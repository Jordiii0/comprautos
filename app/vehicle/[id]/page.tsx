"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, ArrowLeft, Loader2, Calendar, Gauge, DollarSign,
  Fuel, Cog, Palette, Wrench, User, Phone, Mail,
  MapPin, Share2, Heart, AlertCircle, ChevronLeft, ChevronRight,
  CheckCircle, X
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
  user_id: string;
  vehicle_type: string;
}

interface SellerProfile {
  full_name: string;
  username: string;
  phone: string;
  region: string;
  city: string;
}

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehiclePublication | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (vehicleId) {
      loadVehicleDetails();
    }
  }, [vehicleId]);

  const loadVehicleDetails = async () => {
    try {
      // Verificar sesión del usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Verificar si está en favoritos
        await checkIfFavorite(session.user.id);
      }

      // Cargar vehículo
      const { data: vehicleData, error: vehicleError } = await supabase
        .from('vehicle_publications')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (vehicleError) throw vehicleError;
      setVehicle(vehicleData);

      // Cargar perfil del vendedor
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, username, phone, region, city')
        .eq('id', vehicleData.user_id)
        .single();

      if (!profileError && profileData) {
        setSeller(profileData);
      }
    } catch (error: any) {
      console.error('Error loading vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('vehicle_id', vehicleId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setIsFavorite(!!data);
    } catch (error: any) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    // Verificar si el usuario está autenticado
    if (!user) {
      alert('Debes iniciar sesión para agregar favoritos');
      router.push('/login');
      return;
    }

    try {
      if (isFavorite) {
        // Eliminar de favoritos
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vehicle_id', vehicleId);

        if (error) throw error;
        setIsFavorite(false);
      } else {
        // Agregar a favoritos
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            vehicle_id: vehicleId
          });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      alert('Error al actualizar favoritos');
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

  const nextImage = () => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle?.brand} ${vehicle?.model}`,
          text: `Mira este ${vehicle?.brand} ${vehicle?.model} ${vehicle?.year}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando vehículo...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Vehículo no encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            El vehículo que buscas no existe o ha sido eliminado
          </p>
          <button
            onClick={() => router.push('/shop')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Volver a la tienda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {vehicle.images && vehicle.images.length > 0 ? (
                <div className="relative">
                  <div className="relative h-96 bg-gray-200">
                    <img
                      src={vehicle.images[currentImageIndex]}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {vehicle.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <ChevronLeft className="w-6 h-6 text-gray-800" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all"
                        >
                          <ChevronRight className="w-6 h-6 text-gray-800" />
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {vehicle.images.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  {vehicle.images.length > 1 && (
                    <div className="p-4 flex gap-2 overflow-x-auto">
                      {vehicle.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex
                              ? 'border-indigo-600 scale-105'
                              : 'border-gray-200 hover:border-indigo-400'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-200">
                  <Car className="w-24 h-24 text-gray-400" />
                </div>
              )}
            </div>

            {/* Vehicle Information */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  <p className="text-4xl font-bold text-indigo-600 mb-2">
                    {formatPrice(vehicle.price)}
                  </p>
                  {vehicle.condition && (
                    <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                      vehicle.condition === 'Nuevo (0km)' 
                        ? 'bg-green-100 text-green-700' 
                        : vehicle.condition === 'Seminuevo'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {vehicle.condition}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-full transition-colors ${
                      isFavorite
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-600">Año</p>
                    <p className="font-semibold text-gray-800">{vehicle.year}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Gauge className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Kilometraje</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.mileage.toLocaleString()} km
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Cog className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Transmisión</p>
                    <p className="font-semibold text-gray-800">{vehicle.transmission}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Fuel className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">Combustible</p>
                    <p className="font-semibold text-gray-800">{vehicle.fuel_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Car className='w-5 h-5 text-orange-600' />
                    <div>
                      <p className="text-xs text-gray-600">Tipo de Vehículo</p>
                      <p className="font-semibold text-gray-800">{vehicle.vehicle_type}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg">
                  <Palette className="w-5 h-5 text-pink-600" />
                  <div>
                    <p className="text-xs text-gray-600">Color</p>
                    <p className="font-semibold text-gray-800">{vehicle.color}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Motor</p>
                    <p className="font-semibold text-gray-800">{vehicle.engine_size} cc</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Descripción</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </p>
              </div>

              {/* Publication Date */}
              <div className="mt-6 text-sm text-gray-500">
                Publicado el {formatDate(vehicle.created_at)}
              </div>
            </div>
          </div>

          {/* Sidebar - Seller Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Información del Vendedor
              </h3>

              {seller ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Nombre</p>
                      <p className="font-semibold text-gray-800">{seller.full_name}</p>
                      <p className="text-sm text-gray-500">@{seller.username}</p>
                    </div>
                  </div>

                  {seller.region && seller.city && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Ubicación</p>
                        <p className="font-semibold text-gray-800">
                          {seller.city}, {seller.region}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setShowContactModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl hover:shadow-lg transition-all font-bold text-lg"
                  >
                    <Phone className="w-5 h-5" />
                    Contactar Vendedor
                  </button>

                  <div className="text-center text-xs text-gray-500">
                    <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" />
                    Vendedor verificado
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Cargando información del vendedor...</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactModal && seller && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Contactar Vendedor
                </h3>
                <button
                  onClick={() => setShowContactModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="w-5 h-5 text-indigo-600" />
                    <p className="font-semibold text-gray-800">{seller.full_name}</p>
                  </div>
                  <p className="text-sm text-gray-600">@{seller.username}</p>
                </div>

                {seller.phone && (
                  <a
                    href={`tel:${seller.phone}`}
                    className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-xs text-gray-600">Teléfono</p>
                      <p className="font-semibold text-gray-800">{seller.phone}</p>
                    </div>
                  </a>
                )}

                <a
                  href={`https://wa.me/${seller.phone?.replace(/\+/g, '')}?text=Hola, me interesa tu ${vehicle.brand} ${vehicle.model} ${vehicle.year}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  Contactar por WhatsApp
                </a>

                <p className="text-xs text-center text-gray-500">
                  Al contactar al vendedor, asegúrate de verificar la información del vehículo antes de realizar cualquier transacción.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}