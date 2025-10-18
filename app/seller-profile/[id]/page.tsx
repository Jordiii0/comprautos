"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  User, MapPin, Calendar, Car, Loader2, ArrowLeft,
  Building2, CheckCircle, Eye, Gauge, DollarSign,
  AlertCircle, Package, TrendingUp
} from 'lucide-react';

interface SellerProfile {
  full_name: string;
  username: string;
  region: string;
  city: string;
  created_at: string;
}

interface BusinessProfile {
  commercial_name: string;
  region: string;
  city: string;
  website: string;
  created_at: string;
}

interface VehiclePublication {
  id: string;
  price: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  transmission: string;
  fuel_type: string;
  condition: string;
  images: string[];
  created_at: string;
}

export default function SellerPublicProfile() {
  const router = useRouter();
  const params = useParams();
  const sellerId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [publications, setPublications] = useState<VehiclePublication[]>([]);
  const [stats, setStats] = useState({
    totalPublications: 0,
    activePublications: 0,
    memberSince: ''
  });

  useEffect(() => {
    if (sellerId) {
      loadSellerProfile();
    }
  }, [sellerId]);

  const loadSellerProfile = async () => {
    try {
      // Cargar información del usuario
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sellerId)
        .single();

      if (!userError && userData) {
        setProfile(userData);
        setAccountType('personal');
      } else {
        // Intentar cargar perfil de empresa
        const { data: businessData, error: businessError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('id', sellerId)
          .single();

        if (!businessError && businessData) {
          setBusinessProfile(businessData);
          setAccountType('business');
        }
      }

      // Cargar publicaciones activas del vendedor
      const { data: pubsData, error: pubsError } = await supabase
        .from('vehicle_publications')
        .select('*')
        .eq('user_id', sellerId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!pubsError) {
        setPublications(pubsData || []);
        
        // Calcular estadísticas
        setStats({
          totalPublications: pubsData?.length || 0,
          activePublications: pubsData?.length || 0,
          memberSince: userData?.created_at || businessProfile?.created_at || ''
        });
      }

    } catch (error: any) {
      console.error('Error loading seller profile:', error);
    } finally {
      setLoading(false);
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
          <p className="text-gray-600">Cargando perfil del vendedor...</p>
        </div>
      </div>
    );
  }

  if (!profile && !businessProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Vendedor no encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            El perfil que buscas no existe
          </p>
          <button
            onClick={() => router.back()}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
          >
            Volver
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

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32"></div>
          
          <div className="relative px-8 pb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 mb-6">
              <div className="w-32 h-32 bg-white rounded-2xl border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0">
                {accountType === 'business' ? (
                  <Building2 className="w-20 h-20 text-indigo-400" />
                ) : (
                  <User className="w-20 h-20 text-indigo-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-3xl font-bold text-gray-800 text-white">
                    {accountType === 'business' 
                      ? businessProfile?.commercial_name 
                      : profile?.full_name
                    }
                  </h1>
                  <CheckCircle className="w-6 h-6 text-green-500" title="Vendedor verificado" />
                </div>
                
                {accountType === 'personal' && profile?.username && (
                  <p className="text-gray-600 mb-2">@{profile.username}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  {(profile?.region || businessProfile?.region) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {profile?.city || businessProfile?.city}, {profile?.region || businessProfile?.region}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Miembro desde {formatDate(stats.memberSince)}</span>
                  </div>

                  {accountType === 'business' && (
                    <div className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                      <Building2 className="w-4 h-4" />
                      <span className="font-semibold">Empresa</span>
                    </div>
                  )}
                </div>

                {accountType === 'business' && businessProfile?.website && (
                  <a 
                    href={businessProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    🌐 Visitar sitio web
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <Package className="w-8 h-8 text-indigo-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.activePublications}</p>
                    <p className="text-sm text-gray-600">Publicaciones Activas</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalPublications}</p>
                    <p className="text-sm text-gray-600">Total Publicaciones</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 col-span-2 md:col-span-1">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-800">Verificado</p>
                    <p className="text-sm text-gray-600">Vendedor Confiable</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Publications Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Car className="w-7 h-7 text-indigo-600" />
            Vehículos Publicados ({publications.length})
          </h2>
        </div>

        {publications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Sin publicaciones activas
            </h3>
            <p className="text-gray-600">
              Este vendedor no tiene vehículos publicados en este momento
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publications.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/vehicle/${vehicle.id}`)}
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

                  {/* Year Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800">
                      {vehicle.year}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-3">
                    {formatPrice(vehicle.price)}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        <span>{vehicle.mileage.toLocaleString()} km</span>
                      </div>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {vehicle.fuel_type}
                      </span>
                    </div>
                  </div>

                  <button className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                    <Eye className="w-4 h-4" />
                    Ver Detalles
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