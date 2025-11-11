"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
    Car, Upload, X, DollarSign, Calendar, Gauge, Fuel,
    Wrench, FileText, Save, ArrowLeft, Image as ImageIcon, Loader2,
    CheckCircle, AlertCircle, MapPin
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
    ciudad_manual: string;
    oculto: boolean;
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
    // user ahora almacena el UUID de auth como 'id' (tipo string)
    const [user, setUser] = useState<{ id: string, rol: string } | null>(null);
    const [empresaId, setEmpresaId] = useState<string | null>(null);
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
        ciudad_manual: "",
        oculto: false,
    });

    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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
            const authUserId = session.user.id; // El UUID del usuario de Auth

            // 1. Intentar cargar como Usuario (rol usuario/administrador)
            const { data: userData } = await supabase
                .from("usuario")
                .select("id, rol") // 'id' aquí es el UUID de la tabla 'usuario'
                .eq("id", authUserId) // Usamos el UUID de Auth para encontrar el perfil
                .maybeSingle();

            if (userData) {
                if (userData.rol === "administrador") {
                    alert("Los administradores no pueden publicar vehículos");
                    router.push("/admin/profile");
                    return;
                }
                // Almacenamos el UUID y el rol
                setUser({ id: userData.id, rol: userData.rol });
                setEmpresaId(null); // Aseguramos que empresa_id sea null
                return;
            }

            // 2. Intentar cargar como Empresa
            const { data: empresaData } = await supabase
            .from("empresa")
            .select("id") // <<-- Esto es el ID ENTERO
            .eq("usuario_id", authUserId)
            .maybeSingle();

        if (empresaData) {
            // user.id es el UUID de Supabase Auth
            setUser({ id: authUserId, rol: "empresa" });
            // empresaId es el ID ENTERO de la tabla 'empresa'
            setEmpresaId(empresaData.id); // ✅ empresaData.id es el entero
            return;
        }

            // 3. Si no es ni usuario ni empresa registrado
            router.push("/login");
        } catch (error) {
            console.error("Error al verificar acceso:", error);
            router.push("/login");
        }
    };

    const loadCatalogs = async () => {
    try {
        // --- 1. TIPO VEHÍCULO ---
        const { data: tiposData, error: tiposError } = await supabase
            .from("tipo_vehiculo")
            // ¡IMPORTANTE! Pedir nombre_tipo, no solo nombre
            .select("id, nombre_tipo") 
            .order("nombre_tipo");
        if (tiposError) throw tiposError;

        setTiposVehiculo((tiposData || []).map(item => ({
            id: item.id,
            // Asigna el nombre_tipo al campo 'nombre' que tu interfaz 'CatalogItem' espera
            nombre: item.nombre_tipo 
        })));

        // --- 2. TIPO COMBUSTIBLE ---
        const { data: combustibleData, error: combustibleError } = await supabase
            .from("tipo_combustible")
            // ¡IMPORTANTE! Pedir nombre_combustible, no solo nombre
            .select("id, nombre_combustible")
            .order("nombre_combustible");
        if (combustibleError) throw combustibleError;

        setTiposCombustible((combustibleData || []).map(item => ({
            id: item.id,
            // Asigna el nombre_combustible al campo 'nombre' que tu interfaz 'CatalogItem' espera
            nombre: item.nombre_combustible
        })));

            const { data: regionesData, error: regionesError } = await supabase
                .from("region")
                .select("id, nombre_region, codigo_iso")
                .order("nombre_region");
            if (regionesError) throw regionesError;

            setRegions(regionesData || []);

        } catch (error: any) {
            setError("Error al cargar los catálogos: " + error.message);
        }
    };

    const loadCities = async (regionId: string) => {
        if (!regionId) {
            setCities([]);
            setVehicleData((prev) => ({ ...prev, ciudad_id: "", ciudad_manual: "" }));
            return;
        }
        const { data: citiesData, error: citiesError } = await supabase
            .from("ciudad")
            .select("id, nombre_ciudad")
            .eq("region_id", parseInt(regionId))
            .order("nombre_ciudad");

        if (citiesError) {
            console.error("Error cargando ciudades:", citiesError);
            return;
        }

        setCities(
            (citiesData || []).map(item => ({
                id: item.id,
                nombre: item.nombre_ciudad
            }))
        );
    };

    useEffect(() => {
        if (vehicleData.region_id) {
            loadCities(vehicleData.region_id);
        } else {
            setCities([]);
            setVehicleData((prev) => ({ ...prev, ciudad_id: "", ciudad_manual: "" }));
        }
    }, [vehicleData.region_id]);

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
        if (!user) {
            setError("Error de autenticación. Por favor, inicia sesión de nuevo.");
            return;
        }

        // --- Validación de campos obligatorios
        if (
            !vehicleData.marca.trim() || !vehicleData.modelo.trim() || !vehicleData.precio ||
            !vehicleData.anio || !vehicleData.kilometraje || !vehicleData.transmision ||
            !vehicleData.tipo_combustible_id || !vehicleData.cilindrada || !vehicleData.descripcion.trim() ||
            !vehicleData.estado_vehiculo || !vehicleData.tipo_vehiculo_id || !vehicleData.region_id ||
            (!vehicleData.ciudad_id && !vehicleData.ciudad_manual.trim())
        ) {
            setError("Por favor completa todos los campos obligatorios");
            return;
        }
        if (images.length === 0) {
            setError("Debes subir al menos una imagen del vehículo");
            return;
        }
        const anio = parseInt(vehicleData.anio);
        if (anio < 1900 || anio > new Date().getFullYear() + 1 || isNaN(anio)) {
            setError("El año del vehículo no es válido");
            return;
        }
        setSaving(true);

        try {
            const userId = user.id; // UUID del usuario

            // 1. Subida de imágenes en paralelo
            const uploadImage = async (file: File, idx: number) => {
                const fileExtension = file.name.split(".").pop();
                const fileName = `${userId}/${Date.now()}_${idx}.${fileExtension}`;
                const { error: uploadError } = await supabase.storage
                    .from("vehiculo_imagen")
                    .upload(fileName, file);
                if (uploadError) throw uploadError;
                const { data: publicData } = supabase.storage
                    .from("vehiculo_imagen")
                    .getPublicUrl(fileName);
                return publicData.publicUrl;
            };
            const imageUrls: string[] = await Promise.all(images.map(uploadImage));

            // 2. Manejo de Ciudad (ID o nueva)
            let ciudadIdToUse = vehicleData.ciudad_id;
            if (!ciudadIdToUse && vehicleData.ciudad_manual.trim()) {
                const { data: ciudadCreada, error: ciudadError } = await supabase
                    .from("ciudad")
                    .insert({
                        nombre_ciudad: vehicleData.ciudad_manual.trim(),
                        region_id: parseInt(vehicleData.region_id),
                    })
                    .select("id") // Solo necesitamos el ID
                    .single();
                if (ciudadError) {
                    setError("No se pudo crear la ciudad: " + ciudadError.message);
                    setSaving(false);
                    return;
                }
                ciudadIdToUse = ciudadCreada.id.toString(); // Convertir a string para el parseo
            }

            // 3. PARSEOS y Validación Final
            const regionIdInt = parseInt(vehicleData.region_id);
            const ciudadIdInt = parseInt(ciudadIdToUse);
            const tipoVehiculoInt = parseInt(vehicleData.tipo_vehiculo_id);
            const tipoCombustibleInt = parseInt(vehicleData.tipo_combustible_id);
            const precioFloat = parseFloat(vehicleData.precio);
            const kilometrajeFloat = parseFloat(vehicleData.kilometraje);
            const cilindradaInt = parseInt(vehicleData.cilindrada);

            if (
                isNaN(regionIdInt) || isNaN(ciudadIdInt) || isNaN(tipoVehiculoInt) ||
                isNaN(tipoCombustibleInt) || isNaN(precioFloat) || isNaN(kilometrajeFloat) ||
                isNaN(cilindradaInt)
            ) {
                setError('Error de formato: Asegúrate de que todos los números e IDs seleccionados sean válidos.');
                setSaving(false);
                return;
            }

            // 4. Inserción del Vehículo
const { data: vehiculoData, error: vehiculoError } = await supabase
    .from("vehiculo")
    .insert({
        marca: vehicleData.marca.trim(),
        modelo: vehicleData.modelo.trim(),
        anio: anio,
        kilometraje: kilometrajeFloat,
        transmision: vehicleData.transmision,
        precio: precioFloat,
        estado_vehiculo: vehicleData.estado_vehiculo,
        descripcion: vehicleData.descripcion.trim(),
        cilindrada: cilindradaInt,
        tipo_vehiculo_id: tipoVehiculoInt,
        tipo_combustible_id: tipoCombustibleInt,
        region_id: regionIdInt,
        ciudad_id: ciudadIdInt,
        oculto: vehicleData.oculto,
        // *** LÓGICA DE PROPIEDAD CORREGIDA ***
        // 1. Asigna usuario_id (UUID) si NO es empresa
        usuario_id: user.rol !== "empresa" ? userId : null,
        // 2. Asigna empresa_id (UUID) si ES empresa
        // Se cambió `typeof empresaId === 'number'` por `typeof empresaId === 'string'`
        // ¡O mejor, simplemente verifica que el valor exista!
        empresa_id: user.rol === "empresa" && empresaId ? empresaId : null,
    })
    .select()
    .single();

            if (vehiculoError) throw vehiculoError;

            // 5. Inserción de Imágenes
            if (imageUrls.length > 0) {
                const imageRecords = imageUrls.map((url, index) => ({
                    vehiculo_id: vehiculoData.id,
                    url_imagen: url,
                    es_principal: index === 0, // El primer elemento es principal
                }));
                const { error: imageError } = await supabase.from("imagen_vehiculo").insert(imageRecords);
                if (imageError) throw imageError;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push("/shop");
            }, 2000);

        } catch (error: any) {
            console.error("Error completo al publicar:", error);
            // El error original era por enviar UUID a un campo INTEGER.
            // La nueva lógica maneja usuario_id (UUID) y empresa_id (INTEGER) por separado.
            setError("Error al publicar el vehículo: " + (error.message || "Un error desconocido ha ocurrido."));
        } finally {
            setSaving(false);
        }
    };

    // ... (El resto del componente de React permanece igual para el renderizado)
    // Se mantiene el renderizado porque la UI no fue el problema.
    // ...
    
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
                                            placeholder="Ej: Corolla, Fiesta..."
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
                                                setVehicleData({
                                                    ...vehicleData,
                                                    anio: e.target.value,
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="2022"
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
                                            placeholder="15000"
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
                                    {/* Tipo de Vehículo */}
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
                                    {/* Tipo de Combustible */}
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
                                                    ciudad_id: "",
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
                                            Ciudad (elige o escribe) *
                                        </label>
                                        <select
                                            value={vehicleData.ciudad_id}
                                            onChange={(e) =>
                                                setVehicleData({
                                                    ...vehicleData,
                                                    ciudad_id: e.target.value,
                                                    ciudad_manual: "",
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                            disabled={!vehicleData.region_id}
                                        >
                                            <option value="">Selecciona ciudad (opcional)</option>
                                            {cities.map((city) => (
                                                <option key={city.id} value={city.id.toString()}>
                                                    {city.nombre}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="mt-2 text-sm text-gray-600">O escribe una ciudad:</div>
                                        <input
                                            type="text"
                                            value={vehicleData.ciudad_manual}
                                            onChange={(e) =>
                                                setVehicleData({
                                                    ...vehicleData,
                                                    ciudad_manual: e.target.value,
                                                    ciudad_id: "",
                                                })
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1"
                                            placeholder="Ej: Ciudad Nueva"
                                            disabled={!vehicleData.region_id}
                                        />
                                    </div>
                                    {/* Oculto */}
                                    <div className="flex items-center pt-4">
                                        <input
                                            type="checkbox"
                                            checked={vehicleData.oculto}
                                            onChange={(e) =>
                                                setVehicleData({
                                                    ...vehicleData,
                                                    oculto: e.target.checked,
                                                })
                                            }
                                            className="w-4 h-4 mr-2"
                                            id="oculto"
                                        />
                                        <label htmlFor="oculto" className="text-sm text-gray-700">
                                            Ocultar publicación (no visible al público)
                                        </label>
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