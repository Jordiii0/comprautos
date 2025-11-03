"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Flag,
  Search,
  Loader2,
  ArrowLeft,
  Car,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";

interface MyReport {
  id: number;
  vehiculo_id: number;
  motivo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  vehiculo?: {
    marca: string;
    modelo: string;
    anio: number;
  };
}

export default function MyReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<MyReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<MyReport[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    loadMyReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [searchTerm, reports]);

  const loadMyReports = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      console.log("👤 Email del usuario:", session.user.email);
      setUserEmail(session.user.email || "");

      // Cargar reportes del usuario actual
      console.log("🔄 Cargando reportes...");
      const { data, error } = await supabase
        .from("reporte_vehiculo")
        .select("*")
        .eq("usuario_reporta", session.user.email)
        .order("created_at", { ascending: false });

      console.log("✅ Resultado query:", { data, error });

      if (error) {
        console.error("❌ Error en query:", error);
        throw error;
      }

      console.log("📊 Reportes encontrados:", data?.length || 0);

      // Cargar relaciones manualmente
      if (data && data.length > 0) {
        console.log("🔗 Cargando vehículos...");
        const reportsWithVehicles = await Promise.all(
          data.map(async (report) => {
            const { data: vehiculoData } = await supabase
              .from("vehiculo")
              .select("marca, modelo, anio")
              .eq("id", report.vehiculo_id)
              .single();

            return {
              ...report,
              vehiculo: vehiculoData,
            };
          })
        );

        console.log("✅ Reportes con vehículos:", reportsWithVehicles);
        setReports(reportsWithVehicles);
      } else {
        console.warn("⚠️ No hay reportes para este usuario");
        setReports([]);
      }
    } catch (error) {
      console.error("❌ Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.vehiculo?.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.vehiculo?.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.motivo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredReports(filtered);
  };

  const handleDelete = async (reportId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este reporte?")) return;

    try {
      const { error } = await supabase
        .from("reporte_vehiculo")
        .delete()
        .eq("id", reportId);

      if (error) throw error;

      await loadMyReports();
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Error al eliminar el reporte");
    }
  };

  const getMotivoLabel = (motivo: string) => {
    const motivos: Record<string, string> = {
      fraude: "Posible fraude",
      duplicado: "Publicación duplicada",
      precio_erroneo: "Precio erróneo",
      info_falsa: "Información falsa",
      spam: "Spam",
      otro: "Otro",
    };
    return motivos[motivo] || motivo;
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "bg-amber-100 text-amber-700";
      case "revisado":
        return "bg-blue-100 text-blue-700";
      case "resuelto":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Flag className="w-8 h-8 text-red-600" />
            Mis Reportes
          </h1>
          <p className="text-gray-600 mt-2">
            Total de reportes: {reports.length}
          </p>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por vehículo o motivo..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de reportes */}
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No hay reportes
            </h3>
            <p className="text-gray-600">
              {reports.length === 0
                ? "Aún no has hecho ningún reporte"
                : "No se encontraron reportes con esos criterios"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Car className="w-5 h-5 text-red-600" />
                      <h3 className="text-lg font-bold text-gray-800">
                        {report.vehiculo?.marca} {report.vehiculo?.modelo}{" "}
                        {report.vehiculo?.anio}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getEstadoColor(
                          report.estado
                        )}`}
                      >
                        {report.estado}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Motivo:</span>{" "}
                        {getMotivoLabel(report.motivo)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {report.descripcion && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {report.descripcion}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(report.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar reporte"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
