'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

// Importación dinámica para evitar errores de SSR
const LeafletMap = dynamic(() => import('@/components/maps/LeafletMap'), {
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

export default function MapaPage() {
  const [parcelas, setParcelas] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [viewMode, setViewMode] = useState('parcelas'); // 'parcelas' | 'actividades'
  const [mapCenter, setMapCenter] = useState({ lat: 40.4637, lng: -3.7492 });
  const [mapZoom, setMapZoom] = useState(6);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar parcelas
      const parcelasResponse = await api.parcelas.getAll();
      const parcelasData = parcelasResponse.data || [];
      
      // Generar datos mock para demostración
      const parcelasMock = [
        {
          id: '1',
          nombre: 'Parcela Norte',
          superficie: 15.5,
          cultivo: 'trigo',
          coordenadas: { lat: 40.4168, lng: -3.7038 },
          poligono: [
            { lat: 40.4165, lng: -3.7040 },
            { lat: 40.4170, lng: -3.7040 },
            { lat: 40.4170, lng: -3.7035 },
            { lat: 40.4165, lng: -3.7035 },
          ]
        },
        {
          id: '2',
          nombre: 'Olivar Sur',
          superficie: 8.2,
          cultivo: 'olivo',
          coordenadas: { lat: 40.4140, lng: -3.7050 },
          poligono: [
            { lat: 40.4138, lng: -3.7055 },
            { lat: 40.4142, lng: -3.7055 },
            { lat: 40.4142, lng: -3.7045 },
            { lat: 40.4138, lng: -3.7045 },
          ]
        },
        {
          id: '3',
          nombre: 'Viñedo Este',
          superficie: 12.3,
          cultivo: 'vid',
          coordenadas: { lat: 40.4180, lng: -3.7020 },
          poligono: [
            { lat: 40.4178, lng: -3.7025 },
            { lat: 40.4182, lng: -3.7025 },
            { lat: 40.4182, lng: -3.7015 },
            { lat: 40.4178, lng: -3.7015 },
          ]
        },
        {
          id: '4',
          nombre: 'Huertas Valle',
          superficie: 5.8,
          cultivo: 'tomate',
          coordenadas: { lat: 40.4120, lng: -3.7030 },
        },
        {
          id: '5',
          nombre: 'Campo Girasol',
          superficie: 22.1,
          cultivo: 'girasol',
          coordenadas: { lat: 40.4200, lng: -3.7060 },
        }
      ];
      
      setParcelas(parcelasMock);
      
      // Cargar actividades
      const actividadesResponse = await api.actividades.getAll();
      setActividades(actividadesResponse.data || []);
      
      // Centrar mapa en las parcelas
      if (parcelasMock.length > 0) {
        const avgLat = parcelasMock.reduce((sum, p) => sum + (p.coordenadas?.lat || 0), 0) / parcelasMock.length;
        const avgLng = parcelasMock.reduce((sum, p) => sum + (p.coordenadas?.lng || 0), 0) / parcelasMock.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
        setMapZoom(13);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParcelaClick = (parcela) => {
    setSelectedParcela(parcela.id === selectedParcela ? null : parcela.id);
    if (parcela.coordenadas) {
      setMapCenter(parcela.coordenadas);
      setMapZoom(16);
    }
  };

  const getTotalSuperficie = () => {
    return parcelas.reduce((total, parcela) => total + parcela.superficie, 0);
  };

  const getCultivoStats = () => {
    const stats = {};
    parcelas.forEach(parcela => {
      if (stats[parcela.cultivo]) {
        stats[parcela.cultivo] += parcela.superficie;
      } else {
        stats[parcela.cultivo] = parcela.superficie;
      }
    });
    return Object.entries(stats)
      .map(([cultivo, superficie]) => ({ cultivo, superficie }))
      .sort((a, b) => b.superficie - a.superficie);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mapa de Explotación
          </h1>
          <p className="text-gray-600">
            Visualiza y gestiona tus parcelas agrícolas en el mapa interactivo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Panel lateral */}
          <div className="lg:col-span-1 space-y-6">
            {/* Controles */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Controles</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Vista
                  </label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="parcelas">Parcelas</option>
                    <option value="actividades">Actividades</option>
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    setSelectedParcela(null);
                    setMapCenter({ lat: 40.4637, lng: -3.7492 });
                    setMapZoom(6);
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  🌍 Vista General
                </button>
                
                <button
                  onClick={loadData}
                  className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  🔄 Actualizar Datos
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Parcelas:</span>
                  <span className="font-medium">{parcelas.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Superficie Total:</span>
                  <span className="font-medium">{getTotalSuperficie().toFixed(1)} ha</span>
                </div>
                
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Por Cultivo:</h4>
                  <div className="space-y-2">
                    {getCultivoStats().map(({ cultivo, superficie }) => (
                      <div key={cultivo} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">{cultivo}:</span>
                        <span className="font-medium">{superficie.toFixed(1)} ha</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de parcelas */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Parcelas</h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Cargando...</p>
                  </div>
                ) : parcelas.length > 0 ? (
                  <div className="divide-y">
                    {parcelas.map((parcela) => (
                      <button
                        key={parcela.id}
                        onClick={() => handleParcelaClick(parcela)}
                        className={`w-full p-3 text-left hover:bg-gray-50 ${
                          selectedParcela === parcela.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{parcela.nombre}</div>
                        <div className="text-sm text-gray-500">
                          🌾 {parcela.cultivo} • 📏 {parcela.superficie} ha
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No hay parcelas registradas
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mapa principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Mapa Interactivo
                  </h3>
                  {selectedParcela && (
                    <div className="text-sm text-gray-600">
                      Parcela seleccionada: <span className="font-medium">
                        {parcelas.find(p => p.id === selectedParcela)?.nombre}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="relative">
                <LeafletMap
                  parcelas={parcelas}
                  center={mapCenter}
                  zoom={mapZoom}
                  height="600px"
                  onParcelaClick={handleParcelaClick}
                  selectedParcela={selectedParcela}
                  showControls={true}
                  interactive={true}
                />
              </div>
            </div>

            {/* Información de parcela seleccionada */}
            {selectedParcela && (
              <div className="mt-6 bg-white rounded-lg shadow p-6">
                {(() => {
                  const parcela = parcelas.find(p => p.id === selectedParcela);
                  if (!parcela) return null;
                  
                  return (
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{parcela.nombre}</h3>
                          <p className="text-gray-600">Información detallada de la parcela</p>
                        </div>
                        <button
                          onClick={() => setSelectedParcela(null)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Cultivo</div>
                          <div className="text-lg font-medium text-gray-900 capitalize">{parcela.cultivo}</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Superficie</div>
                          <div className="text-lg font-medium text-gray-900">{parcela.superficie} ha</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Coordenadas</div>
                          <div className="text-sm font-mono text-gray-900">
                            {parcela.coordenadas ? 
                              `${parcela.coordenadas.lat.toFixed(6)}, ${parcela.coordenadas.lng.toFixed(6)}` 
                              : 'No disponibles'
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex space-x-3">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                          📝 Registrar Actividad
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                          ✏️ Editar Parcela
                        </button>
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                          📊 Ver Historial
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}