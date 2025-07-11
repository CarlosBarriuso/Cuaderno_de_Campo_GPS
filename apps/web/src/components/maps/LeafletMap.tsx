import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface Parcela {
  id: string;
  nombre: string;
  superficie: number;
  cultivo: string;
  coordenadas?: Coordinates;
  poligono?: Coordinates[];
  color?: string;
}

interface MapProps {
  parcelas?: Parcela[];
  center?: Coordinates;
  zoom?: number;
  height?: string;
  onMapClick?: (coordinates: Coordinates) => void;
  onParcelaClick?: (parcela: Parcela) => void;
  selectedParcela?: string;
  showControls?: boolean;
  interactive?: boolean;
}

export function LeafletMap({
  parcelas = [],
  center = { lat: 40.4637, lng: -3.7492 }, // Madrid por defecto
  zoom = 10,
  height = '400px',
  onMapClick,
  onParcelaClick,
  selectedParcela,
  showControls = true,
  interactive = true,
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{ [key: string]: L.Layer }>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Colores para diferentes tipos de cultivo
  const getCultivoColor = (cultivo: string): string => {
    const colores: { [key: string]: string } = {
      'trigo': '#F59E0B',
      'cebada': '#EAB308',
      'avena': '#FCD34D',
      'maiz': '#FBBF24',
      'olivo': '#10B981',
      'vid': '#8B5CF6',
      'almendro': '#F3E8FF',
      'naranjo': '#FB923C',
      'tomate': '#EF4444',
      'pimiento': '#DC2626',
      'lechuga': '#22C55E',
      'patata': '#A3A3A3',
      'girasol': '#FACC15',
      'soja': '#4ADE80',
      'default': '#6B7280',
    };
    return colores[cultivo.toLowerCase()] || colores.default;
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: showControls,
      scrollWheelZoom: interactive,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive,
    });

    // Añadir capas base
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
      }
    );

    osmLayer.addTo(map);

    // Control de capas
    if (showControls) {
      L.control.layers({
        'Mapa': osmLayer,
        'Satélite': satelliteLayer,
      }).addTo(map);

      // Control de escala
      L.control.scale({
        metric: true,
        imperial: false,
        position: 'bottomleft',
      }).addTo(map);
    }

    // Evento de click en mapa
    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    mapInstanceRef.current = map;
    setIsLoaded(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizar parcelas en el mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const map = mapInstanceRef.current;

    // Limpiar capas anteriores
    Object.values(layersRef.current).forEach(layer => {
      map.removeLayer(layer);
    });
    layersRef.current = {};

    if (parcelas.length === 0) return;

    const bounds = L.latLngBounds([]);
    let hasValidCoordinates = false;

    parcelas.forEach(parcela => {
      const color = parcela.color || getCultivoColor(parcela.cultivo);
      const isSelected = selectedParcela === parcela.id;

      // Si tiene polígono definido
      if (parcela.poligono && parcela.poligono.length > 0) {
        const latlngs = parcela.poligono.map(coord => [coord.lat, coord.lng] as [number, number]);
        
        const polygon = L.polygon(latlngs, {
          color: isSelected ? '#1F2937' : color,
          fillColor: color,
          fillOpacity: isSelected ? 0.8 : 0.5,
          weight: isSelected ? 3 : 2,
        });

        // Popup con información
        polygon.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg mb-1">${parcela.nombre}</h3>
            <p class="text-sm text-gray-600 mb-1">🌾 ${parcela.cultivo}</p>
            <p class="text-sm text-gray-600">📏 ${parcela.superficie} ha</p>
          </div>
        `);

        // Evento click
        if (onParcelaClick) {
          polygon.on('click', () => onParcelaClick(parcela));
        }

        polygon.addTo(map);
        layersRef.current[parcela.id] = polygon;

        // Añadir al bounds
        latlngs.forEach(latlng => bounds.extend(latlng));
        hasValidCoordinates = true;

      } 
      // Si solo tiene coordenadas centrales
      else if (parcela.coordenadas) {
        const marker = L.marker([parcela.coordenadas.lat, parcela.coordenadas.lng]);

        // Popup con información
        marker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg mb-1">${parcela.nombre}</h3>
            <p class="text-sm text-gray-600 mb-1">🌾 ${parcela.cultivo}</p>
            <p class="text-sm text-gray-600">📏 ${parcela.superficie} ha</p>
            <p class="text-xs text-gray-500 mt-2">
              📍 ${parcela.coordenadas.lat.toFixed(6)}, ${parcela.coordenadas.lng.toFixed(6)}
            </p>
          </div>
        `);

        // Evento click
        if (onParcelaClick) {
          marker.on('click', () => onParcelaClick(parcela));
        }

        marker.addTo(map);
        layersRef.current[parcela.id] = marker;

        // Añadir al bounds
        bounds.extend([parcela.coordenadas.lat, parcela.coordenadas.lng]);
        hasValidCoordinates = true;
      }
    });

    // Ajustar vista a las parcelas
    if (hasValidCoordinates && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [parcelas, selectedParcela, isLoaded]);

  // Actualizar centro del mapa
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    mapInstanceRef.current.setView([center.lat, center.lng], zoom);
  }, [center.lat, center.lng, zoom, isLoaded]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
        style={{ minHeight: '300px' }}
      />
      
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}

      {/* Leyenda de cultivos */}
      {parcelas.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 max-w-xs">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Cultivos</h4>
          <div className="space-y-1">
            {Array.from(new Set(parcelas.map(p => p.cultivo))).map(cultivo => (
              <div key={cultivo} className="flex items-center text-xs">
                <div 
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: getCultivoColor(cultivo) }}
                />
                <span className="text-gray-700 capitalize">{cultivo}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información de coordenadas en hover */}
      <div className="absolute bottom-4 left-4 bg-white rounded px-2 py-1 text-xs text-gray-600 shadow">
        {center.lat.toFixed(6)}, {center.lng.toFixed(6)}
      </div>
    </div>
  );
}

export default LeafletMap;