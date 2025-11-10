// business-profile/components/chartsCalificaciones.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'; // Ejemplo de librería de gráfico

interface ChartCalificacionesProps {
  userId: string; // <-- DEBE ACEPTAR EL userId
}

// Interfaz para la estructura de datos que esperas (ejemplo)
interface CalificacionStat {
  name: string; // Ej: '5 Estrellas'
  value: number; // Ej: 85
}

export default function ChartCalificaciones({ userId }: ChartCalificacionesProps) {
  const [data, setData] = useState<CalificacionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCalificacionesStats() {
      setLoading(true);
      // Lógica de Supabase: Filtrar calificaciones donde la empresa_id/usuario_id coincida
      // ...
      
      // Ejemplo con datos dummy
      const dummyData: CalificacionStat[] = [
        { name: '5 Estrellas', value: 85 },
        { name: '4 Estrellas', value: 15 },
        { name: '3 Estrellas', value: 5 },
        { name: '1-2 Estrellas', value: 3 },
      ];
      
      setData(dummyData);
      setLoading(false);
    }

    if (userId) {
      fetchCalificacionesStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // ... Renderizado si hay error

  return (
    <div className="h-64">
      {/* EJEMPLO DE RENDERIZADO DEL GRÁFICO 
      */}
      <p className="text-center text-gray-500 mt-4">
        {data[0].value}% de clientes calificaron con 5 Estrellas.
      </p>
      <div className="mt-2 p-4 bg-purple-50 rounded-lg text-sm">
        [Aquí se renderizaría el gráfico de torta/barra de calificaciones usando la variable `data`]
      </div>
    </div>
  );
}