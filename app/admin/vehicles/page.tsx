"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Search,
  Loader2,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Gauge,
  Fuel,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Vehicle {
  id: number;
  marca: string;
  modelo: string;
  anio: number;
  precio: number;
  kilometraje: number;
  tipo_combustible_id: number;
  transmision: string;
  color: string;
  oculto: boolean;
  correo_dueno: string;
  created_at: string;
  tipo_combustible?: { nombre: string };
  imagen_vehiculo?: Array<{ url_imagen: string }>;
}

interface ModalData {
  type: "view" | "delete" | null;
  vehicle: Vehicle | null;
}

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "visible" | "hidden"
  >("all");
  const [modal, setModal] = useState<ModalData>({ type: null, vehicle: null });
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ✅ Caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar filtrado
  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    if (filterStatus === "visible") {
      filtered = filtered.filter((v) => !v.oculto);
    } else if (filterStatus === "hidden") {
      filtered = filtered.filter((v) => v.oculto);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.marca.toLowerCase().includes(term) ||
          v.modelo.toLowerCase().includes(term) ||
          v.correo_dueno.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [vehicles, filterStatus, searchTerm]);

  // ✅ Calcular estadísticas
  const stats = useMemo(
    () => ({
      total: vehicles.length,
      visible: vehicles.filter((v) => !v.oculto).length,
      hidden: vehicles.filter((v) => v.oculto).length,
    }),
    [vehicles]
  );

  const checkAdmin = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("usuario")
        .select("rol")
        .eq("usuario_id", session.user.id)
        .single();

      if (error || !userData || userData.rol !== "administrador") {
        setError("Acceso denegado");
        router.push("/");
        return;
      }

      await loadVehicles();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = useCallback(async () => {
    try {
      const now = Date.now();

      // Usar caché si es reciente
      if (now - lastLoadTime.current < CACHE_DURATION && vehicles.length > 0) {
        console.log("📦 Usando caché de vehículos");
        return;
      }

      console.log("📥 Cargando vehículos...");

      // ✅ Cargar vehículos con join para combustible
      const { data: vehiculos, error } = await supabase
        .from("vehiculo")
        .select(
          `
          *,
          tipo_combustible:tipo_combustible_id (nombre)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      // ✅ Cargar imágenes en paralelo
      const vehiclesWithImages = await Promise.all(
        (vehiculos || []).map(async (v) => {
          const { data: imagenes } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", v.id);

          return {
            ...v,
            imagen_vehiculo: imagenes || [],
          };
        })
      );

      setVehicles(vehiclesWithImages);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading vehicles:", error);
      setError("Error al cargar vehículos");
      setVehicles([]);
    }
  }, [vehicles.length]);

  const handleToggleVisibility = useCallback(async (vehicle: Vehicle) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: !vehicle.oculto })
        .eq("id", vehicle.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicle.id ? { ...v, oculto: !v.oculto } : v
        )
      );

      setError("");
    } catch (error) {
      console.error("Error toggling visibility:", error);
      setError("Error al cambiar la visibilidad");
    } finally {
      setSaving(false);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!modal.vehicle) return;

    setSaving(true);
    try {
      // ✅ Eliminar imágenes del storage
      if (
        modal.vehicle.imagen_vehiculo &&
        modal.vehicle.imagen_vehiculo.length > 0
      ) {
        const filePaths = modal.vehicle.imagen_vehiculo.map((img) => {
          const url = img.url_imagen;
          const path = url.split("/storage/v1/object/public/vehiculo_imagen/")[1];
          return path;
        });

        await supabase.storage.from("vehiculo_imagen").remove(filePaths);
      }

      // ✅ Eliminar registro de imagen_vehiculo
      await supabase
        .from("imagen_vehiculo")
        .delete()
        .eq("vehiculo_id", modal.vehicle.id);

      // ✅ Eliminar vehículo
      const { error } = await supabase
        .from("vehiculo")
        .delete()
        .eq("id", modal.vehicle.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setVehicles((prev) => prev.filter((v) => v.id !== modal.vehicle!.id));
      setModal({ type: null, vehicle: null });
      setError("");
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      setError("Error al eliminar el vehículo");
    } finally {
      setSaving(false);
    }
  }, [modal.vehicle]);

  const closeModal = useCallback(() => {
    setModal({ type: null, vehicle: null });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/profile")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Panel
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Car className="w-8 h-8 text-green-400" />
              Gestión de Vehículos
            </h1>
            <p className="text-slate-400 mt-2">
              Total: {stats.total} vehículos publicados
            </p>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Car className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-green-100 font-semibold">Total Vehículos</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.visible}</span>
            </div>
            <p className="text-blue-100 font-semibold">Visibles</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.hidden}</span>
            </div>
            <p className="text-orange-100 font-semibold">Ocultos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por marca, modelo o dueño..."
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los vehículos</option>
              <option value="visible">Visibles</option>
              <option value="hidden">Ocultos</option>
            </select>
          </div>
        </div>

        {/* Lista de Vehículos */}
        <div className="space-y-4">
          {filteredVehicles.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-slate-700 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No se encontraron vehículos
              </h3>
              <p className="text-slate-400">
                {filterStatus === "hidden"
                  ? "No hay vehículos ocultos"
                  : "No hay vehículos publicados"}
              </p>
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden hover:border-green-500 transition-all"
              >
                {/* Encabezado de la fila */}
                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() =>
                    setExpandedId(expandedId === vehicle.id ? null : vehicle.id)
                  }
                >
                  <div className="flex-1 flex items-center gap-4">
                    {/* Imagen pequeña */}
                    <div className="w-20 h-20 bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                      {vehicle.imagen_vehiculo &&
                      vehicle.imagen_vehiculo.length > 0 ? (
                        <img
                          src={vehicle.imagen_vehiculo[0].url_imagen}
                          alt={`${vehicle.marca} ${vehicle.modelo}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-10 h-10 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">
                          {vehicle.marca} {vehicle.modelo}
                        </h3>
                        {vehicle.oculto && (
                          <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Oculto
                          </span>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>{vehicle.anio}</span>
                        <span>${vehicle.precio.toLocaleString()}</span>
                        <span>{vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones rápidas */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "view", vehicle });
                      }}
                      disabled={saving}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(vehicle);
                      }}
                      disabled={saving}
                      className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                        vehicle.oculto
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-orange-600 hover:bg-orange-700"
                      }`}
                      title={vehicle.oculto ? "Mostrar" : "Ocultar"}
                    >
                      {vehicle.oculto ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <XCircle className="w-5 h-5 text-white" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ type: "delete", vehicle });
                      }}
                      disabled={saving}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedId(expandedId === vehicle.id ? null : vehicle.id);
                      }}
                      className="p-2 text-slate-400 hover:text-white transition-colors"
                    >
                      {expandedId === vehicle.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Detalles expandibles */}
                {expandedId === vehicle.id && (
                  <div className="border-t border-slate-700 px-4 py-4 bg-slate-700/20">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Año</p>
                        <p className="text-white font-semibold">
                          {vehicle.anio}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Precio</p>
                        <p className="text-white font-semibold">
                          ${vehicle.precio.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Kilometraje</p>
                        <p className="text-white font-semibold">
                          {vehicle.kilometraje.toLocaleString()} km
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Combustible</p>
                        <p className="text-white font-semibold">
                          {vehicle.tipo_combustible?.nombre || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Transmisión</p>
                        <p className="text-white font-semibold">
                          {vehicle.transmision || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm mb-1">Dueño</p>
                        <p className="text-white font-semibold text-sm truncate">
                          {vehicle.correo_dueno}
                        </p>
                      </div>
                    </div>

                    {/* Galería de imágenes expandida */}
                    {vehicle.imagen_vehiculo &&
                      vehicle.imagen_vehiculo.length > 1 && (
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <p className="text-slate-400 text-sm mb-3">Imágenes</p>
                          <div className="grid grid-cols-4 gap-2">
                            {vehicle.imagen_vehiculo.map((img, idx) => (
                              <img
                                key={idx}
                                src={img.url_imagen}
                                alt={`Imagen ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Ver Detalles */}
      {modal.type === "view" && modal.vehicle && (
        <ModalDetalles
          vehicle={modal.vehicle}
          onClose={closeModal}
        />
      )}

      {/* Modal Eliminar */}
      {modal.type === "delete" && modal.vehicle && (
        <ModalEliminar
          vehicle={modal.vehicle}
          onConfirm={handleDelete}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// ✅ Componentes de modal separados
interface ModalDetallesProps {
  vehicle: Vehicle;
  onClose: () => void;
}

function ModalDetalles({ vehicle, onClose }: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-3xl w-full p-6 border border-slate-700 my-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          Detalles del Vehículo
        </h2>

        {/* Galería de imágenes */}
        {vehicle.imagen_vehiculo && vehicle.imagen_vehiculo.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {vehicle.imagen_vehiculo.map((img, idx) => (
              <img
                key={idx}
                src={img.url_imagen}
                alt={`Imagen ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-slate-400 text-sm">Marca y Modelo</p>
            <p className="text-white font-semibold text-lg">
              {vehicle.marca} {vehicle.modelo}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Año</p>
            <p className="text-white font-semibold">{vehicle.anio}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Precio</p>
            <p className="text-white font-semibold">
              ${vehicle.precio.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Kilometraje</p>
            <p className="text-white font-semibold">
              {vehicle.kilometraje.toLocaleString()} km
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Combustible</p>
            <p className="text-white font-semibold">
              {vehicle.tipo_combustible?.nombre || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Transmisión</p>
            <p className="text-white font-semibold">
              {vehicle.transmision || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Dueño</p>
            <p className="text-white font-semibold">{vehicle.correo_dueno}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">Estado</p>
            <p className="text-white font-semibold">
              {vehicle.oculto ? "Oculto" : "Visible"}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalEliminarProps {
  vehicle: Vehicle;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEliminar({
  vehicle,
  onConfirm,
  onClose,
  saving,
}: ModalEliminarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Confirmar Eliminación
        </h2>
        <p className="text-slate-300 mb-6">
          ¿Estás seguro de que quieres eliminar el vehículo{" "}
          <span className="font-semibold text-white">
            {vehicle.marca} {vehicle.modelo} {vehicle.anio}
          </span>
          ? Esta acción no se puede deshacer y eliminará todas las imágenes
          asociadas.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
