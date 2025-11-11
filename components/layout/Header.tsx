"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Menu, X, ChevronDown, LogIn, UserCircle, Shield } from "lucide-react";
import { Car } from "lucide-react";

export default function Header() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileRoute, setProfileRoute] = useState("/profile");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    name?: string;
    accountType?: "user" | "business" | "admin";
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para detectar el tipo de usuario
  const detectUserType = async (userId: string, userEmail: string) => {
    try {
      console.log("🔍 Detectando tipo de usuario para:", userId, userEmail);

      // 1. Verificar si es USUARIO (incluye administradores)
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuario")
        .select("id, nombre, apellido, rol")
        .eq("id", userId)
        .maybeSingle();

      console.log("👤 Búsqueda usuario:", usuarioData, usuarioError);

      if (usuarioData) {
        // Verificar si es ADMINISTRADOR
        if (usuarioData.rol === "administrador") {
          console.log("✅ ENCONTRADO: Es ADMINISTRADOR");
          return {
            accountType: "admin" as const,
            name:
              `${usuarioData.nombre} ${usuarioData.apellido}`.trim() || "Admin",
            route: "/admin/profile",
          };
        }

        // Es usuario normal
        console.log("✅ ENCONTRADO: Es USUARIO NORMAL");
        return {
          accountType: "user" as const,
          name:
            `${usuarioData.nombre} ${usuarioData.apellido}`.trim() ||
            "Mi Perfil",
          route: "/profile",
        };
      }

      // 2. Si no es usuario, verificar si es EMPRESA
      const { data: empresaData, error: empresaError } = await supabase
        .from("empresa")
        .select("id, nombre_comercial")
        .eq("usuario_id", userId)
        .maybeSingle();

      console.log("🏢 Búsqueda empresa:", empresaData, empresaError);

      if (empresaData) {
        console.log("✅ ENCONTRADO: Es EMPRESA");
        return {
          accountType: "business" as const,
          name: empresaData.nombre_comercial || "Empresa",
          route: "/business-profile",
        };
      }

      // Si no existe en ninguna tabla
      console.log("⚠️ Usuario no encontrado en ninguna tabla");
      return {
        accountType: "user" as const,
        name: "Mi Perfil",
        route: "/profile",
      };
    } catch (error) {
      console.error("❌ Error detectando tipo de usuario:", error);
      return {
        accountType: "user" as const,
        name: "Mi Perfil",
        route: "/profile",
      };
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkUserType = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id && session?.user?.email) {
          const userType = await detectUserType(
            session.user.id,
            session.user.email
          );

          setIsAuthenticated(true);
          setUserInfo({
            name: userType.name,
            accountType: userType.accountType,
          });
          setProfileRoute(userType.route);
        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
          setProfileRoute("/profile");
        }
      } catch (error) {
        console.error("Error checking user type:", error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkUserType();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.id && session?.user?.email) {
        const userType = await detectUserType(
          session.user.id,
          session.user.email
        );

        setIsAuthenticated(true);
        setUserInfo({
          name: userType.name,
          accountType: userType.accountType,
        });
        setProfileRoute(userType.route);

        console.log("🎯 Profile route actualizado a:", userType.route);
      } else {
        setIsAuthenticated(false);
        setUserInfo(null);
        setProfileRoute("/profile");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg border-b border-gray-100"
          : "bg-white/95 backdrop-blur-md border-b border-gray-200"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="group">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-200 shadow-md">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  carNETwork
                </span>
                <div className="text-[10px] text-gray-500 font-medium tracking-wider -mt-1">
                  ComprAutos
                </div>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link href="/shop">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Tienda
              </div>
            </Link>
            <Link href="/about">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Sobre Nosotros
              </div>
            </Link>
            <Link href="/comparativa">
              <div className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200">
                Compara
              </div>
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Publish Button */}
            {isAuthenticated && userInfo?.accountType !== "admin" && (
              <Link href="/publication">
                <div className="relative group">
                  <div className="p-2 lg:px-4 lg:py-2 rounded-xl hover:bg-gray-100 transition-all duration-200 flex items-center space-x-2">
                    <span className="hidden lg:block text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">
                      Vende tu Auto
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Profile/Login Button - Desktop */}
            {!loading && isAuthenticated ? (
              <Link href={profileRoute}>
                <div
                  className={`hidden lg:flex items-center space-x-2 px-4 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 group relative ${
                    userInfo?.accountType === "admin"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                  }`}
                >
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                  {userInfo?.accountType === "admin" ? (
                    <Shield className="w-5 h-5" />
                  ) : (
                    <UserCircle className="w-5 h-5" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold leading-tight">
                      {userInfo?.name || "Mi Perfil"}
                    </span>
                    {userInfo?.accountType === "business" && (
                      <span className="text-[10px] opacity-90 leading-tight">
                        Empresa
                      </span>
                    )}
                    {userInfo?.accountType === "admin" && (
                      <span className="text-[10px] opacity-90 leading-tight">
                        Administrador
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:scale-105 transition-all duration-200 group">
                  <LogIn className="w-5 h-5" />
                  <span className="text-sm font-semibold">Iniciar Sesión</span>
                </div>
              </Link>
            )}

            {/* Mobile Profile/Login Icon */}
            <Link
              href={isAuthenticated ? profileRoute : "/login"}
              className="lg:hidden"
            >
              <div className="relative p-2 rounded-xl hover:bg-gray-100 transition-all">
                {isAuthenticated ? (
                  <>
                    {userInfo?.accountType === "admin" ? (
                      <Shield className="w-5 h-5 text-amber-600" />
                    ) : (
                      <UserCircle className="w-5 h-5 text-indigo-600" />
                    )}
                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div>
                  </>
                ) : (
                  <LogIn className="w-5 h-5 text-gray-700" />
                )}
              </div>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-all"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col space-y-1">
              <Link href="/shop" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Tienda
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>
              <Link href="/about" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Sobre Nosotros
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>
              <Link href="/comparativa" onClick={() => setIsMobileOpen(false)}>
                <div className="flex items-center justify-between px-4 py-3 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all font-medium">
                  Compara
                  <ChevronDown className="w-4 h-4 -rotate-90" />
                </div>
              </Link>

              <div className="pt-4 mt-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <Link
                    href={profileRoute}
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-lg hover:shadow-lg transition-all font-semibold ${
                        userInfo?.accountType === "admin"
                          ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {userInfo?.accountType === "admin" ? (
                            <Shield className="w-5 h-5" />
                          ) : (
                            <UserCircle className="w-5 h-5" />
                          )}
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-white"></div>
                        </div>
                        <div className="flex flex-col items-start">
                          <span>{userInfo?.name || "Mi Perfil"}</span>
                          {userInfo?.accountType === "business" && (
                            <span className="text-xs opacity-90">
                              Cuenta Empresa
                            </span>
                          )}
                          {userInfo?.accountType === "admin" && (
                            <span className="text-xs opacity-90">
                              Administrador
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </div>
                  </Link>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                    <div className="flex items-center justify-between px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold">
                      <div className="flex items-center space-x-3">
                        <LogIn className="w-5 h-5" />
                        <span>Iniciar Sesión</span>
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90" />
                    </div>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
