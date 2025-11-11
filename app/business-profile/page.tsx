"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  AlertCircle,
  LogOut,
  Edit2,
  X,
  CheckCircle,
  Building2,
  Phone,
  MapPin,
  Mail,
  Menu,
  Plus,
  List,
  Heart,
  Flag
} from "lucide-react";

interface EmpresaData {
  id: string;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono?: string;
  representante_legal: string;
  rut_representante: string;
  region_id: number;
  ciudad_id: number;
  validada: boolean;
  region_nombre?: string;
  ciudad_nombre?: string;
  sitio_web?: string;
  descripcion?: string;
  created_at?: string;
  updated_at?: string;
  habilitada?: boolean;
}

interface Region {
  id: number;
  nombre_region: string;
}
interface Ciudad {
  id: number;
  nombre_ciudad: string;
  region_id: number;
}

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<any>(null);

  // Edit
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<EmpresaData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<Ciudad[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  // UI
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [byeMsg, setByeMsg] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  // --- LOGOUT MODAL ---
  const handleLogoutModal = () => setShowModal(true);
  const cancelLogout = () => setShowModal(false);
  const confirmLogout = async () => {
      setLoggingOut(true);
      setByeMsg("¡Hasta luego! 👋");
      await supabase.auth.signOut();
      setTimeout(() => {
        router.replace("/login");
      }, 1800); // 1.8 segundos antes de redirigir
    };

  useEffect(() => {
    checkAuth();
    loadRegions();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session: authSession },
    } = await supabase.auth.getSession();

    if (!authSession) {
      router.replace("/login");
      return;
    }

    const { data: empresaData } = await supabase
      .from("empresa")
      .select("*")
      .eq("usuario_id", authSession.user.id)
      .single();

    if (!empresaData) {
      router.replace("/login");
      return;
    }

    setSession(authSession);
    setEmpresa(empresaData);
    setLoading(false);
  };

  const loadRegions = async () => {
    const { data } = await supabase
      .from("region")
      .select("id, nombre_region")
      .order("nombre_region", { ascending: true });
    setRegions(data || []);
  };

  const loadCities = async (regionId?: number) => {
    let query = supabase.from("ciudad").select("id, nombre_ciudad, region_id");
    if (regionId) query = query.eq("region_id", regionId);
    const { data } = await query;
    setCities(data || []);
  };

  // --- EDICIÓN INLINE ---
  const startEditing = async () => {
    if (empresa) {
      setEditForm({ ...empresa });
      await loadCities(empresa.region_id);
      setIsEditing(true);
      setEditSuccess(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (!editForm) return;
    if (name === "region_id") {
      setEditForm((prev) =>
        prev
          ? {
              ...prev,
              region_id: parseInt(value),
              ciudad_id: 0,
            }
          : prev
      );
      loadCities(parseInt(value));
    } else if (name === "ciudad_id") {
      setEditForm((prev) =>
        prev ? { ...prev, ciudad_id: parseInt(value) } : prev
      );
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSaveChanges = async () => {
    if (!editForm || !session) return;
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("empresa")
        .update({
          nombre_comercial: editForm.nombre_comercial,
          correo_electronico: editForm.correo_electronico,
          telefono: editForm.telefono,
          representante_legal: editForm.representante_legal,
          rut_representante: editForm.rut_representante,
          region_id: editForm.region_id,
          ciudad_id: editForm.ciudad_id,
        })
        .eq("id", editForm.id);

      if (error) throw error;

      const ciudadNombre =
        cities.find((c) => c.id === editForm.ciudad_id)?.nombre_ciudad || "";
      const regionNombre =
        regions.find((r) => r.id === editForm.region_id)?.nombre_region || "";

      setEmpresa({
        ...editForm,
        ciudad_nombre: ciudadNombre,
        region_nombre: regionNombre,
      });
      setIsEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (error: any) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil de empresa...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Ir al Inicio
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!empresa || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sin Datos</h2>
          <p className="text-gray-600 mb-6">
            No se encontraron datos de empresa
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors"
          >
            Ir al Inicio
          </button>
        </div>
      </div>
    );
  }

  // ------------ RENDER PRINCIPAL -----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      {/* Modal Cerrar Sesión */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-xs">
            <h3 className="text-lg font-bold mb-2 text-gray-800">¿Salir de la cuenta?</h3>
            <p className="text-gray-600 mb-4">¿Estás seguro de que quieres cerrar sesión?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelLogout}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
                disabled={loggingOut}
              >
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {byeMsg && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-xl p-6 text-center">
            <span className="text-2xl">👋</span>
            <div className="mt-2 text-lg text-gray-700 font-semibold">{byeMsg}</div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-y-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 break-words">
              {empresa.nombre_comercial}
            </h1>
            <p className="text-gray-600 mt-1">Mi Perfil de Empresa</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoutModal}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg"
            >
              {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Estado de Validación */}
        {!empresa.validada ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <p className="text-yellow-700 font-semibold">
              ⚠️ Tu empresa aún no ha sido validada.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
            <p className="text-green-700 font-semibold">
              ✅ Tu empresa ha sido validada exitosamente.
            </p>
          </div>
        )}

        {/* Acciones Desktop */}
        <div className="hidden md:grid grid-cols-5 gap-4 mb-8 w-full">
          <button
            onClick={() => router.push("/publication")}
            disabled={!empresa.validada}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Plus className="w-6 h-6" />
            Publicar
          </button>
          <button
            onClick={() => router.push("/mypost")}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <List className="w-6 h-6" />
            Mis Publicaciones
          </button>
          <button
            onClick={() => router.push("/favorites")}
            className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Heart className="w-6 h-6" />
            Mis Favoritos
          </button>
          <button
            onClick={() => router.push("/my-reports")}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Flag className="w-6 h-6" />
            Mis Reportes
          </button>
          <button
            onClick={startEditing}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Edit2 className="w-6 h-6" />
            {isEditing ? "Editando..." : "Editar Perfil"}
          </button>
        </div>

        {/* Acciones Móvil */}
        {showMenu && (
          <div className="md:hidden flex flex-col gap-3 mb-8">
            <button
              onClick={() => {
                router.push("/publication");
                setShowMenu(false);
              }}
              disabled={!empresa.validada}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Publicar
            </button>
            <button
              onClick={() => {
                router.push("/mypost");
                setShowMenu(false);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <List className="w-5 h-5" />
              Mis Publicaciones
            </button>
            <button
              onClick={() => {
                router.push("/favorites");
                setShowMenu(false);
              }}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Heart className="w-5 h-5" />
              Mis Favoritos
            </button>
            <button
              onClick={() => {
                router.push("/my-reports");
                setShowMenu(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Flag className="w-5 h-5" />
              Mis Reportes
            </button>
            <button
              onClick={() => {
                startEditing();
                setShowMenu(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-semibold"
            >
              <Edit2 className="w-5 h-5" />
              Editar Perfil
            </button>
          </div>
        )}

        {/* ---INFO EMPRESA Y REPRESENTANTE--- */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Información de la Empresa
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Nombre Comercial</label>
              {isEditing ? (
                <input
                  type="text"
                  name="nombre_comercial"
                  value={editForm?.nombre_comercial ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.nombre_comercial}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">RUT Empresa</label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.rut_empresa}
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  name="correo_electronico"
                  value={editForm?.correo_electronico ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.correo_electronico}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Teléfono</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="telefono"
                  value={editForm?.telefono ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.telefono || "No registrado"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Región</label>
              {isEditing ? (
                <select
                  name="region_id"
                  value={editForm?.region_id ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Seleccione región</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.nombre_region}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.region_nombre || "No registrada"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">Ciudad</label>
              {isEditing ? (
                <select
                  name="ciudad_id"
                  value={editForm?.ciudad_id ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="">Seleccione ciudad</option>
                  {cities.map((ciudad) => (
                    <option key={ciudad.id} value={ciudad.id}>
                      {ciudad.nombre_ciudad}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.ciudad_nombre || "No registrada"}
                </p>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={editLoading}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={editLoading}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {editLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          )}
          {editSuccess && (
            <div className="p-3 mt-5 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle className="w-4 h-4" />
              Cambios guardados exitosamente
            </div>
          )}
        </div>

        {/* Card REPRESENTANTE (inline editable igual) */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Representante Legal</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">Nombre Completo</label>
              {isEditing ? (
                <input
                  type="text"
                  name="representante_legal"
                  value={editForm?.representante_legal ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.representante_legal}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-600">RUT</label>
              {isEditing ? (
                <input
                  type="text"
                  name="rut_representante"
                  value={editForm?.rut_representante ?? ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                />
              ) : (
                <p className="text-lg text-gray-800 font-medium mt-1">
                  {empresa.rut_representante}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* ...el resto de tus cards info/estado/etc... */}
      </div>
    </div>
  );
}
