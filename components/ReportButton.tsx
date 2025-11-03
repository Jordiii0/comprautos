"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Flag, X } from "lucide-react";

interface ReportButtonProps {
  vehiculoId: number;
  vehiculoInfo: string; // Ej: "Toyota Corolla 2020"
}

export default function ReportButton({ vehiculoId, vehiculoInfo }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const motivos = [
    { value: "fraude", label: "Posible fraude" },
    { value: "duplicado", label: "Publicación duplicada" },
    { value: "precio_erroneo", label: "Precio erróneo o sospechoso" },
    { value: "info_falsa", label: "Información falsa" },
    { value: "spam", label: "Spam" },
    { value: "otro", label: "Otro" },
  ];

  const handleReport = async () => {
    if (!motivo) {
      alert("Por favor selecciona un motivo");
      return;
    }

    setLoading(true);

    try {
      // Verificar sesión
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("Debes iniciar sesión para reportar");
        return;
      }

      // Crear reporte
      const { error } = await supabase.from("reporte_vehiculo").insert({
        vehiculo_id: vehiculoId,
        usuario_reporta: session.user.email,
        motivo: motivo,
        descripcion: descripcion.trim() || null,
      });

      if (error) throw error;

      alert("Reporte enviado exitosamente. Será revisado por un administrador.");
      setShowModal(false);
      setMotivo("");
      setDescripcion("");
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al enviar el reporte: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón redondeado para coincidir con los otros */}
      <button
        onClick={() => setShowModal(true)}
        className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-red-100 hover:text-red-600 transition-colors"
        title="Reportar publicación"
      >
        <Flag className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                Reportar Publicación
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Vehículo: <span className="font-semibold">{vehiculoInfo}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo del reporte *
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Selecciona un motivo</option>
                  {motivos.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción adicional (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Proporciona más detalles sobre el reporte..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleReport}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
