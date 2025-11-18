"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Loader2,
  Car,
  Tag,
  MapPin,
  Calendar,
  Gauge,
  User,
  Phone,
  Fuel,
  Ruler,
  Cog,
  Heart,
  Share2,
  X,
  Building,
  Star,
  Send,
} from "lucide-react";

// --- INTERFACES CORREGIDAS ---

interface Region {
  id: number;
  nombre_region: string;
}

interface SellerProfile {
  nombre: string;
  apellido: string;
  correo_electronico: string;
  telefono?: string;
  ciudad?: string;
  region_nombre?: string;
}

interface Company {
    id: string;
    nombre_comercial: string;
    telefono: string | null;
    region_id: number | null; 
    ciudad_id: number | null; 
    correo_electronico: string | null;
}

interface Vehicle {
  id: number;
  precio: number;
  marca: string;
  modelo: string;
  anio: number;
  kilometraje: number;
  transmision: string;
  estado_vehiculo: string;
  descripcion: string;
  cilindrada: number;
  oculto: boolean;
  created_at: string;
  
  region_id: number;
  ciudad_id: number;
  tipo_vehiculo_id: number;
  tipo_combustible_id: number;
  usuario_id: string | null; 
  empresa_id: string | null; 
  
  tipo_combustible: string;
  tipo_vehiculo: string;
  ciudad_nombre: string;
  region_nombre: string; 
}

interface VehicleWithImages extends Vehicle {
  images: string[];
}

// NUEVA INTERFAZ: Usuario que califica
interface RatingUser {
    nombre: string;
    apellido: string;
}

// INTERFAZ CORREGIDA: 'usuario' es un objeto simple o null, NO un array.
interface Rating {
    id: number;
    vehiculo_id: number;
    usuario_id: string;
    estrellas: number;
    comentario: string | null;
    created_at: string;
    // Campo añadido que viene de la Vista/Función SQL
    nombre_calificador?: string | null; 
    // El campo 'usuario' original ya no es necesario si usamos nombre_calificador
    usuario: RatingUser | null; 
}

// --- CONSTANTES Y FORMATOS ---

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(price);
};


// --- COMPONENTE PRINCIPAL ---

