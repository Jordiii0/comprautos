"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

// Props: solo los esperados
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon; // Componente de icono, NO string
  color: string;    // Clase Tailwind para color de fondo círculo del icono
}
export default function StatsCard({
  title,
  value,
  icon: Icon,
  color,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-5 flex items-center justify-between transition-shadow duration-300 hover:shadow-xl">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>

      <div className={`p-3 rounded-full ${color} text-white ml-4`}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>
    </div>
  );
}
