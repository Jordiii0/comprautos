// business-profile/components/chartsPublicaciones.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from 'lucide-react';
// 👈 IMPORTAMOS LOS COMPONENTES DE RECHARTS
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';

interface ChartPublicacionesProps {
  userId: string;
}

interface PublicacionStat {
  month: string;
  count: number;
}

// Interfaz que refleja la columna 'created_at' de la tabla 'usuario_vehiculo'
interface PublicacionRow {
    created_at: string;
}

export default function ChartPublicaciones({ userId }: ChartPublicacionesProps) {
  const [data, setData] = useState<PublicacionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPublicacionesStats() {
      setLoading(true);
      setError(null);

      try {
        // Consultamos la tabla de RELACIÓN 'usuario_vehiculo'
        const { data: rawData, error: dbError } = await supabase
          .from('usuario_vehiculo') // <-- Tabla de relación
          .select('created_at')    
          .eq('usuario_id', userId) 
          .order('created_at', { ascending: true }); 

        if (dbError) {
          console.error("Error de Supabase (DBError):", dbError);
          throw new Error(dbError.message || "Error de Supabase. Revisa RLS en 'usuario_vehiculo'.");
        }

        // 1. Lógica de Agrupación (Mismo código)
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); 
        sixMonthsAgo.setDate(1); 

        const monthlyCounts: { [key: string]: number } = {};
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(sixMonthsAgo);
            date.setMonth(sixMonthsAgo.getMonth() + i);
            const monthKey = monthNames[date.getMonth()];
            const yearKey = date.getFullYear().toString().substring(2);
            monthlyCounts[`${monthKey} '${yearKey}`] = 0;
        }

        const rawDates: string[] = (rawData as PublicacionRow[])
          .map(row => row.created_at) 
          .filter((date): date is string => !!date);

        rawDates.forEach(dateStr => {
            const date = new Date(dateStr);
            if (date >= sixMonthsAgo) {
                const monthKey = monthNames[date.getMonth()];
                const yearKey = date.getFullYear().toString().substring(2);
                const key = `${monthKey} '${yearKey}`;
                
                if (monthlyCounts.hasOwnProperty(key)) {
                    monthlyCounts[key]++;
                }
            }
        });

        const processedData: PublicacionStat[] = Object.keys(monthlyCounts).map(key => ({
            month: key,
            count: monthlyCounts[key],
        }));
        
        setData(processedData);

      } catch (e: any) {
        console.error("🚨 Error al cargar estadísticas de publicaciones:", e.message || e);
        setError(`Error: ${e.message || "Revisa la política RLS en 'usuario_vehiculo'."}`);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchPublicacionesStats();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="ml-3 text-gray-500">Cargando historial de publicaciones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex flex-col items-center justify-center p-4 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-8 h-8 mb-2" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }
  
  const totalPublicaciones = data.reduce((sum, item) => sum + item.count, 0);

  // Si no hay datos, mostramos un mensaje
  if (totalPublicaciones === 0) {
      return (
          <div className="h-64 flex flex-col items-center justify-center p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
              <p className="font-semibold">No hay publicaciones registradas en los últimos 6 meses.</p>
              <p className="text-sm mt-1">¡Publica un vehículo para empezar a ver tu historial!</p>
          </div>
      );
  }

  // 📈 Renderizado del Gráfico
  return (
    <div className="h-64 w-full p-4 bg-white rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Publicaciones por Mes ({totalPublicaciones} total)</h3>
        
        {/* ResponsiveContainer asegura que el gráfico ocupe el espacio disponible */}
        <ResponsiveContainer width="100%" height="80%">
            <BarChart
                data={data}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis 
                    dataKey="month" 
                    stroke="#555" 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    fontSize={10}
                />
                <YAxis 
                    allowDecimals={false}
                    stroke="#555" 
                    tickLine={false} 
                    axisLine={false}
                    fontSize={10}
                />
                <Tooltip 
                    cursor={{ fill: '#d8c2ff', opacity: 0.5 }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#333' }}
                />
                <Bar 
                    dataKey="count" 
                    fill="#8b5cf6" // Color morado/púrpura
                    name="Publicaciones"
                    radius={[4, 4, 0, 0]} // Bordes redondeados
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
}