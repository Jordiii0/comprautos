import React from 'react';
import { LucideIcon } from 'lucide-react';

// Define la interfaz de props para StatsCard
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon; // <--- Tipo correcto para un componente Icono de Lucide
  color: string; // Para el color de fondo, ej: "bg-purple-500"
}

export default function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  // Nota: Renombramos 'icon' a 'Icon' (capitalizado) para usarlo como componente JSX

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex items-center justify-between transition-shadow duration-300 hover:shadow-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      
      {/* Contenedor del icono */}
      <div className={`p-3 rounded-full ${color} text-white ml-4`}>
        {/* Renderizamos el icono (que es un componente React) */}
        <Icon className="w-6 h-6" /> 
      </div>
    </div>
  );
}