// WeatherWidget.tsx - Componente de clima para el dashboard
'use client';

import React, { useEffect, useState } from 'react';
import { useWeather } from '@/hooks/useWeather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Droplets, Wind, Eye, Thermometer, AlertTriangle } from 'lucide-react';

interface WeatherWidgetProps {
  lat?: number;
  lng?: number;
  cropTypes?: string[];
  showAlerts?: boolean;
  showForecast?: boolean;
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  lat = 40.4168, // Madrid por defecto
  lng = -3.7038,
  cropTypes = [],
  showAlerts = true,
  showForecast = true,
  className = ''
}) => {
  const {
    currentWeather,
    forecast,
    alerts,
    loading,
    error,
    getCurrentWeather,
    getForecast,
    getAlerts,
    formatTemperature,
    formatWind,
    getAlertColor,
    getWeatherIcon,
    getActiveAlerts,
    isGoodForFieldWork,
    getIrrigationRecommendation,
    getFrostRisk
  } = useWeather();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Cargar datos meteorológicos
  const loadWeatherData = async () => {
    try {
      await Promise.all([
        getCurrentWeather(lat, lng),
        showForecast && getForecast(lat, lng, 5),
        showAlerts && getAlerts(lat, lng, cropTypes)
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error cargando datos meteorológicos:', error);
    }
  };

  // Cargar datos al montar y cuando cambien las coordenadas
  useEffect(() => {
    loadWeatherData();
  }, [lat, lng]);

  // Auto-refresh cada 30 minutos
  useEffect(() => {
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  if (error) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Error al cargar el clima</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadWeatherData}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeAlerts = getActiveAlerts();
  const fieldWorkStatus = isGoodForFieldWork();
  const irrigationRec = getIrrigationRecommendation();
  const frostRisk = getFrostRisk();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Clima Actual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Clima Actual
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadWeatherData}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {loading && !currentWeather ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Cargando datos meteorológicos...</span>
            </div>
          ) : currentWeather ? (
            <div className="space-y-4">
              {/* Temperatura principal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl">
                    {getWeatherIcon('', currentWeather.fuente)}
                  </span>
                  <div>
                    <div className="text-3xl font-bold">
                      {formatTemperature(currentWeather.temperatura)}
                    </div>
                    {currentWeather.sensacion_termica && (
                      <div className="text-sm text-gray-500">
                        Sensación: {formatTemperature(currentWeather.sensacion_termica)}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={currentWeather.fuente === 'AEMET' ? 'default' : 'secondary'}>
                  {currentWeather.fuente}
                </Badge>
              </div>

              {/* Métricas adicionales */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span>Humedad: {currentWeather.humedad}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Wind className="h-4 w-4 text-gray-500" />
                  <span>{formatWind(currentWeather.viento.velocidad, currentWeather.viento.direccion)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  <span>Presión: {currentWeather.presion} hPa</span>
                </div>
                {currentWeather.visibilidad && (
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span>Visibilidad: {currentWeather.visibilidad} km</span>
                  </div>
                )}
              </div>

              {/* Precipitación */}
              {currentWeather.precipitacion > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Droplets className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-800">
                      Precipitación: {currentWeather.precipitacion} mm/h
                    </span>
                  </div>
                </div>
              )}

              {/* Recomendaciones agrícolas */}
              <div className="space-y-2 pt-2 border-t">
                <h4 className="font-medium text-gray-700">Condiciones para el Campo</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={fieldWorkStatus ? 'default' : 'destructive'}>
                    Trabajo campo: {fieldWorkStatus ? 'Favorable' : 'No recomendado'}
                  </Badge>
                  <Badge 
                    variant={
                      irrigationRec === 'necesario' ? 'destructive' : 
                      irrigationRec === 'opcional' ? 'secondary' : 'default'
                    }
                  >
                    Riego: {
                      irrigationRec === 'necesario' ? 'Necesario' :
                      irrigationRec === 'opcional' ? 'Opcional' : 'No necesario'
                    }
                  </Badge>
                  <Badge 
                    variant={
                      frostRisk === 'alto' ? 'destructive' :
                      frostRisk === 'medio' ? 'secondary' : 'default'
                    }
                  >
                    Riesgo helada: {frostRisk}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No hay datos meteorológicos disponibles
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predicción */}
      {showForecast && forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Predicción 5 Días</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-center">
              {forecast.slice(0, 5).map((day, index) => {
                const date = new Date(day.fecha);
                const dayName = index === 0 ? 'Hoy' : 
                               index === 1 ? 'Mañana' : 
                               date.toLocaleDateString('es-ES', { weekday: 'short' });
                
                return (
                  <div key={day.fecha} className="space-y-1">
                    <div className="font-medium text-sm">{dayName}</div>
                    <div className="text-2xl">
                      {getWeatherIcon(day.icono, 'FORECAST')}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{Math.round(day.temperatura_maxima)}°</div>
                      <div className="text-gray-500">{Math.round(day.temperatura_minima)}°</div>
                    </div>
                    {day.probabilidad_precipitacion > 20 && (
                      <div className="text-xs text-blue-600">
                        {day.probabilidad_precipitacion}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Agrícolas */}
      {showAlerts && activeAlerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Alertas Agrícolas ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeAlerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  className="border-l-4 pl-3 py-2"
                  style={{ borderLeftColor: getAlertColor(alert.severidad) }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.titulo}</h4>
                    <Badge 
                      style={{ 
                        backgroundColor: getAlertColor(alert.severidad),
                        color: 'white'
                      }}
                    >
                      {alert.severidad}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.descripcion}</p>
                  {alert.recomendaciones.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700">Recomendaciones:</p>
                      <ul className="text-xs text-gray-600 mt-1 list-disc list-inside">
                        {alert.recomendaciones.slice(0, 2).map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
              
              {activeAlerts.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Ver todas las alertas ({activeAlerts.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información de actualización */}
      {lastUpdate && (
        <div className="text-xs text-gray-500 text-center">
          Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
        </div>
      )}
    </div>
  );
};

export default WeatherWidget;