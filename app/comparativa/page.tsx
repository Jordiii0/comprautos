"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Plus,
  X,
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Palette,
  Wrench,
  CheckCircle,
  ArrowLeft,
  Heart,
} from "lucide-react";

interface VehiclePublication {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  tipo_combustible_id: number;
  cilindrada: string;
  descripcion: string;
  estado_vehiculo: string;
  oculto: boolean;
  created_at: string;
  tipo_combustible?: {
    id: number;
    nombre_combustible: string;
  };
}

interface vehicleImage {
  id: number;
  vehiculo_id: number;
  url: string;
}

interface Favorite {
  id: number;
  usuario_id: string;
  vehiculo_id: number;
}

// Componente para cargar imágenes
const VehicleImageComponent = ({ src, alt }: { src: string; alt: string }) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imgLoading, setImgLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setImgLoading(false);
      return;
    }

    if (src.startsWith("http")) {
      setImageUrl(src);
      setImgLoading(false);
      return;
    }

    const publicUrl = supabase.storage.from("vehiculo_imagen").getPublicUrl(src)
      .data.publicUrl;

    setImageUrl(publicUrl);
    setImgLoading(false);
  }, [src]);

  if (imgLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="w-full h-full object-cover"
      onError={(e) => {
        console.error("Error cargando imagen:", imageUrl);
        e.currentTarget.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75-3.54c-.3-.38-.77-.59-1.25-.59-.67 0-1.22.44-1.39 1.06-.1.37-.07.77.08 1.12l2.91 3.75-2.88 3.74c-.15.36-.18.77-.08 1.14.17.62.73 1.06 1.39 1.06.48 0 .95-.21 1.25-.59l2.75-3.54 2.75 3.54c.3.38.77.59 1.25.59.67 0 1.22-.44 1.39-1.06.1-.37.07-.77-.08-1.12l-2.91-3.75 2.88-3.74c.15-.36.18-.77.08-1.14-.17-.62-.73-1.06-1.39-1.06-.48 0-.95.21-1.25.59l-2.75 3.54z"/%3E%3C/svg%3E';
      }}
    />
  );
};

