"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Heart,
  Loader2,
  Car,
  Calendar,
  Gauge,
  DollarSign,
  Fuel,
  Cog,
  ArrowLeft,
  Trash2,
  Eye,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible_id: number;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo_id: number;
  region: number;
  ciudad: string;
}

interface Favorite {
  id: number;
  vehiculo_id: number;
  created_at: string;
  vehiculo: Vehicle;
  tipo_combustible_nombre?: string;
  tipo_vehiculo_nombre?: string;
  imagen_principal?: string;
  region_nombre?: string;
}

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const checkAuthAndLoadFavorites = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
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
      // Cargar favoritos
      const { data: favoritosData, error: favError } = await supabase
        .from("favorito")
        .select("id, vehiculo_id, created_at")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false });

      if (favError) throw favError;

      if (!favoritosData || favoritosData.length === 0) {
        setFavorites([]);
        return;
      }

      // Obtener IDs de vehículos
      const vehiculoIds = favoritosData.map((f) => f.vehiculo_id);

      // Cargar vehículos
      const { data: vehiculosData } = await supabase
        .from("vehiculo")
        .select("*")
        .in("id", vehiculoIds);

      // Cargar catálogos
      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre");

      const { data: tipoVehiculoData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre");

      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region");

      // Cargar imágenes y mapear datos
      const favoritosCompletos = await Promise.all(
        favoritosData.map(async (fav) => {
          const vehiculo = vehiculosData?.find((v) => v.id === fav.vehiculo_id);

          if (!vehiculo) return null;

          // Obtener nombres de catálogos
          const tipoCombustible = combustibleData?.find(
            (c) => c.id === vehiculo.tipo_combustible_id
          );
          const tipoVehiculo = tipoVehiculoData?.find(
            (t) => t.id === vehiculo.tipo_vehiculo_id
          );
          const region = regionesData?.find((r) => r.id === vehiculo.region);

          // Cargar primera imagen
          const { data: imagenesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehiculo.id)
            .limit(1);

          return {
            id: fav.id,
            vehiculo_id: fav.vehiculo_id,
            created_at: fav.created_at,
            vehiculo,
            tipo_combustible_nombre: tipoCombustible?.nombre || "Desconocido",
            tipo_vehiculo_nombre: tipoVehiculo?.nombre || "Desconocido",
            region_nombre: region?.nombre_region || "Desconocida",
            imagen_principal:
              imagenesData && imagenesData.length > 0
                ? imagenesData[0].url_imagen
                : null,
          };
        })
      );

      // Filtrar nulos
      setFavorites(favoritosCompletos.filter((f) => f !== null) as Favorite[]);
    } catch (error: any) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    }
  };

  const removeFavorite = async (favoriteId: number) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("favorito")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter((fav) => fav.id !== favoriteId));
    } catch (error: any) {
      console.error("Error removing favorite:", error);
      alert("Error al eliminar favorito");
    } finally {
      setDeleting(false);
      setDeleteModal(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
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
              onClick={() => router.push("/shop")}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              <Car className="w-5 h-5" />
              Ir a la Tienda
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => {
              const vehicle = favorite.vehiculo;
              if (!vehicle) return null;

              return (
                <div
                  key={favorite.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-200">
                    {favorite.imagen_principal ? (
                      <img
                        src={favorite.imagen_principal}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
                        }}
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
                    {vehicle.estado_vehiculo && (
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            vehicle.estado_vehiculo === "Nuevo"
                              ? "bg-green-500 text-white"
                              : vehicle.estado_vehiculo === "Semi-nuevo"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-500 text-white"
                          }`}
                        >
                          {vehicle.estado_vehiculo}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">
                        {vehicle.marca} {vehicle.modelo}
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600">
                        {formatPrice(vehicle.precio)}
                      </p>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{vehicle.anio}</span>
                        <span className="mx-2">•</span>
                        <Gauge className="w-4 h-4" />
                        <span>{vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {vehicle.transmision}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {favorite.tipo_combustible_nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        {vehicle.ciudad}, {favorite.region_nombre}
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
