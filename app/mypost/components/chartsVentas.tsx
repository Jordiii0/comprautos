"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
// import { LineChart, Line,... } from 'recharts'; // Usar si tienes datos reales

interface ChartsVentasProps {
  usuarioId?: string;
  empresaId?: string;
  isBusiness: boolean;
}

interface VentaStat {
  month: string;
  revenue: number; // Ingresos
}

export default function ChartsVentas({ usuarioId, empresaId, isBusiness }: ChartsVentasProps) {
  const [data, setData] = useState<VentaStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVentasStats() {
      setLoading(true);
      setError(null);

      // AQUÍ colocar el fetch según tipo de usuario
      // Puedes modificar según tengas ventas reales
      // Ejemplo: filtrar la tabla ventas por empresa_id o usuario_id
      const dummyData: VentaStat[] = [
        { month: 'Ene', revenue: 1500000 },
        { month: 'Feb', revenue: 1800000 },
        { month: 'Mar', revenue: 2200000 },
        { month: 'Abr', revenue: 1900000 },
        { month: 'May', revenue: 2500000 },
        { month: 'Jun', revenue: 3000000 },
      ];
      setData(dummyData);
      setLoading(false);
    }

    if (isBusiness ? empresaId : usuarioId) {
      fetchVentasStats();
    }
  }, [usuarioId, empresaId, isBusiness]);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  // Render error
  if (error) {
    return (
      <div className="h-96 flex items-center justify-center bg-red-50 text-red-600 border rounded">
        <AlertCircle className="w-8 h-8 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  const lastRevenue = data[data.length - 1]?.revenue.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 });

  return (
    <div className="h-96">
      <p className="text-center text-gray-500 mt-4">
        Ingresos del último mes registrado: <b>{lastRevenue}</b>
      </p>
      <div className="mt-2 p-4 bg-purple-50 rounded-lg text-sm">
        [Aquí se renderizaría el gráfico de líneas de ventas usando la variable `data`]
      </div>
    </div>
  );
}
