import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';

// Importación dinámica para evitar errores de SSR
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Cargando mapa...</p>
      </div>
    </div>
  )
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapSelectorProps {
  onLocationSelect: (coordinates: Coordinates) => void;
  initialCoordinates?: Coordinates;
  height?: string;
  title?: string;
  description?: string;
}

export function MapSelector({
  onLocationSelect,
  initialCoordinates,
  height = '400px',
  title = 'Seleccionar Ubicación',
  description = 'Haz clic en el mapa para seleccionar las coordenadas'
}: MapSelectorProps) {
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(
    initialCoordinates || null
  );
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const handleMapClick = useCallback((coordinates: Coordinates) => {
    setSelectedCoordinates(coordinates);
    onLocationSelect(coordinates);
  }, [onLocationSelect]);

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocalización no soportada por el navegador');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedCoordinates(coordinates);
        onLocationSelect(coordinates);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error obteniendo ubicación:', error);
        alert('No se pudo obtener la ubicación actual');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onLocationSelect]);

  const clearSelection = useCallback(() => {
    setSelectedCoordinates(null);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
          >
            {isGettingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Obteniendo...
              </>
            ) : (
              <>📍 Mi Ubicación</>
            )}
          </Button>
          {selectedCoordinates && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearSelection}
            >
              🗑️ Limpiar
            </Button>
          )}
        </div>
      </div>

      {/* Información de coordenadas seleccionadas */}
      {selectedCoordinates && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Coordenadas Seleccionadas
              </h4>
              <p className="text-sm text-green-700 font-mono">
                Lat: {selectedCoordinates.lat.toFixed(6)}, 
                Lng: {selectedCoordinates.lng.toFixed(6)}
              </p>
            </div>
            <div className="text-green-600">
              ✓
            </div>
          </div>
        </div>
      )}

      {/* Mapa */}
      <LeafletMap
        center={selectedCoordinates || { lat: 40.4637, lng: -3.7492 }}
        zoom={selectedCoordinates ? 15 : 6}
        height={height}
        onMapClick={handleMapClick}
        parcelas={selectedCoordinates ? [{
          id: 'selected',
          nombre: 'Ubicación Seleccionada',
          superficie: 0,
          cultivo: 'seleccionado',
          coordenadas: selectedCoordinates,
          color: '#EF4444'
        }] : []}
      />

      {/* Instrucciones */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>💡 <strong>Instrucciones:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Haz clic en cualquier punto del mapa para seleccionar coordenadas</li>
          <li>Usa "Mi Ubicación" para obtener tu posición actual</li>
          <li>Puedes hacer zoom y navegar por el mapa libremente</li>
          <li>Las coordenadas se actualizarán automáticamente</li>
        </ul>
      </div>
    </div>
  );
}

export default MapSelector;