import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '@/lib/api';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface SIGPACViewerProps {
  referencia: string;
  height?: string;
  showControls?: boolean;
  className?: string;
  onParcelaLoad?: (data: any) => void;
  onError?: (error: string) => void;
}

export function SIGPACViewer({ 
  referencia, 
  height = '400px', 
  showControls = true,
  className = '',
  onParcelaLoad,
  onError 
}: SIGPACViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [parcelaData, setParcelaData] = useState<any>(null);

  useEffect(() => {
    if (!mapRef.current || !referencia) return;

    initializeMap();
    loadSIGPACData();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [referencia]);

  const initializeMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current!, {
      center: [41.7665, -2.479], // Centro inicial en Soria
      zoom: 15,
      zoomControl: showControls,
    });

    // Capa base de ortofotos SIGPAC
    const sigpacBaseLayer = L.tileLayer.wms('https://www.ign.es/wms-inspire/pnoa-ma', {
      layers: 'OI.OrthoimageCoverage',
      format: 'image/jpeg',
      transparent: false,
      attribution: '© Instituto Geográfico Nacional (IGN) - PNOA',
      maxZoom: 20,
      version: '1.3.0',
    });

    // Capa de parcelas SIGPAC
    const sigpacParcelasLayer = L.tileLayer.wms('https://sigpac.mapa.es/fega/ows', {
      layers: 'Recintos',
      format: 'image/png',
      transparent: true,
      attribution: '© FEGA - SIGPAC',
      opacity: 0.7,
      maxZoom: 20,
      version: '1.1.1',
      styles: '',
    });

    // Capa de límites de municipios
    const municipiosLayer = L.tileLayer.wms('https://www.ign.es/wms-inspire/unidades-administrativas', {
      layers: 'AU.AdministrativeBoundary',
      format: 'image/png',
      transparent: true,
      attribution: '© IGN - Límites Administrativos',
      opacity: 0.5,
      maxZoom: 18,
      version: '1.3.0',
    });

    sigpacBaseLayer.addTo(map);
    sigpacParcelasLayer.addTo(map);

    if (showControls) {
      L.control.layers({
        '🛰️ Ortofotos SIGPAC': sigpacBaseLayer,
        '🗺️ Mapa base': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }),
      }, {
        '🌾 Parcelas SIGPAC': sigpacParcelasLayer,
        '🏘️ Límites municipales': municipiosLayer,
      }).addTo(map);

      L.control.scale({
        metric: true,
        imperial: false,
        position: 'bottomleft',
      }).addTo(map);
    }

    mapInstanceRef.current = map;
  };

  const loadSIGPACData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Cargando datos SIGPAC para referencia:', referencia);

      // Consultar datos de la parcela usando nuestra API
      const response = await api.sigpac.getParcela(referencia);

      if (response.success && response.data) {
        const data = response.data;
        setParcelaData(data);

        console.log('✅ Datos SIGPAC cargados:', data);

        // Centrar mapa en la parcela
        if (data.coordenadas_centroide) {
          const { lat, lng } = data.coordenadas_centroide;
          mapInstanceRef.current?.setView([lat, lng], 18);

          // Añadir marcador de la parcela
          const marker = L.marker([lat, lng], {
            title: `Parcela ${referencia}`,
          });

          marker.bindPopup(`
            <div class="p-3 min-w-72">
              <h3 class="font-bold text-lg mb-2">📍 Parcela SIGPAC</h3>
              <div class="space-y-1 text-sm">
                <p><strong>Referencia:</strong> ${data.referencia.full}</p>
                <p><strong>Ubicación:</strong> ${data.municipio_nombre}, ${data.provincia_nombre}</p>
                <p><strong>Superficie:</strong> ${data.superficie} ha</p>
                <p><strong>Uso:</strong> ${data.uso_sigpac}</p>
                <p><strong>Cultivo:</strong> ${data.cultivo}</p>
                <p><strong>Coordenadas:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                <p class="text-xs text-gray-500 mt-2">Fuente: ${data.fuente} (Confianza: ${Math.round((data.confianza || 0) * 100)}%)</p>
              </div>
            </div>
          `);

          marker.addTo(mapInstanceRef.current!);

          // Dibujar geometría si está disponible
          if (data.geometria && data.geometria.type === 'Polygon') {
            try {
              const coords = data.geometria.coordinates[0];
              const latlngs = coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);

              const polygon = L.polygon(latlngs, {
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.3,
                weight: 2,
                dashArray: '5, 5',
              });

              polygon.bindTooltip(`Parcela ${referencia}<br/>${data.superficie} ha`, {
                permanent: false,
                direction: 'center',
                className: 'sigpac-tooltip',
              });

              polygon.addTo(mapInstanceRef.current!);

              // Ajustar vista a la geometría
              mapInstanceRef.current?.fitBounds(polygon.getBounds(), { padding: [20, 20] });
            } catch (geomError) {
              console.warn('Error dibujando geometría:', geomError);
            }
          }
        }

        onParcelaLoad?.(data);
      } else {
        const errorMsg = 'No se encontraron datos para esta referencia catastral';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `Error cargando datos SIGPAC: ${err.message || err}`;
      console.error('❌ Error SIGPAC:', err);
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Información de la parcela */}
      {parcelaData && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-sm z-10">
          <div className="flex items-center text-sm font-medium text-gray-900 mb-2">
            <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            SIGPAC: {parcelaData.referencia.full}
          </div>
          <div className="text-xs text-gray-600">
            <p>{parcelaData.municipio_nombre}, {parcelaData.provincia_nombre} • {parcelaData.superficie} ha</p>
            <p>{parcelaData.uso_sigpac}</p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando SIGPAC...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-50 rounded-lg flex items-center justify-center z-20">
          <div className="text-center p-4">
            <div className="text-red-600 text-4xl mb-2">⚠️</div>
            <p className="text-red-800 font-medium mb-2">Error cargando SIGPAC</p>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={loadSIGPACData}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg overflow-hidden shadow-lg"
      />

      {/* Información de coordenadas */}
      {parcelaData?.coordenadas_centroide && (
        <div className="absolute bottom-4 right-4 bg-white rounded px-2 py-1 text-xs text-gray-600 shadow z-10">
          📍 {parcelaData.coordenadas_centroide.lat.toFixed(6)}, {parcelaData.coordenadas_centroide.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
}

export default SIGPACViewer;