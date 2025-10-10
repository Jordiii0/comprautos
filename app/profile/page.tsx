"use client";

import React, { useState, useEffect } from 'react';

// Simulación de Supabase para el artifact
const mockSupabase = {
  auth: {
    getUser: async () => ({ data: { user: { id: '123', email: 'demo@example.com' } } }),
    signOut: async () => {}
  },
  from: (table: string) => ({
    select: (cols: string) => ({
      eq: (field: string, val: any) => ({
        single: async () => ({ 
          data: {
            full_name: 'Juan Pérez',
            username: 'juanperez',
            bio: 'Desarrollador apasionado',
            phone: '+56 9 1234 5678',
            website: 'https://ejemplo.com',
            avatar_url: '',
            account_type: 'personal',
            company_name: '',
            company_rut: '',
            company_address: '',
            company_region: '',
            company_city: ''
          }
        })
      })
    }),
    upsert: async (data: any) => ({ error: null })
  })
};

interface UserProfile {
  fullName: string;
  username: string;
  bio: string;
  phone: string;
  website: string;
  avatarUrl: string;
  accountType: 'personal' | 'business';
  companyName: string;
  companyRut: string;
  companyAddress: string;
  companyRegion: string;
  companyCity: string;
  companyPhone: string;
}

const REGIONES_CHILE = [
  'Región de Arica y Parinacota',
  'Región de Tarapacá',
  'Región de Antofagasta',
  'Región de Atacama',
  'Región de Coquimbo',
  'Región de Valparaíso',
  'Región Metropolitana',
  'Región de O\'Higgins',
  'Región del Maule',
  'Región de Ñuble',
  'Región del Biobío',
  'Región de La Araucanía',
  'Región de Los Ríos',
  'Región de Los Lagos',
  'Región de Aysén',
  'Región de Magallanes'
];

const UserProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userEmail, setUserEmail] = useState('demo@example.com');
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: 'Juan Pérez',
    username: 'juanperez',
    bio: 'Desarrollador apasionado',
    phone: '+56 9 1234 5678',
    website: 'https://ejemplo.com',
    avatarUrl: '',
    accountType: 'personal',
    companyName: '',
    companyRut: '',
    companyAddress: '',
    companyRegion: '',
    companyCity: '',
    companyPhone: ''
  });
  const [businessForm, setBusinessForm] = useState({
    companyRut: '',
    companyName: '',
    companyAddress: '',
    companyRegion: '',
    companyCity: '',
    companyPhone: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBusinessForm({ ...businessForm, [e.target.name]: e.target.value });
  };

  const handleAccountTypeToggle = () => {
    if (profile.accountType === 'personal') {
      setBusinessForm({
        companyRut: profile.companyRut || '',
        companyName: profile.companyName || '',
        companyAddress: profile.companyAddress || '',
        companyRegion: profile.companyRegion || '',
        companyCity: profile.companyCity || '',
        companyPhone: profile.companyPhone || ''
      });
      setShowBusinessModal(true);
    } else {
      setProfile({ ...profile, accountType: 'personal' });
      setMessage({ type: 'success', text: 'Cambiado a cuenta personal' });
    }
  };

  const validateBusinessForm = () => {
    if (!businessForm.companyRut.trim()) return 'El RUT de la empresa es obligatorio';
    if (!businessForm.companyName.trim()) return 'El nombre de la empresa es obligatorio';
    if (!businessForm.companyPhone.trim()) return 'El teléfono de la empresa es obligatorio';
    if (!businessForm.companyAddress.trim()) return 'La dirección es obligatoria';
    if (!businessForm.companyRegion) return 'Debes seleccionar una región';
    if (!businessForm.companyCity.trim()) return 'La ciudad es obligatoria';
    return null;
  };

  const handleBusinessSubmit = async () => {
    const error = validateBusinessForm();
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }

    setLoading(true);
    try {
      // Aquí iría la llamada real a Supabase
      setProfile({
        ...profile,
        accountType: 'business',
        companyRut: businessForm.companyRut,
        companyName: businessForm.companyName,
        companyAddress: businessForm.companyAddress,
        companyRegion: businessForm.companyRegion,
        companyCity: businessForm.companyCity,
        companyPhone: businessForm.companyPhone
      });
      
      setMessage({ type: 'success', text: '¡Cuenta empresarial activada exitosamente!' });
      setShowBusinessModal(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor selecciona una imagen válida' });
      return;
    }

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar 5MB' });
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // En producción, aquí subirías a Supabase Storage:
    /*
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile({ ...profile, avatarUrl: data.publicUrl });
      setMessage({ type: 'success', text: 'Foto actualizada' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
    */
  };

  const removeAvatar = () => {
    setAvatarPreview(null);
    setProfile({ ...profile, avatarUrl: '' });
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      // Aquí iría la llamada real a Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: '¡Perfil actualizado exitosamente!' });
      setIsEditing(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-40 relative">
            <div className="absolute -bottom-16 left-8 group">
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden relative">
                {avatarPreview || profile.avatarUrl ? (
                  <img 
                    src={avatarPreview || profile.avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{profile.fullName ? profile.fullName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}</span>
                )}
                
                {/* Overlay para cambiar foto */}
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center">
                    <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-white">Cambiar</span>
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
              </div>
              
              {/* Botón para remover foto */}
              {(avatarPreview || profile.avatarUrl) && (
                <button
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition shadow-lg"
                  title="Eliminar foto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="pt-20 px-8 pb-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-1">
                  {profile.accountType === 'business' && profile.companyName 
                    ? profile.companyName 
                    : profile.fullName || 'Usuario'}
                </h1>
                {profile.accountType === 'business' && profile.companyName && profile.fullName && (
                  <p className="text-gray-600 text-sm mb-1">{profile.fullName}</p>
                )}
                <p className="text-gray-500">@{profile.username || 'username'}</p>
                <p className="text-sm text-gray-600 mt-1">{userEmail}</p>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                  profile.accountType === 'business' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {profile.accountType === 'business' ? '🏢 Cuenta Empresa' : '👤 Cuenta Personal'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAccountTypeToggle}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition text-sm"
                >
                  {profile.accountType === 'personal' ? '🏢 Empresa' : '👤 Personal'}
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </button>
              </div>
            </div>

            {profile.accountType === 'business' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-800 mb-2">Información Empresarial</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-semibold">RUT:</span> {profile.companyRut}</div>
                  <div><span className="font-semibold">Teléfono:</span> {profile.companyPhone}</div>
                  <div><span className="font-semibold">Dirección:</span> {profile.companyAddress}</div>
                  <div><span className="font-semibold">Región:</span> {profile.companyRegion}</div>
                  <div><span className="font-semibold">Ciudad:</span> {profile.companyCity}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="Juan Pérez"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-lg">
                    {profile.fullName || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="juanperez"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-lg">
                    {profile.username || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="+56 9 1234 5678"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-lg">
                    {profile.phone || 'No especificado'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sitio Web
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={profile.website}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    placeholder="https://ejemplo.com"
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-lg">
                    {profile.website ? (
                      <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                        {profile.website}
                      </a>
                    ) : (
                      'No especificado'
                    )}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Biografía
                </label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                    placeholder="Cuéntanos algo sobre ti..."
                  />
                ) : (
                  <p className="text-gray-800 bg-gray-50 px-4 py-3 rounded-lg min-h-[100px]">
                    {profile.bio || 'No hay biografía disponible'}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal de Cuenta Empresarial */}
        {showBusinessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">🏢 Activar Cuenta Empresarial</h2>
                <p className="text-blue-100">Completa los datos de tu empresa para continuar</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    RUT Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyRut"
                    value={businessForm.companyRut}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="12.345.678-9"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={businessForm.companyName}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Mi Empresa SpA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={businessForm.companyPhone}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="+56 2 2345 6789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="companyAddress"
                    value={businessForm.companyAddress}
                    onChange={handleBusinessChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Av. Principal 123, Oficina 45"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Región <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="companyRegion"
                      value={businessForm.companyRegion}
                      onChange={handleBusinessChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Selecciona región</option>
                      {REGIONES_CHILE.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ciudad <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="companyCity"
                      value={businessForm.companyCity}
                      onChange={handleBusinessChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Santiago"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios para activar una cuenta empresarial.
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 p-6 flex justify-end gap-3 bg-gray-50">
                <button
                  onClick={() => setShowBusinessModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleBusinessSubmit}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Activando...' : 'Activar Cuenta Empresa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;