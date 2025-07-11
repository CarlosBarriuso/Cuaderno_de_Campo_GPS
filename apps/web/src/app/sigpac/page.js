'use client';

import { useState, useEffect } from 'react';
import { SIGPACSearchForm } from '../../components/sigpac/SIGPACSearchForm';
import { useSIGPAC } from '../../hooks/useSIGPAC';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export default function SIGPACPage() {
  const { getProvincias, checkHealth, loading } = useSIGPAC();
  const [provincias, setProvincias] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [showProvincias, setShowProvincias] = useState(false);

  useEffect(() => {
    // Cargar estado de salud del servicio
    loadHealthStatus();
  }, []);

  const loadHealthStatus = async () => {
    try {
      const health = await checkHealth();
      setHealthStatus(health);
    } catch (error) {
      console.error('Error cargando health status:', error);
    }
  };

  const loadProvincias = async () => {
    if (provincias.length === 0) {
      try {
        const data = await getProvincias();
        setProvincias(data);
      } catch (error) {
        console.error('Error cargando provincias:', error);
      }
    }
    setShowProvincias(!showProvincias);
  };

  const handleParcelaFound = (parcela) => {
    setSelectedParcela(parcela);
  };

  const getHealthStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'degraded': return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateParcela = () => {
    if (selectedParcela) {
      // Navegar al formulario de creación de parcela con datos pre-rellenados
      const params = new URLSearchParams({
        referencia_sigpac: selectedParcela.referencia.full,
        superficie: selectedParcela.superficie,
        lat: selectedParcela.coordenadas_centroide.lat,
        lng: selectedParcela.coordenadas_centroide.lng,
        cultivo: selectedParcela.cultivo || '',
        geometria: JSON.stringify(selectedParcela.geometria)
      });
      
      window.location.href = `/parcelas/crear?${params.toString()}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Integración SIGPAC
              </h1>
              <p className="mt-2 text-gray-600">
                Consulta parcelas del Sistema de Información Geográfica de Parcelas Agrícolas
              </p>
            </div>
            
            {/* Estado del servicio */}
            {healthStatus && (
              <div className="text-right">
                <Badge 
                  className={getHealthStatusColor(healthStatus.status)}
                >
                  Servicio {healthStatus.status}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  Última verificación: {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Formulario de búsqueda */}
        <div className="mb-8">
          <SIGPACSearchForm 
            onParcelaFound={handleParcelaFound}
            onError={(error) => console.error('Error SIGPAC:', error)}
          />
        </div>

        {/* Acciones con parcela seleccionada */}
        {selectedParcela && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  ¿Qué quieres hacer con esta parcela?
                </h3>
                <p className="text-gray-600">
                  Puedes crear una nueva parcela en tu sistema con los datos de SIGPAC
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleCreateParcela}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Crear Parcela
                </Button>
                <Button
                  onClick={() => {
                    const coords = selectedParcela.coordenadas_centroide;
                    window.location.href = `/mapa?lat=${coords.lat}&lng=${coords.lng}&zoom=17`;
                  }}
                  variant="outline"
                >
                  Ver en Mapa
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Información adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de provincias */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Provincias Españolas
              </h3>
              <Button
                onClick={loadProvincias}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                {showProvincias ? 'Ocultar' : 'Mostrar'} ({provincias.length || 52})
              </Button>
            </div>

            {showProvincias && (
              <div className="max-h-60 overflow-y-auto">
                {provincias.length > 0 ? (
                  <div className="space-y-2">
                    {provincias.map((provincia) => (
                      <div 
                        key={provincia.codigo}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                      >
                        <div>
                          <span className="font-medium">{provincia.nombre}</span>
                          <span className="text-gray-500 text-sm ml-2">
                            ({provincia.codigo})
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {provincia.comunidad_autonoma}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    {loading ? 'Cargando provincias...' : 'No hay datos disponibles'}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Información sobre SIGPAC */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Sobre SIGPAC
            </h3>
            <div className="space-y-4 text-sm text-gray-600">
              <p>
                El Sistema de Información Geográfica de Parcelas Agrícolas (SIGPAC) 
                es la base de datos oficial de parcelas agrícolas en España.
              </p>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Funcionalidades:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• Consulta de geometrías oficiales</li>
                  <li>• Validación de referencias catastrales</li>
                  <li>• Información de cultivos y usos</li>
                  <li>• Superficies certificadas</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2">Fuentes de datos:</h4>
                <ul className="space-y-1 ml-4">
                  <li>• <Badge className="bg-green-100 text-green-800 text-xs mr-2">WMS</Badge>Servicios oficiales</li>
                  <li>• <Badge className="bg-blue-100 text-blue-800 text-xs mr-2">LOCAL</Badge>Base de datos local</li>
                  <li>• <Badge className="bg-yellow-100 text-yellow-800 text-xs mr-2">MANUAL</Badge>Entrada manual</li>
                </ul>
              </div>

              {/* Estado detallado del servicio */}
              {healthStatus?.details && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Estado del servicio:</h4>
                  <div className="space-y-1">
                    {Object.entries(healthStatus.details).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <span className="capitalize">{service}:</span>
                        <Badge 
                          className={`text-xs ${status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                        >
                          {status ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Footer con enlaces útiles */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Datos oficiales del Ministerio de Agricultura, Pesca y Alimentación |{' '}
            <a 
              href="https://www.mapa.gob.es/es/agricultura/temas/sistema-de-informacion-geografica-de-parcelas-agricolas-sigpac-/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700"
            >
              Más información sobre SIGPAC
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}