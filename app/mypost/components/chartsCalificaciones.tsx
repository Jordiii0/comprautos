"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from 'lucide-react';

interface ChartsCalificacionesProps {
  usuarioId?: string;
  empresaId?: string;
  isBusiness: boolean;
}

type CalificacionStat = {
  name: string;
  value: number;
};

export default function ChartsCalificaciones({ usuarioId, empresaId, isBusiness }: ChartsCalificacionesProps) {
  const [data, setData] = useState<CalificacionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchCalificacionesStats() {
      setLoading(true);
      setError(null);

      try {
        // 1. Conseguir TODOS los vehículos publicados por este usuario/empresa
        const match = isBusiness && empresaId
          ? { empresa_id: empresaId }
          : { usuario_id: usuarioId };
        const { data: vehiculos, error: vError } = await supabase
          .from("vehiculo")
          .select("id")
          .match(match);

        if (vError) throw vError;
        const vehiculoIds = vehiculos?.map(v => v.id) || [];
        if (vehiculoIds.length === 0) {
          setData([
            { name: "5 Estrellas", value: 0 },
            { name: "4 Estrellas", value: 0 },
            { name: "3 Estrellas", value: 0 },
            { name: "2 Estrellas", value: 0 },
            { name: "1 Estrella", value: 0 }
          ]);
          setTotal(0);
          setLoading(false);
          return;
        }

        // 2. Conseguir TODAS las calificaciones de esos vehículos
        const { data: calificaciones, error: cError } = await supabase
          .from("calificacion")
          .select("estrellas")
          .in("vehiculo_id", vehiculoIds);

        if (cError) throw cError;

        // 3. Agrupar por estrellas
        const starCounts = [0,0,0,0,0]; // índice 0 para 1 estrella, ..., 4 para 5 estrellas
        (calificaciones || []).forEach(c => {
          if (c.estrellas >= 1 && c.estrellas <= 5) starCounts[c.estrellas-1]++;
        });
        const totalVotes = starCounts.reduce((a, b) => a + b, 0);
        setTotal(totalVotes);

        const statData: CalificacionStat[] = [
          { name: "5 Estrellas", value: starCounts[4] },
          { name: "4 Estrellas", value: starCounts[3] },
          { name: "3 Estrellas", value: starCounts[2] },
          { name: "2 Estrellas", value: starCounts[1] },
          { name: "1 Estrella", value: starCounts[0] }
        ];

        setData(statData);
      } catch (e: any) {
        setError(e.message || "Error de conexión o RLS.");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    if (isBusiness ? empresaId : usuarioId) {
      fetchCalificacionesStats();
    }
  }, [usuarioId, empresaId, isBusiness]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="h-64 flex items-center justify-center bg-red-50 text-red-600 border rounded">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
        <p className="font-semibold mb-2">Aún no hay calificaciones para tus publicaciones.</p>
        <p className="text-sm">Sigue publicando para recibir feedback de tus clientes.</p>
      </div>
    );
  }

  // --- Render gráfico tipo barras (simple, sin librería externa) ---
  return (
    <div className="h-64 flex flex-col justify-between bg-white rounded-lg p-4 shadow">
      <h4 className="font-semibold text-gray-800 mb-2">
        Distribución de Calificaciones ({total} votos)
      </h4>
      <div className="flex flex-col gap-2 mt-2">
        {data.map((item, idx) => {
          const pct = total ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={item.name}>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-24">{item.name}</span>
                <div className="flex-1 bg-gray-200 rounded h-3 overflow-hidden">
                  <div
                    className={
                      "h-3 rounded"
                      + (idx === 0
                        ? " bg-amber-500"
                        : idx === 1
                        ? " bg-yellow-400"
                        : idx === 2
                        ? " bg-blue-400"
                        : idx === 3
                        ? " bg-purple-400"
                        : " bg-gray-400")
                    }
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="ml-2 text-gray-700 font-semibold w-8">{item.value}</span>
                <span className="ml-1 text-gray-500 text-xs">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
