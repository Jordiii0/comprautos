"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { 
  Car, Upload, X, DollarSign, Calendar, Gauge, 
  Fuel, Palette, Wrench, FileText, Save, ArrowLeft,
  Image as ImageIcon, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';

interface VehicleData {
  price: string;
  brand: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
  fuel_type: string;
  color: string;
  engine_size: string;
  description: string;
  condition: string;
}

const BRANDS = [
  'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Mazda', 
  'Hyundai', 'Kia', 'Volkswagen', 'BMW', 'Mercedes-Benz', 
  'Audi', 'Peugeot', 'Renault', 'Suzuki', 'Mitsubishi', 'Subaru', 'Otra'
];

const FUEL_TYPES = ['Gasolina', 'Diésel', 'Eléctrico', 'Híbrido'];
const TRANSMISSIONS = ['Manual', 'Automática', 'Semi-automática'];
const CONDITIONS = ['Nuevo (0km)', 'Seminuevo', 'Usado'];

export default function PublicationPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    price: '',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    transmission: '',
    fuel_type: '',
    color: '',
    engine_size: '',
    description: '',
    condition: ''
  });

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 6) {
      setError('Máximo 6 imágenes permitidas');
      return;
    }

    const newImages = [...images, ...files].slice(0, 6);
    setImages(newImages);

    // Crear previews
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
    setError('');
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validaciones
    if (!vehicleData.price || !vehicleData.brand || !vehicleData.model || 
        !vehicleData.year || !vehicleData.mileage || !vehicleData.transmission ||
        !vehicleData.fuel_type || !vehicleData.color || !vehicleData.engine_size ||
        !vehicleData.description || !vehicleData.condition) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (images.length === 0) {
      setError('Debes subir al menos una imagen del vehículo');
      return;
    }

    if (parseInt(vehicleData.year) < 1900 || parseInt(vehicleData.year) > new Date().getFullYear() + 1) {
      setError('El año del vehículo no es válido');
      return;
    }

    setSaving(true);

    try {
      // Subir imágenes a Supabase Storage
      const imageUrls: string[] = [];
      
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileName = `${user.id}/${Date.now()}_${i}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('vehicle-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vehicle-images')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Guardar publicación en la base de datos
      const { error: dbError } = await supabase
        .from('vehicle_publications')
        .insert({
          user_id: user.id,
          price: parseInt(vehicleData.price),
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: parseInt(vehicleData.year),
          mileage: parseInt(vehicleData.mileage),
          transmission: vehicleData.transmission,
          fuel_type: vehicleData.fuel_type,
          color: vehicleData.color,
          engine_size: parseInt(vehicleData.engine_size),
          description: vehicleData.description,
          condition: vehicleData.condition,
          images: imageUrls,
          status: 'active',
          created_at: new Date().toISOString()
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/shop');
      }, 2000);

    } catch (error: any) {
      setError('Error al publicar el vehículo: ' + error.message);
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Publicación Exitosa!</h2>
          <p className="text-gray-600">Tu vehículo ha sido publicado correctamente</p>
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
                <p className="text-indigo-100 text-sm">Completa la información de tu auto</p>
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
                <p className="text-xs text-gray-500">{images.length}/6 imágenes</p>
              </div>

              {/* Información Básica */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Básica</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio (CLP) *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.price}
                      onChange={(e) => setVehicleData({ ...vehicleData, price: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="5000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Car className="w-4 h-4 inline mr-1" />
                      Marca *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.brand}
                      onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Toyota, Chevrolet, Ford..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.model}
                      onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Corolla"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Año *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.year}
                      onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })}
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
                      value={vehicleData.mileage}
                      onChange={(e) => setVehicleData({ ...vehicleData, mileage: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="50000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Estado *
                    </label>
                    <select
                      value={vehicleData.condition}
                      onChange={(e) => setVehicleData({ ...vehicleData, condition: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecciona el estado</option>
                      {CONDITIONS.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transmisión *
                    </label>
                    <select
                      value={vehicleData.transmission}
                      onChange={(e) => setVehicleData({ ...vehicleData, transmission: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecciona</option>
                      {TRANSMISSIONS.map((trans) => (
                        <option key={trans} value={trans}>{trans}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Fuel className="w-4 h-4 inline mr-1" />
                      Tipo de Combustible *
                    </label>
                    <select
                      value={vehicleData.fuel_type}
                      onChange={(e) => setVehicleData({ ...vehicleData, fuel_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="">Selecciona</option>
                      {FUEL_TYPES.map((fuel) => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="w-4 h-4 inline mr-1" />
                      Color *
                    </label>
                    <input
                      type="text"
                      value={vehicleData.color}
                      onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Negro"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Wrench className="w-4 h-4 inline mr-1" />
                      Tamaño del Motor (cc) *
                    </label>
                    <input
                      type="number"
                      value={vehicleData.engine_size}
                      onChange={(e) => setVehicleData({ ...vehicleData, engine_size: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="1800"
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
                  value={vehicleData.description}
                  onChange={(e) => setVehicleData({ ...vehicleData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe tu vehículo, condiciones, extras, historial, etc."
                />
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6 border-t">
                <button
                  onClick={() => router.back()}
                  disabled={saving}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
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