"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  LogOut,
  Loader2,
  Phone,
  MapPin,
  Save,
  Edit2,
  Mail,
  Globe,
  FileText,
  MapPinned,
  Menu,
  ChevronDown,
  Plus,
  List,
  Heart,
  Calendar,
  Briefcase,
  IdCard,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    account_type?: string;
    full_name?: string;
    position?: string;
  };
}

interface BusinessProfileData {
  legal_name: string;
  commercial_name: string;
  rut: string;
  region: string;
  city: string;
  address: string;
  corporate_email: string;
  phone: string;
  website: string;
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

export default function BusinessProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  const [profileData, setProfileData] = useState<BusinessProfileData>({
    legal_name: "",
    commercial_name: "",
    rut: "",
    region: "",
    city: "",
    address: "",
    corporate_email: "",
    phone: "+56",
    website: "",
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

      // Verificar que sea cuenta empresa
      if (session.user.user_metadata?.account_type !== 'business') {
        router.push("/profile");
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
        .from("business_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setProfileData({
          legal_name: data.legal_name || "",
          commercial_name: data.commercial_name || "",
          rut: data.rut || "",
          region: data.region || "",
          city: data.city || "",
          address: data.address || "",
          corporate_email: data.corporate_email || "",
          phone: data.phone || "+56",
          website: data.website || "",
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
      !profileData.legal_name ||
      !profileData.commercial_name ||
      !profileData.rut ||
      !profileData.region ||
      !profileData.city ||
      !profileData.address ||
      !profileData.corporate_email ||
      !profileData.phone
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    if (!profileData.phone.startsWith("+56")) {
      alert("El número debe comenzar con +56");
      return;
    }

    setSaving(true);
    setSuccessMessage("");

    try {
      const { error } = await supabase.from("business_profiles").upsert({
        id: user.id,
        legal_name: profileData.legal_name,
        commercial_name: profileData.commercial_name,
        rut: profileData.rut,
        region: profileData.region,
        city: profileData.city,
        address: profileData.address,
        corporate_email: profileData.corporate_email,
        phone: profileData.phone,
        website: profileData.website,
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
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-indigo-600">Perfil Empresarial</h1>
          </div>
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
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32"></div>

          <div className="relative px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-6">
              <div className="flex items-end">
                <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center">
                  <Building2 className="w-20 h-20 text-indigo-400" />
                </div>
                <div className="ml-6 mb-5">
                  <h2 className="text-3xl font-bold text-gray-800 text-white">
                    {profileData.commercial_name || "Completa tu perfil empresarial"}
                  </h2>
                  <p className="text-gray-600">
                    {user.user_metadata?.full_name || "Representante Legal"}
                  </p>
                  {user.user_metadata?.position && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {user.user_metadata.position}
                    </p>
                  )}
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
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Información de la Empresa
                    </h3>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Nombre Legal (Registro SII) *
                    </label>
                    <input
                      type="text"
                      value={profileData.legal_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          legal_name: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Empresa S.A."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Nombre Comercial *
                    </label>
                    <input
                      type="text"
                      value={profileData.commercial_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          commercial_name: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Mi Empresa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <IdCard className="w-4 h-4 inline mr-1" />
                      RUT *
                    </label>
                    <input
                      type="text"
                      value={profileData.rut}
                      onChange={(e) =>
                        setProfileData({ ...profileData, rut: e.target.value })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="12.345.678-9"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Correo Corporativo *
                    </label>
                    <input
                      type="email"
                      value={profileData.corporate_email}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          corporate_email: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="contacto@empresa.cl"
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
                      <Globe className="w-4 h-4 inline mr-1" />
                      Sitio Web Oficial
                    </label>
                    <input
                      type="url"
                      value={profileData.website}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          website: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="https://www.empresa.cl"
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
                      <MapPin className="w-4 h-4 inline mr-1" />
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

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPinned className="w-4 h-4 inline mr-1" />
                      Dirección/Ubicación *
                    </label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          address: e.target.value,
                        })
                      }
                      disabled={!isEditing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-600"
                      placeholder="Av. Libertador Bernardo O'Higgins 1234, Piso 5"
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
                    <span className="text-gray-600">Tipo de cuenta</span>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Empresa
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