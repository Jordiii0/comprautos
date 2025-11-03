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
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Verificar qué tipo de usuario es
        const { data: userData } = await supabase
          .from("usuario")
          .select("id, rol")
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        if (userData) {
          // Es usuario normal
          console.log("✅ Usuario encontrado:", userData.rol);
          if (userData.rol === "administrador") {
            router.push("/admin/profile");
          } else {
            router.push("/profile");
          }
          return;
        }

        // Verificar si es empresa
        const { data: empresaData } = await supabase
          .from("empresa")
          .select("id")
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        if (empresaData) {
          // Es empresa
          console.log("✅ Empresa encontrada");
          router.push("/business-profile");
          return;
        }

        // Si no es ni usuario ni empresa, mantener en login
        console.log("⚠️ No se encontró tipo de usuario");
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Validar campos
      if (!loginForm.email.trim() || !loginForm.password.trim()) {
        setErrorMessage("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      if (!loginForm.email.includes("@")) {
        setErrorMessage("Por favor ingresa un email válido");
        setLoading(false);
        return;
      }

      console.log("🔐 Intentando login con:", loginForm.email);

      // Autenticar con Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (authError) {
        console.error("❌ Error de autenticación:", authError);
        setErrorMessage(
          authError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : authError.message
        );
        setLoading(false);
        return;
      }

      if (!data.user) {
        setErrorMessage("Error al iniciar sesión");
        setLoading(false);
        return;
      }

      console.log("✅ Usuario autenticado:", data.user.id);

      // Verificar qué tipo de usuario es
      const { data: userData, error: userError } = await supabase
        .from("usuario")
        .select("id, rol, habilitado")
        .eq("usuario_id", data.user.id)
        .maybeSingle();

      if (userData) {
        console.log("✅ Usuario encontrado:", userData);

        // Verificar si está habilitado (solo para usuarios normales, no para admin)
        if (userData.rol !== "administrador" && !userData.habilitado) {
          console.log("❌ Usuario deshabilitado");
          setErrorMessage(
            "Tu cuenta ha sido deshabilitada. Contacta al administrador."
          );
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        setSuccessMessage("¡Bienvenido!");

        // Redirigir según el rol
        setTimeout(() => {
          if (userData.rol === "administrador") {
            console.log("→ Redirigiendo a admin");
            router.push("/admin/profile");
          } else {
            console.log("→ Redirigiendo a usuario");
            router.push("/profile");
          }
        }, 1500);
        return;
      }

      // Si no está en usuario, verificar si es empresa
      console.log("🔍 Verificando si es empresa...");
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("id, validada")
        .eq("usuario_id", data.user.id)
        .maybeSingle();

      if (empresaData) {
        console.log("✅ Empresa encontrada:", empresaData);

        setSuccessMessage("¡Bienvenido!");
        setTimeout(() => {
          console.log("→ Redirigiendo a empresa");
          router.push("/business-profile");
        }, 1500);
        return;
      }

      // No encontró ni usuario ni empresa
      console.log("❌ No se encontró perfil");
      setErrorMessage("No se encontró tu perfil. Contacta al administrador.");
      await supabase.auth.signOut();
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Error en login:", error);
      setErrorMessage(
        error.message || "Ocurrió un error. Por favor intenta de nuevo."
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">carNETwork</h1>
            <p className="text-gray-600 mt-2">ComprAutos</p>
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
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={loginForm.password}
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
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </form>

          {/* Separador */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">¿No tienes cuenta?</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          {/* Links de Registro */}
          <div className="space-y-3">
            <button
              onClick={() => router.push("/register")}
              className="w-full border-2 border-indigo-600 text-indigo-600 font-bold py-3 rounded-lg hover:bg-indigo-50 transition"
              disabled={loading}
            >
              Registrarse como Usuario
            </button>
            <button
              onClick={() => router.push("/register-empresa")}
              className="w-full border-2 border-purple-600 text-purple-600 font-bold py-3 rounded-lg hover:bg-purple-50 transition"
              disabled={loading}
            >
              Registrarse como Empresa
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-xs mt-6">
            Al iniciar sesión aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
