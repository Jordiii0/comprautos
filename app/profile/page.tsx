"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  User,
  LogOut,
  UserCircle,
  Mail,
  Calendar,
  Loader2,
  Phone,
  MapPin,
  Save,
  Edit2,
  Plus,
  List,
  Heart,
  ChevronDown,
  Menu,
  Flag,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

interface UserData {
  id: number;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono: string | null;
  rut: string;
  region: number | null;
  ciudad: string | null;
  created_at: string;
  habilitado: boolean;
  region_data?: {
    nombre_region: string;
  };
}

interface Region {
  id: number;
  nombre_region: string;
  codigo_iso: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    ciudad: "",
    region: "",
  });

  useEffect(() => {
    const verifyAndLoad = async () => {
      try {
        console.log("🔍 Verificando acceso de usuario...");

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session || !session.user?.email) {
          console.log("❌ No hay sesión");
          router.push("/login");
          return;
        }

        // Verificar si es usuario regular (no empresa ni admin)
        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuario")
          .select("rol")
          .eq("usuario_id", session.user.id)
          .single();

        if (usuarioError || !usuarioData) {
          console.log("❌ No es usuario, redirigiendo...");
          router.push("/login");
          return;
        }

        if (usuarioData.rol !== "usuario") {
          console.log("❌ No tiene rol de usuario, redirigiendo...");
          router.push("/login");
          return;
        }

        // Verificar si es empresa
        const { data: empresaData } = await supabase
          .from("empresa")
          .select("id")
          .eq("usuario_id", session.user.id)
          .single();

        if (empresaData) {
          console.log("❌ Es empresa, redirigiendo...");
          router.push("/login");
          return;
        }

        console.log("✅ Usuario verificado");
        setUser(session.user as UserProfile);
        
        await loadRegions();
        await loadUserData(session.user.email);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error en verificación:", error);
        router.push("/login");
      }
    };

    verifyAndLoad();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("region")
        .select("id, nombre_region, codigo_iso")
        .order("nombre_region");

      if (error) throw error;
      setRegions(data || []);
    } catch (error) {
      console.error("Error loading regions:", error);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("correo_electronico", email)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading user data:", error);
        return;
      }

      if (data) {
        setUserData(data);

        if (!data.habilitado) {
          setErrorMessage(
            "Tu cuenta ha sido deshabilitada por un administrador."
          );
        }

        setFormData({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          telefono: data.telefono || "",
          ciudad: data.ciudad || "",
          region: data.region?.toString() || "",
        });
      } else {
        // Usuario no tiene datos completos, activar modo edición
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.nombre || !formData.apellido) {
      alert("Por favor completa al menos el nombre y apellido");
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      const { error } = await supabase
        .from("usuario")
        .update({
          nombre: formData.nombre,
          apellido: formData.apellido,
          telefono: formData.telefono || null,
          ciudad: formData.ciudad || null,
          region: formData.region ? parseInt(formData.region) : null,
        })
        .eq("correo_electronico", user.email);

      if (error) throw error;

      setSuccessMessage("Perfil actualizado exitosamente");
      setIsEditing(false);
      await loadUserData(user.email);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error: any) {
      alert("Error al guardar el perfil: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fullName = userData
    ? `${userData.nombre} ${userData.apellido}`
    : "Completa tu perfil";

  const getRegionName = (regionId: number | null) => {
    if (!regionId) return "";
    const region = regions.find((r) => r.id === regionId);
    return region?.nombre_region || "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Mi Perfil</h1>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 mt-8">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>

          <div className="relative px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="flex items-end">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                  <UserCircle className="w-28 h-28 text-indigo-400" />
                </div>
                <div className="ml-6 mb-2">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {fullName}
                  </h2>
                  <p className="text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="relative mb-1">
                <button
                  type="button"
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
                >
                  <Menu className="w-5 h-5" />
                  Opciones
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    ></div>

                    <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
                      <button
                        type="button"
                        onClick={() => {
                          router.push("/publication");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                          <Plus className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Publicar
                          </p>
                          <p className="text-xs text-gray-500">
                            Nuevo vehículo
                          </p>
                        </div>
                      </button>

                      <div className="border-t border-gray-100"></div>

                      <button
                        type="button"
                        onClick={() => {
                          router.push("/mypost");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <List className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Mis Publicaciones
                          </p>
                          <p className="text-xs text-gray-500">
                            Gestionar publicaciones
                          </p>
                        </div>
                      </button>

                      <div className="border-t border-gray-100"></div>

                      <button
                        type="button"
                        onClick={() => {
                          router.push("/favorites");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                          <Heart className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Mis Favoritos
                          </p>
                          <p className="text-xs text-gray-500">
                            Vehículos guardados
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          router.push("/my-reports");
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-left group"
                      >
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                          <Flag className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            Mis Reportes
                          </p>
                          <p className="text-xs text-gray-500">
                            Reportes que has hecho
                          </p>
                        </div>
                      </button>

                      {!isEditing && (
                        <>
                          <div className="border-t border-gray-100"></div>

                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(true);
                              setShowMenu(false);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                              <Edit2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                Editar Perfil
                              </p>
                              <p className="text-xs text-gray-500">
                                Actualizar información
                              </p>
                            </div>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {successMessage && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                ✓ {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Información Personal
                    </h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nombre: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Juan"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      value={formData.apellido}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          apellido: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Pérez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      RUT
                    </label>
                    <input
                      type="text"
                      value={userData?.rut || ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      placeholder="12.345.678-9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          telefono: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={formData.ciudad}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ciudad: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Santiago"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Región
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          region: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600 appearance-none cursor-pointer bg-white"
                    >
                      <option value="">Selecciona una región</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id}>
                          {region.nombre_region} ({region.codigo_iso})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        if (user) loadUserData(user.email);
                      }}
                      disabled={saving}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Información de la Cuenta
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Miembro desde</span>
                    <span className="font-medium text-gray-800">
                      {userData && formatDate(userData.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        userData?.habilitado
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {userData?.habilitado ? "Activa" : "Deshabilitada"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tipo de cuenta</span>
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Usuario Personal
                    </span>
                  </div>
                  {userData?.ciudad && (
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-gray-600">Ubicación</span>
                      <span className="font-medium text-gray-800">
                        {userData.ciudad}, {getRegionName(userData.region)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
