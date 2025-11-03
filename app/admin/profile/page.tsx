"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Shield,
  Users,
  Car,
  Building2,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalCompanies: number;
  totalVehicles: number;
  activeVehicles: number;
  hiddenVehicles: number;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCompanies: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    hiddenVehicles: 0,
  });
  const [recentVehicles, setRecentVehicles] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

  // ✅ Control de caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      console.log("🔍 Verificando acceso de administrador...");

      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession) {
        console.log("❌ No hay sesión");
        router.push("/login");
        return;
      }

      // Verificar si es administrador
      const { data: userData, error } = await supabase
        .from("usuario")
        .select("rol")
        .eq("usuario_id", authSession.user.id)
        .single();

      if (error || !userData || userData.rol !== "administrador") {
        console.log("❌ No es administrador, redirigiendo...");
        router.push("/login");
        return;
      }

      console.log("✅ Administrador verificado");
      setSession(authSession);

      // ✅ Cargar todos los datos en paralelo
      await loadAllData();
      setLoading(false);
    } catch (error: any) {
      console.error("❌ Error en checkAdminAccess:", error);
      router.push("/login");
    }
  };

  // ✅ Función unificada para cargar todo en paralelo
  const loadAllData = async () => {
    try {
      const now = Date.now();

      // Usar caché si los datos son recientes
      if (
        now - lastLoadTime.current < CACHE_DURATION &&
        recentVehicles.length > 0
      ) {
        console.log("📦 Usando datos en caché");
        return;
      }

      console.log("📥 Cargando todos los datos...");

      // ✅ Promise.all para ejecutar en paralelo
      const [statsData, recentData, reportsData] = await Promise.all([
        loadStatsData(),
        loadRecentDataParallel(),
        loadPendingReportsCountData(),
      ]);

      setStats(statsData);
      setRecentVehicles(recentData.vehicles);
      setRecentUsers(recentData.users);
      setPendingReportsCount(reportsData);

      lastLoadTime.current = now;
      console.log("✅ Datos cargados exitosamente");
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    }
  };

  // ✅ Retorna datos en lugar de setearlos
  const loadStatsData = async () => {
    try {
      // ✅ Todas las queries en paralelo
      const [usersRes, companiesRes, vehiclesRes, activeRes, hiddenRes] =
        await Promise.all([
          supabase.from("usuario").select("*", { count: "exact", head: true }),
          supabase.from("empresa").select("*", { count: "exact", head: true }),
          supabase.from("vehiculo").select("*", { count: "exact", head: true }),
          supabase
            .from("vehiculo")
            .select("*", { count: "exact", head: true })
            .eq("oculto", false),
          supabase
            .from("vehiculo")
            .select("*", { count: "exact", head: true })
            .eq("oculto", true),
        ]);

      return {
        totalUsers: usersRes.count || 0,
        totalCompanies: companiesRes.count || 0,
        totalVehicles: vehiclesRes.count || 0,
        activeVehicles: activeRes.count || 0,
        hiddenVehicles: hiddenRes.count || 0,
      };
    } catch (error) {
      console.error("❌ Error loading stats:", error);
      return {
        totalUsers: 0,
        totalCompanies: 0,
        totalVehicles: 0,
        activeVehicles: 0,
        hiddenVehicles: 0,
      };
    }
  };

  // ✅ Cargar vehículos y usuarios en paralelo
  const loadRecentDataParallel = async () => {
    try {
      const [vehiclesRes, usersRes] = await Promise.all([
        supabase
          .from("vehiculo")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("usuario")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      return {
        vehicles: vehiclesRes.data || [],
        users: usersRes.data || [],
      };
    } catch (error) {
      console.error("❌ Error loading recent data:", error);
      return { vehicles: [], users: [] };
    }
  };

  // ✅ Retorna datos en lugar de setear
  const loadPendingReportsCountData = async () => {
    try {
      const { count, error } = await supabase
        .from("reporte_vehiculo")
        .select("*", { count: "exact", head: true })
        .eq("estado", "pendiente");

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("❌ Error loading pending reports count:", error);
      return 0;
    }
  };

  // ✅ Actualizar solo el elemento cambiado
  const toggleVehicleVisibility = async (
    vehicleId: number,
    isHidden: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("vehiculo")
        .update({ oculto: !isHidden })
        .eq("id", vehicleId);

      if (error) throw error;

      // ✅ Actualizar lista local sin recargar todo
      setRecentVehicles((prev) =>
        prev.map((v) =>
          v.id === vehicleId ? { ...v, oculto: !isHidden } : v
        )
      );

      // Recargar stats solo
      const statsData = await loadStatsData();
      setStats(statsData);
    } catch (error) {
      console.error("❌ Error toggling visibility:", error);
    }
  };

  // ✅ Eliminar vehículo optimizado SIN PROMISE.ALL (CORREGIDO)
  const deleteVehicle = async (vehicleId: number) => {
    if (!confirm("¿Estás seguro de eliminar este vehículo?")) return;

    try {
      console.log("🗑️ Eliminando vehículo ID:", vehicleId);

      // ✅ PASO 1: Obtener imágenes
      const { data: images, error: imagesError } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", vehicleId);

      if (imagesError) throw imagesError;

      // ✅ PASO 2: Eliminar imágenes del storage
      if (images && images.length > 0) {
        const filePaths = images.map((img) => img.url_imagen);
        const { error: storageError } = await supabase.storage
          .from("vehiculo_imagen")
          .remove(filePaths);

        if (storageError) {
          console.warn("⚠️ Error eliminando del storage:", storageError);
        }
      }

      // ✅ PASO 3: Eliminar registros de imagen_vehiculo
      const { error: deleteImagesError } = await supabase
        .from("imagen_vehiculo")
        .delete()
        .eq("vehiculo_id", vehicleId);

      if (deleteImagesError) throw deleteImagesError;
      console.log("✅ Imágenes eliminadas");

      // ✅ PASO 4: Eliminar registros de usuario_vehiculo
      const { error: deleteUserVehicleError } = await supabase
        .from("usuario_vehiculo")
        .delete()
        .eq("vehiculo_id", vehicleId);

      if (deleteUserVehicleError) throw deleteUserVehicleError;
      console.log("✅ Relaciones usuario-vehículo eliminadas");

      // ✅ PASO 5: Eliminar el vehículo
      const { error: deleteVehicleError } = await supabase
        .from("vehiculo")
        .delete()
        .eq("id", vehicleId);

      if (deleteVehicleError) throw deleteVehicleError;
      console.log("✅ Vehículo eliminado");

      // ✅ PASO 6: Actualizar lista local
      setRecentVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

      // ✅ PASO 7: Recargar stats
      const statsData = await loadStatsData();
      setStats(statsData);

      console.log("✅ Proceso de eliminación completado");
    } catch (error: any) {
      console.error("❌ Error deleting vehicle:", error);
      alert("Error al eliminar el vehículo: " + error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ✅ Función para refrescar datos manualmente
  const handleRefresh = async () => {
    lastLoadTime.current = 0; // Forzar recarga
    await loadAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Panel de Administrador
                </h1>
                <p className="text-slate-400">{session?.user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                🔄 Refrescar
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalUsers}</span>
            </div>
            <p className="text-blue-100 font-semibold">Total Usuarios</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalCompanies}</span>
            </div>
            <p className="text-purple-100 font-semibold">Total Empresas</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Car className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.totalVehicles}</span>
            </div>
            <p className="text-green-100 font-semibold">Total Vehículos</p>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.activeVehicles}</span>
            </div>
            <p className="text-teal-100 font-semibold">Activos</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <EyeOff className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.hiddenVehicles}</span>
            </div>
            <p className="text-orange-100 font-semibold">Ocultos</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Vehículos Recientes */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Car className="w-6 h-6 text-blue-400" />
              Vehículos Recientes
            </h2>
            <div className="space-y-3">
              {recentVehicles.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No hay vehículos registrados
                </p>
              ) : (
                recentVehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="text-white font-semibold">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-sm text-slate-400">
                        Año: {vehicle.anio} • $
                        {vehicle.precio?.toLocaleString() || "N/A"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          toggleVehicleVisibility(vehicle.id, vehicle.oculto)
                        }
                        className={`p-2 rounded-lg transition-colors ${
                          vehicle.oculto
                            ? "bg-yellow-600 hover:bg-yellow-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                        title={vehicle.oculto ? "Mostrar" : "Ocultar"}
                      >
                        {vehicle.oculto ? (
                          <EyeOff className="w-5 h-5 text-white" />
                        ) : (
                          <Eye className="w-5 h-5 text-white" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Usuarios Recientes */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-400" />
              Usuarios Recientes
            </h2>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-slate-400 text-center py-8">
                  No hay usuarios registrados
                </p>
              ) : (
                recentUsers.map((usr) => (
                  <div key={usr.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-semibold">
                          {usr.nombre} {usr.apellido}
                        </h3>
                        <p className="text-sm text-slate-400">RUT: {usr.rut}</p>
                        <p className="text-xs text-slate-500">
                          {usr.correo_electronico}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          usr.rol === "administrador"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {usr.rol}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mt-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
            <button
              onClick={() => router.push("/admin/users")}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Users className="w-5 h-5" />
              Gestionar Usuarios
            </button>

            <button
              onClick={() => router.push("/admin/vehicles")}
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Car className="w-5 h-5" />
              Gestionar Vehículos
            </button>

            <button
              onClick={() => router.push("/admin/companies")}
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Building2 className="w-5 h-5" />
              Gestionar Empresas
            </button>

            <button
              onClick={() => router.push("/admin/validation")}
              className="bg-amber-600 hover:bg-amber-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <Shield className="w-5 h-5" />
              Validación
            </button>

            <button
              onClick={() => router.push("/admin/rejected")}
              className="bg-rose-600 hover:bg-rose-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
            >
              <XCircle className="w-5 h-5" />
              Rechazadas
            </button>

            <div className="relative">
              <button
                onClick={() => router.push("/admin/reports")}
                className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl transition-colors flex flex-col items-center justify-center gap-2 font-semibold"
              >
                <Flag className="w-5 h-5" />
                Reportes
              </button>
              {pendingReportsCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-800 shadow-lg">
                  {pendingReportsCount > 9 ? "9+" : pendingReportsCount}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
