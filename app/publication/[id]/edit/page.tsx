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
    ciudad_id: string;
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
    const [cities, setCities] = useState<CatalogItem[]>([]);

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
        ciudad_id: "",
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleId, router]);

    // Cargar todos los catálogos iniciales
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

    // Cargar ciudades por región
    const loadCities = async (regionId: string) => {
        if (!regionId) {
            setCities([]);
            setVehicleData((prev) => ({ ...prev, ciudad_id: "" }));
            return;
        }
        const { data: citiesData } = await supabase
            .from("ciudad")
            .select("id, nombre")
            .eq("region_id", parseInt(regionId))
            .order("nombre");
        setCities(citiesData || []);
    };

    // 🔑 Cargar info del vehículo y verificar propiedad (CORREGIDO)
    const loadVehicle = async (userId: string) => {
        try {
            // 1. Cargar datos del vehículo (incluyendo sus IDs de propietario)
            const { data: vehiculoData, error: vehiculoError } = await supabase
                .from("vehiculo")
                .select("*, region_id, ciudad_id, usuario_id, empresa_id") // Incluimos IDs de propietario
                .eq("id", parseInt(vehicleId))
                .single();

            if (vehiculoError) throw vehiculoError;

            // 2. Determinar si el usuario autenticado es dueño del vehículo
            let isOwner = false;

            // a) Si el vehículo pertenece a un Usuario (particular)
            if (vehiculoData.usuario_id === userId) {
                isOwner = true;
            }

            // b) Si el vehículo pertenece a una Empresa
            if (!isOwner && vehiculoData.empresa_id) {
                // Buscar si el usuario autenticado está vinculado a esa empresa_id
                const { data: empresaOwnerData } = await supabase
                    .from("empresa")
                    .select("id")
                    .eq("id", vehiculoData.empresa_id) // ID de la empresa dueña del vehículo
                    .eq("usuario_id", userId) // UUID del usuario logueado
                    .maybeSingle();

                if (empresaOwnerData) {
                    isOwner = true;
                }
            }

            if (!isOwner) {
                console.error("Permiso denegado: El usuario no es dueño de este vehículo o empresa.");
                setError("No tienes permiso para editar este vehículo");
                setTimeout(() => router.push("/mypost"), 2000); // Redirigir a mis publicaciones
                return;
            }

            // 3. Rellenar el formulario
            setVehicleData({
                marca: vehiculoData.marca,
                modelo: vehiculoData.modelo,
                anio: vehiculoData.anio?.toString() || "",
                kilometraje: vehiculoData.kilometraje?.toString() || "",
                transmision: vehiculoData.transmision || "",
                precio: vehiculoData.precio?.toString() || "",
                estado_vehiculo: vehiculoData.estado_vehiculo || "",
                descripcion: vehiculoData.descripcion || "",
                cilindrada: vehiculoData.cilindrada?.toString() || "",
                tipo_vehiculo_id: vehiculoData.tipo_vehiculo_id?.toString() || "",
                tipo_combustible_id: vehiculoData.tipo_combustible_id?.toString() || "",
                region_id: vehiculoData.region_id?.toString() || "",
                ciudad_id: vehiculoData.ciudad_id?.toString() || "",
            });

            // Cargar ciudades acorde a la región del vehículo
            if (vehiculoData.region_id) {
                await loadCities(vehiculoData.region_id?.toString());
            }

            // Imágenes existentes
            const { data: imagenesData } = await supabase
                .from("imagen_vehiculo")
                .select("url_imagen")
                .eq("vehiculo_id", parseInt(vehicleId));

            setExistingImages(imagenesData?.map((img) => img.url_imagen) || []);
        } catch (error: any) {
            console.error("Error loading vehicle:", error);
            setError("Error al cargar el vehículo o verificar la propiedad.");
        }
    };

    // Actualiza ciudades cada vez que se modifica la región
    useEffect(() => {
        if (vehicleData.region_id) {
            loadCities(vehicleData.region_id);
        } else {
            setCities([]);
            setVehicleData((prev) => ({ ...prev, ciudad_id: "" }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vehicleData.region_id]);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVehicleData(prev => ({ ...prev, [name]: value }));
    };

    // ----------- Validación + submit --------------------------------------
    const handleSubmit = async () => {
        setError("");

        // Validaciones obligatorias
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
            !vehicleData.ciudad_id ||
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
                    kilometraje: parseFloat(vehicleData.kilometraje),
                    transmision: vehicleData.transmision,
                    precio: parseFloat(vehicleData.precio),
                    estado_vehiculo: vehicleData.estado_vehiculo,
                    descripcion: vehicleData.descripcion.trim(),
                    cilindrada: parseInt(vehicleData.cilindrada),
                    tipo_vehiculo_id: parseInt(vehicleData.tipo_vehiculo_id),
                    tipo_combustible_id: parseInt(vehicleData.tipo_combustible_id),
                    region_id: parseInt(vehicleData.region_id),
                    ciudad_id: parseInt(vehicleData.ciudad_id),
                    updated_at: new Date().toISOString(),
                })
                .eq("id", parseInt(vehicleId));

            if (vehicleError) throw vehicleError;

            // 2. Eliminar imágenes marcadas (DB y Storage)
            for (const url of imagesToDelete) {
                // Eliminar de la tabla
                await supabase
                    .from("imagen_vehiculo")
                    .delete()
                    .eq("vehiculo_id", parseInt(vehicleId))
                    .eq("url_imagen", url);

                // Eliminar del Storage
                const urlParts = url.split('/');
                const fileName = urlParts[urlParts.length - 1]; 
                if (fileName) {
                    await supabase.storage.from("vehiculo_imagen").remove([fileName]);
                }
            }

            // 3. Subir nuevas imágenes e insertar en DB
            for (let i = 0; i < newImages.length; i++) {
                const file = newImages[i];
                // Creamos un nombre de archivo único incluyendo el ID del usuario/vehiculo
                const fileExtension = file.name.split(".").pop();
                const fileName = `${user.id}_${vehicleId}_${Date.now()}_${i}.${fileExtension}`;

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

    // ----------- Render ---------------------------
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

    const currentImages = existingImages.filter(url => !imagesToDelete.includes(url));
    const maxImages = 6;
    const canUploadMore = currentImages.length + newImages.length < maxImages;
    const totalImagesCount = currentImages.length + newImages.length;


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
                            {/* Sección de Imágenes */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5" /> Imágenes ({totalImagesCount}/{maxImages}) *
                                </h3>

                                {/* Visualización de Imágenes Existentes */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {existingImages.map((url) => (
                                        <div
                                            key={url}
                                            className={`relative h-32 rounded-lg overflow-hidden border-2 transition-all ${imagesToDelete.includes(url) ? 'opacity-50 border-red-400' : 'border-gray-200'
                                                }`}
                                        >
                                            <img
                                                src={url}
                                                alt="Existing Vehicle"
                                                className="w-full h-full object-cover"
                                            />
                                            {imagesToDelete.includes(url) ? (
                                                <button
                                                    onClick={() => undoRemoveImage(url)}
                                                    className="absolute inset-0 bg-red-600 bg-opacity-70 text-white flex items-center justify-center font-bold text-sm"
                                                >
                                                    Deshacer Eliminación
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => removeExistingImage(url)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                                                    title="Eliminar imagen"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Visualización de Nuevas Imágenes */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    {newImagePreviews.map((preview, index) => (
                                        <div
                                            key={index}
                                            className="relative h-32 rounded-lg overflow-hidden border-2 border-green-400"
                                        >
                                            <img
                                                src={preview}
                                                alt="New Vehicle Preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeNewImage(index)}
                                                className="absolute top-1 right-1 bg-gray-900 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                                                title="Eliminar nueva imagen"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Botón de Carga */}
                                    {canUploadMore && (
                                        <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <Upload className="w-6 h-6 text-gray-500" />
                                            <p className="mt-1 text-sm text-gray-500 text-center px-2">
                                                Añadir (Max {maxImages - totalImagesCount})
                                            </p>
                                            <input
                                                type="file"
                                                className="hidden"
                                                multiple
                                                accept="image/*"
                                                onChange={handleNewImageUpload}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Información básica */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                    Información Básica
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Marca */}
                                    <div>
                                        <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-2">Marca *</label>
                                        <input
                                            type="text"
                                            id="marca"
                                            name="marca"
                                            value={vehicleData.marca}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Modelo */}
                                    <div>
                                        <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-2">Modelo *</label>
                                        <input
                                            type="text"
                                            id="modelo"
                                            name="modelo"
                                            value={vehicleData.modelo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Año */}
                                    <div>
                                        <label htmlFor="anio" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Calendar className="w-4 h-4 inline mr-1" /> Año *
                                        </label>
                                        <input
                                            type="number"
                                            id="anio"
                                            name="anio"
                                            value={vehicleData.anio}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Kilometraje */}
                                    <div>
                                        <label htmlFor="kilometraje" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Gauge className="w-4 h-4 inline mr-1" /> Kilometraje (km) *
                                        </label>
                                        <input
                                            type="number"
                                            id="kilometraje"
                                            name="kilometraje"
                                            value={vehicleData.kilometraje}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Precio */}
                                    <div>
                                        <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                                            <DollarSign className="w-4 h-4 inline mr-1" /> Precio (CLP) *
                                        </label>
                                        <input
                                            type="number"
                                            id="precio"
                                            name="precio"
                                            value={vehicleData.precio}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Transmisión */}
                                    <div>
                                        <label htmlFor="transmision" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Wrench className="w-4 h-4 inline mr-1" /> Transmisión *
                                        </label>
                                        <select
                                            id="transmision"
                                            name="transmision"
                                            value={vehicleData.transmision}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            required
                                        >
                                            <option value="">Selecciona...</option>
                                            {TRANSMISSIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Tipo de Vehículo */}
                                    <div>
                                        <label htmlFor="tipo_vehiculo_id" className="block text-sm font-medium text-gray-700 mb-2">Tipo de Vehículo *</label>
                                        <select
                                            id="tipo_vehiculo_id"
                                            name="tipo_vehiculo_id"
                                            value={vehicleData.tipo_vehiculo_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            required
                                        >
                                            <option value="">Selecciona...</option>
                                            {tiposVehiculo.map((tipo) => (
                                                <option key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Tipo de Combustible */}
                                    <div>
                                        <label htmlFor="tipo_combustible_id" className="block text-sm font-medium text-gray-700 mb-2">
                                            <Fuel className="w-4 h-4 inline mr-1" /> Combustible *
                                        </label>
                                        <select
                                            id="tipo_combustible_id"
                                            name="tipo_combustible_id"
                                            value={vehicleData.tipo_combustible_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            required
                                        >
                                            <option value="">Selecciona...</option>
                                            {tiposCombustible.map((comb) => (
                                                <option key={comb.id} value={comb.id.toString()}>{comb.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Cilindrada */}
                                    <div>
                                        <label htmlFor="cilindrada" className="block text-sm font-medium text-gray-700 mb-2">Cilindrada (cc) *</label>
                                        <input
                                            type="number"
                                            id="cilindrada"
                                            name="cilindrada"
                                            value={vehicleData.cilindrada}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                    {/* Estado del Vehículo */}
                                    <div>
                                        <label htmlFor="estado_vehiculo" className="block text-sm font-medium text-gray-700 mb-2">Estado del Vehículo *</label>
                                        <select
                                            id="estado_vehiculo"
                                            name="estado_vehiculo"
                                            value={vehicleData.estado_vehiculo}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            required
                                        >
                                            <option value="">Selecciona...</option>
                                            {CONDITIONS.map((c) => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Región */}
                                    <div>
                                        <label htmlFor="region_id" className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-1" /> Región *
                                        </label>
                                        <select
                                            id="region_id"
                                            name="region_id"
                                            value={vehicleData.region_id}
                                            onChange={(e) =>
                                                setVehicleData({
                                                    ...vehicleData,
                                                    region_id: e.target.value,
                                                    ciudad_id: "",
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            required
                                        >
                                            <option value="">Selecciona una región</option>
                                            {regions.map((region) => (
                                                <option key={region.id} value={region.id.toString()}>
                                                    {region.nombre_region} ({region.codigo_iso})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Ciudad */}
                                    <div>
                                        <label htmlFor="ciudad_id" className="block text-sm font-medium text-gray-700 mb-2">
                                            <MapPin className="w-4 h-4 inline mr-1" /> Ciudad *
                                        </label>
                                        <select
                                            id="ciudad_id"
                                            name="ciudad_id"
                                            value={vehicleData.ciudad_id}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer bg-white"
                                            disabled={!vehicleData.region_id || cities.length === 0}
                                            required
                                        >
                                            <option value="">Selecciona una ciudad</option>
                                            {cities.map((city) => (
                                                <option key={city.id} value={city.id.toString()}>
                                                    {city.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" /> Descripción *
                                </h3>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={vehicleData.descripcion}
                                    onChange={handleChange}
                                    rows={5}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="Describe las características y el estado de tu vehículo..."
                                    required
                                />
                            </div>

                            {/* Botón de Guardar */}
                            <div className="pt-6 border-t flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50"
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