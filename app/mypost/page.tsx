"use client";

import { Car, Heart } from "lucide-react";
import ChartsPublicaciones from "./components/chartsPublicaciones";
import ChartsCalificaciones from "./components/chartsCalificaciones";
import ChartsVentas from "./components/chartsVentas";
import StatsCard from "./components/statsCard";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Plus,
  Calendar,
  Gauge,
  AlertCircle,
  CheckCircle,
  MapPin,
} from "lucide-react";

// 🚨 Interfaz actualizada: empresa_id es string (UUID) o null
interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo: string;
  region: number;
  ciudad: string;
  created_at: string;
  oculto: boolean;
  usuario_id: string | null; // UUID
  empresa_id: string | null; // UUID
}

interface VehicleWithImages extends Vehicle {
  images: string[];
}

interface Message {
  type: "success" | "error";
  text: string;
}

export default function MyPostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [regions, setRegions] = useState<Map<number, string>>(new Map());

  // NUEVO: Para mostrar/ocultar sección de gráficos
  const [showCharts, setShowCharts] = useState(false);
  // Guarda info si es empresa
  const [isBusiness, setIsBusiness] = useState<boolean>(false);
  const [empresaId, setEmpresaId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // --- ¡Detecta si es empresa! Guarda en estado para los gráficos
      let isEmpresa = false;
      let usuarioId = session.user.id;
      let empresaUUID: string | null = null;

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", usuarioId)
        .maybeSingle();

      if (empresaData) {
        isEmpresa = true;
        empresaUUID = empresaData.id;
      }

      setIsBusiness(isEmpresa);
      setEmpresaId(empresaUUID);
      await loadVehicles(usuarioId);
      setLoading(false);
    };

    checkAuthAndLoadPosts();
  }, [router]);

  // =========================================================================
  // 🔑 LÓGICA DE CARGA DE VEHÍCULOS CORREGIDA PARA USUARIOS Y EMPRESAS
  // =========================================================================
  const loadVehicles = async (userAuthId: string) => {
    try {
      console.log("User Auth ID:", userAuthId);

      // 1. Determinar si el usuario es EMPRESA y obtener su UUID de empresa
      let isBusiness = false;
      let vehicleOwnerId: string = userAuthId; // Por defecto, usa el UUID del usuario

      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", userAuthId)
        .maybeSingle();

      if (empresaData) {
        isBusiness = true;
        vehicleOwnerId = empresaData.id; // ¡Usar el UUID de la empresa!
        console.log("✅ Usuario es Empresa. ID de Empresa (UUID):", vehicleOwnerId);
      } else {
        console.log("👤 Usuario Individual. ID de Usuario (UUID):", vehicleOwnerId);
      }

      // 2. Cargar catálogos (Regiones, Combustibles, Tipos)
      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region");

      const regionMap = new Map(
        regionesData?.map((r) => [r.id, r.nombre_region]) || []
      );
      setRegions(regionMap);

      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre");

      const { data: tipoVehiculoData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre");

      // 3. Cargar los vehículos directamente desde 'vehiculo'
      let query = supabase.from("vehiculo").select("*");

      if (isBusiness) {
        // Consulta por el UUID en empresa_id
        query = query.eq("empresa_id", vehicleOwnerId).is("usuario_id", null);
      } else {
        // Consulta por el UUID en usuario_id
        query = query.eq("usuario_id", vehicleOwnerId).is("empresa_id", null);
      }
      
      const { data: vehiculosData, error: vError } = await query
        .order("created_at", { ascending: false });

      console.log("Vehículos Data:", vehiculosData);
      console.log("Error Vehiculos:", vError);

      if (vError) throw vError;

      if (!vehiculosData || vehiculosData.length === 0) {
        console.log("No se encontraron vehículos para este usuario/empresa");
        setVehicles([]);
        return;
      }

      // 4. Cargar imágenes y mapear nombres
      const vehiculosConImagenes = await Promise.all(
        vehiculosData.map(async (vehiculo) => {
          // Cargar imágenes
          const { data: imagenesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehiculo.id);

          // Buscar nombre de combustible
          const combustible = combustibleData?.find(
            (c) => c.id === vehiculo.tipo_combustible_id
          );

          // Buscar nombre de tipo de vehículo
          const tipoVehiculo = tipoVehiculoData?.find(
            (t) => t.id === vehiculo.tipo_vehiculo_id
          );

          return {
            ...vehiculo,
            images: imagenesData?.map((img) => img.url_imagen) || [],
            tipo_combustible: combustible?.nombre || "Desconocido",
            tipo_vehiculo: tipoVehiculo?.nombre || "Desconocido",
          } as VehicleWithImages;
        })
      );

      console.log("Vehículos con imágenes:", vehiculosConImagenes);
      setVehicles(vehiculosConImagenes);
    } catch (error: any) {
      console.error("Error loading vehicles:", error);
      setMessage({
        type: "error",
        text: "Error al cargar tus publicaciones",
      });
    }
  };
  // =========================================================================

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: newStatus })
        .eq("id", id);

      if (error) throw error;

      setVehicles(
        vehicles.map((v) => (v.id === id ? { ...v, oculto: newStatus } : v))
      );

      setMessage({
        type: "success",
        text: newStatus
          ? "Publicación oculta correctamente"
          : "Publicación visible nuevamente",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Error toggling status:", error);
      setMessage({ type: "error", text: "Error al cambiar el estado" });
    }
  };

  const deleteVehicle = async (id: number) => {
    setDeleting(true);
    try {
      // Eliminar imágenes del storage
      const { data: imagenesData } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", id);

      if (imagenesData && imagenesData.length > 0) {
        for (const img of imagenesData) {
          // Asumiendo que la URL de Supabase Storage es: [bucket_url]/[fileName]
          // Y que el bucket se llama 'vehiculo_imagen'
          const urlParts = img.url_imagen.split('/');
          const fileName = urlParts[urlParts.length - 1]; 
          
          if (fileName) {
            // Eliminar solo el archivo, no el path completo
            const { error: storageError } = await supabase.storage.from("vehiculo_imagen").remove([fileName]);
            if (storageError) {
                console.warn("Error al eliminar del storage:", storageError.message);
            }
          }
        }
      }

      // Eliminar registros de imágenes (asumiendo ON DELETE CASCADE en la BD)
      // Si imagen_vehiculo tiene FK a vehiculo con CASCADE, esto podría ser redundante.
      // Lo mantendremos por seguridad, pero revisa tu esquema de BD.
      await supabase.from("imagen_vehiculo").delete().eq("vehiculo_id", id);

      // Eliminar vehículo (Asumiendo que las FK de usuario/empresa son NULAS o no hay FK desde vehiculo)
      // Si tienes una tabla 'usuario_vehiculo' la eliminaremos aquí, si no, puedes quitar esta línea.
      // Ya eliminamos la dependencia de 'usuario_vehiculo' en la carga, pero la eliminación debe ser completa.
      await supabase.from("usuario_vehiculo").delete().eq("vehiculo_id", id);


      const { error } = await supabase.from("vehiculo").delete().eq("id", id);

      if (error) throw error;

      setVehicles(vehicles.filter((v) => v.id !== id));
      setMessage({
        type: "success",
        text: "Vehículo eliminado exitosamente",
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error("Delete error:", error);
      setMessage({ type: "error", text: "Error al eliminar el vehículo" });
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRegionName = (regionId: number) => {
    return regions.get(regionId) || "Desconocida";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Perfil
          </button>

           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Car className="w-8 h-8 text-indigo-600" />
                Mis Publicaciones
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus vehículos publicados ({vehicles.length})
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => router.push("/publication")}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nueva Publicación
              </button>

              {/* 🚩 Botón para mostrar/ocultar gráficos */}
              <button
                onClick={() => setShowCharts((v) => !v)}
                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-6 py-3 rounded-xl border border-indigo-200 hover:bg-indigo-200 transition-all font-semibold"
              >
                📊 Ver estadísticas
              </button>
            </div>
          </div>
        </div>

        {/* NUEVO: SECCIÓN DE GRÁFICOS */}
        {showCharts && (
          <div className="mb-8 p-4 bg-white shadow-md rounded-xl">
            <div className="grid md:grid-cols-2 gap-8">
              <ChartsPublicaciones 
              usuarioId={user?.id} 
              empresaId={empresaId ?? undefined} 
              isBusiness={isBusiness} />
              <ChartsCalificaciones 
              usuarioId={user?.id} 
              empresaId={empresaId ?? undefined} 
              isBusiness={isBusiness} />

            </div>
          </div>
        )}

        {/* Mensajes */}
        {message && (
          <div
            className={`mb-6 ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            } border px-4 py-3 rounded-lg flex items-center gap-2`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes publicaciones
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza publicando tu primer vehículo
            </p>
            <button
              onClick={() => router.push("/publication")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Publicar Vehículo
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => {
              return (
                <div
                  key={vehicle.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {vehicle.images.length > 0 ? (
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vehicle.oculto
                            ? "bg-gray-500 text-white"
                            : "bg-green-500 text-white"
                        }`}
                      >
                        {vehicle.oculto ? "Oculta" : "Activa"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatPrice(vehicle.precio)}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{vehicle.anio}</span>
                        <span className="mx-2">•</span>
                        <Gauge className="w-4 h-4" />
                        <span>{vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.transmision}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.tipo_combustible}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {vehicle.ciudad}, {getRegionName(vehicle.region)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Publicado: {formatDate(vehicle.created_at)}
                      </div>
                    </div>

                    {/* Actions */}

                    {/* Ver Detalles */}
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium transition-colors"
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Ocultar */}
                      <button
                        onClick={() => toggleStatus(vehicle.id, vehicle.oculto)}
                        className={`flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                          vehicle.oculto
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                        title={vehicle.oculto ? "Mostrar" : "Ocultar"}
                      >
                        {vehicle.oculto ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    
                      {/* Editar */}
                      <button
                        onClick={() =>
                          router.push(`/publication/${vehicle.id}/edit`)
                        }
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() => setDeleteModal(vehicle.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-gray-800">
                  Confirmar Eliminación
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro que deseas eliminar esta publicación? Esta acción
                no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deleteVehicle(deleteModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}