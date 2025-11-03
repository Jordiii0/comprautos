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
  Building2,
  Phone,
  MapPin,
} from "lucide-react";

interface Region {
  id: number;
  nombre_region: string;
}

export default function RegisterEmpresaPage() {
  const router = useRouter();
  const [registerForm, setRegisterForm] = useState({
    nombre_comercial: "",
    rut_empresa: "",
    correo_electronico: "",
    telefono: "",
    representante_legal: "",
    rut_representante: "",
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
        router.push("/business-profile");
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
        !registerForm.nombre_comercial.trim() ||
        !registerForm.rut_empresa.trim() ||
        !registerForm.correo_electronico.trim()
      ) {
        setErrorMessage(
          "Por favor completa nombre de empresa, RUT empresa y email"
        );
        setLoading(false);
        return;
      }

      if (!registerForm.representante_legal.trim()) {
        setErrorMessage("Por favor completa el nombre del representante legal");
        setLoading(false);
        return;
      }

      if (!registerForm.rut_representante.trim()) {
        setErrorMessage("Por favor completa el RUT del representante legal");
        setLoading(false);
        return;
      }

      if (!validateRUT(registerForm.rut_empresa)) {
        setErrorMessage(
          "RUT de empresa inválido. Debe tener al menos 8 dígitos"
        );
        setLoading(false);
        return;
      }

      if (!validateRUT(registerForm.rut_representante)) {
        setErrorMessage(
          "RUT del representante inválido. Debe tener al menos 8 dígitos"
        );
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
        setErrorMessage("Por favor ingresa la ciudad");
        setLoading(false);
        return;
      }

      console.log("🏢 Creando empresa:", registerForm.correo_electronico);

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

      // Crear registro en tabla empresa
      const { error: insertError } = await supabase.from("empresa").insert({
        usuario_id: authData.user.id,
        nombre_comercial: registerForm.nombre_comercial.trim(),
        rut_empresa: registerForm.rut_empresa.trim(),
        correo_electronico: registerForm.correo_electronico.trim(),
        telefono: registerForm.telefono.trim() || null,
        representante_legal: registerForm.representante_legal.trim(),
        rut_representante: registerForm.rut_representante.trim(),
        region: parseInt(registerForm.region),
        ciudad: registerForm.ciudad.trim(),
        validada: false, // Las empresas se crean como no validadas
      });

      if (insertError) {
        console.error("❌ Error al crear empresa en BD:", insertError);
        // Si falla la inserción en la BD, eliminar la cuenta de Auth
        await supabase.auth.admin.deleteUser(authData.user.id);
        setErrorMessage(
          "Error al guardar tu información. Por favor intenta de nuevo."
        );
        setLoading(false);
        return;
      }

      console.log("✅ Empresa registrada en base de datos");

      setSuccessMessage(
        "¡Empresa registrada exitosamente! Tu perfil será validado por un administrador. Redirigiendo..."
      );
      setTimeout(() => {
        router.push("/business-profile");
      }, 3000);
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      setErrorMessage(
        error.message || "Ocurrió un error. Por favor intenta de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Registrar Empresa
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
            {/* Información de la Empresa */}
            <div className="bg-purple-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Información de la Empresa
              </h3>

              <div className="space-y-4">
                {/* Nombre Comercial y RUT Empresa */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="nombre_comercial"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Nombre Comercial *
                    </label>
                    <input
                      id="nombre_comercial"
                      type="text"
                      name="nombre_comercial"
                      value={registerForm.nombre_comercial}
                      onChange={handleInputChange}
                      placeholder="Mi Empresa S.A."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rut_empresa"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      RUT Empresa *
                    </label>
                    <input
                      id="rut_empresa"
                      type="text"
                      name="rut_empresa"
                      value={registerForm.rut_empresa}
                      onChange={handleInputChange}
                      placeholder="12.345.678-9"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email y Teléfono */}
                <div className="grid grid-cols-2 gap-4">
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
                        placeholder="contacto@empresa.com"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        disabled={loading}
                      />
                    </div>
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
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Representante Legal */}
            <div className="bg-pink-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-pink-600" />
                Representante Legal
              </h3>

              <div className="space-y-4">
                {/* Nombre y RUT Representante */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="representante_legal"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      Nombre Completo *
                    </label>
                    <input
                      id="representante_legal"
                      type="text"
                      name="representante_legal"
                      value={registerForm.representante_legal}
                      onChange={handleInputChange}
                      placeholder="Juan Pérez García"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="rut_representante"
                      className="block text-sm font-semibold text-gray-700 mb-2"
                    >
                      RUT *
                    </label>
                    <input
                      id="rut_representante"
                      type="text"
                      name="rut_representante"
                      value={registerForm.rut_representante}
                      onChange={handleInputChange}
                      placeholder="12.345.678-9"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Ubicación
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="region"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Región *
                  </label>
                  <select
                    id="region"
                    name="region"
                    value={registerForm.region}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition appearance-none bg-white"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-gray-600" />
                Seguridad
              </h3>

              <div className="space-y-4">
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
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent outline-none transition"
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
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo 6 caracteres
                  </p>
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
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-600 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
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
              </div>
            </div>

            {/* Botón Registrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Empresa"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-purple-600 font-semibold hover:text-purple-700 transition"
              >
                Iniciar sesión
              </button>
            </p>
            <p className="text-gray-600 mt-2">
              ¿Eres un usuario?{" "}
              <button
                onClick={() => router.push("/register")}
                className="text-blue-600 font-semibold hover:text-blue-700 transition"
              >
                Registrar como usuario
              </button>
            </p>
          </div>

          {/* Legal */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Al registrarte aceptas nuestros términos y condiciones. <br />
            <span className="text-amber-600 font-semibold">
              Nota: Tu empresa será validada por un administrador antes de poder
              publicar.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
