"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  Clock,
} from "lucide-react";

interface Empresa {
  id: number;
  usuario_id: string;
  nombre_comercial: string;
  rut_empresa: string;
  correo_electronico: string;
  telefono: string | null;
  direccion: string | null;
  ciudad: string | null;
  sitio_web: string | null;
  validada: boolean;
  created_at: string;
}

interface ModalData {
  type: "view" | "approve" | "reject" | null;
  empresa: Empresa | null;
}

export default function ValidationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "pending" | "validated" | "all"
  >("pending");
  const [modal, setModal] = useState<ModalData>({ type: null, empresa: null });
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  // ✅ Caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar filtrado
  const filteredCompanies = useMemo(() => {
    let filtered = companies;

    if (filterStatus === "pending") {
      filtered = filtered.filter((c) => !c.validada);
    } else if (filterStatus === "validated") {
      filtered = filtered.filter((c) => c.validada);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.nombre_comercial.toLowerCase().includes(term) ||
          c.correo_electronico.toLowerCase().includes(term) ||
          c.rut_empresa.includes(term)
      );
    }

    return filtered;
  }, [companies, filterStatus, searchTerm]);

  // ✅ Calcular estadísticas
  const stats = useMemo(
    () => ({
      pending: companies.filter((c) => !c.validada).length,
      validated: companies.filter((c) => c.validada).length,
      total: companies.length,
    }),
    [companies]
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

      await loadCompanies();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = useCallback(async () => {
    try {
      const now = Date.now();

      // Usar caché si es reciente
      if (now - lastLoadTime.current < CACHE_DURATION && companies.length > 0) {
        console.log("📦 Usando caché de empresas");
        return;
      }

      console.log("📥 Cargando empresas...");

      const { data, error } = await supabase
        .from("empresa")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading companies:", error);
      setError("Error al cargar empresas");
    }
  }, [companies.length]);

  // ✅ Aprobar empresa
  const handleApprove = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      console.log("🔄 Aprobando empresa:", modal.empresa.id);

      const { error } = await supabase
        .from("empresa")
        .update({ validada: true })
        .eq("id", modal.empresa.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setCompanies((prev) =>
        prev.map((e) =>
          e.id === modal.empresa!.id ? { ...e, validada: true } : e
        )
      );

      setModal({ type: null, empresa: null });
      setError("");
    } catch (error) {
      console.error("Error approving company:", error);
      setError("Error al aprobar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa]);

  // ✅ Rechazar empresa
  const handleReject = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      console.log("🔄 Rechazando empresa:", modal.empresa.id);

      // 1. Eliminar usuario de auth
      try {
        await supabase.auth.admin.deleteUser(modal.empresa.usuario_id);
      } catch (authError) {
        console.warn("⚠️ No se pudo eliminar de auth:", authError);
      }

      // 2. Eliminar empresa
      const { error } = await supabase
        .from("empresa")
        .delete()
        .eq("id", modal.empresa.id);

      if (error) throw error;

      // 3. Guardar motivo del rechazo (si existe)
      if (rejectReason.trim()) {
        try {
          await supabase.from("empresa_rechazos").insert({
            empresa_nombre: modal.empresa.nombre_comercial,
            empresa_rut: modal.empresa.rut_empresa,
            correo: modal.empresa.correo_electronico,
            motivo: rejectReason,
            rechazado_el: new Date().toISOString(),
          });
        } catch (logError) {
          console.warn("⚠️ No se pudo guardar log del rechazo:", logError);
        }
      }

      // ✅ Actualizar lista local
      setCompanies((prev) =>
        prev.filter((e) => e.id !== modal.empresa!.id)
      );

      setModal({ type: null, empresa: null });
      setRejectReason("");
      setError("");
    } catch (error) {
      console.error("Error rejecting company:", error);
      setError("Error al rechazar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa, rejectReason]);

  // ✅ Cerrar modal
  const closeModal = useCallback(() => {
    setModal({ type: null, empresa: null });
    setRejectReason("");
  }, []);

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
              <Shield className="w-8 h-8 text-amber-400" />
              Validación de Empresas
            </h1>
            <p className="text-slate-400 mt-2">
              Revisa y aprueba empresas que desean registrarse
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
              <Clock className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-amber-100 font-semibold">Pendientes</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.validated}</span>
            </div>
            <p className="text-green-100 font-semibold">Validadas</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-purple-100 font-semibold">Total</p>
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
                placeholder="Buscar por nombre, email o RUT..."
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="pending">Pendientes de validación</option>
              <option value="validated">Validadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Empresa
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    RUT
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-400">
                        {filterStatus === "pending"
                          ? "No hay empresas pendientes de validación"
                          : "No se encontraron empresas"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCompanies.map((empresa) => (
                    <tr
                      key={empresa.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-semibold flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                            {empresa.nombre_comercial}
                          </p>
                          <p className="text-sm text-slate-400 truncate">
                            {empresa.correo_electronico}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-sm">
                        {empresa.rut_empresa}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">
                          {empresa.telefono || "—"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {empresa.ciudad || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-sm">
                        {new Date(empresa.created_at).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            empresa.validada
                              ? "bg-green-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {empresa.validada ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Validada
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pendiente
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setModal({ type: "view", empresa })}
                            disabled={saving}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          {!empresa.validada && (
                            <>
                              <button
                                onClick={() =>
                                  setModal({ type: "approve", empresa })
                                }
                                disabled={saving}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Aprobar"
                              >
                                <CheckCircle className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() =>
                                  setModal({ type: "reject", empresa })
                                }
                                disabled={saving}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                                title="Rechazar"
                              >
                                <XCircle className="w-4 h-4 text-white" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Ver Detalles */}
      {modal.type === "view" && modal.empresa && (
        <ModalDetalles
          empresa={modal.empresa}
          onClose={closeModal}
          onApprove={() => setModal({ type: "approve", empresa: modal.empresa })}
          onReject={() => setModal({ type: "reject", empresa: modal.empresa })}
        />
      )}

      {/* Modal Aprobar */}
      {modal.type === "approve" && modal.empresa && (
        <ModalAprobar
          empresa={modal.empresa}
          onConfirm={handleApprove}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Modal Rechazar */}
      {modal.type === "reject" && modal.empresa && (
        <ModalRechazar
          empresa={modal.empresa}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onConfirm={handleReject}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// ✅ Componentes de modal separados
interface ModalDetallesProps {
  empresa: Empresa;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}

function ModalDetalles({
  empresa,
  onClose,
  onApprove,
  onReject,
}: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-400" />
          Detalles de la Empresa
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Nombre</p>
              <p className="text-white font-semibold text-lg">
                {empresa.nombre_comercial}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">RUT</p>
              <p className="text-white font-semibold font-mono">
                {empresa.rut_empresa}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </p>
              <p className="text-white break-all text-sm">
                {empresa.correo_electronico}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Phone className="w-4 h-4" /> Teléfono
              </p>
              <p className="text-white text-sm">
                {empresa.telefono || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Ciudad
              </p>
              <p className="text-white text-sm">
                {empresa.ciudad || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Globe className="w-4 h-4" /> Sitio Web
              </p>
              {empresa.sitio_web ? (
                <a
                  href={empresa.sitio_web}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all text-sm"
                >
                  {empresa.sitio_web}
                </a>
              ) : (
                <p className="text-white text-sm">No especificado</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm">Dirección</p>
              <p className="text-white text-sm">
                {empresa.direccion || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Registro
              </p>
              <p className="text-white text-sm">
                {new Date(empresa.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-white font-semibold text-sm">
                {empresa.validada ? "Validada" : "Pendiente"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
          {!empresa.validada && (
            <>
              <button
                onClick={onApprove}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Aprobar
              </button>
              <button
                onClick={onReject}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Rechazar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface ModalAprobarProps {
  empresa: Empresa;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalAprobar({
  empresa,
  onConfirm,
  onClose,
  saving,
}: ModalAprobarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-400" />
          Aprobar Empresa
        </h2>
        <p className="text-slate-300 mb-6">
          ¿Estás seguro de que quieres aprobar a{" "}
          <span className="font-semibold text-white">
            {empresa.nombre_comercial}
          </span>
          ? La empresa podrá acceder a todas las funcionalidades.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Aprobando...
              </>
            ) : (
              "Aprobar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalRechazarProps {
  empresa: Empresa;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalRechazar({
  empresa,
  rejectReason,
  setRejectReason,
  onConfirm,
  onClose,
  saving,
}: ModalRechazarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <XCircle className="w-6 h-6 text-red-400" />
          Rechazar Empresa
        </h2>
        <p className="text-slate-300 mb-4">
          ¿Estás seguro de que quieres rechazar a{" "}
          <span className="font-semibold text-white">
            {empresa.nombre_comercial}
          </span>
          ? Esta acción eliminará permanentemente el registro.
        </p>
        <div className="mb-6">
          <label className="block text-slate-400 text-sm mb-2">
            Motivo del rechazo (opcional)
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Explica el motivo del rechazo..."
            rows={3}
            disabled={saving}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Rechazando...
              </>
            ) : (
              "Rechazar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
