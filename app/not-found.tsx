"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, ArrowLeft, Search, Car, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <h1 className="text-[150px] sm:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 leading-none animate-pulse">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <AlertTriangle className="w-20 h-20 sm:w-32 sm:h-32 text-yellow-500 animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/20">
          <div className="mb-6">
            <Car className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-wiggle" />
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              ¡Oops! Página no encontrada
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Parece que tomaste un desvío equivocado.
            </p>
            <p className="text-gray-500">
              La página que buscas no existe o ha sido movida.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold hover:scale-105 shadow-md"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver Atrás
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold hover:scale-105"
            >
              <Home className="w-5 h-5" />
              Ir al Inicio
            </button>

            <button
              onClick={() => router.push('/shop')}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-xl transition-all font-semibold hover:scale-105"
            >
              <Search className="w-5 h-5" />
              Ver Tienda
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 font-semibold">
              ¿Qué puedes hacer?
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-left">
              <div className="bg-indigo-50 rounded-xl p-4 hover:bg-indigo-100 transition-colors">
                <h3 className="font-semibold text-indigo-900 mb-1 text-sm">
                  🏠 Página Principal
                </h3>
                <p className="text-xs text-indigo-700">
                  Vuelve al inicio para explorar
                </p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 hover:bg-purple-100 transition-colors">
                <h3 className="font-semibold text-purple-900 mb-1 text-sm">
                  🚗 Ver Vehículos
                </h3>
                <p className="text-xs text-purple-700">
                  Explora nuestro catálogo
                </p>
              </div>
              <div className="bg-pink-50 rounded-xl p-4 hover:bg-pink-100 transition-colors">
                <h3 className="font-semibold text-pink-900 mb-1 text-sm">
                  👤 Mi Perfil
                </h3>
                <p className="text-xs text-pink-700">
                  Accede a tu cuenta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fun fact */}
        <div className="mt-8 text-sm text-gray-500 italic">
          <p>💡 Dato curioso: El error 404 se originó en el CERN en 1992</p>
        </div>
      </div>

      {/* Floating elements decoration */}
      <div className="fixed top-20 left-10 w-20 h-20 bg-indigo-200 rounded-full blur-3xl opacity-50 animate-float"></div>
      <div className="fixed bottom-20 right-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50 animate-float-delayed"></div>
      <div className="fixed top-40 right-20 w-16 h-16 bg-pink-200 rounded-full blur-3xl opacity-50 animate-float"></div>

      <style jsx>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-wiggle {
          animation: wiggle 1s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}