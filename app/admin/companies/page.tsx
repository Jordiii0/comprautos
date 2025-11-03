"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Building2,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  AlertCircle,
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
  habilitado: boolean;
  created_at: string;
}

interface ModalData {
  type: "view" | "edit" | "delete" | null;
  empresa: Empresa | null;
}

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modal, setModal] = useState<ModalData>({ type: null, empresa: null });
  const [error, setError] = useState("");
  const [editForm, setEditForm] = useState({
    nombre_comercial: "",
    telefono: "",
    direccion: "",
    ciudad: "",
    sitio_web: "",
  });

  // ✅ Caché
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar filtrado
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;

    const term = searchTerm.toLowerCase();
    return companies.filter(
      (c) =>
        c.nombre_comercial.toLowerCase().includes(term) ||
        c.correo_electronico.toLowerCase().includes(term) ||
        c.rut_empresa.includes(term)
    );
  }, [companies, searchTerm]);

  // ✅ Calcular estadísticas
  const stats = useMemo(
    () => ({
      total: companies.length,
      active: companies.filter((c) => c.habilitado).length,
      inactive: companies.filter((c) => !c.habilitado).length,
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

  // ✅ Manejar cambio de estado con actualización local
  const handleToggleStatus = useCallback(async (empresa: Empresa) => {
    setSaving(true);
    try {
      const newStatus = !empresa.habilitado;
      const { error } = await supabase
        .from("empresa")
        .update({ habilitado: newStatus })
        .eq("id", empresa.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setCompanies((prev) =>
        prev.map((e) =>
          e.id === empresa.id ? { ...e, habilitado: newStatus } : e
        )
      );

      setError("");
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Error al cambiar el estado de la empresa");
    } finally {
      setSaving(false);
    }
  }, []);

  // ✅ Abrir modal de edición
  const openEditModal = useCallback((empresa: Empresa) => {
    setEditForm({
      nombre_comercial: empresa.nombre_comercial,
      telefono: empresa.telefono || "",
      direccion: empresa.direccion || "",
      ciudad: empresa.ciudad || "",
      sitio_web: empresa.sitio_web || "",
    });
    setModal({ type: "edit", empresa });
  }, []);

  // ✅ Guardar cambios
  const handleEdit = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("empresa")
        .update({
          nombre_comercial: editForm.nombre_comercial.trim(),
          telefono: editForm.telefono?.trim() || null,
          direccion: editForm.direccion?.trim() || null,
          ciudad: editForm.ciudad?.trim() || null,
          sitio_web: editForm.sitio_web?.trim() || null,
        })
        .eq("id", modal.empresa.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setCompanies((prev) =>
        prev.map((e) =>
          e.id === modal.empresa!.id
            ? {
                ...e,
                nombre_comercial: editForm.nombre_comercial,
                telefono: editForm.telefono || null,
                direccion: editForm.direccion || null,
                ciudad: editForm.ciudad || null,
                sitio_web: editForm.sitio_web || null,
              }
            : e
        )
      );

      setModal({ type: null, empresa: null });
      setError("");
    } catch (error) {
      console.error("Error updating company:", error);
      setError("Error al actualizar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa, editForm]);

  // ✅ Eliminar empresa
  const handleDelete = useCallback(async () => {
    if (!modal.empresa) return;

    setSaving(true);
    try {
      // Intentar eliminar de auth
      try {
        await supabase.auth.admin.deleteUser(modal.empresa.usuario_id);
      } catch (authError) {
        console.warn("⚠️ No se pudo eliminar de auth:", authError);
      }

      // Eliminar de tabla empresa
      const { error } = await supabase
        .from("empresa")
        .delete()
        .eq("id", modal.empresa.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setCompanies((prev) => prev.filter((e) => e.id !== modal.empresa!.id));
      setModal({ type: null, empresa: null });
      setError("");
    } catch (error) {
      console.error("Error deleting company:", error);
      setError("Error al eliminar la empresa");
    } finally {
      setSaving(false);
    }
  }, [modal.empresa]);

  // ✅ Cerrar modal
  const closeModal = useCallback(() => {
    setModal({ type: null, empresa: null });
    setError("");
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
              <Building2 className="w-8 h-8 text-purple-400" />
              Gestión de Empresas
            </h1>
            <p className="text-slate-400 mt-2">
              Total: {stats.total} empresas registradas
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
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.total}</span>
            </div>
            <p className="text-purple-100 font-semibold">Total Empresas</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.active}</span>
            </div>
            <p className="text-green-100 font-semibold">Activas</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{stats.inactive}</span>
            </div>
            <p className="text-red-100 font-semibold">Inactivas</p>
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
              className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tabla de Empresas */}
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
                    Ubicación
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
                      <p className="text-slate-400">
                        {searchTerm
                          ? "No se encontraron empresas"
                          : "No hay empresas registradas"}
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
                      <td className="px-6 py-4 text-slate-300 font-mono">
                        {empresa.rut_empresa}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-slate-300 text-sm flex items-center gap-1">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            {empresa.telefono || "—"}
                          </p>
                          {empresa.sitio_web && (
                            <a
                              href={empresa.sitio_web}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 text-xs flex items-center gap-1 hover:underline truncate"
                            >
                              <Globe className="w-3 h-3 flex-shrink-0" />
                              Sitio web
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">
                          {empresa.ciudad || "—"}
                        </p>
                        <p className="text-slate-400 text-xs truncate">
                          {empresa.direccion || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(empresa)}
                          disabled={saving}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                            empresa.habilitado
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {empresa.habilitado ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Activo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              setModal({ type: "view", empresa })
                            }
                            disabled={saving}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => openEditModal(empresa)}
                            disabled={saving}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "delete", empresa })
                            }
                            disabled={saving}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
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
        <ModalDetalles empresa={modal.empresa} onClose={closeModal} />
      )}

      {/* Modal Editar */}
      {modal.type === "edit" && modal.empresa && (
        <ModalEditar
          empresa={modal.empresa}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleEdit}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Modal Eliminar */}
      {modal.type === "delete" && modal.empresa && (
        <ModalEliminar
          empresa={modal.empresa}
          onConfirm={handleDelete}
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
}

function ModalDetalles({ empresa, onClose }: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-400" />
          Detalles de la Empresa
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Nombre de la Empresa</p>
              <p className="text-white font-semibold text-lg">
                {empresa.nombre_comercial}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">RUT Empresa</p>
              <p className="text-white font-semibold font-mono">
                {empresa.rut_empresa}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </p>
              <p className="text-white break-all">{empresa.correo_electronico}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Phone className="w-4 h-4" /> Teléfono
              </p>
              <p className="text-white">
                {empresa.telefono || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Ciudad
              </p>
              <p className="text-white">
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
                  className="text-blue-400 hover:underline break-all"
                >
                  {empresa.sitio_web}
                </a>
              ) : (
                <p className="text-white">No especificado</p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-400 text-sm">Dirección</p>
              <p className="text-white">
                {empresa.direccion || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Registro
              </p>
              <p className="text-white">
                {new Date(empresa.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-white font-semibold">
                {empresa.habilitado ? "Activo" : "Inactivo"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalEditarProps {
  empresa: Empresa;
  editForm: any;
  setEditForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEditar({
  empresa,
  editForm,
  setEditForm,
  onSave,
  onClose,
  saving,
}: ModalEditarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Editar Empresa</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={editForm.nombre_comercial}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  nombre_comercial: e.target.value,
                })
              }
              disabled={saving}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Teléfono
              </label>
              <input
                type="text"
                value={editForm.telefono}
                onChange={(e) =>
                  setEditForm({ ...editForm, telefono: e.target.value })
                }
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Ciudad
              </label>
              <input
                type="text"
                value={editForm.ciudad}
                onChange={(e) =>
                  setEditForm({ ...editForm, ciudad: e.target.value })
                }
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={editForm.direccion}
              onChange={(e) =>
                setEditForm({ ...editForm, direccion: e.target.value })
              }
              disabled={saving}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-2">
              Sitio Web
            </label>
            <input
              type="url"
              value={editForm.sitio_web}
              onChange={(e) =>
                setEditForm({ ...editForm, sitio_web: e.target.value })
              }
              disabled={saving}
              placeholder="https://ejemplo.com"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Cambios"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

interface ModalEliminarProps {
  empresa: Empresa;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEliminar({
  empresa,
  onConfirm,
  onClose,
  saving,
}: ModalEliminarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-4">
          Confirmar Eliminación
        </h2>
        <p className="text-slate-300 mb-6">
          ¿Estás seguro de que quieres eliminar a{" "}
          <span className="font-semibold text-white">
            {empresa.nombre_comercial}
          </span>
          ? Esta acción no se puede deshacer.
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
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Eliminando...
              </>
            ) : (
              "Eliminar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
