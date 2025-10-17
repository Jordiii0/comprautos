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
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
}

interface ProfileData {
  full_name: string;
  username: string;
  phone: string;
  region: string;
  city: string;
}

const REGIONES_CHILE = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Metropolitana de Santiago",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    full_name: "",
    username: "",
    phone: "+56",
    region: "",
    city: "",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user as UserProfile);
      await loadProfile(session.user.id);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setProfileData({
          full_name: data.full_name || "",
          username: data.username || "",
          phone: data.phone || "+56",
          region: data.region || "",
          city: data.city || "",
        });
      } else {
        setIsEditing(true);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (
      !profileData.full_name ||
      !profileData.username ||
      !profileData.phone ||
      !profileData.region ||
      !profileData.city
    ) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (!profileData.phone.startsWith("+56")) {
      alert("El número debe comenzar con +56");
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name: profileData.full_name,
        username: profileData.username,
        phone: profileData.phone,
        region: profileData.region,
        city: profileData.city,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setSuccessMessage("Perfil guardado exitosamente");
      setIsEditing(false);
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

  const handlePhoneChange = (value: string) => {
    if (!value.startsWith("+56")) {
      setProfileData({ ...profileData, phone: "+56" });
    } else {
      setProfileData({ ...profileData, phone: value });
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Mi Perfil</h1>
          <button
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
                <div className="ml-6 mb-1">
                  <h2 className="text-3xl font-bold text-gray-800">
                    {profileData.full_name || "Completa tu perfil"}
                  </h2>
                  <p className="text-gray-600">
                    @{profileData.username || "usuario"}
                  </p>
                </div>
              </div>

              <div className="relative mb-1">
                <button
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

                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-20">
                      <button
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

                      {!isEditing && (
                        <>
                          <div className="border-t border-gray-100"></div>

                          <button
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
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          full_name: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Juan Pérez González"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          username: e.target.value
                            .toLowerCase()
                            .replace(/\s/g, ""),
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="juanperez"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Número de Celular *
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="+56912345678"
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
                      Región *
                    </label>
                    <select
                      value={profileData.region}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          region: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                    >
                      <option value="">Selecciona una región</option>
                      {REGIONES_CHILE.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={profileData.city}
                      onChange={(e) =>
                        setProfileData({ ...profileData, city: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Santiago"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6">
                    <button
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
                      onClick={() => {
                        setIsEditing(false);
                        if (user) loadProfile(user.id);
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Miembro desde</span>
                    <span className="font-medium text-gray-800">
                      {user && formatDate(user.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado</span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      Activa
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}