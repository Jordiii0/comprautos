"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Heart, Loader2, Car, Calendar, Gauge, DollarSign,
  Fuel, Cog, ArrowLeft, Trash2, Eye, AlertCircle
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
  condition: string;
  images: string[];
  status: string;
  created_at: string;
}

interface Favorite {
  id: string;
  vehicle_id: string;
  created_at: string;
  vehicle: VehiclePublication;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      await loadFavorites(session.user.id);
      setLoading(false);
    };

    checkAuthAndLoadFavorites();
  }, [router]);

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          vehicle_id,
          created_at,
          vehicle_publications (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar los datos
      const formattedFavorites = data.map((fav: any) => ({
        id: fav.id,
        vehicle_id: fav.vehicle_id,
        created_at: fav.created_at,
        vehicle: fav.vehicle_publications
      }));

      setFavorites(formattedFavorites);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
    }
  };

  const removeFavorite = async (favoriteId: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      alert('Error al eliminar favorito');
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
          <p className="text-gray-600">Cargando favoritos...</p>
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-500 fill-current" />
                Mis Favoritos
              </h1>
              <p className="text-gray-600 mt-1">
                Vehículos que has guardado ({favorites.length})
              </p>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        {favorites.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No tienes favoritos guardados
            </h3>
            <p className="text-gray-600 mb-6">
              Explora la tienda y guarda los vehículos que te interesen
            </p>
            <button
              onClick={() => router.push('/shop')}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Car className="w-5 h-5" />
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const vehicle = favorite.vehicle;
              if (!vehicle) return null;

              return (
                <div
                  key={favorite.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img
                        src={vehicle.images[0]}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Heart Badge */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-red-500 p-2 rounded-full shadow-lg">
                        <Heart className="w-5 h-5 text-white fill-current" />
                      </div>
                    </div>

                    {/* Condition Badge */}
                    {vehicle.condition && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          vehicle.condition === 'Nuevo (0km)' 
                            ? 'bg-green-500 text-white' 
                            : vehicle.condition === 'Seminuevo'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {vehicle.condition}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {vehicle.brand} {vehicle.model}
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatPrice(vehicle.price)}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{vehicle.year}</span>
                        <span className="mx-2">•</span>
                        <Gauge className="w-4 h-4" />
                        <span>{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.transmission}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.fuel_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Heart className="w-3 h-3" />
                        Guardado: {formatDate(favorite.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => router.push(`/vehicle/${vehicle.id}`)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Ver
                      </button>

                      <button
                        onClick={() => setDeleteModal(favorite.id)}
                        className="flex items-center justify-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
                <h3 className="text-xl font-bold text-gray-800">
                  Quitar de Favoritos
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro que deseas quitar este vehículo de tus favoritos?
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
                  onClick={() => removeFavorite(deleteModal)}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Quitando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Quitar
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