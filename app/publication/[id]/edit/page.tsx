"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
  User,
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
  region_id: string;
  ciudad: string;
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

export default function EditPublicationPage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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
    region_id: "",
    ciudad: "",
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        router.push("/login");
        return;
      }

      setUser(session.user);
      await loadCatalogs();
      await loadVehicle(session.user.id);
      setLoading(false);
    };

    checkAuthAndLoad();
  }, [vehicleId, router]);

  const loadCatalogs = async () => {
    try {
      const { data: tiposData } = await supabase
        .from("tipo_vehiculo")
        .select("id, nombre")
        .order("nombre");
      setTiposVehiculo(tiposData || []);

      const { data: combustibleData } = await supabase
        .from("tipo_combustible")
        .select("id, nombre")
        .order("nombre");
      setTiposCombustible(combustibleData || []);

      const { data: regionesData } = await supabase
        .from("region")
        .select("id, nombre_region, codigo_iso")
        .order("nombre_region");
      setRegions(regionesData || []);
    } catch (error: any) {
      console.error("Error cargando catálogos:", error);
      setError("Error al cargar los catálogos");
    }
  };

  const loadVehicle = async (userId: string) => {
    try {
      // Verificar que el usuario sea dueño del vehículo
      const { data: ownerData } = await supabase
        .from("usuario_vehiculo")
        .select("usuario_id")
        .eq("vehiculo_id", parseInt(vehicleId))
        .single();

      if (!ownerData || ownerData.usuario_id !== userId) {
        setError("No tienes permiso para editar este vehículo");
        setTimeout(() => router.push("/profile"), 2000);
        return;
      }

      // Cargar datos del vehículo
      const { data: vehiculoData, error: vehiculoError } = await supabase
        .from("vehiculo")
        .select("*")
        .eq("id", parseInt(vehicleId))
        .single();

      if (vehiculoError) throw vehiculoError;

      setVehicleData({
        marca: vehiculoData.marca,
        modelo: vehiculoData.modelo,
        anio: vehiculoData.anio.toString(),
        kilometraje: vehiculoData.kilometraje.toString(),
        transmision: vehiculoData.transmision,
        precio: vehiculoData.precio.toString(),
        estado_vehiculo: vehiculoData.estado_vehiculo,
        descripcion: vehiculoData.descripcion,
        cilindrada: vehiculoData.cilindrada,
        tipo_vehiculo_id: vehiculoData.tipo_vehiculo_id?.toString() || "",
        tipo_combustible_id: vehiculoData.tipo_combustible_id?.toString() || "",
        region_id: vehiculoData.region?.toString() || "",
        ciudad: vehiculoData.ciudad || "",
      });

      // Cargar imágenes existentes
      const { data: imagenesData } = await supabase
        .from("imagen_vehiculo")
        .select("url_imagen")
        .eq("vehiculo_id", parseInt(vehicleId));

      setExistingImages(imagenesData?.map((img) => img.url_imagen) || []);
    } catch (error: any) {
      console.error("Error loading vehicle:", error);
      setError("Error al cargar el vehículo");
    }
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      existingImages.length -
      imagesToDelete.length +
      newImages.length +
      files.length;

    if (totalImages > 6) {
      setError("Máximo 6 imágenes permitidas");
      return;
    }

    const newImgs = [...newImages, ...files];
    setNewImages(newImgs);

    const newPrevs = newImgs.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(newPrevs);
    setError("");
  };

  const removeExistingImage = (url: string) => {
    setImagesToDelete([...imagesToDelete, url]);
  };

  const undoRemoveImage = (url: string) => {
    setImagesToDelete(imagesToDelete.filter((u) => u !== url));
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
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

    const remainingImages = existingImages.length - imagesToDelete.length;
    if (remainingImages + newImages.length === 0) {
      setError("Debes tener al menos una imagen del vehículo");
      return;
    }

    setSaving(true);

    try {
      // 1. Actualizar vehículo
      const { error: vehicleError } = await supabase
        .from("vehiculo")
        .update({
          marca: vehicleData.marca.trim(),
          modelo: vehicleData.modelo.trim(),
          anio: parseInt(vehicleData.anio),
          kilometraje: parseInt(vehicleData.kilometraje),
          transmision: vehicleData.transmision,
          precio: parseFloat(vehicleData.precio),
          estado_vehiculo: vehicleData.estado_vehiculo,
          descripcion: vehicleData.descripcion.trim(),
          cilindrada: vehicleData.cilindrada,
          tipo_vehiculo_id: parseInt(vehicleData.tipo_vehiculo_id),
          tipo_combustible_id: parseInt(vehicleData.tipo_combustible_id),
          region: parseInt(vehicleData.region_id),
          ciudad: vehicleData.ciudad.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", parseInt(vehicleId));

      if (vehicleError) throw vehicleError;

      // 2. Eliminar imágenes marcadas
      for (const url of imagesToDelete) {
        await supabase
          .from("imagen_vehiculo")
          .delete()
          .eq("vehiculo_id", parseInt(vehicleId))
          .eq("url_imagen", url);

        // También eliminar del storage
        const fileName = url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("vehiculo_imagen").remove([fileName]);
        }
      }

      // 3. Subir nuevas imágenes
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const fileName = `${user.id}/${Date.now()}_${i}.${file.name
          .split(".")
          .pop()}`;

        const { error: uploadError } = await supabase.storage
          .from("vehiculo_imagen")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("vehiculo_imagen")
          .getPublicUrl(fileName);

        await supabase.from("imagen_vehiculo").insert({
          vehiculo_id: parseInt(vehicleId),
          url_imagen: publicData.publicUrl,
        });
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/mypost");
      }, 2000);
    } catch (error: any) {
      console.error("Error:", error);
      setError("Error al actualizar el vehículo: " + error.message);
    } finally {
      setSaving(false);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Actualización Exitosa!
          </h2>
          <p className="text-gray-600">
            Tu vehículo ha sido actualizado correctamente
          </p>
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
                <h1 className="text-3xl font-bold">Editar Publicación</h1>
                <p className="text-indigo-100 text-sm">
                  Actualiza la información de tu vehículo
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
                  {existingImages.map((url, index) => {
                    const isMarkedForDeletion = imagesToDelete.includes(url);
                    return (
                      <div key={`existing-${index}`} className="relative group">
                        <img
                          src={url}
                          alt={`Existente ${index + 1}`}
                          className={`w-full h-32 object-cover rounded-lg border-2 ${
                            isMarkedForDeletion
                              ? "border-red-300 opacity-50"
                              : "border-gray-200"
                          }`}
                        />
                        {isMarkedForDeletion ? (
                          <button
                            type="button"
                            onClick={() => undoRemoveImage(url)}
                            className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => removeExistingImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {newImagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={preview}
                        alt={`Nueva ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-green-300"
                      />
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        Nueva
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {existingImages.length -
                    imagesToDelete.length +
                    newImages.length <
                    6 && (
                    <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">
                        Agregar foto
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleNewImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {existingImages.length -
                    imagesToDelete.length +
                    newImages.length}
                  /6 imágenes
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Información Básica
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
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
                      <option value="">Selecciona el tipo</option>
                      {tiposVehiculo.map((tipo) => (
                        <option key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      <option value="">Selecciona</option>
                      {tiposCombustible.map((tipo) => (
                        <option key={tipo.id} value={tipo.id.toString()}>
                          {tipo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

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
                      <option value="">Selecciona una región</option>
                      {regions.map((region) => (
                        <option key={region.id} value={region.id.toString()}>
                          {region.nombre_region} ({region.codigo_iso})
                        </option>
                      ))}
                    </select>
                  </div>

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
                  Descripción del Vehículo *
                </label>
                <textarea
                  value={vehicleData.descripcion}
                  onChange={(e) =>
                    setVehicleData({
                      ...vehicleData,
                      descripcion: e.target.value,
                    })
                  }
                  rows={4}
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
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Guardar Cambios
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
