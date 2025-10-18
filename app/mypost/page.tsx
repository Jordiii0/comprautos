"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, Edit2, Trash2, Eye, EyeOff, Loader2, 
  ArrowLeft, Plus, Calendar, Gauge, DollarSign,
  AlertCircle, CheckCircle, MapPin
} from 'lucide-react';

interface VehiclePublication {
  id: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel_type: string;
  color: string;
  engine_size: number;
  description: string;
  images: string[];
  status: string;
  created_at: string;
}

export default function MyPostsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publications, setPublications] = useState<VehiclePublication[]>([]);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const checkAuthAndLoadPosts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      await loadPublications(session.user.id);
      setLoading(false);
    };

    checkAuthAndLoadPosts();
  }, [router]);

  const loadPublications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('vehicle_publications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublications(data || []);
    } catch (error: any) {
      console.error('Error loading publications:', error);
      setMessage({ type: 'error', text: 'Error al cargar las publicaciones' });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('vehicle_publications')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setPublications(publications.map(pub => 
        pub.id === id ? { ...pub, status: newStatus } : pub
      ));

      setMessage({ 
        type: 'success', 
        text: newStatus === 'active' ? 'Publicación activada' : 'Publicación desactivada' 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al cambiar el estado' });
    }
  };

  const deletePublication = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('vehicle_publications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPublications(publications.filter(pub => pub.id !== id));
      setMessage({ type: 'success', text: 'Publicación eliminada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Error al eliminar la publicación' });
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tus publicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Perfil
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Car className="w-8 h-8 text-indigo-600" />
                Mis Publicaciones
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus vehículos publicados ({publications.length})
              </p>
            </div>

            <button
              onClick={() => router.push('/publication')}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Nueva Publicación
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 ${
            message.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          } border px-4 py-3 rounded-lg flex items-center gap-2`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Publications Grid */}
        {publications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes publicaciones
            </h3>
            <p className="text-gray-600 mb-6">
              Comienza publicando tu primer vehículo
            </p>
            <button
              onClick={() => router.push('/publication')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Publicar Vehículo
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((pub) => (
              <div
                key={pub.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {pub.images && pub.images.length > 0 ? (
                    <img
                      src={pub.images[0]}
                      alt={`${pub.brand} ${pub.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      pub.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {pub.status === 'active' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {pub.brand} {pub.model}
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatPrice(pub.price)}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{pub.year}</span>
                      <span className="mx-2">•</span>
                      <Gauge className="w-4 h-4" />
                      <span>{pub.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {pub.transmission}
                      </span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {pub.fuel_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      Publicado: {formatDate(pub.created_at)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => toggleStatus(pub.id, pub.status)}
                      className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        pub.status === 'active'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      title={pub.status === 'active' ? 'Desactivar' : 'Activar'}
                    >
                      {pub.status === 'active' ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => router.push(`/publication/${pub.id}/edit`)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 text-sm font-medium transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteModal(pub.id)}
                      className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-gray-800">
                  Confirmar Eliminación
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro que deseas eliminar esta publicación? Esta acción no se puede deshacer.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModal(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => deletePublication(deleteModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}