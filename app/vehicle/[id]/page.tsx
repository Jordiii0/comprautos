"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import ReportButton from "@/components/ReportButton";
import {
  Car,
  ArrowLeft,
  Loader2,
  Calendar,
  Gauge,
  DollarSign,
  Fuel,
  Cog,
  Wrench,
  User,
  Phone,
  Mail,
  MapPin,
  Share2,
  Heart,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  X,
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
  tipo_vehiculo_id: number;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  region: number;
  ciudad: string;
  created_at: string;
  correo_dueno?: string;
}

interface VehicleDetail extends Vehicle {
  images: string[];
  tipo_combustible: string;
  tipo_vehiculo: string;
}

interface SellerProfile {
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono?: string;
  ciudad?: string;
  region_nombre?: string;
}

interface Region {
  id: number;
  nombre_region: string;
}

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  // ✅ Caché de regiones
  const regionsCache = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (vehicleId) {
      loadVehicleDetails();
    }
  }, [vehicleId]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors((prev) => new Set(prev).add(index));
  }, []);

  const loadVehicleDetails = useCallback(async () => {
    try {
      setError("");
      console.log("📥 Cargando detalles del vehículo:", vehicleId);

      // ✅ 1. Verificar sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }

      // ✅ 2. Cargar regiones
      if (regionsCache.current.size === 0) {
        const { data: regionesData } = await supabase
          .from("region")
          .select("id, nombre_region");

        if (regionesData) {
          regionesData.forEach((r) => {
            regionsCache.current.set(r.id, r.nombre_region);
          });
        }
      }

      // ✅ 3. Cargar vehículo
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("id", parseInt(vehicleId))
        .single();

      if (vehiculoError || !vehiculoData) {
        throw vehiculoError || new Error("Vehículo no encontrado");
      }

      console.log("✅ Vehículo cargado:", vehiculoData);
      console.log("📋 usuario_id:", vehiculoData.usuario_id);
      console.log("📋 correo_dueno:", vehiculoData.correo_dueno);

      // ✅ 4. Cargar tipos e imágenes
      const [
        { data: combustibleData },
        { data: tipoVehiculoData },
        { data: imagenesData },
      ] = await Promise.all([
        vehiculoData.tipo_combustible_id
          ? supabase
              .from("tipo_combustible")
              .select("nombre")
              .eq("id", vehiculoData.tipo_combustible_id)
              .single()
          : Promise.resolve({ data: null }),
        vehiculoData.tipo_vehiculo_id
          ? supabase
              .from("tipo_vehiculo")
              .select("nombre")
              .eq("id", vehiculoData.tipo_vehiculo_id)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("imagen_vehiculo")
          .select("url_imagen")
          .eq("vehiculo_id", parseInt(vehicleId))
          .order("id", { ascending: true }),
      ]);

      const vehicleDetail: VehicleDetail = {
        ...vehiculoData,
        images:
          imagenesData
            ?.map((img) => img.url_imagen)
            .filter((url) => url && url.trim() !== "") || [],
        tipo_combustible: combustibleData?.nombre || "Desconocido",
        tipo_vehiculo: tipoVehiculoData?.nombre || "Desconocido",
      };

      setVehicle(vehicleDetail);

      // ✅ 5. Verificar favoritos
      if (session?.user?.id) {
        await checkIfFavorite(session.user.id);
      }

      // ✅ 6. Cargar vendedor
      console.log("📥 ========== BUSCANDO VENDEDOR ==========");

      // OPCIÓN 1: Si vehiculo tiene usuario_id (usuario regular)
      if (vehiculoData.usuario_id) {
        console.log(
          "🔍 Opción 1: Buscando usuario con usuario_id:",
          vehiculoData.usuario_id
        );

        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuario")
          .select("nombre, apellido, correo_electronico, telefono, region")
          .eq("id", vehiculoData.usuario_id)
          .single();

        console.log("❌ usuario error:", usuarioError);
        console.log("✅ usuario data:", usuarioData);

        if (!usuarioError && usuarioData) {
          const regionName =
            regionsCache.current.get(usuarioData.region) || "Desconocida";

          setSeller({
            nombre: usuarioData.nombre || "",
            apellido: usuarioData.apellido || "",
            correo_electronico: usuarioData.correo_electronico || "",
            telefono: usuarioData.telefono,
            region_nombre: regionName,
          });
          console.log("✅ VENDEDOR CARGADO (usuario)");
          return;
        }
      }

      // OPCIÓN 2: Si vehiculo tiene correo_dueno, buscar en usuario
      if (vehiculoData.correo_dueno) {
        console.log(
          "🔍 Opción 2: Buscando usuario por correo_dueno:",
          vehiculoData.correo_dueno
        );

        const { data: usuarioData, error: usuarioError } = await supabase
          .from("usuario")
          .select("nombre, apellido, correo_electronico, telefono, region")
          .eq("correo_electronico", vehiculoData.correo_dueno)
          .single();

        console.log("❌ usuario por correo error:", usuarioError);
        console.log("✅ usuario por correo data:", usuarioData);

        if (!usuarioError && usuarioData) {
          const regionName =
            regionsCache.current.get(usuarioData.region) || "Desconocida";

          setSeller({
            nombre: usuarioData.nombre || "",
            apellido: usuarioData.apellido || "",
            correo_electronico: usuarioData.correo_electronico || "",
            telefono: usuarioData.telefono,
            region_nombre: regionName,
          });
          console.log("✅ VENDEDOR CARGADO (usuario por correo)");
          return;
        }

        // OPCIÓN 3: Si no está en usuario, buscar en empresa
        console.log(
          "🔍 Opción 3: Buscando empresa con correo:",
          vehiculoData.correo_dueno
        );

        const { data: empresaData, error: empresaError } = await supabase
          .from("empresa")
          .select(
            "nombre_comercial, correo_electronico, telefono, ciudad, region"
          )
          .eq("correo_electronico", vehiculoData.correo_dueno)
          .single();

        console.log("❌ empresa error:", empresaError);
        console.log("✅ empresa data:", empresaData);

        if (!empresaError && empresaData) {
          const regionName = empresaData.region
            ? regionsCache.current.get(empresaData.region) ||
              empresaData.ciudad ||
              "Desconocida"
            : empresaData.ciudad || "Desconocida";

          setSeller({
            nombre: empresaData.nombre_comercial || "",
            apellido: "",
            correo_electronico: empresaData.correo_electronico || "",
            telefono: empresaData.telefono,
            region_nombre: regionName,
          });
          console.log("✅ VENDEDOR CARGADO (empresa)");
          return;
        }
      }

      console.log("⚠️ No se encontró vendedor");
      setSeller(null);
    } catch (error: any) {
      console.error("❌ Error cargando detalles:", error);
      setError(error.message || "Error al cargar el vehículo");
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  const checkIfFavorite = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("favorito")
          .select("id")
          .eq("usuario_id", userId)
          .eq("vehiculo_id", parseInt(vehicleId))
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking favorite:", error);
        }

        setIsFavorite(!!data);
      } catch (error: any) {
        console.error("Error checking favorite:", error);
      }
    },
    [vehicleId]
  );

  const toggleFavorite = useCallback(async () => {
    if (!user) {
      alert("Debes iniciar sesión para agregar favoritos");
      router.push("/login");
      return;
    }

    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorito")
          .delete()
          .eq("usuario_id", user.id)
          .eq("vehiculo_id", parseInt(vehicleId));

        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("favorito").insert({
          usuario_id: user.id,
          vehiculo_id: parseInt(vehicleId),
        });

        if (error) throw error;
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      setError(`Error al actualizar favoritos: ${error.message}`);
    }
  }, [user, vehicleId, isFavorite]);

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const nextImage = useCallback(() => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === vehicle.images.length - 1 ? 0 : prev + 1
      );
    }
  }, [vehicle?.images.length]);

  const prevImage = useCallback(() => {
    if (vehicle && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? vehicle.images.length - 1 : prev - 1
      );
    }
  }, [vehicle?.images.length]);

  const handleShare = useCallback(async () => {
    if (!vehicle) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${vehicle.marca} ${vehicle.modelo}`,
          text: `Mira este ${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  }, [vehicle]);

  // ✅ Memoizar región del vehículo
  const vehicleRegion = useMemo(() => {
    if (!vehicle) return "Desconocida";
    return regionsCache.current.get(vehicle.region) || "Desconocida";
  }, [vehicle?.region]);

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
            {error || "El vehículo que buscas no existe o ha sido eliminado"}
          </p>
          <button
            onClick={() => router.push("/shop")}
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

        {error && (
          <div className="mb-6 bg-yellow-100 border border-yellow-500 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {vehicle.images && vehicle.images.length > 0 ? (
                <div className="relative">
                  <div className="relative h-96 bg-gray-200">
                    {!imageErrors.has(currentImageIndex) ? (
                      <img
                        src={vehicle.images[currentImageIndex]}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(currentImageIndex)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <Car className="w-24 h-24 text-gray-400" />
                      </div>
                    )}

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
                              ? "border-indigo-600 scale-105"
                              : "border-gray-200 hover:border-indigo-400"
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3C/svg%3E";
                            }}
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
                    {vehicle.marca} {vehicle.modelo}
                  </h1>
                  <p className="text-4xl font-bold text-indigo-600 mb-2">
                    {formatPrice(vehicle.precio)}
                  </p>
                  {vehicle.estado_vehiculo && (
                    <span
                      className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
                        vehicle.estado_vehiculo === "Nuevo"
                          ? "bg-green-100 text-green-700"
                          : vehicle.estado_vehiculo === "Semi-nuevo"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {vehicle.estado_vehiculo}
                    </span>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    className={`p-3 rounded-full transition-colors ${
                      isFavorite
                        ? "bg-red-100 text-red-600"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
                    }
                  >
                    <Heart
                      className={`w-6 h-6 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </button>

                  <button
                    onClick={handleShare}
                    className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>

                  <ReportButton
                    vehiculoId={vehicle.id}
                    vehiculoInfo={`${vehicle.marca} ${vehicle.modelo} ${vehicle.anio}`}
                  />
                </div>
              </div>

              {/* Specifications Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs text-gray-600">Año</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.anio}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <Gauge className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-gray-600">Kilometraje</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.kilometraje.toLocaleString()} km
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Cog className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-600">Transmisión</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.transmision}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Fuel className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-xs text-gray-600">Combustible</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.tipo_combustible}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                  <Car className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-xs text-gray-600">Tipo de Vehículo</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.tipo_vehiculo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Motor</p>
                    <p className="font-semibold text-gray-800">
                      {vehicle.cilindrada} cc
                    </p>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-6">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-600">Ubicación</p>
                  <p className="font-semibold text-gray-800">
                    {vehicle.ciudad}, {vehicleRegion}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Descripción
                </h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {vehicle.descripcion}
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

              {seller && seller.nombre ? (
                <div className="space-y-4">
                  {/* Nombre */}
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-600">Nombre</p>
                      <p className="font-semibold text-gray-800">
                        {seller.nombre}
                        {seller.apellido && ` ${seller.apellido}`}
                      </p>
                    </div>
                  </div>

                  {/* Región */}
                  {seller.region_nombre && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Región</p>
                        <p className="font-semibold text-gray-800">
                          {seller.region_nombre}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Teléfono */}
                  {seller.telefono && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Teléfono</p>
                        <p className="font-semibold text-gray-800">
                          {seller.telefono}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {seller.correo_electronico && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600">Email</p>
                        <p className="font-semibold text-gray-800 truncate text-sm">
                          {seller.correo_electronico}
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
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ℹ️ Cargando información del vendedor...
                  </p>
                  <div className="mt-2 flex gap-2">
                    <div className="h-4 bg-yellow-200 rounded animate-pulse flex-1"></div>
                    <div className="h-4 bg-yellow-200 rounded animate-pulse flex-1"></div>
                  </div>
                </div>
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
                    <p className="font-semibold text-gray-800">
                      {seller.nombre}
                      {seller.apellido && ` ${seller.apellido}`}
                    </p>
                  </div>
                  {seller.region_nombre && (
                    <p className="text-sm text-gray-600">
                      {seller.region_nombre}
                    </p>
                  )}
                </div>

                {seller.telefono && (
                  <>
                    <a
                      href={`tel:${seller.telefono}`}
                      className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-xs text-gray-600">Teléfono</p>
                        <p className="font-semibold text-gray-800">
                          {seller.telefono}
                        </p>
                      </div>
                    </a>

                    <a
                      href={`https://wa.me/${seller.telefono
                        .replace(/\+/g, "")
                        .replace(/\s/g, "")}?text=Hola, me interesa tu ${
                        vehicle.marca
                      } ${vehicle.modelo} ${vehicle.anio}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-semibold"
                    >
                      <Phone className="w-5 h-5" />
                      Contactar por WhatsApp
                    </a>
                  </>
                )}

                <p className="text-xs text-center text-gray-500">
                  Al contactar al vendedor, asegúrate de verificar la
                  información del vehículo antes de realizar cualquier
                  transacción.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
