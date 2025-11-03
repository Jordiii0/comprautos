"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  AlertCircle,
  LogOut,
  Plus,
  List,
  Heart,
  Flag,
  Edit2,
  Menu,
  X,
  CheckCircle,
} from "lucide-react";

interface EmpresaData {
  id: number;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono?: string;
  representante_legal: string;
  rut_representante: string;
  region: number;
  ciudad: string;
  validada: boolean;
  region_nombre?: string;
}

interface Region {
  id: number;
  nombre_region: string;
}

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editForm, setEditForm] = useState<EmpresaData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    checkAuth();
    loadRegions();
  }, []);

  const checkAuth = async () => {
    try {
      console.log("🔍 Verificando autenticación de empresa...");

      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession) {
        console.log("❌ No hay sesión");
        router.push("/login");
        return;
      }

      // Verificar si es empresa
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("*")
        .eq("usuario_id", authSession.user.id)
        .single();

      if (empresaError || !empresaData) {
        console.log("❌ No es empresa, redirigiendo...");
        router.push("/login");
        return;
      }

      console.log("✅ Empresa verificada");
      setSession(authSession);

      // Cargar datos de empresa
      await loadEmpresaData(authSession.user.id);
    } catch (error: any) {
      console.error("❌ Error en checkAuth:", error);
      router.push("/login");
    }
  };

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("region")
        .select("id, nombre_region")
        .order("nombre_region", { ascending: true });

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadEmpresaData = async (userId: string) => {
    try {
      console.log("📥 Cargando datos de empresa para usuario:", userId);

      const { data, error } = await supabase
        .from("empresa")
        .select("*")
        .eq("usuario_id", userId)
        .single();

      console.log("Resultado query empresa:", { data, error });

      if (error) {
        console.error("❌ Error al cargar empresa:", error);
        if (error.code === "PGRST116") {
          setErrorMessage(
            "No se encontraron datos de empresa asociados a tu cuenta"
          );
        } else {
          setErrorMessage(error.message || "Error al cargar datos");
        }
        setLoading(false);
        return;
      }

      if (!data) {
        console.log("⚠️ No hay datos de empresa");
        setErrorMessage("No se encontraron datos de empresa");
        setLoading(false);
        return;
      }

      console.log("✅ Datos de empresa cargados:", data);

      // Cargar nombre de la región
      const { data: regionData, error: regionError } = await supabase
        .from("region")
        .select("nombre_region")
        .eq("id", data.region)
        .single();

      console.log("Resultado query región:", { regionData, regionError });

      const empresaConRegion = {
        ...data,
        region_nombre: regionData?.nombre_region || "Desconocida",
      };

      setEmpresa(empresaConRegion);
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Error en loadEmpresaData:", error);
      setErrorMessage(error.message || "Error al cargar datos");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const startEditing = () => {
    if (empresa) {
      setEditForm({ ...empresa });
      setIsEditing(true);
      setEditSuccess(false);
      setShowMenu(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (editForm) {
      setEditForm({
        ...editForm,
        [name]: name === "region" ? parseInt(value) : value,
      });
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
          ciudad: editForm.ciudad,
          region: editForm.region,
          representante_legal: editForm.representante_legal,
          rut_representante: editForm.rut_representante,
        })
        .eq("usuario_id", session.user.id);

      if (error) throw error;

      setEmpresa(editForm);
      setIsEditing(false);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error updating empresa:", error);
      alert("Error al actualizar: " + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
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

  if (!empresa) {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              {empresa.nombre_comercial}
            </h1>
            <p className="text-gray-600 mt-1">Mi Perfil de Empresa</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </button>

            {/* Botón menú móvil */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors"
            >
              {showMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Estado de Validación */}
        {!empresa.validada && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <p className="text-yellow-700 font-semibold">
              ⚠️ Tu empresa aún no ha sido validada por un administrador.
            </p>
            <p className="text-yellow-600 text-sm mt-1">
              Una vez validada, podrás publicar vehículos.
            </p>
          </div>
        )}

        {empresa.validada && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6 rounded">
            <p className="text-green-700 font-semibold">
              ✅ Tu empresa ha sido validada exitosamente.
            </p>
          </div>
        )}

        {/* Acciones Rápidas - Escritorio */}
        <div className="hidden md:grid grid-cols-5 gap-4 mb-8">
          <button
            onClick={() => router.push("/publication")}
            disabled={!empresa.validada}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Plus className="w-6 h-6" />
            Publicar
          </button>

          <button
            onClick={() => router.push("/mypost")}
            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <List className="w-6 h-6" />
            Mis Publicaciones
          </button>

          <button
            onClick={() => router.push("/favorites")}
            className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Heart className="w-6 h-6" />
            Mis Favoritos
          </button>

          <button
            onClick={() => router.push("/my-reports")}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Flag className="w-6 h-6" />
            Mis Reportes
          </button>

          <button
            onClick={startEditing}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
          >
            <Edit2 className="w-6 h-6" />
            Editar Perfil
          </button>
        </div>

        {/* Menú Móvil */}
        {showMenu && (
          <div className="md:hidden bg-white rounded-2xl shadow-xl p-4 mb-8 space-y-3">
            <button
              onClick={() => {
                router.push("/publication");
                setShowMenu(false);
              }}
              disabled={!empresa.validada}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Publicar
            </button>

            <button
              onClick={() => {
                router.push("/mypost");
                setShowMenu(false);
              }}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <List className="w-5 h-5" />
              Mis Publicaciones
            </button>

            <button
              onClick={() => {
                router.push("/favorites");
                setShowMenu(false);
              }}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Heart className="w-5 h-5" />
              Mis Favoritos
            </button>

            <button
              onClick={() => {
                router.push("/my-reports");
                setShowMenu(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Flag className="w-5 h-5" />
              Mis Reportes
            </button>

            <button
              onClick={() => {
                startEditing();
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <Edit2 className="w-5 h-5" />
              Editar Perfil
            </button>
          </div>
        )}

        {/* Información de la Empresa */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Información de la Empresa
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Nombre Comercial
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.nombre_comercial}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                RUT Empresa
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.rut_empresa}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Email
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.correo_electronico}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Teléfono
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.telefono || "No registrado"}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Ciudad
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.ciudad}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">
                Región
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.region_nombre || "Cargando..."}
              </p>
            </div>
          </div>
        </div>

        {/* Información del Representante */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Representante Legal
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-semibold text-gray-600">
                Nombre Completo
              </label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.representante_legal}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">RUT</label>
              <p className="text-lg text-gray-800 font-medium mt-1">
                {empresa.rut_representante}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición */}
      {isEditing && editForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto p-8">
            {editSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-green-700 text-sm">
                  Cambios guardados exitosamente
                </p>
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Editar Perfil
              </h2>
              <button
                onClick={cancelEditing}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Información de la Empresa */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Información de la Empresa
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      name="nombre_comercial"
                      value={editForm.nombre_comercial}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="correo_electronico"
                      value={editForm.correo_electronico}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={editForm.telefono || ""}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Región
                    </label>
                    <select
                      name="region"
                      value={editForm.region}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none appearance-none bg-white"
                    >
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nombre_region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={editForm.ciudad}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Representante Legal */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Representante Legal
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="representante_legal"
                      value={editForm.representante_legal}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      RUT
                    </label>
                    <input
                      type="text"
                      name="rut_representante"
                      value={editForm.rut_representante}
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={cancelEditing}
                disabled={editLoading}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-semibold disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
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
          </div>
        </div>
      )}
    </div>
  );
}
