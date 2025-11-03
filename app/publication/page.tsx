"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Car,
  Upload,
  X,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Wrench,
  FileText,
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  MapPin,
} from "lucide-react";

interface VehicleFormData {
  marca: string;
  modelo: string;
  anio: string;
  kilometraje: string;
  transmision: string;
  precio: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: string;
  tipo_vehiculo_id: string;
  tipo_combustible_id: string;
  ciudad: string;
  region_id: string;
}

interface CatalogItem {
  id: number;
  nombre: string;
}

interface Region {
  id: number;
  nombre_region: string;
  codigo_iso: string;
}

const TRANSMISSIONS = ["Manual", "Automática", "Semi-automática", "CVT"];
const CONDITIONS = ["Nuevo", "Usado", "Semi-nuevo", "Para reparar"];

export default function PublicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Catálogos
  const [tiposVehiculo, setTiposVehiculo] = useState<CatalogItem[]>([]);
  const [tiposCombustible, setTiposCombustible] = useState<CatalogItem[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);

  const [vehicleData, setVehicleData] = useState<VehicleFormData>({
    marca: "",
    modelo: "",
    anio: "",
    kilometraje: "",
    transmision: "",
    precio: "",
    estado_vehiculo: "",
    descripcion: "",
    cilindrada: "",
    tipo_vehiculo_id: "",
    tipo_combustible_id: "",
    ciudad: "",
    region_id: "",
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Cargar usuario y catálogos
  useEffect(() => {
    const initializeForm = async () => {
      await checkUserAccess();
      await loadCatalogs();
      setLoading(false);
    };

    initializeForm();
  }, []);

  const checkUserAccess = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // Verificar que NO sea administrador
      const { data: userData } = await supabase
        .from("usuario")
        .select("id, rol")
        .eq("usuario_id", session.user.id)
        .maybeSingle();

      if (userData && userData.rol === "administrador") {
        alert("Los administradores no pueden publicar vehículos");
        router.push("/admin/profile");
        return;
      }

      // Verificar que sea usuario normal o empresa
      if (userData) {
        setUser(userData);
        return;
      }

      // Verificar si es empresa
      const { data: empresaData } = await supabase
        .from("empresa")
        .select("id")
        .eq("usuario_id", session.user.id)
        .maybeSingle();

      if (empresaData) {
        setUser({ id: session.user.id, rol: "empresa" });
        return;
      }

      // No es ni usuario ni empresa
      router.push("/login");
    } catch (error) {
      console.error("Error:", error);
      router.push("/login");
    }
  };

  const loadCatalogs = async () => {
    try {
      console.log("📥 Cargando catálogos...");

      // Cargar tipos de vehículo
      const { data: tiposData, error: tiposError } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre")
        .order("nombre");

      if (tiposError) {
        console.error("❌ Error cargando tipo_vehiculo:", tiposError);
      } else {
        console.log("✅ Tipos de vehículo cargados:", tiposData?.length);
        setTiposVehiculo(tiposData || []);
      }

      // Cargar tipos de combustible
      const { data: combustibleData, error: combustibleError } = await supabase
        .from("tipo_combustible")
        .select("id, nombre")
        .order("nombre");

      if (combustibleError) {
        console.error("❌ Error cargando tipo_combustible:", combustibleError);
      } else {
        console.log(
          "✅ Tipos de combustible cargados:",
          combustibleData?.length
        );
        setTiposCombustible(combustibleData || []);
      }

      // Cargar regiones
      const { data: regionesData, error: regionesError } = await supabase
        .from("region")
        .select("id, nombre_region, codigo_iso")
        .order("nombre_region");

      if (regionesError) {
        console.error("❌ Error cargando regiones:", regionesError);
      } else {
        console.log("✅ Regiones cargadas:", regionesData?.length);
        setRegions(regionesData || []);
      }
    } catch (error: any) {
      console.error("❌ Error cargando catálogos:", error);
      setError("Error al cargar los catálogos: " + error.message);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (images.length + files.length > 6) {
      setError("Máximo 6 imágenes permitidas");
      return;
    }

    const newImages = [...images, ...files].slice(0, 6);
    setImages(newImages);

    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    setError("");
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    setError("");

    // Validaciones
    if (
      !vehicleData.marca.trim() ||
      !vehicleData.modelo.trim() ||
      !vehicleData.precio ||
      !vehicleData.anio ||
      !vehicleData.kilometraje ||
      !vehicleData.transmision ||
      !vehicleData.tipo_combustible_id ||
      !vehicleData.cilindrada ||
      !vehicleData.descripcion.trim() ||
      !vehicleData.estado_vehiculo ||
      !vehicleData.tipo_vehiculo_id ||
      !vehicleData.ciudad.trim() ||
      !vehicleData.region_id
    ) {
      setError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (images.length === 0) {
      setError("Debes subir al menos una imagen del vehículo");
      return;
    }

    const anio = parseInt(vehicleData.anio);
    if (anio < 1900 || anio > new Date().getFullYear() + 1) {
      setError("El año del vehículo no es válido");
      return;
    }

    setSaving(true);

    try {
      // ✅ OBTENER LA SESIÓN ACTUAL
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("No estás autenticado");
        setSaving(false);
        return;
      }

      const userId = session.user.id; // ← UUID correcto

      // 1. Subir imágenes a Supabase Storage
      const imageUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileName = `${userId}/${Date.now()}_${i}.${file.name
          .split(".")
          .pop()}`;

        const { error: uploadError } = await supabase.storage
          .from("vehiculo_imagen")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("vehiculo_imagen")
          .getPublicUrl(fileName);

        imageUrls.push(publicData.publicUrl);
      }

      // 2. Insertar vehículo
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from("vehiculo")
        .insert({
          marca: vehicleData.marca.trim(),
          modelo: vehicleData.modelo.trim(),
          anio: parseInt(vehicleData.anio),
          kilometraje: parseInt(vehicleData.kilometraje),
          transmision: vehicleData.transmision,
          precio: parseFloat(vehicleData.precio),
          estado_vehiculo: vehicleData.estado_vehiculo,
          descripcion: vehicleData.descripcion.trim(),
          cilindrada: vehicleData.cilindrada,
          tipo_vehiculo_id: vehicleData.tipo_vehiculo_id
            ? parseInt(vehicleData.tipo_vehiculo_id)
            : null,
          tipo_combustible_id: vehicleData.tipo_combustible_id
            ? parseInt(vehicleData.tipo_combustible_id)
            : null,
          region: parseInt(vehicleData.region_id),
          ciudad: vehicleData.ciudad.trim(),
        })
        .select()
        .single();

      if (vehiculoError) throw vehiculoError;

      // 3. Crear relación usuario-vehículo
      const { error: usuarioVehiculoError } = await supabase
        .from("usuario_vehiculo")
        .insert({
          usuario_id: userId, // ✅ UUID correcto de la sesión
          vehiculo_id: vehiculoData.id,
        });

      if (usuarioVehiculoError) throw usuarioVehiculoError;

      // 4. Guardar las URLs de imágenes
      if (imageUrls.length > 0) {
        const imageRecords = imageUrls.map((url) => ({
          vehiculo_id: vehiculoData.id,
          url_imagen: url,
        }));

        const { error: imagesError } = await supabase
          .from("imagen_vehiculo")
          .insert(imageRecords);

        if (imagesError) {
          console.warn(
            "Advertencia al guardar imágenes:",
            imagesError,
            " pero el vehículo fue publicado"
          );
        }
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/shop");
      }, 2000);
    } catch (error: any) {
      console.error("Error completo:", error);
      setError("Error al publicar el vehículo: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Publicación Exitosa!
          </h2>
          <p className="text-gray-600">
            Tu vehículo ha sido publicado correctamente
          </p>
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <div className="flex items-center gap-3 text-white">
              <Car className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">Publicar Vehículo</h1>
                <p className="text-indigo-100 text-sm">
                  Completa la información de tu auto
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-8">
              {/* Imágenes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <ImageIcon className="w-4 h-4 inline mr-2" />
                  Imágenes del Vehículo * (máximo 6)
                </label>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {images.length < 6 && (
                    <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Subir foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {images.length}/6 imágenes
                </p>
              </div>

              {/* Información Básica */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Información Básica
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Marca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="w-4 h-4 inline mr-1" />
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.marca}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          marca: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Toyota, Ford, BMW..."
                    />
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.modelo}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          modelo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Corolla, Fiesta, X5..."
                    />
                  </div>

                  {/* Precio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio (CLP) *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.precio}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          precio: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="5000000"
                      min="0"
                    />
                  </div>

                  {/* Año */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Año *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.anio}
                      onChange={(e) =>
                        setVehicleData({ ...vehicleData, anio: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="2020"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>

                  {/* Kilometraje */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Gauge className="w-4 h-4 inline mr-1" />
                      Kilometraje *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.kilometraje}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          kilometraje: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="50000"
                      min="0"
                    />
                  </div>

                  {/* Transmisión */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Wrench className="w-4 h-4 inline mr-1" />
                      Transmisión *
                    </label>
                    <select
                      value={vehicleData.transmision}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          transmision: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecciona</option>
                      {TRANSMISSIONS.map((trans) => (
                        <option key={trans} value={trans}>
                          {trans}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cilindrada */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Wrench className="w-4 h-4 inline mr-1" />
                      Cilindrada (cc) *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.cilindrada}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          cilindrada: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1800"
                      min="0"
                    />
                  </div>

                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Estado *
                    </label>
                    <select
                      value={vehicleData.estado_vehiculo}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          estado_vehiculo: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecciona el estado</option>
                      {CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>
                          {condition}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Vehículo - CARGADO DE SUPABASE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="w-4 h-4 inline mr-1" />
                      Tipo de Vehículo *
                    </label>
                    <select
                      value={vehicleData.tipo_vehiculo_id}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          tipo_vehiculo_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">
                        {tiposVehiculo.length === 0
                          ? "Cargando tipos..."
                          : "Selecciona el tipo"}
                      </option>
                      {tiposVehiculo.map((tipo) => (
                        <option key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tipo de Combustible - CARGADO DE SUPABASE */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Fuel className="w-4 h-4 inline mr-1" />
                      Tipo de Combustible *
                    </label>
                    <select
                      value={vehicleData.tipo_combustible_id}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          tipo_combustible_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">
                        {tiposCombustible.length === 0
                          ? "Cargando combustibles..."
                          : "Selecciona"}
                      </option>
                      {tiposCombustible.map((tipo) => (
                        <option key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Región */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Región *
                    </label>
                    <select
                      value={vehicleData.region_id}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          region_id: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                    >
                      <option value="">
                        {regions.length === 0
                          ? "Cargando regiones..."
                          : "Selecciona una región"}
                      </option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id.toString()}>
                          {region.nombre_region} ({region.codigo_iso})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Ciudad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.ciudad}
                      onChange={(e) =>
                        setVehicleData({
                          ...vehicleData,
                          ciudad: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Santiago, Valparaíso, Concepción..."
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Descripción *
                </label>
                <textarea
                  value={vehicleData.descripcion}
                  onChange={(e) =>
                    setVehicleData({
                      ...vehicleData,
                      descripcion: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe tu vehículo, condiciones, extras, historial, etc."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Publicando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Publicar Vehículo
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
