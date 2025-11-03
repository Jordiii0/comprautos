"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  Phone,
  MapPin,
} from "lucide-react";

interface Region {
  id: number;
  nombre_region: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({
    nombre: "",
    apellido: "",
    rut: "",
    telefono: "",
    correo_electronico: "",
    region: "",
    ciudad: "",
    password: "",
    confirmPassword: "",
  });

  const [regions, setRegions] = useState<Region[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
    loadRegions();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  const validateRUT = (rut: string): boolean => {
    // Formato básico: XXX.XXX.XXX-X o sin puntos
    const cleanRUT = rut.replace(/\./g, "").replace(/-/g, "");
    return cleanRUT.length >= 8 && cleanRUT.length <= 9;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validaciones
      if (
        !registerForm.nombre.trim() ||
        !registerForm.apellido.trim() ||
        !registerForm.rut.trim() ||
        !registerForm.correo_electronico.trim()
      ) {
        setErrorMessage("Por favor completa nombre, apellido, RUT y email");
        setLoading(false);
        return;
      }

      if (!validateRUT(registerForm.rut)) {
        setErrorMessage("RUT inválido. Debe tener al menos 8 dígitos");
        setLoading(false);
        return;
      }

      if (!registerForm.correo_electronico.includes("@")) {
        setErrorMessage("Por favor ingresa un email válido");
        setLoading(false);
        return;
      }

      if (registerForm.password.length < 6) {
        setErrorMessage("La contraseña debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setErrorMessage("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }

      if (!registerForm.region) {
        setErrorMessage("Por favor selecciona una región");
        setLoading(false);
        return;
      }

      if (!registerForm.ciudad.trim()) {
        setErrorMessage("Por favor ingresa tu ciudad");
        setLoading(false);
        return;
      }

      console.log("🔐 Creando usuario:", registerForm.correo_electronico);

      // Crear usuario en Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: registerForm.correo_electronico,
        password: registerForm.password,
      });

      const authData = data;

      if (authError) {
        console.error("❌ Error de autenticación:", authError);
        if (authError.message.includes("already registered")) {
          setErrorMessage("Este email ya está registrado");
        } else {
          setErrorMessage(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData?.user) {
        setErrorMessage("Error al crear la cuenta");
        setLoading(false);
        return;
      }

      console.log("✅ Usuario autenticado:", authData.user.id);

      // Crear registro en tabla usuario
      const { error: insertError } = await supabase.from("usuario").insert({
        usuario_id: authData.user.id,
        nombre: registerForm.nombre.trim(),
        apellido: registerForm.apellido.trim(),
        rut: registerForm.rut.trim(),
        telefono: registerForm.telefono.trim() || null,
        correo_electronico: registerForm.correo_electronico.trim(),
        region: parseInt(registerForm.region),
        ciudad: registerForm.ciudad.trim(),
        rol: "usuario",
        habilitado: true,
      });

      if (insertError) {
        console.error("❌ Error al crear usuario en BD:", insertError);
        // Si falla la inserción en la BD, eliminar la cuenta de Auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        setErrorMessage(
          "Error al guardar tu información. Por favor intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      console.log("✅ Usuario registrado en base de datos");

      setSuccessMessage("¡Cuenta creada exitosamente! Redirigiendo...");
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      setErrorMessage(
        error.message || "Ocurrió un error. Por favor intenta de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Crear Cuenta Usuario
            </h1>
            <p className="text-gray-600 mt-2">carNETwork - ComprAutos</p>
          </div>

          {/* Mensajes */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="nombre"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Nombre *
                </label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  value={registerForm.nombre}
                  onChange={handleInputChange}
                  placeholder="Juan"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="apellido"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Apellido *
                </label>
                <input
                  id="apellido"
                  type="text"
                  name="apellido"
                  value={registerForm.apellido}
                  onChange={handleInputChange}
                  placeholder="Pérez"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* RUT y Teléfono */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rut"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  RUT *
                </label>
                <input
                  id="rut"
                  type="text"
                  name="rut"
                  value={registerForm.rut}
                  onChange={handleInputChange}
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Teléfono (opcional)
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="telefono"
                    type="tel"
                    name="telefono"
                    value={registerForm.telefono}
                    onChange={handleInputChange}
                    placeholder="+56912345678"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="correo_electronico"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="correo_electronico"
                  type="email"
                  name="correo_electronico"
                  value={registerForm.correo_electronico}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Región y Ciudad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="region"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Región *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    id="region"
                    name="region"
                    value={registerForm.region}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition appearance-none bg-white"
                    disabled={loading}
                  >
                    <option value="">Selecciona una región</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="ciudad"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Ciudad *
                </label>
                <input
                  id="ciudad"
                  type="text"
                  name="ciudad"
                  value={registerForm.ciudad}
                  onChange={handleInputChange}
                  placeholder="Santiago"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={registerForm.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Confirmar Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={registerForm.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón Registrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition"
              >
                Iniciar sesión
              </button>
            </p>
            <p className="text-gray-600 mt-2">
              ¿Eres una empresa?{" "}
              <button
                onClick={() => router.push("/register-empresa")}
                className="text-purple-600 font-semibold hover:text-purple-700 transition"
              >
                Registrar empresa
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Al registrarte aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
