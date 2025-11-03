"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Users,
  Search,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Shield,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";

interface Usuario {
  id: number;
  usuario_id: string;
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono: string | null;
  rut: string;
  region: number;
  ciudad: string | null;
  rol: string;
  habilitado: boolean;
  created_at: string;
}

interface ModalData {
  type: "view" | "edit" | "delete" | null;
  usuario: Usuario | null;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [modal, setModal] = useState<ModalData>({ type: null, usuario: null });
  const [editForm, setEditForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    ciudad: "",
    rol: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ✅ Caché para evitar recargas innecesarias
  const lastLoadTime = useRef<number>(0);
  const CACHE_DURATION = 30000; // 30 segundos

  useEffect(() => {
    checkAdmin();
  }, []);

  // ✅ Memoizar la lógica de filtrado
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.nombre.toLowerCase().includes(term) ||
          u.apellido.toLowerCase().includes(term) ||
          u.correo_electronico.toLowerCase().includes(term) ||
          u.rut.includes(term)
      );
    }

    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.rol === filterRole);
    }

    return filtered;
  }, [users, searchTerm, filterRole]);

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

      await loadUsers();
    } catch (error) {
      console.error("Error:", error);
      setError("Error al verificar acceso");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cargar usuarios con caché
  const loadUsers = async () => {
    try {
      const now = Date.now();

      // Usar caché si los datos son recientes
      if (now - lastLoadTime.current < CACHE_DURATION && users.length > 0) {
        console.log("📦 Usando caché de usuarios");
        return;
      }

      console.log("📥 Cargando usuarios desde BD...");

      const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      lastLoadTime.current = now;
      setError("");
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Error al cargar usuarios");
    }
  };

  // ✅ Manejar cambio de estado con actualización local
  const handleToggleStatus = useCallback(async (usuario: Usuario) => {
    setSaving(true);
    try {
      const newStatus = !usuario.habilitado;

      const { error } = await supabase
        .from("usuario")
        .update({ habilitado: newStatus })
        .eq("id", usuario.id);

      if (error) throw error;

      // ✅ Actualizar lista local sin recargar todo
      setUsers((prev) =>
        prev.map((u) =>
          u.id === usuario.id ? { ...u, habilitado: newStatus } : u
        )
      );

      setError("");
    } catch (error) {
      console.error("Error toggling status:", error);
      setError("Error al cambiar el estado del usuario");
    } finally {
      setSaving(false);
    }
  }, []);

  // ✅ Abrir modal de edición
  const openEditModal = useCallback((usuario: Usuario) => {
    setEditForm({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono || "",
      ciudad: usuario.ciudad || "",
      rol: usuario.rol,
    });
    setModal({ type: "edit", usuario });
  }, []);

  // ✅ Guardar cambios de usuario
  const handleEdit = useCallback(async () => {
    if (!modal.usuario) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("usuario")
        .update({
          nombre: editForm.nombre.trim(),
          apellido: editForm.apellido.trim(),
          telefono: editForm.telefono?.trim() || null,
          ciudad: editForm.ciudad?.trim() || null,
          rol: editForm.rol,
        })
        .eq("id", modal.usuario.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setUsers((prev) =>
        prev.map((u) =>
          u.id === modal.usuario!.id
            ? {
                ...u,
                nombre: editForm.nombre,
                apellido: editForm.apellido,
                telefono: editForm.telefono || null,
                ciudad: editForm.ciudad || null,
                rol: editForm.rol,
              }
            : u
        )
      );

      setModal({ type: null, usuario: null });
      setError("");
    } catch (error) {
      console.error("Error updating user:", error);
      setError("Error al actualizar el usuario");
    } finally {
      setSaving(false);
    }
  }, [modal.usuario, editForm]);

  // ✅ Eliminar usuario
  const handleDelete = useCallback(async () => {
    if (!modal.usuario) return;

    setSaving(true);
    try {
      // ✅ Opción 1: Intentar eliminar de auth
      try {
        await supabase.auth.admin.deleteUser(modal.usuario.usuario_id);
      } catch (authError) {
        console.warn("⚠️ No se pudo eliminar de auth:", authError);
      }

      // ✅ Opción 2: Eliminar de tabla usuario
      const { error } = await supabase
        .from("usuario")
        .delete()
        .eq("id", modal.usuario.id);

      if (error) throw error;

      // ✅ Actualizar lista local
      setUsers((prev) => prev.filter((u) => u.id !== modal.usuario!.id));
      setModal({ type: null, usuario: null });
      setError("");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Error al eliminar el usuario");
    } finally {
      setSaving(false);
    }
  }, [modal.usuario]);

  // ✅ Cerrar modal
  const closeModal = useCallback(() => {
    setModal({ type: null, usuario: null });
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
              <Users className="w-8 h-8 text-blue-400" />
              Gestión de Usuarios
            </h1>
            <p className="text-slate-400 mt-2">
              Total: {users.length} usuarios registrados
            </p>
          </div>
        </div>

        {/* Errores */}
        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Filtros y Búsqueda */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-700 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o RUT..."
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Usuario
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    RUT
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Contacto
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">
                    Rol
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-slate-400">
                        No se encontraron usuarios
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((usuario) => (
                    <tr
                      key={usuario.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-white font-semibold">
                            {usuario.nombre} {usuario.apellido}
                          </p>
                          <p className="text-sm text-slate-400">
                            {usuario.correo_electronico}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {usuario.rut}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-300 text-sm">
                          {usuario.telefono || "Sin teléfono"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {usuario.ciudad || "Sin ciudad"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.rol === "administrador"
                              ? "bg-amber-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {usuario.rol === "administrador" && (
                            <Shield className="w-3 h-3" />
                          )}
                          {usuario.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(usuario)}
                          disabled={saving}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                            usuario.habilitado
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {usuario.habilitado ? (
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
                            onClick={() => setModal({ type: "view", usuario })}
                            disabled={saving}
                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() => openEditModal(usuario)}
                            disabled={saving}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4 text-white" />
                          </button>
                          <button
                            onClick={() =>
                              setModal({ type: "delete", usuario })
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
      {modal.type === "view" && modal.usuario && (
        <ModalDetalles usuario={modal.usuario} onClose={closeModal} />
      )}

      {/* Modal Editar */}
      {modal.type === "edit" && modal.usuario && (
        <ModalEditar
          usuario={modal.usuario}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleEdit}
          onClose={closeModal}
          saving={saving}
        />
      )}

      {/* Modal Eliminar */}
      {modal.type === "delete" && modal.usuario && (
        <ModalEliminar
          usuario={modal.usuario}
          onConfirm={handleDelete}
          onClose={closeModal}
          saving={saving}
        />
      )}
    </div>
  );
}

// ✅ Componentes de modales separados para mejor rendimiento
interface ModalDetallesProps {
  usuario: Usuario;
  onClose: () => void;
}

function ModalDetalles({ usuario, onClose }: ModalDetallesProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">
          Detalles del Usuario
        </h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Nombre Completo</p>
              <p className="text-white font-semibold">
                {usuario.nombre} {usuario.apellido}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">RUT</p>
              <p className="text-white font-semibold">{usuario.rut}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Mail className="w-4 h-4" /> Email
              </p>
              <p className="text-white">{usuario.correo_electronico}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Phone className="w-4 h-4" /> Teléfono
              </p>
              <p className="text-white">
                {usuario.telefono || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Ciudad
              </p>
              <p className="text-white">
                {usuario.ciudad || "No especificado"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Rol</p>
              <p className="text-white font-semibold">{usuario.rol}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" /> Registro
              </p>
              <p className="text-white">
                {new Date(usuario.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Estado</p>
              <p className="text-white font-semibold">
                {usuario.habilitado ? "Activo" : "Inactivo"}
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
  usuario: Usuario;
  editForm: any;
  setEditForm: (form: any) => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEditar({
  usuario,
  editForm,
  setEditForm,
  onSave,
  onClose,
  saving,
}: ModalEditarProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Editar Usuario</h2>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Nombre
              </label>
              <input
                type="text"
                value={editForm.nombre}
                onChange={(e) =>
                  setEditForm({ ...editForm, nombre: e.target.value })
                }
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">
                Apellido
              </label>
              <input
                type="text"
                value={editForm.apellido}
                onChange={(e) =>
                  setEditForm({ ...editForm, apellido: e.target.value })
                }
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
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
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 text-sm mb-2">Rol</label>
              <select
                value={editForm.rol}
                onChange={(e) =>
                  setEditForm({ ...editForm, rol: e.target.value })
                }
                disabled={saving}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="usuario">Usuario</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
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
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
  usuario: Usuario;
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}

function ModalEliminar({
  usuario,
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
            {usuario.nombre} {usuario.apellido}
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
