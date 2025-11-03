"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Filter,
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  Calendar,
  Gauge,
  DollarSign,
  ArrowUpDown,
  ChevronDown,
  Eye,
  Fuel,
  Cog,
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
  tipo_combustible: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo: string;
  region: number;
  ciudad: string;
  created_at?: string;
  oculto: boolean;
}

interface CatalogItem {
  id: number;
  nombre: string;
}

interface Region {
  id: number;
  nombre_region: string;
}

interface VehicleWithImages extends Vehicle {
  images: string[];
}

const SORT_OPTIONS = [
  { value: "default", label: "Por defecto (Recientes)" },
  { value: "price_desc", label: "Precio: Mayor a Menor" },
  { value: "price_asc", label: "Precio: Menor a Mayor" },
  { value: "year_desc", label: "Año: Más nuevo" },
  { value: "year_asc", label: "Año: Más antiguo" },
  { value: "mileage_asc", label: "Kilometraje: Menor" },
];

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<VehicleWithImages[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleWithImages[]>(
    []
  );
  const [showFilters, setShowFilters] = useState(false);

  const [tiposCombustible, setTiposCombustible] = useState<CatalogItem[]>([]);
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    brand: "",
    model: "",
    yearMin: "",
    yearMax: "",
    priceMin: "",
    priceMax: "",
    conditions: searchParams?.getAll("conditions") || [],
    vehicleType: "",
    region: "",
  });

  const [sortBy, setSortBy] = useState("default");
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [vehicles, filters, sortBy]);

  const loadData = async () => {
    try {
      // Cargar tipos de combustible
      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre");
      setTiposCombustible(combustibleData || []);

      // Cargar tipos de vehículo
      const { data: tipoData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre");
      setTiposVehiculo(tipoData || []);

      // Cargar regiones
      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region");
      setRegions(regionesData || []);

      // Cargar vehículos con sus imágenes (SOLO NO OCULTOS)
      const { data: vehiculosData } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("oculto", false)
        .order("created_at", { ascending: false });

      if (!vehiculosData || vehiculosData.length === 0) {
        setVehicles([]);
        setLoading(false);
        return;
      }

      // Cargar imágenes y mapear nombres para cada vehículo
      const vehiculosConImagenes = await Promise.all(
        vehiculosData.map(async (vehiculo) => {
          // Cargar imágenes
          const { data: imagenesData } = await supabase
            .from("imagen_vehiculo")
            .select("url_imagen")
            .eq("vehiculo_id", vehiculo.id);

          // Buscar nombre de combustible
          const combustible = combustibleData?.find(
            (c) => c.id === vehiculo.tipo_combustible_id
          );

          // Buscar nombre de tipo de vehículo
          const tipoVehiculo = tipoData?.find(
            (t) => t.id === vehiculo.tipo_vehiculo_id
          );

          return {
            ...vehiculo,
            images: imagenesData?.map((img) => img.url_imagen) || [],
            tipo_combustible: combustible?.nombre || "Desconocido",
            tipo_vehiculo: tipoVehiculo?.nombre || "Desconocido",
          };
        })
      );

      setVehicles(vehiculosConImagenes);
    } catch (error: any) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...vehicles];

    // Filtro de búsqueda (marca o modelo)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.marca.toLowerCase().includes(searchLower) ||
          v.modelo.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de marca
    if (filters.brand) {
      const brandLower = filters.brand.toLowerCase();
      filtered = filtered.filter((v) =>
        v.marca.toLowerCase().includes(brandLower)
      );
    }

    // Filtro de modelo
    if (filters.model) {
      const modelLower = filters.model.toLowerCase();
      filtered = filtered.filter((v) =>
        v.modelo.toLowerCase().includes(modelLower)
      );
    }

    // Filtro de año
    if (filters.yearMin) {
      filtered = filtered.filter((v) => v.anio >= parseInt(filters.yearMin));
    }
    if (filters.yearMax) {
      filtered = filtered.filter((v) => v.anio <= parseInt(filters.yearMax));
    }

    // Filtro de precio
    if (filters.priceMin) {
      filtered = filtered.filter((v) => v.precio >= parseInt(filters.priceMin));
    }
    if (filters.priceMax) {
      filtered = filtered.filter((v) => v.precio <= parseInt(filters.priceMax));
    }

    // Filtro de tipo de vehículo
    if (filters.vehicleType) {
      filtered = filtered.filter(
        (v) => v.tipo_vehiculo === filters.vehicleType
      );
    }

    // Filtro de región
    if (filters.region) {
      filtered = filtered.filter((v) => v.region === parseInt(filters.region));
    }

    // Filtro de condición/estado
    if (filters.conditions.length > 0) {
      filtered = filtered.filter((v) =>
        filters.conditions.includes(v.estado_vehiculo)
      );
    }

    // Ordenamiento
    switch (sortBy) {
      case "price_desc":
        filtered.sort((a, b) => b.precio - a.precio);
        break;
      case "price_asc":
        filtered.sort((a, b) => a.precio - b.precio);
        break;
      case "year_desc":
        filtered.sort((a, b) => b.anio - a.anio);
        break;
      case "year_asc":
        filtered.sort((a, b) => a.anio - b.anio);
        break;
      case "mileage_asc":
        filtered.sort((a, b) => a.kilometraje - b.kilometraje);
        break;
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
        );
    }

    setFilteredVehicles(filtered);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      brand: "",
      model: "",
      yearMin: "",
      yearMax: "",
      priceMin: "",
      priceMax: "",
      conditions: [],
      vehicleType: "",
      region: "",
    });
    setSortBy("default");
    router.push("/shop");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const hasActiveFilters = () => {
    return (
      filters.search ||
      filters.brand ||
      filters.model ||
      filters.yearMin ||
      filters.yearMax ||
      filters.priceMin ||
      filters.priceMax ||
      filters.conditions.length > 0 ||
      filters.vehicleType ||
      filters.region ||
      sortBy !== "default"
    );
  };

  const getRegionName = (regionId: number) => {
    return (
      regions.find((r) => r.id === regionId)?.nombre_region || "Desconocida"
    );
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
          <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3 mb-2">
            <Car className="w-10 h-10 text-indigo-600" />
            Tienda de Vehículos
          </h1>
          <p className="text-gray-600">
            Encuentra tu próximo auto entre {vehicles.length} vehículos
            disponibles
          </p>
        </div>

        {/* Search and Sort Bar */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Buscar por marca o modelo..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div className="lg:w-64">
              <div className="relative">
                <ArrowUpDown className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none bg-white"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                showFilters
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters() && (
                <span className="bg-white text-indigo-600 text-xs px-2 py-0.5 rounded-full font-bold">
                  !
                </span>
              )}
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={filters.brand}
                    onChange={(e) =>
                      setFilters({ ...filters, brand: e.target.value })
                    }
                    placeholder="Ej: Toyota"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Model Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={filters.model}
                    onChange={(e) =>
                      setFilters({ ...filters, model: e.target.value })
                    }
                    placeholder="Ej: Corolla"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Vehicle Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Vehículo
                  </label>
                  <select
                    value={filters.vehicleType}
                    onChange={(e) =>
                      setFilters({ ...filters, vehicleType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Todos los tipos</option>
                    {tiposVehiculo.map((type) => (
                      <option key={type.id} value={type.nombre}>
                        {type.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Región
                  </label>
                  <select
                    value={filters.region}
                    onChange={(e) =>
                      setFilters({ ...filters, region: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Todas las regiones</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre_region}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.yearMin}
                      onChange={(e) =>
                        setFilters({ ...filters, yearMin: e.target.value })
                      }
                      placeholder="Desde"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.yearMax}
                      onChange={(e) =>
                        setFilters({ ...filters, yearMax: e.target.value })
                      }
                      placeholder="Hasta"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio (CLP)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={filters.priceMin}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMin: e.target.value })
                      }
                      placeholder="Precio mínimo"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      value={filters.priceMax}
                      onChange={(e) =>
                        setFilters({ ...filters, priceMax: e.target.value })
                      }
                      placeholder="Precio máximo"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters() && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                    >
                      <X className="w-4 h-4" />
                      Limpiar Filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Mostrando {filteredVehicles.length} de {vehicles.length} vehículos
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No se encontraron vehículos
            </h3>
            <p className="text-gray-600 mb-4">
              Intenta ajustar tus filtros de búsqueda
            </p>
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold"
              >
                <X className="w-5 h-5" />
                Limpiar Filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => router.push(`/vehicle/${vehicle.id}`)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gray-200 overflow-hidden">
                  {!imageErrors.has(vehicle.id) && vehicle.images.length > 0 ? (
                    <img
                      src={vehicle.images[0]}
                      alt={`${vehicle.marca} ${vehicle.modelo}`}
                      className="w-full h-full object-cover"
                      onError={() =>
                        setImageErrors((prev) => new Set(prev).add(vehicle.id))
                      }
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Car className="w-16 h-16 text-gray-400" />
                    </div>
                  )}

                  {/* Year Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-gray-800">
                      {vehicle.anio}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {vehicle.marca} {vehicle.modelo}
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-3">
                    {formatPrice(vehicle.precio)}
                  </p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Gauge className="w-4 h-4" />
                        <span>{vehicle.kilometraje.toLocaleString()} km</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cog className="w-4 h-4" />
                        <span>{vehicle.transmision}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Fuel className="w-4 h-4" />
                      <span>{vehicle.tipo_combustible}</span>
                      <span className="mx-1">•</span>
                      <span>{vehicle.cilindrada}cc</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {vehicle.ciudad}, {getRegionName(vehicle.region)}
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
