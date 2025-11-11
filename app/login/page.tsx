"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => { checkAuth(); }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const userId = session.user.id;
        // Buscar usuario
        const { data: userData } = await supabase
          .from("usuario")
          .select("id, rol")
          .eq("id", userId)
          .maybeSingle();

        if (userData) {
          if (userData.rol === "administrador") {
            router.replace("/admin/profile");
          } else {
            router.replace("/profile");
          }
          return;
        }

        // Buscar empresa
        const { data: empresaData } = await supabase
        .from("empresa")
        .select("id, validada")
        .eq("usuario_id", userId)
        .maybeSingle();

        if (empresaData) {
          router.replace("/business-profile");
          return;
        }

        // Si no hay perfil, desloguea y permite login
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMessage("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      if (!loginForm.email.trim() || !loginForm.password.trim()) {
        setErrorMessage("Por favor completa todos los campos");
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (authError) {
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

      const userId = data.user.id;

      // Buscar usuario normal
      const { data: userData } = await supabase
        .from("usuario")
        .select("id, rol, habilitado")
        .eq("id", userId)
        .maybeSingle();

      if (userData) {
        if (userData.rol !== "administrador" && userData.habilitado === false) {
          setErrorMessage("Tu cuenta ha sido deshabilitada. Contacta al administrador.");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        setSuccessMessage("¡Bienvenido!");
        setTimeout(() => {
          if (userData.rol === "administrador") router.replace("/admin/profile");
          else router.replace("/profile");
        }, 1200);
        return;
      }

      // Buscar empresa
      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id, validada")
        .eq("usuario_id", userId)
        .maybeSingle();
      if (empresaData) {
        setSuccessMessage("¡Bienvenido!");
        setTimeout(() => router.replace("/business-profile"), 1200);
        return;
      }

      // No está en ninguna tabla
      setErrorMessage("No se encontró tu perfil. Contacta al administrador.");
      await supabase.auth.signOut();
      setLoading(false);
    } catch (error: any) {
      setErrorMessage(error.message || "Ocurrió un error. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-100">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8 text-center">
            <div className="inline-block p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">carNETwork</h1>
            <p className="text-gray-600 mt-2">ComprAutos</p>
          </div>

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

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
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
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
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
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Iniciando sesión...</>) : "Iniciar Sesión"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 text-sm">¿No tienes cuenta?</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
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
          <p className="text-center text-gray-500 text-xs mt-6">
            Al iniciar sesión aceptas nuestros términos y condiciones
          </p>
        </div>
      </div>
    </div>
  );
}