export default function ComparePage() {
  const conditions = ["Nuevo (0km)", "Usado", "Seminuevo"];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<
    (VehiclePublication & { images: string[] })[]
  >([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<
    ((VehiclePublication & { images: string[] }) | null)[]
  >([null, null, null]);
  const [showSelector, setShowSelector] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "favorites">("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await loadFavorites(session.user.id);
      }

      await loadVehicles();
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      console.log("🚗 Iniciando carga de vehículos...");

      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("oculto", false)
        .order("created_at", { ascending: false });

      if (vehiclesError) {
        console.error("❌ Error en SELECT vehiculo:", vehiclesError);
        throw vehiclesError;
      }

      console.log("✅ Vehículos obtenidos de la BD:", vehiclesData);
      console.log(`📊 Total de vehículos: ${vehiclesData?.length || 0}`);

      if (!vehiclesData || vehiclesData.length === 0) {
        console.warn("⚠️ No hay vehículos en la base de datos");
        setVehicles([]);
        return;
      }

      // Obtener IDs de combustibles únicos
      const combustibleIds = [
        ...new Set(vehiclesData.map((v) => v.tipo_combustible_id)),
      ];

      const { data: combustiblesData, error: combError } = await supabase
        .from("tipo_combustible")
        .select("id, nombre")
        .in("id", combustibleIds);

      if (combError) {
        console.error("❌ Error cargando combustibles:", combError);
      }

      const combustiblesMap = (combustiblesData || []).reduce((acc, c) => {
        acc[c.id] = c.nombre;
        return acc;
      }, {} as Record<number, string>);

      console.log("✅ Combustibles cargados:", combustiblesMap);

      // Cargar imágenes para cada vehículo
      const vehiclesWithImages = await Promise.all(
        vehiclesData.map(async (vehicle, idx) => {
          try {
            // ← CAMBIO AQUÍ: usar url_imagen en lugar de url
            const { data: imagesData } = await supabase
              .from("imagen_vehiculo")
              .select("url_imagen")
              .eq("vehiculo_id", vehicle.id);

            console.log(`📸 Imágenes para vehículo ${vehicle.id}:`, imagesData);

            const images = (imagesData || []).map((img) => {
              const urlPath = img.url_imagen;

              if (urlPath.startsWith("http")) {
                return urlPath;
              }

              // Generar URL pública
              const publicUrl = supabase.storage
                .from("vehiculo_imagen")
                .getPublicUrl(urlPath).data.publicUrl;

              console.log(`🖼️ URL generada para ${urlPath}:`, publicUrl);
              return publicUrl;
            });

            console.log(
              `✅ Vehículo ${idx + 1}: ${vehicle.marca} ${vehicle.modelo} - ${
                images.length
              } imágenes`
            );

            return {
              ...vehicle,
              images,
              tipo_combustible: {
                id: vehicle.tipo_combustible_id,
                nombre:
                  combustiblesMap[vehicle.tipo_combustible_id] || "Desconocido",
              },
            };
          } catch (error) {
            console.error(`❌ Error procesando vehículo ${vehicle.id}:`, error);
            return {
              ...vehicle,
              images: [],
              tipo_combustible: {
                id: vehicle.tipo_combustible_id,
                nombre:
                  combustiblesMap[vehicle.tipo_combustible_id] || "Desconocido",
              },
            };
          }
        })
      );

      console.log("📦 Vehículos con imágenes cargados:", vehiclesWithImages);
      setVehicles(vehiclesWithImages);
    } catch (error: any) {
      console.error("❌ Error en loadVehicles:", error);
      setVehicles([]);
    }
  };

  const loadFavorites = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("favorito")
        .select("vehiculo_id")
        .eq("usuario_id", userId);

      if (error) throw error;

      setFavorites((data || []).map((fav) => fav.vehiculo_id));
    } catch (error: any) {
      console.error("Error loading favorites:", error);
    }
  };

  const selectVehicle = (
    vehicle: VehiclePublication & { images: string[] },
    index: number
  ) => {
    const newSelected = [...selectedVehicles];
    newSelected[index] = vehicle;
    setSelectedVehicles(newSelected);
    setShowSelector(null);
    setSearchTerm("");
  };

  const removeVehicle = (index: number) => {
    const newSelected = [...selectedVehicles];
    newSelected[index] = null;
    setSelectedVehicles(newSelected);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (viewMode === "favorites" && !favorites.includes(v.id)) return false;

    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      v.marca.toLowerCase().includes(search) ||
      v.modelo.toLowerCase().includes(search) ||
      v.anio.toString().includes(search)
    );
  });

  const getComparisonValue = (
    attr: string,
    vehicle: (VehiclePublication & { images: string[] }) | null
  ) => {
    if (!vehicle) return "-";

    switch (attr) {
      case "precio":
        return formatPrice(vehicle.precio);
      case "anio":
        return vehicle.anio;
      case "kilometraje":
        return `${vehicle.kilometraje.toLocaleString()} km`;
      case "transmision":
        return vehicle.transmision;
      case "tipo_combustible":
        return vehicle.tipo_combustible?.nombre || "-"; // ← CAMBIO AQUÍ
      case "cilindrada":
        return vehicle.cilindrada || "-";
      case "estado_vehiculo":
        return vehicle.estado_vehiculo;
      default:
        return "-";
    }
  };

  const getHighlightClass = (attr: string, index: number) => {
    const values = selectedVehicles
      .map((v) => {
        if (!v) return null;
        switch (attr) {
          case "precio":
            return Number(v.precio);
          case "anio":
            return Number(v.anio);
          case "kilometraje":
            return Number(v.kilometraje);
          case "cilindrada":
            return v.cilindrada ? parseFloat(v.cilindrada) : null;
          default:
            return null;
        }
      })
      .filter((v) => v !== null);

    if (values.length < 2) return "";

    const currentValue = selectedVehicles[index];
    if (!currentValue) return "";

    let current: number;
    switch (attr) {
      case "precio":
        current = Number(currentValue.precio);
        break;
      case "anio":
        current = Number(currentValue.anio);
        break;
      case "kilometraje":
        current = Number(currentValue.kilometraje);
        break;
      case "cilindrada":
        current = currentValue.cilindrada
          ? parseFloat(currentValue.cilindrada)
          : 0;
        break;
      default:
        return "";
    }

    const min = Math.min(...(values as number[]));
    const max = Math.max(...(values as number[]));

    if (attr === "precio" || attr === "kilometraje") {
      return current === min ? "bg-green-50 border-green-300" : "";
    } else if (attr === "anio" || attr === "cilindrada") {
      return current === max ? "bg-green-50 border-green-300" : "";
    }

    return "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando vehículos...</p>
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
            Volver
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
                <Car className="w-10 h-10 text-indigo-600" />
                Comparar Vehículos
              </h1>
              <p className="text-gray-600 mt-2">
                Selecciona hasta 3 vehículos para comparar sus características
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {selectedVehicles.map((vehicle, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {vehicle ? (
                <div>
                  <div className="relative h-48 bg-gray-200">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <VehicleImageComponent
                        src={vehicle.images[0]}
                        alt={`${vehicle.marca} ${vehicle.modelo}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Car className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <button
                      onClick={() => removeVehicle(index)}
                      className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {vehicle.marca} {vehicle.modelo}
                    </h3>
                    <p className="text-2xl font-bold text-indigo-600 mb-2">
                      {formatPrice(vehicle.precio)}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {vehicle.anio}
                      <span className="mx-2">•</span>
                      <Gauge className="w-4 h-4" />
                      {vehicle.kilometraje.toLocaleString()} km
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowSelector(index)}
                  className="w-full h-full min-h-[300px] flex flex-col items-center justify-center p-8 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-semibold">
                    Seleccionar Vehículo {index + 1}
                  </p>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        {selectedVehicles.some((v) => v !== null) && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                Comparación Detallada
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 w-1/4">
                      Característica
                    </th>
                    {selectedVehicles.map((_, index) => (
                      <th
                        key={index}
                        className="px-6 py-4 text-center text-sm font-semibold text-gray-700"
                      >
                        Vehículo {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {/* Precio */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-indigo-600" />
                      Precio
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center border-2 ${getHighlightClass(
                          "precio",
                          index
                        )}`}
                      >
                        <span className="font-semibold text-gray-800">
                          {getComparisonValue("precio", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Estado */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                      Estado
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center">
                        {vehicle ? (
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              vehicle.estado_vehiculo === conditions[0]
                                ? "bg-green-100 text-green-700"
                                : vehicle.estado_vehiculo === conditions[1] ||
                                  vehicle.estado_vehiculo === conditions[2]
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {vehicle.estado_vehiculo}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Año */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Año
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center border-2 ${getHighlightClass(
                          "anio",
                          index
                        )}`}
                      >
                        <span className="text-gray-800">
                          {getComparisonValue("anio", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Kilometraje */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <Gauge className="w-5 h-5 text-indigo-600" />
                      Kilometraje
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center border-2 ${getHighlightClass(
                          "kilometraje",
                          index
                        )}`}
                      >
                        <span className="text-gray-800">
                          {getComparisonValue("kilometraje", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Transmisión */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <Cog className="w-5 h-5 text-indigo-600" />
                      Transmisión
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center">
                        <span className="text-gray-800">
                          {getComparisonValue("transmision", vehicle)}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Combustible */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <Fuel className="w-5 h-5 text-indigo-600" />
                      Combustible
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td key={index} className="px-6 py-4 text-center">
                        <span className="text-gray-800">
                          {vehicle?.tipo_combustible?.nombre || "-"}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Cilindrada */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-700 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-indigo-600" />
                      Cilindrada
                    </td>
                    {selectedVehicles.map((vehicle, index) => (
                      <td
                        key={index}
                        className={`px-6 py-4 text-center border-2 ${getHighlightClass(
                          "cilindrada",
                          index
                        )}`}
                      >
                        <span className="text-gray-800">
                          {vehicle?.cilindrada || "-"}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
                <span>
                  Mejor valor (precio más bajo, año más nuevo, menor
                  kilometraje, cilindrada más grande)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicle Selector Modal */}
        {showSelector !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-white">
                  Seleccionar Vehículo {showSelector + 1}
                </h3>
                <button
                  onClick={() => {
                    setShowSelector(null);
                    setSearchTerm("");
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6">
                {/* View Mode Toggle */}
                {user && favorites.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setViewMode("all")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        viewMode === "all"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      Todos ({vehicles.length})
                    </button>
                    <button
                      onClick={() => setViewMode("favorites")}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                        viewMode === "favorites"
                          ? "bg-pink-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Heart className="w-4 h-4" />
                      Favoritos ({favorites.length})
                    </button>
                  </div>
                )}

                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por marca, modelo o año..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Empty State for Favorites */}
                {viewMode === "favorites" && favorites.length === 0 && (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      No tienes favoritos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Guarda vehículos en favoritos para compararlos fácilmente
                    </p>
                    <button
                      onClick={() => setViewMode("all")}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      Ver todos los vehículos
                    </button>
                  </div>
                )}

                {/* Vehicle List */}
                {(viewMode !== "favorites" || favorites.length > 0) && (
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {filteredVehicles.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          No se encontraron vehículos
                        </p>
                      </div>
                    ) : (
                      filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicles.some(
                          (v) => v?.id === vehicle.id
                        );
                        const isFavorite = favorites.includes(vehicle.id);
                        return (
                          <button
                            key={vehicle.id}
                            onClick={() =>
                              !isSelected &&
                              selectVehicle(vehicle, showSelector)
                            }
                            disabled={isSelected}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all relative ${
                              isSelected
                                ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                                : "border-gray-200 hover:border-indigo-500 hover:bg-indigo-50"
                            }`}
                          >
                            {isFavorite && (
                              <div className="absolute top-2 right-2 bg-pink-100 rounded-full p-1">
                                <Heart className="w-4 h-4 text-pink-500 fill-current" />
                              </div>
                            )}
                            <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                              {vehicle.images && vehicle.images.length > 0 ? (
                                <VehicleImageComponent
                                  src={vehicle.images[0]}
                                  alt={`${vehicle.marca} ${vehicle.modelo}`}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Car className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="text-lg font-bold text-gray-800">
                                {vehicle.marca} {vehicle.modelo}
                              </h4>
                              <p className="text-xl font-bold text-indigo-600 mb-1">
                                {formatPrice(vehicle.precio)}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span>{vehicle.anio}</span>
                                <span>•</span>
                                <span>
                                  {vehicle.kilometraje.toLocaleString()} km
                                </span>
                                <span>•</span>
                                <span>{vehicle.estado_vehiculo}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <CheckCircle className="w-6 h-6 text-gray-400" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