export default function VehicleDetailPage() {
  const params = useParams();
  const vehicleId = parseInt(params.id as string);

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<VehicleWithImages | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null); 
  const [company, setCompany] = useState<Company | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]); 
  const [avgRating, setAvgRating] = useState(0); 
  
  const regionsCache = useRef(new Map<number, string>()); 
  const [showContactModal, setShowContactModal] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());


  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails(vehicleId);
    }
  }, [vehicleId]);
  
  // Función de carga de calificaciones separada
  const fetchRatings = async (id: number) => {
    const { data: ratingsData, error } = await supabase
        .from("calificacion_detalles") 
        // ¡IMPORTANTE! Elimina saltos de línea y comentarios dentro de la cadena
        .select(`id, vehiculo_id, usuario_id, estrellas, comentario, created_at, nombre_calificador`)
        .eq("vehiculo_id", id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading ratings:", error);
        return;
    }

    // La data ahora no viene anidada. Mapeo simple:
    const validRatings = (ratingsData || []).map((r: any) => ({
        ...r,
        // Usamos null/undefined para 'usuario' ya que ahora usamos 'nombre_calificador'
        usuario: null, 
    })) as Rating[];
    
    setRatings(validRatings);

    if (validRatings.length > 0) {
        const sum = validRatings.reduce((acc, curr) => acc + curr.estrellas, 0);
        setAvgRating(sum / validRatings.length);
    } else {
        setAvgRating(0);
    }
}


  const mapCatalogName = (id: number | null, catalog: any[], key: string): string => {
      return (id !== null && id !== undefined) 
          ? catalog.find(item => item.id === id)?.[key] || `ID ${id} Desconocido`
          : "No especificado";
  };
  
  const fetchVehicleDetails = async (id: number) => {
    try {
      setLoading(true);

      // --- 1. Cargar Catálogos y Caches ---
      const { data: regionsData } = await supabase.from("region").select("id, nombre_region");
      const loadedRegions = regionsData || [];
      
      regionsCache.current.clear();
      loadedRegions.forEach(r => regionsCache.current.set(r.id, r.nombre_region));

      const { data: citiesData } = await supabase.from("ciudad").select("id, nombre_ciudad, region_id");
      const { data: fuelTypesData } = await supabase.from("tipo_combustible").select("id, nombre_combustible");
      const { data: vehicleTypesData } = await supabase.from("tipo_vehiculo").select("id, nombre_tipo");


      // --- 2. Cargar el Vehículo ---
      const { data: vehicleDataRaw, error: vehicleError } = await supabase
          .from("vehiculo")
          .select(`*`)
          .eq("id", id)
          .single();
          
      if (vehicleError || !vehicleDataRaw) {
        console.error("Error loading vehicle:", vehicleError);
        setVehicle(null);
        return;
      }
      
      // Mapear nombres de catálogos para el VEHÍCULO
      const vehicleData: Vehicle = {
          ...vehicleDataRaw,
          tipo_combustible: mapCatalogName(vehicleDataRaw.tipo_combustible_id, fuelTypesData || [], 'nombre_combustible'),
          tipo_vehiculo: mapCatalogName(vehicleDataRaw.tipo_vehiculo_id, vehicleTypesData || [], 'nombre_tipo'),
          ciudad_nombre: mapCatalogName(vehicleDataRaw.ciudad_id, citiesData || [], 'nombre_ciudad'),
          region_nombre: regionsCache.current.get(vehicleDataRaw.region_id) || "Región Desconocida",
      }

      // --- 3. Lógica para obtener ciudad y región de perfil del VENDEDOR ---
      
      setSeller(null);
      setCompany(null);
      
      if (vehicleData.usuario_id) {
          // Usuario particular
          const { data: usuarioData } = await supabase
              .from("usuario")
              .select("nombre, apellido, correo_electronico, telefono, ciudad_id, region_id")
              .eq("id", vehicleData.usuario_id)
              .single();

          if(usuarioData) {
              let ciudadName = "Desconocida";
              if (usuarioData.ciudad_id) {
                  const ciudad = citiesData?.find(c => c.id === usuarioData.ciudad_id);
                  ciudadName = ciudad?.nombre_ciudad ?? "Desconocida";
              }
              
              const regionName = usuarioData.region_id
                  ? regionsCache.current.get(usuarioData.region_id) || "Desconocida" 
                  : "Desconocida";
              
              setSeller({
                  nombre: usuarioData.nombre || "",
                  apellido: usuarioData.apellido || "",
                  correo_electronico: usuarioData.correo_electronico || "",
                  telefono: usuarioData.telefono,
                  ciudad: ciudadName,
                  region_nombre: regionName,
              });
          }
      } else if (vehicleData.empresa_id) {
          // Empresa
          const { data: empresaData } = await supabase
              .from("empresa")
              .select("nombre_comercial, correo_electronico, telefono, ciudad_id, region_id")
              .eq("id", vehicleData.empresa_id)
              .single();
          
          if (empresaData) {
              setCompany(empresaData as Company);
              
              let ciudadName = "Desconocida";
              if (empresaData.ciudad_id) {
                  const ciudad = citiesData?.find(c => c.id === empresaData.ciudad_id);
                  ciudadName = ciudad?.nombre_ciudad ?? "Desconocida";
              }
              
              const regionName = empresaData.region_id
                  ? regionsCache.current.get(empresaData.region_id) || "Desconocida"
                  : "Desconocida";
                  
              setSeller({
                  nombre: empresaData.nombre_comercial || "",
                  apellido: "",
                  correo_electronico: empresaData.correo_electronico || "",
                  telefono: empresaData.telefono,
                  ciudad: ciudadName,
                  region_nombre: regionName,
              });
          }
      }
      
      // --- 4. Cargar Imágenes y setear el vehículo final ---
      const { data: imagesData } = await supabase
          .from("imagen_vehiculo")
          .select("url_imagen")
          .eq("vehiculo_id", id);

      const vehicleWithImages: VehicleWithImages = {
          ...vehicleData,
          images: imagesData?.map((img) => img.url_imagen) || [],
      };

      setVehicle(vehicleWithImages);
      
      // --- 5. Cargar Calificaciones (Inicial) ---
      await fetchRatings(id);

    } catch (error) {
      console.error("Error general:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="ml-3 text-lg text-gray-700">Cargando detalles...</p>
        </div>
    );
  }

  if (!vehicle) {
    return (
        <div className="min-h-screen bg-white p-10 text-center">
            <h1 className="text-3xl font-bold text-red-600">Vehículo no encontrado</h1>
            <p className="mt-4 text-gray-600">El ID {vehicleId} no corresponde a ningún vehículo activo.</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* --- Header del Vehículo --- */}
        <div className="mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
                {vehicle.marca} {vehicle.modelo} {vehicle.anio}
            </h1>
            <p className="text-3xl font-bold text-indigo-600 mb-4">
                {formatPrice(vehicle.precio)}
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{vehicle.ciudad_nombre}, {vehicle.region_nombre}</span> 
                </div>
                <span className="text-gray-300">•</span>
                <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Publicado el: {new Date(vehicle.created_at).toLocaleDateString("es-CL")}</span>
                </div>
            </div>
        </div>
        
        <hr className="my-6" />

        {/* --- Grid Principal: Detalles y Contacto --- */}
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Columna Izquierda: Imagen, Descripción y Especificaciones, CLASIFICACIÓN */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Galería de Imágenes */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="h-96 relative">
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
                                <Car className="w-20 h-20 text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Descripción */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Descripción</h2>
                    <p className="text-gray-600 whitespace-pre-line">
                        {vehicle.descripcion || "El vendedor no ha proporcionado una descripción detallada."}
                    </p>
                </div>

                {/* 3. Especificaciones */}
                <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Especificaciones Clave</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-gray-700">
                        <DetailItem icon={Calendar} label="Año" value={vehicle.anio} />
                        <DetailItem icon={Gauge} label="Kilometraje" value={`${vehicle.kilometraje.toLocaleString()} km`} />
                        <DetailItem icon={Cog} label="Transmisión" value={vehicle.transmision} />
                        <DetailItem icon={Fuel} label="Combustible" value={vehicle.tipo_combustible} />
                        <DetailItem icon={Ruler} label="Cilindrada" value={`${vehicle.cilindrada} cc`} />
                        <DetailItem icon={Tag} label="Tipo de Vehículo" value={vehicle.tipo_vehiculo} />
                    </div>
                </div>

                {/* 4. Clasificación y Comentarios */}
                <RatingsAndCommentsSection 
                    vehicleId={vehicleId}
                    ratings={ratings}
                    avgRating={avgRating}
                    onNewRating={() => fetchRatings(vehicleId)} 
                />

            </div>
            
            {/* Columna Derecha: Vendedor y Acciones */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* Seller/Contact Card */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        {company ? (
                            <Building className="w-5 h-5 text-indigo-600" />
                        ) : (
                            <User className="w-5 h-5 text-indigo-600" />
                        )}
                        {company ? "Vendido por Empresa" : "Vendedor Particular"}
                    </h3>
                    
                    {seller ? (
                        <div className="space-y-3">
                            
                            {/* Nombre del Vendedor/Empresa */}
                            <p className="text-xl font-bold text-gray-900">
                                {company ? seller.nombre : `${seller.nombre} ${seller.apellido}`}
                            </p>
                            
                            {/* Ubicación del perfil del vendedor */}
                            {seller.ciudad && seller.region_nombre && (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <MapPin className="w-5 h-5 text-gray-600" />
                                    <div>
                                        <p className="text-xs text-gray-600">Ubicación del Vendedor</p>
                                        <p className="font-semibold text-gray-800">
                                            {seller.ciudad}, {seller.region_nombre}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={() => setShowContactModal(true)}
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg mt-4"
                            >
                                <Phone className="w-5 h-5 inline-block mr-2" />
                                Mostrar Contacto
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">Información del vendedor no disponible.</p>
                    )}
                </div>

                {/* Botones de Acción */}
                <div className="flex space-x-4">
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                        <Heart className="w-5 h-5" />
                        Guardar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors">
                        <Share2 className="w-5 h-5" />
                        Compartir
                    </button>
                </div>
            </div>
            
        </div>
      </div>
      
      {/* Modal de Contacto (Placeholder) */}
      {showContactModal && <ContactModal onClose={() => setShowContactModal(false)} company={company} seller={seller} />}
      
    </div>
  );
}

// --- Componente de Calificaciones y Comentarios ---

interface RatingsProps {
    vehicleId: number;
    ratings: Rating[];
    avgRating: number;
    onNewRating: () => void;
}

const RatingsAndCommentsSection: React.FC<RatingsProps> = ({ vehicleId, ratings, avgRating, onNewRating }) => {
    const [userRating, setUserRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null); 
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // 1. Verificar autenticación al cargar
    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
            setIsAuthenticated(!!user);
        };
        checkUser();
    }, []);
    
    // 2. Manejar envío de calificación/comentario
    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || userRating === 0) {
        // ... (manejo de errores) ...
        return;
    }

    setIsSubmitting(true);
    
    // EL UPSERT ES AHORA SIMPLE Y ÚNICO
    const userId = currentUser.id; 

    const { error } = await supabase
        .from("calificacion")
        .upsert({
            vehiculo_id: vehicleId,
            usuario_id: userId, // Siempre el ID de auth.users
            estrellas: userRating,
            comentario: comment,
        }, {
            // Requiere UNIQUE CONSTRAINT (vehiculo_id, usuario_id) en la DB
            onConflict: 'vehiculo_id, usuario_id' 
        });

    setIsSubmitting(false);

    if (error) {
        console.error("Error submitting rating:", error);
        alert(`Error al enviar la calificación: ${error.message}`);
    } else {
        alert("Calificación enviada con éxito.");
        setUserRating(0);
        setComment("");
        onNewRating(); // Recarga las calificaciones
    }
};

    // Renderiza las estrellas
    const renderStars = (rating: number, size = 5) => (
        <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-${size} h-${size} ${
                        i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                    }`}
                />
            ))}
        </div>
    );
    
    // Componente para seleccionar estrellas
    const StarSelector = ({ rating, setRating }: { rating: number, setRating: (r: number) => void }) => (
        <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`w-6 h-6 cursor-pointer transition-colors ${
                        i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-300"
                    }`}
                    onClick={() => setRating(i + 1)}
                />
            ))}
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-indigo-600" />
                Clasificación y Opiniones
            </h2>
            
            {/* Resumen de Calificación Promedio */}
            <div className="flex items-center mb-6 border-b pb-4">
                <span className="text-5xl font-extrabold text-gray-900 mr-3">
                    {avgRating.toFixed(1)}
                </span>
                <div className="flex flex-col">
                    {renderStars(Math.round(avgRating), 6)}
                    <p className="text-sm text-gray-600 mt-1">
                        Basado en {ratings.length} {ratings.length === 1 ? 'opinión' : 'opiniones'}
                    </p>
                </div>
            </div>

            {/* Formulario para Nuevo Comentario */}
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Deja tu opinión</h3>
            <form onSubmit={handleSubmit} className="space-y-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                    <p className="text-gray-700">Tu Clasificación:</p>
                    <StarSelector rating={userRating} setRating={setUserRating} />
                </div>
                <div>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={isAuthenticated ? "Escribe tu comentario..." : "Inicia sesión para comentar"}
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={!isAuthenticated || isSubmitting}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!isAuthenticated || isSubmitting || userRating === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:bg-indigo-300"
                >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isSubmitting ? "Enviando..." : "Enviar Calificación"}
                </button>
            </form>

            {/* Lista de Comentarios Existentes */}
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Comentarios de Usuarios</h3>
            {ratings.length === 0 ? (
                <p className="text-gray-500">Aún no hay opiniones. ¡Sé el primero en calificar!</p>
            ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {ratings.map((rating) => (
                    <div key={rating.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-800">
                                {/* USAMOS EL CAMPO CALCULADO DE LA VISTA */}
                                {rating.nombre_calificador || 'Usuario Desconocido'} 
                            </p>
                            {renderStars(rating.estrellas, 4)}
                        </div>
                            <p className="text-sm text-gray-500 mb-2">
                                {new Date(rating.created_at).toLocaleDateString("es-CL")}
                            </p>
                            {rating.comentario && (
                                <p className="text-gray-700 italic">"{rating.comentario}"</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Componentes Reutilizables (Resto) ---

const DetailItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) => (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-500" />
            <span className="font-medium">{label}</span>
        </div>
        <span className="font-semibold text-gray-900">{value}</span>
    </div>
);

const ContactModal = ({ onClose, company, seller }: { onClose: () => void, company: Company | null, seller: SellerProfile | null }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
                        <Phone className="w-6 h-6" />
                        Información de Contacto
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {/* Información del Vendedor (Persona o Empresa) */}
                    <div>
                        <p className="text-sm font-medium text-gray-500">{company ? "Empresa" : "Vendedor"}</p>
                        <p className="text-xl font-bold">
                            {company ? company.nombre_comercial : `${seller?.nombre} ${seller?.apellido}`}
                        </p>
                    </div>

                    {/* Teléfono */}
                    {seller?.telefono && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                            <p className="text-lg font-semibold text-gray-700">
                                <span className="font-medium text-indigo-600">Teléfono:</span> {seller.telefono}
                            </p>
                        </div>
                    )}

                    {/* Correo Electrónico */}
                    {seller?.correo_electronico && (
                        <div className="bg-indigo-50 p-3 rounded-lg">
                            <p className="text-lg font-semibold text-gray-700">
                                <span className="font-medium text-indigo-600">Correo:</span> {seller.correo_electronico}
                            </p>
                        </div>
                    )}
                    
                    <button 
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors mt-4"
                        onClick={onClose}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};