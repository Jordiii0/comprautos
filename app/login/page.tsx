"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Lock, Mail, AlertCircle, UserPlus, User, Building2, Briefcase } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/profile');
      }
    };
    checkUser();
  }, [router]);

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        // Redirigir según el tipo de cuenta
        const accountType = data.user.user_metadata?.account_type;
        if (accountType === 'business') {
          router.push('/business-profile');
        } else {
          router.push('/profile');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError('');
    setSuccessMessage('');
    setLoading(true);

    // Validaciones comunes
    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    // Validaciones específicas para cuenta empresa
    if (accountType === 'business' && (!fullName || !position)) {
      setError('Por favor completa todos los campos de la empresa');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            account_type: accountType,
            full_name: accountType === 'business' ? fullName : undefined,
            position: accountType === 'business' ? position : undefined,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo...');
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit();
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPosition('');
    setAccountType('personal');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            {isLogin ? (
              <Lock className="w-8 h-8 text-indigo-600" />
            ) : (
              <UserPlus className="w-8 h-8 text-indigo-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Accede a tu cuenta' : 'Regístrate para comenzar'}
          </p>
        </div>

        {/* Account Type Selection - Solo para registro */}
        {!isLogin && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Cuenta
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountType === 'personal'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <User className={`w-6 h-6 ${accountType === 'personal' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${accountType === 'personal' ? 'text-indigo-600' : 'text-gray-700'}`}>
                  Personal
                </span>
              </button>

              <button
                type="button"
                onClick={() => setAccountType('business')}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  accountType === 'business'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <Building2 className={`w-6 h-6 ${accountType === 'business' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-semibold ${accountType === 'business' ? 'text-indigo-600' : 'text-gray-700'}`}>
                  Empresa
                </span>
              </button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Campos específicos para cuenta empresa */}
          {!isLogin && accountType === 'business' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Juan Pérez"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cargo en la Empresa
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Gerente de Ventas"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {/* Correo electrónico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="tu@email.com"
                disabled={loading}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Confirmar contraseña - Solo para registro */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>✓ {successMessage}</span>
            </div>
          )}

          {/* Botón principal */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          {/* Switch entre login y registro */}
          <button
            onClick={switchMode}
            disabled={loading}
            className="w-full text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-50"
          >
            {isLogin ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}