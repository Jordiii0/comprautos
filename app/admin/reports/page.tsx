"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Flag,
  Search,
  Loader2,
  ArrowLeft,
  Eye,
  CheckCircle,
  XCircle,
  Car,
  User,
  Calendar,
  AlertCircle,
} from "lucide-react";

interface Report {
  id: number;
  vehiculo_id: number;
  usuario_reporta: string;
  motivo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  vehiculo?: {
    marca: string;
    modelo: string;
    anio: number;
    correo_dueno: string;
  };
}

// ✅ Constante de motivos fuera del componente
const MOTIVO_LABELS: Record<string, string> = {
  fraude: "Posible fraude",
  duplicado: "Publicación duplicada",
  precio_erroneo: "Precio erróneo",
  info_falsa: "Información falsa",
  spam: "Spam",
  otro: "Otro",
};

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pendiente" | "revisado" | "resuelto"
  >("pendiente");
  const [error, setError] = useState("");

  // ✅ Caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar filtrado
  const filteredReports = useMemo(() => {
    let filtered = reports;

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.estado === filterStatus);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.vehiculo?.marca.toLowerCase().includes(term) ||
          r.vehiculo?.modelo.toLowerCase().includes(term) ||
          r.usuario_reporta.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reports, filterStatus, searchTerm]);

  // ✅ Calcular estadísticas
  const stats = useMemo(
    () => ({
      pending: reports.filter((r) => r.estado === "pendiente").length,
      reviewed: reports.filter((r) => r.estado === "revisado").length,
      resolved: reports.filter((r) => r.estado === "resuelto").length,
    }),
    [reports]
  );

  const checkAdmin = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      const { data: userData, error } = await supabase
        .from("usuario")
        .select("rol")
        .eq("usuario_id", session.user.id)
        .single();

      if (error || !userData || userData.rol !== "administrador") {
        setError("Acceso denegado");
        router.push("/");
        return;
      }

      await loadReports();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadReports = useCallback(async () => {
    try {
      const now = Date.now();

      // Usar caché si es reciente
      if (now - lastLoadTime.current < CACHE_DURATION && reports.length > 0) {
        console.log("📦 Usando caché de reportes");
        return;
      }

      console.log("📥 Cargando reportes...");

      // Cargar reportes
      const { data, error } = await supabase
        .from("reporte_vehiculo")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setReports([]);
        lastLoadTime.current = now;
        return;
      }

      // ✅ Cargar relaciones en paralelo
      const reportsWithRelations = await Promise.all(
        data.map(async (report) => {
          const { data: vehiculoData } = await supabase
            .from("vehiculo")
            .select("marca, modelo, anio, correo_dueno")
            .eq("id", report.vehiculo_id)
            .single();

          return {
            ...report,
            vehiculo: vehiculoData,
          };
        })
      );

      setReports(reportsWithRelations);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading reports:", error);
      setError("Error al cargar reportes");
      setReports([]);
    }
  }, [reports.length]);

  // ✅ Actualizar estado con actualización local
  const updateStatus = useCallback(
    async (reportId: number, newStatus: string) => {
      setSaving(true);
      try {
        const { error } = await supabase
          .from("reporte_vehiculo")
          .update({ estado: newStatus })
          .eq("id", reportId);

        if (error) throw error;

        // ✅ Actualizar lista local
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId ? { ...r, estado: newStatus } : r
          )
        );

        setError("");
      } catch (error) {
        console.error("Error updating status:", error);
        setError("Error al actualizar el estado del reporte");
      } finally {
        setSaving(false);
      }
    },
    []
  );

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
        <div className="mb-6">
          <button
            onClick={() => router.push("/admin/profile")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Panel
          </button>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Flag className="w-8 h-8 text-red-400" />
              Reportes de Publicaciones
            </h1>
            <p className="text-slate-400 mt-2">
              Total de reportes: {reports.length}
            </p>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-amber-100 font-semibold">Pendientes</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.reviewed}</span>
            </div>
            <p className="text-blue-100 font-semibold">Revisados</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.resolved}</span>
            </div>
            <p className="text-green-100 font-semibold">Resueltos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por vehículo o usuario..."
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">Todos los reportes</option>
              <option value="pendiente">Pendientes</option>
              <option value="revisado">Revisados</option>
              <option value="resuelto">Resueltos</option>
            </select>
          </div>
        </div>

        {/* Lista de reportes */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No hay reportes
              </h3>
              <p className="text-slate-400">
                {filterStatus === "pendiente"
                  ? "No hay reportes pendientes"
                  : "No se encontraron reportes"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onUpdateStatus={updateStatus}
                  onViewVehicle={() =>
                    router.push(`/vehicle/${report.vehiculo_id}`)
                  }
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Componente separado para mejor rendimiento
interface ReportCardProps {
  report: Report;
  onUpdateStatus: (reportId: number, newStatus: string) => void;
  onViewVehicle: () => void;
  saving: boolean;
}

function ReportCard({
  report,
  onUpdateStatus,
  onViewVehicle,
  saving,
}: ReportCardProps) {
  // ✅ Memoizar formato de fecha
  const formattedDate = useMemo(() => {
    return new Date(report.created_at).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [report.created_at]);

  // ✅ Memoizar motivo
  const motivoLabel = useMemo(
    () => MOTIVO_LABELS[report.motivo] || report.motivo,
    [report.motivo]
  );

  // ✅ Determinar color de estado
  const statusColors = useMemo(() => {
    switch (report.estado) {
      case "pendiente":
        return "bg-amber-600 text-white";
      case "revisado":
        return "bg-blue-600 text-white";
      case "resuelto":
        return "bg-green-600 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  }, [report.estado]);

  return (
    <div className="p-6 hover:bg-slate-700/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Encabezado */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <Car className="w-5 h-5 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white truncate">
              {report.vehiculo?.marca} {report.vehiculo?.modelo}{" "}
              {report.vehiculo?.anio}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors}`}>
              {report.estado}
            </span>
          </div>

          {/* Info principal */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm min-w-0">
              <Flag className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold flex-shrink-0">Motivo:</span>
              <span className="truncate">{motivoLabel}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm min-w-0">
              <User className="w-4 h-4 flex-shrink-0" />
              <span className="font-semibold flex-shrink-0">Reportado:</span>
              <span className="truncate">{report.usuario_reporta}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {formattedDate}
            </div>
          </div>

          {/* Descripción */}
          {report.descripcion && (
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-300 break-words">
                {report.descripcion}
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={onViewVehicle}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              Ver Vehículo
            </button>

            {report.estado === "pendiente" && (
              <>
                <button
                  onClick={() => onUpdateStatus(report.id, "revisado")}
                  disabled={saving}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Marcar Revisado
                </button>
                <button
                  onClick={() => onUpdateStatus(report.id, "resuelto")}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  Resolver
                </button>
              </>
            )}
            {report.estado === "revisado" && (
              <button
                onClick={() => onUpdateStatus(report.id, "resuelto")}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                Resolver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
