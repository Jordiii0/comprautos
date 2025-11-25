"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// --- Tipado de Interfaces ---
interface ChartsPublicacionesProps {
    usuarioId?: string;
    empresaId?: string;
    isBusiness: boolean;
}
interface PublicacionStat {
    month: string;
    count: number;
}
interface PublicacionRow {
    created_at: string;
}

// --- Función de Formato (Fuera del Componente) ---
function formatYM(dateString: string) {
    const date = new Date(dateString);
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    // Formato: Mes 'AA (e.g., Ene '25)
    return `${meses[date.getMonth()]} '${date.getFullYear().toString().slice(2)}`;
}

// --- Componente Principal ---
export default function ChartsPublicaciones({ usuarioId, empresaId, isBusiness }: ChartsPublicacionesProps) {
    const [data, setData] = useState<PublicacionStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPublicacionesStats() {
            setLoading(true);
            setError(null);

            const isReady = isBusiness ? empresaId : usuarioId;
            if (!isReady) {
                setLoading(false);
                return;
            }

            // 1. Determinar el filtro de usuario/empresa
            let match = isBusiness && empresaId ? { empresa_id: empresaId } : { usuario_id: usuarioId };
            
            // 2. Consultar Supabase
            const { data: vehiculos, error: dbError } = await supabase
                .from("vehiculo") // Consultamos la tabla de vehículos
                .select("created_at")
                .match(match)
                .order('created_at', { ascending: true }) as { data: PublicacionRow[] | null, error: any | null }; // Tipado forzado para la desestructuración


            if (dbError) {
                setError("Error al cargar datos: " + dbError.message);
                setLoading(false);
                return;
            }

            // 3. Agrupar por mes-año
            const countsMap: { [key: string]: number } = {};
            vehiculos?.forEach(v => {
                const key = formatYM(v.created_at);
                countsMap[key] = (countsMap[key] || 0) + 1;
            });

            // 4. Llenar los 6 últimos meses (incluyendo meses con 0 publicaciones)
            const arr: PublicacionStat[] = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                // Retrocede 'i' meses y establece el día 1
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                
                // Formatea la clave para buscar en countsMap
                const key = formatYM(d.toISOString());
                
                // Agrega al array, usando 0 si el mes no tiene publicaciones
                arr.push({ month: key, count: countsMap[key] || 0 });
            }

            setData(arr);
            setLoading(false);
        }

        if (isBusiness ? empresaId : usuarioId) {
            fetchPublicacionesStats();
        }
    }, [usuarioId, empresaId, isBusiness]);

    // --- Renderizado de Estados ---

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
    if (totalPublicaciones === 0) {
        return (
            <div className="h-64 flex flex-col items-center justify-center p-4 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-semibold">No hay publicaciones registradas en los últimos 6 meses.</p>
                <p className="text-sm mt-1">¡Publica un vehículo para empezar a ver tu historial!</p>
            </div>
        );
    }

    // --- Renderizado del Gráfico ---

    return (
        <div className="h-64 w-full p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Publicaciones por Mes ({totalPublicaciones} total)
            </h3>
            <div className="flex items-center justify-center h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis dataKey="month" stroke="#6b7280" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} stroke="#6b7280" tickLine={false} axisLine={false} />
                        <Tooltip 
                            cursor={{ fill: '#d1d5db', opacity: 0.5 }} 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" name="Publicaciones" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}