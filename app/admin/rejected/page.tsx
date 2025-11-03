"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  XCircle,
  Search,
  Loader2,
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";

interface RejectedCompany {
  id: number;
  empresa_nombre: string;
  empresa_rut: string;
  correo: string;
  motivo: string;
  rechazado_el: string;
}

export default function RejectedCompaniesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState<RejectedCompany[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // ✅ Caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar filtrado
  const filteredRejected = useMemo(() => {
    if (!searchTerm) return rejected;

    const term = searchTerm.toLowerCase();
    return rejected.filter(
      (r) =>
        r.empresa_nombre.toLowerCase().includes(term) ||
        r.correo.toLowerCase().includes(term) ||
        r.empresa_rut.includes(term)
    );
  }, [rejected, searchTerm]);

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

      await loadRejected();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadRejected = useCallback(async () => {
    try {
      const now = Date.now();

      // Usar caché si es reciente
      if (now - lastLoadTime.current < CACHE_DURATION && rejected.length > 0) {
        console.log("📦 Usando caché de rechazos");
        return;
      }

      console.log("📥 Cargando empresas rechazadas...");

      const { data, error } = await supabase
        .from("empresa_rechazos")
        .select("*")
        .order("rechazado_el", { ascending: false });

      if (error) throw error;
      setRejected(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading rejected companies:", error);
      setRejected([]);
    }
  }, [rejected.length]);

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
              <XCircle className="w-8 h-8 text-red-400" />
              Empresas Rechazadas
            </h1>
            <p className="text-slate-400 mt-2">
              Historial de empresas rechazadas: {rejected.length}
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
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{rejected.length}</span>
            </div>
            <p className="text-red-100 font-semibold">Total Rechazos</p>
          </div>

          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">
                {new Set(rejected.map((r) => r.empresa_rut)).size}
              </span>
            </div>
            <p className="text-slate-100 font-semibold">Empresas Únicas</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">
                {rejected.filter((r) => r.motivo).length}
              </span>
            </div>
            <p className="text-amber-100 font-semibold">Con Motivo</p>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o RUT..."
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Rechazos */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          {filteredRejected.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {rejected.length === 0
                  ? "No hay empresas rechazadas"
                  : "No se encontraron resultados"}
              </h3>
              <p className="text-slate-400">
                {rejected.length === 0
                  ? "El historial de rechazos aparecerá aquí"
                  : "Intenta con otro término de búsqueda"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {filteredRejected.map((item) => (
                <RejectedCompanyCard key={item.id} company={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ Componente separado para mejor rendimiento
interface RejectedCompanyCardProps {
  company: RejectedCompany;
}

function RejectedCompanyCard({ company }: RejectedCompanyCardProps) {
  // ✅ Memoizar formato de fecha
  const formattedDate = useMemo(() => {
    return new Date(company.rechazado_el).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [company.rechazado_el]);

  return (
    <div className="p-6 hover:bg-slate-700/30 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Nombre empresa */}
          <div className="flex items-center gap-3 mb-3">
            <Building2 className="w-5 h-5 text-red-400 flex-shrink-0" />
            <h3 className="text-lg font-bold text-white truncate">
              {company.empresa_nombre}
            </h3>
          </div>

          {/* Información principal */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center gap-2 text-slate-300 text-sm min-w-0">
              <span className="font-semibold flex-shrink-0">RUT:</span>
              <span className="truncate font-mono">{company.empresa_rut}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm min-w-0">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <a
                href={`mailto:${company.correo}`}
                className="text-blue-400 hover:underline truncate"
              >
                {company.correo}
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {formattedDate}
            </div>
          </div>

          {/* Motivo del rechazo */}
          {company.motivo && (
            <div className="bg-slate-700/50 rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-red-400 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-300 mb-1">
                    Motivo del rechazo:
                  </p>
                  <p className="text-sm text-slate-400 break-words">
                    {company.motivo}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
