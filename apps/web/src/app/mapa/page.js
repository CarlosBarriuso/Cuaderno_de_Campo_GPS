'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { useAuthenticatedApi } from '@/hooks/useAuthenticatedApi';
import { useAuth } from '@clerk/nextjs';

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

// Visor SIGPAC oficial para parcelas con referencia catastral
const SIGPACViewer = dynamic(
  () => import('@/components/sigpac/SIGPACViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando visor SIGPAC oficial...</p>
        </div>
      </div>
    )
  }
);

export default function MapaPage() {
  const { isAuthReady, refreshAuth } = useAuthenticatedApi();
  const { getToken } = useAuth();
  const [parcelas, setParcelas] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [viewMode, setViewMode] = useState('cultivo'); // 'cultivo' | 'actividad'
  const [mapCenter, setMapCenter] = useState({ lat: 40.4637, lng: -3.7492 });
  const [mapZoom, setMapZoom] = useState(6);
  const [filtros, setFiltros] = useState({
    cultivos: [],
    tipos_actividad: [],
    fecha_desde: '',
    fecha_hasta: '',
    solo_con_actividad: false
  });

  useEffect(() => {
    if (isAuthReady) {
      loadData();
    }
  }, [filtros, isAuthReady]);

  // Check URL params for selected parcela
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const parcelaId = urlParams.get('parcela');
    if (parcelaId) {
      // Find and select the parcela
      const parcela = parcelas.find(p => p.id === parcelaId);
      if (parcela) {
        setSelectedParcela(parcela);
        // Focus map on the selected parcela
        const coords = parcela.centroide || parcela.coordenadas;
        if (coords) {
          setMapCenter({ lat: coords.lat, lng: coords.lng });
          setMapZoom(15);
        }
      }
    }
  }, [parcelas]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Refresh auth token before making request
      await refreshAuth();
      
      console.log('🗺️ Loading map data with filters:', filtros);
      console.log('🔍 API object:', api);
      console.log('🔍 API parcelas object:', api.parcelas);
      console.log('🔍 getMapData function:', typeof api.parcelas.getMapData);
      
      // Get current auth token from Clerk
      const token = await getToken();
      
      // Cargar datos enriquecidos del mapa usando la configuración de la API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/parcelas/map-data`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      
      console.log('🗺️ Map data received:', responseData);
      
      // El backend devuelve data como array de parcelas directamente
      setParcelas(responseData.data || []);
      setEstadisticas(responseData.statistics || {});
      
      // Centrar mapa en las parcelas reales
      const parcelas = responseData.data || [];
      if (parcelas && parcelas.length > 0) {
        centerMapOnParcelas(parcelas);
        console.log(`✅ Loaded ${parcelas.length} parcelas for map`);
      } else {
        console.log('ℹ️ No hay parcelas que coincidan con los filtros aplicados');
      }
      
    } catch (error) {
      console.error('❌ Error loading map data:', error);
      // Solo log del error, no cargar datos mock
      setParcelas([]);
      setEstadisticas({});
    } finally {
      setLoading(false);
    }
  };

  // Función para centrar el mapa en las parcelas reales
  const centerMapOnParcelas = (parcelas) => {
    if (parcelas.length === 0) return;
    
    // Usar centroide si está disponible, sino coordenadas
    const validParcelas = parcelas.filter(p => p.centroide || p.coordenadas);
    
    if (validParcelas.length > 0) {
      const avgLat = validParcelas.reduce((sum, p) => {
        const coords = p.centroide || p.coordenadas;
        return sum + (coords?.lat || 0);
      }, 0) / validParcelas.length;
      
      const avgLng = validParcelas.reduce((sum, p) => {
        const coords = p.centroide || p.coordenadas;
        return sum + (coords?.lng || 0);
      }, 0) / validParcelas.length;
      
      setMapCenter({ lat: avgLat, lng: avgLng });
      setMapZoom(13);
    }
  };

  const handleParcelaClick = (parcela) => {
    setSelectedParcela(parcela.id === selectedParcela ? null : parcela.id);
    const coords = parcela.centroide || parcela.coordenadas;
    if (coords) {
      setMapCenter(coords);
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
                    Colorear por
                  </label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="cultivo">Tipo de Cultivo</option>
                    <option value="actividad">Última Actividad</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Cultivo
                  </label>
                  <select
                    multiple
                    value={filtros.cultivos}
                    onChange={(e) => setFiltros({...filtros, cultivos: Array.from(e.target.selectedOptions, option => option.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    size="3"
                  >
                    <option value="CEREAL_SECANO">Cereal Secano</option>
                    <option value="OLIVAR">Olivar</option>
                    <option value="VINEDO">Viñedo</option>
                    <option value="FRUTAL">Frutal</option>
                    <option value="HORTALIZA_AIRE_LIBRE">Hortaliza</option>
                    <option value="BARBECHO">Barbecho</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por Actividad
                  </label>
                  <select
                    multiple
                    value={filtros.tipos_actividad}
                    onChange={(e) => setFiltros({...filtros, tipos_actividad: Array.from(e.target.selectedOptions, option => option.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    size="3"
                  >
                    <option value="SIEMBRA">Siembra</option>
                    <option value="FERTILIZACION">Fertilización</option>
                    <option value="TRATAMIENTO">Tratamiento</option>
                    <option value="COSECHA">Cosecha</option>
                    <option value="RIEGO">Riego</option>
                    <option value="PODA">Poda</option>
                  </select>
                </div>
                
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filtros.solo_con_actividad}
                      onChange={(e) => setFiltros({...filtros, solo_con_actividad: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Solo con actividad</span>
                  </label>
                </div>
                
                <button
                  onClick={() => {
                    setFiltros({
                      cultivos: [],
                      tipos_actividad: [],
                      fecha_desde: '',
                      fecha_hasta: '',
                      solo_con_actividad: false
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  🗑️ Limpiar Filtros
                </button>
                
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
                  onClick={() => {
                    console.log('🔄 Manual refresh requested');
                    loadData();
                  }}
                  className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={!isAuthReady}
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
                  <span className="font-medium">{estadisticas.total_parcelas || parcelas.length}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Superficie Total:</span>
                  <span className="font-medium">{estadisticas.total_superficie || getTotalSuperficie().toFixed(1)} ha</span>
                </div>
                
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Por Cultivo:</h4>
                  <div className="space-y-2">
                    {estadisticas.por_cultivo ? Object.entries(estadisticas.por_cultivo).map(([cultivo, data]) => (
                      <div key={cultivo} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">{cultivo.toLowerCase().replace('_', ' ')}:</span>
                        <span className="font-medium">{data.superficie.toFixed(1)} ha</span>
                      </div>
                    )) : getCultivoStats().map(({ cultivo, superficie }) => (
                      <div key={cultivo} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 capitalize">{cultivo}:</span>
                        <span className="font-medium">{superficie.toFixed(1)} ha</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {estadisticas.por_ultima_actividad && Object.keys(estadisticas.por_ultima_actividad).length > 0 && (
                  <div className="pt-3 border-t">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Por Última Actividad:</h4>
                    <div className="space-y-2">
                      {Object.entries(estadisticas.por_ultima_actividad).map(([actividad, count]) => (
                        <div key={actividad} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 capitalize">{actividad.toLowerCase().replace('_', ' ')}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {parcelas.length === 0 && !loading ? (
                  <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                        🗺️
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No hay parcelas para mostrar
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {filtros.cultivos.length > 0 || filtros.tipos_actividad.length > 0 || filtros.solo_con_actividad ?
                          'Prueba a ajustar los filtros para encontrar parcelas.' :
                          'Crea tu primera parcela para visualizarla en el mapa.'
                        }
                      </p>
                      <button
                        onClick={() => window.location.href = '/parcelas'}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        📝 Crear Parcela
                      </button>
                    </div>
                  </div>
                ) : (
                  (() => {
                    // Verificar si la parcela seleccionada tiene referencias SIGPAC
                    const parcela = parcelas.find(p => p.id === selectedParcela);
                    const tieneSIGPAC = parcela && (parcela.referencia_sigpac || parcela.referencias_catastrales);
                    
                    if (selectedParcela && tieneSIGPAC) {
                      // Mostrar visor SIGPAC oficial para parcelas con referencia catastral
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                            <div>
                              <h3 className="font-medium text-blue-900">🗺️ Visor SIGPAC Oficial</h3>
                              <p className="text-sm text-blue-700">
                                Mostrando la parcela "{parcela.nombre}" con datos oficiales de SIGPAC
                              </p>
                            </div>
                            <button
                              onClick={() => setSelectedParcela(null)}
                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              Ver Todas
                            </button>
                          </div>
                          <SIGPACViewer
                            referencia={parcela.referencia_sigpac || parcela.referencias_catastrales}
                            height="600px"
                            showControls={true}
                          />
                        </div>
                      );
                    } else {
                      // Mapa general con todas las parcelas usando Leaflet
                      return (
                        <LeafletMap
                          parcelas={parcelas}
                          center={mapCenter}
                          zoom={mapZoom}
                          height="600px"
                          onParcelaClick={handleParcelaClick}
                          selectedParcela={selectedParcela}
                          showControls={true}
                          interactive={true}
                          viewMode={viewMode}
                        />
                      );
                    }
                  })()
                )}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Cultivo</div>
                          <div className="text-lg font-medium text-gray-900 capitalize">
                            {parcela.tipo_cultivo ? parcela.tipo_cultivo.toLowerCase().replace('_', ' ') : parcela.cultivo}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Superficie</div>
                          <div className="text-lg font-medium text-gray-900">{parcela.superficie} ha</div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Estado</div>
                          <div className="text-lg font-medium text-gray-900">
                            {parcela.activa ? '✅ Activa' : '❌ Inactiva'}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-600">Coordenadas</div>
                          <div className="text-sm font-mono text-gray-900">
                            {parcela.centroide ? 
                              `${parcela.centroide.lat.toFixed(6)}, ${parcela.centroide.lng.toFixed(6)}` 
                              : parcela.coordenadas ? 
                                `${parcela.coordenadas.lat.toFixed(6)}, ${parcela.coordenadas.lng.toFixed(6)}` 
                                : 'No disponibles'
                            }
                          </div>
                        </div>
                      </div>
                      
                      {/* Información de última actividad */}
                      {parcela.ultima_actividad && (
                        <div className="mt-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-3">Última Actividad</h4>
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-sm text-gray-600">Tipo</div>
                                <div className="text-lg font-medium text-gray-900 capitalize">
                                  {parcela.ultima_actividad.tipo.toLowerCase().replace('_', ' ')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Fecha</div>
                                <div className="text-lg font-medium text-gray-900">
                                  {parcela.ultima_actividad.fecha ? 
                                    new Date(parcela.ultima_actividad.fecha).toLocaleDateString('es-ES') 
                                    : 'No disponible'
                                  }
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-600">Hace</div>
                                <div className="text-lg font-medium text-gray-900">
                                  {parcela.ultima_actividad.dias_desde !== null ? 
                                    `${parcela.ultima_actividad.dias_desde} días` 
                                    : 'No disponible'
                                  }
                                </div>
                              </div>
                            </div>
                            {parcela.ultima_actividad.nombre && (
                              <div className="mt-2">
                                <div className="text-sm text-gray-600">Descripción</div>
                                <div className="text-gray-900">{parcela.ultima_actividad.nombre}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
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