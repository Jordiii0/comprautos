"use client";

import React, { useState } from 'react';
import { X, Plus, Car, Gauge, Fuel, Calendar, Settings, DollarSign, MapPin, Users } from 'lucide-react';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  engine: string;
  power: string;
  color: string;
  doors: number;
  seats: number;
  seller: string;
  location: string;
  image: string;
}

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2022,
    price: 18500000,
    mileage: 25000,
    fuelType: 'Gasolina',
    transmission: 'Automática',
    engine: '1.8L',
    power: '140 HP',
    color: 'Blanco',
    doors: 4,
    seats: 5,
    seller: 'Concesionaria',
    location: 'Santiago Centro',
    image: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=250&fit=crop'
  },
  {
    id: '2',
    brand: 'Mazda',
    model: 'CX-5',
    year: 2023,
    price: 24900000,
    mileage: 12000,
    fuelType: 'Gasolina',
    transmission: 'Automática',
    engine: '2.5L',
    power: '187 HP',
    color: 'Azul',
    doors: 5,
    seats: 5,
    seller: 'Concesionaria',
    location: 'Las Condes',
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=400&h=250&fit=crop'
  },
  {
    id: '3',
    brand: 'Chevrolet',
    model: 'Tracker',
    year: 2021,
    price: 16500000,
    mileage: 38000,
    fuelType: 'Gasolina',
    transmission: 'Manual',
    engine: '1.2L Turbo',
    power: '130 HP',
    color: 'Negro',
    doors: 5,
    seats: 5,
    seller: 'Particular',
    location: 'Providencia',
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=250&fit=crop'
  },
  {
    id: '4',
    brand: 'Honda',
    model: 'CR-V',
    year: 2023,
    price: 27900000,
    mileage: 8000,
    fuelType: 'Híbrido',
    transmission: 'Automática',
    engine: '2.0L Hybrid',
    power: '204 HP',
    color: 'Gris',
    doors: 5,
    seats: 7,
    seller: 'Concesionaria',
    location: 'Vitacura',
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=250&fit=crop'
  }
];

const VehicleComparison = () => {
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([]);
  const [availableVehicles] = useState<Vehicle[]>(mockVehicles);

  const addVehicle = (vehicle: Vehicle) => {
    if (selectedVehicles.length < 3 && !selectedVehicles.find(v => v.id === vehicle.id)) {
      setSelectedVehicles([...selectedVehicles, vehicle]);
    }
  };

  const removeVehicle = (id: string) => {
    setSelectedVehicles(selectedVehicles.filter(v => v.id !== id));
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('es-CL')}`;
  };

  const formatMileage = (km: number) => {
    return `${km.toLocaleString('es-CL')} km`;
  };

  const ComparisonRow = ({ label, icon: Icon, values }: { label: string; icon: any; values: (string | number)[] }) => (
    <div className="grid grid-cols-4 gap-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-2 font-medium text-gray-700">
        <Icon className="w-5 h-5 text-blue-600" />
        {label}
      </div>
      {values.map((value, idx) => (
        <div key={idx} className="text-center text-gray-900 font-medium">
          {value || '-'}
        </div>
      ))}
    </div>
  );

  const getBestValue = (values: number[], lower = false) => {
    if (values.length === 0) return -1;
    const bestValue = lower ? Math.min(...values) : Math.max(...values);
    return values.indexOf(bestValue);
  };

  const priceValues = selectedVehicles.map(v => v.price);
  const mileageValues = selectedVehicles.map(v => v.mileage);
  const bestPriceIdx = getBestValue(priceValues, true);
  const bestMileageIdx = getBestValue(mileageValues, true);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Comparador de Vehículos</h1>
          <p className="text-gray-600">Compara hasta 3 vehículos y encuentra el ideal para ti</p>
        </div>

        {/* Selector de Vehículos */}
        {selectedVehicles.length < 3 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-blue-600" />
              Selecciona vehículos para comparar ({selectedVehicles.length}/3)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {availableVehicles
                .filter(v => !selectedVehicles.find(sv => sv.id === v.id))
                .map(vehicle => (
                  <div
                    key={vehicle.id}
                    onClick={() => addVehicle(vehicle)}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <img
                      src={vehicle.image}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-bold text-lg">{vehicle.brand} {vehicle.model}</h3>
                    <p className="text-sm text-gray-600">{vehicle.year}</p>
                    <p className="text-blue-600 font-semibold mt-2">{formatPrice(vehicle.price)}</p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Tabla Comparativa */}
        {selectedVehicles.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="text-white font-semibold text-lg">Característica</div>
              {selectedVehicles.map((vehicle, idx) => (
                <div key={vehicle.id} className="text-center relative">
                  <button
                    onClick={() => removeVehicle(vehicle.id)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                  <h3 className="text-white font-bold text-lg">{vehicle.brand}</h3>
                  <p className="text-blue-100">{vehicle.model} {vehicle.year}</p>
                </div>
              ))}
            </div>

            <div className="p-6">
              <ComparisonRow
                label="Precio"
                icon={DollarSign}
                values={selectedVehicles.map((v, idx) => (
                  <span className={bestPriceIdx === idx ? 'text-green-600 font-bold' : ''}>
                    {formatPrice(v.price)}
                    {bestPriceIdx === idx && ' ✓'}
                  </span>
                ))}
              />
              <ComparisonRow
                label="Kilometraje"
                icon={Gauge}
                values={selectedVehicles.map((v, idx) => (
                  <span className={bestMileageIdx === idx ? 'text-green-600 font-bold' : ''}>
                    {formatMileage(v.mileage)}
                    {bestMileageIdx === idx && ' ✓'}
                  </span>
                ))}
              />
              <ComparisonRow
                label="Año"
                icon={Calendar}
                values={selectedVehicles.map(v => v.year)}
              />
              <ComparisonRow
                label="Combustible"
                icon={Fuel}
                values={selectedVehicles.map(v => v.fuelType)}
              />
              <ComparisonRow
                label="Transmisión"
                icon={Settings}
                values={selectedVehicles.map(v => v.transmission)}
              />
              <ComparisonRow
                label="Motor"
                icon={Car}
                values={selectedVehicles.map(v => v.engine)}
              />
              <ComparisonRow
                label="Potencia"
                icon={Gauge}
                values={selectedVehicles.map(v => v.power)}
              />
              <ComparisonRow
                label="Color"
                icon={Car}
                values={selectedVehicles.map(v => v.color)}
              />
              <ComparisonRow
                label="Puertas"
                icon={Car}
                values={selectedVehicles.map(v => v.doors)}
              />
              <ComparisonRow
                label="Asientos"
                icon={Users}
                values={selectedVehicles.map(v => v.seats)}
              />
              <ComparisonRow
                label="Vendedor"
                icon={Users}
                values={selectedVehicles.map(v => v.seller)}
              />
              <ComparisonRow
                label="Ubicación"
                icon={MapPin}
                values={selectedVehicles.map(v => v.location)}
              />
            </div>

            <div className="grid grid-cols-4 gap-4 p-6 bg-gray-50 border-t">
              <div></div>
              {selectedVehicles.map(vehicle => (
                <div key={vehicle.id} className="text-center">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Ver detalles
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedVehicles.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay vehículos seleccionados
            </h3>
            <p className="text-gray-500">
              Selecciona hasta 3 vehículos para comenzar a comparar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleComparison;