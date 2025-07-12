// useWeather.ts - Hook React para APIs meteorológicas
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

// Tipos basados en la API
interface WeatherData {
  temperatura: number;
  humedad: number;
  precipitacion: number;
  viento: {
    velocidad: number;
    direccion: number;
    rafagas?: number;
  };
  presion: number;
  visibilidad?: number;
  nubosidad?: number;
  punto_rocio?: number;
  indice_uv?: number;
  sensacion_termica?: number;
  timestamp: string;
  estacion?: string;
  fuente: 'AEMET' | 'OPENWEATHER' | 'LOCAL';
  coordenadas: {
    lat: number;
    lng: number;
  };
}

interface WeatherForecast {
  fecha: string;
  temperatura_maxima: number;
  temperatura_minima: number;
  probabilidad_precipitacion: number;
  precipitacion_esperada: number;
  descripcion: string;
  icono: string;
  viento_max: number;
  humedad_media: number;
  datos_horarios?: Array<{
    hora: number;
    temperatura: number;
    precipitacion: number;
    viento: number;
    humedad: number;
  }>;
}

interface AgriculturalAlert {
  id: string;
  tipo: 'helada' | 'granizo' | 'viento_fuerte' | 'lluvia_intensa' | 'sequia' | 'calor_extremo' | 'niebla';
  severidad: 'baja' | 'media' | 'alta' | 'extrema';
  titulo: string;
  descripcion: string;
  inicio: string;
  fin: string;
  area_afectada: {
    centro: { lat: number; lng: number };
    radio: number;
    provincias?: string[];
    municipios?: string[];
  };
  cultivos_afectados?: string[];
  actividades_riesgo?: string[];
  recomendaciones: string[];
  fuente: string;
  confianza: number;
  actualizado: string;
}

interface CompleteWeatherInfo {
  current: WeatherData | null;
  forecast: WeatherForecast[];
  alerts: AgriculturalAlert[];
  alertsSeverity: 'baja' | 'media' | 'alta' | 'extrema';
}

interface WeatherProvider {
  name: string;
  description: string;
  country: string;
  official: boolean;
  enabled: boolean;
  priority: number;
}

interface WeatherHookState {
  currentWeather: WeatherData | null;
  forecast: WeatherForecast[];
  alerts: AgriculturalAlert[];
  providers: WeatherProvider[];
  loading: boolean;
  error: string | null;
}

interface UseWeatherReturn extends WeatherHookState {
  // Métodos principales
  getCurrentWeather: (lat: number, lng: number) => Promise<WeatherData | null>;
  getForecast: (lat: number, lng: number, days?: number) => Promise<WeatherForecast[]>;
  getAlerts: (lat: number, lng: number, crops?: string[], radius?: number) => Promise<AgriculturalAlert[]>;
  getCompleteInfo: (lat: number, lng: number, crops?: string[]) => Promise<CompleteWeatherInfo>;
  
  // Métodos auxiliares
  getProviders: () => Promise<WeatherProvider[]>;
  clearCache: () => Promise<void>;
  healthCheck: () => Promise<boolean>;
  
  // Utilidades
  formatTemperature: (temp: number) => string;
  formatWind: (speed: number, direction: number) => string;
  getAlertColor: (severity: AgriculturalAlert['severidad']) => string;
  getWeatherIcon: (description: string, fuente: string) => string;
  
  // Filtros y búsquedas
  filterAlertsBySeverity: (severity: AgriculturalAlert['severidad']) => AgriculturalAlert[];
  filterAlertsByType: (type: AgriculturalAlert['tipo']) => AgriculturalAlert[];
  getActiveAlerts: () => AgriculturalAlert[];
  
  // Predicciones específicas
  getTodayForecast: () => WeatherForecast | null;
  getTomorrowForecast: () => WeatherForecast | null;
  getWeekForecast: () => WeatherForecast[];
  
  // Análisis agrícola
  isGoodForFieldWork: (currentWeather?: WeatherData) => boolean;
  getIrrigationRecommendation: (forecast?: WeatherForecast[]) => 'necesario' | 'opcional' | 'no_necesario';
  getFrostRisk: (forecast?: WeatherForecast[]) => 'alto' | 'medio' | 'bajo';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export const useWeather = (): UseWeatherReturn => {
  const { getToken } = useAuth();
  
  const [state, setState] = useState<WeatherHookState>({
    currentWeather: null,
    forecast: [],
    alerts: [],
    providers: [],
    loading: false,
    error: null,
  });

  // Helper para hacer requests autenticados
  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    
    const response = await fetch(`${API_BASE}/weather${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [getToken]);

  // Métodos principales
  const getCurrentWeather = useCallback(async (lat: number, lng: number): Promise<WeatherData | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await makeRequest(`/current?lat=${lat}&lng=${lng}`);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          currentWeather: response.data,
          loading: false 
        }));
        return response.data;
      }
      
      throw new Error(response.error || 'Error desconocido');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener datos meteorológicos';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return null;
    }
  }, [makeRequest]);

  const getForecast = useCallback(async (lat: number, lng: number, days: number = 7): Promise<WeatherForecast[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await makeRequest(`/forecast?lat=${lat}&lng=${lng}&days=${days}`);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          forecast: response.data,
          loading: false 
        }));
        return response.data;
      }
      
      throw new Error(response.error || 'Error desconocido');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener predicción';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return [];
    }
  }, [makeRequest]);

  const getAlerts = useCallback(async (
    lat: number, 
    lng: number, 
    crops?: string[], 
    radius?: number
  ): Promise<AgriculturalAlert[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let url = `/alerts?lat=${lat}&lng=${lng}`;
      if (crops && crops.length > 0) {
        url += `&crops=${crops.join(',')}`;
      }
      if (radius) {
        url += `&radius=${radius}`;
      }
      
      const response = await makeRequest(url);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          alerts: response.data,
          loading: false 
        }));
        return response.data;
      }
      
      throw new Error(response.error || 'Error desconocido');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener alertas';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      return [];
    }
  }, [makeRequest]);

  const getCompleteInfo = useCallback(async (
    lat: number, 
    lng: number, 
    crops?: string[]
  ): Promise<CompleteWeatherInfo> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let url = `/complete?lat=${lat}&lng=${lng}`;
      if (crops && crops.length > 0) {
        url += `&crops=${crops.join(',')}`;
      }
      
      const response = await makeRequest(url);
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          currentWeather: response.data.current,
          forecast: response.data.forecast,
          alerts: response.data.alerts,
          loading: false 
        }));
        return response.data;
      }
      
      throw new Error(response.error || 'Error desconocido');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener información completa';
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: errorMessage 
      }));
      throw error;
    }
  }, [makeRequest]);

  // Métodos auxiliares
  const getProviders = useCallback(async (): Promise<WeatherProvider[]> => {
    try {
      const response = await makeRequest('/providers');
      
      if (response.success) {
        setState(prev => ({ ...prev, providers: response.data }));
        return response.data;
      }
      
      throw new Error(response.error || 'Error desconocido');
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      return [];
    }
  }, [makeRequest]);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      const response = await makeRequest('/cache/clear', { method: 'POST' });
      
      if (!response.success) {
        throw new Error(response.error || 'Error al limpiar cache');
      }
    } catch (error) {
      console.error('Error al limpiar cache:', error);
      throw error;
    }
  }, [makeRequest]);

  const healthCheck = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/weather/health`);
      const data = await response.json();
      return data.success && data.data.status === 'healthy';
    } catch (error) {
      console.error('Error en health check:', error);
      return false;
    }
  }, []);

  // Utilidades de formateo
  const formatTemperature = useCallback((temp: number): string => {
    return `${Math.round(temp)}°C`;
  }, []);

  const formatWind = useCallback((speed: number, direction: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const dirIndex = Math.round(direction / 45) % 8;
    return `${Math.round(speed)} km/h ${directions[dirIndex]}`;
  }, []);

  const getAlertColor = useCallback((severity: AgriculturalAlert['severidad']): string => {
    const colors = {
      'baja': '#10b981',     // green-500
      'media': '#f59e0b',    // amber-500
      'alta': '#f97316',     // orange-500
      'extrema': '#ef4444'   // red-500
    };
    return colors[severity];
  }, []);

  const getWeatherIcon = useCallback((description: string, fuente: string): string => {
    const iconMap: { [key: string]: string } = {
      // OpenWeather icons
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };

    // Si es un icono de OpenWeather, usarlo directamente
    if (iconMap[description]) {
      return iconMap[description];
    }

    // Para AEMET, mapear por palabras clave
    const desc = description.toLowerCase();
    if (desc.includes('despejado') || desc.includes('sol')) return '☀️';
    if (desc.includes('nube')) return '☁️';
    if (desc.includes('lluvia')) return '🌧️';
    if (desc.includes('tormenta')) return '⛈️';
    if (desc.includes('nieve')) return '❄️';
    if (desc.includes('niebla')) return '🌫️';
    if (desc.includes('viento')) return '💨';
    
    return '🌤️'; // Por defecto
  }, []);

  // Filtros
  const filterAlertsBySeverity = useCallback((severity: AgriculturalAlert['severidad']): AgriculturalAlert[] => {
    return state.alerts.filter(alert => alert.severidad === severity);
  }, [state.alerts]);

  const filterAlertsByType = useCallback((type: AgriculturalAlert['tipo']): AgriculturalAlert[] => {
    return state.alerts.filter(alert => alert.tipo === type);
  }, [state.alerts]);

  const getActiveAlerts = useCallback((): AgriculturalAlert[] => {
    const now = new Date();
    return state.alerts.filter(alert => {
      const inicio = new Date(alert.inicio);
      const fin = new Date(alert.fin);
      return now >= inicio && now <= fin;
    });
  }, [state.alerts]);

  // Predicciones específicas
  const getTodayForecast = useCallback((): WeatherForecast | null => {
    const today = new Date().toISOString().split('T')[0];
    return state.forecast.find(day => day.fecha.startsWith(today)) || null;
  }, [state.forecast]);

  const getTomorrowForecast = useCallback((): WeatherForecast | null => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return state.forecast.find(day => day.fecha.startsWith(tomorrowStr)) || null;
  }, [state.forecast]);

  const getWeekForecast = useCallback((): WeatherForecast[] => {
    return state.forecast.slice(0, 7);
  }, [state.forecast]);

  // Análisis agrícola
  const isGoodForFieldWork = useCallback((currentWeather?: WeatherData): boolean => {
    const weather = currentWeather || state.currentWeather;
    if (!weather) return false;

    // Condiciones favorables para trabajo de campo
    return (
      weather.precipitacion < 1 &&           // Poca lluvia
      weather.viento.velocidad < 30 &&       // Viento moderado
      weather.temperatura > 5 &&             // Temperatura mínima
      weather.temperatura < 35               // Temperatura máxima
    );
  }, [state.currentWeather]);

  const getIrrigationRecommendation = useCallback((forecast?: WeatherForecast[]): 'necesario' | 'opcional' | 'no_necesario' => {
    const forecastData = forecast || state.forecast.slice(0, 3); // Próximos 3 días
    
    const totalRain = forecastData.reduce((sum, day) => sum + day.precipitacion_esperada, 0);
    const highTempDays = forecastData.filter(day => day.temperatura_maxima > 30).length;
    
    if (totalRain > 15) return 'no_necesario';      // Lluvia suficiente
    if (totalRain < 5 && highTempDays >= 2) return 'necesario';  // Seco y calor
    return 'opcional';                               // Condiciones intermedias
  }, [state.forecast]);

  const getFrostRisk = useCallback((forecast?: WeatherForecast[]): 'alto' | 'medio' | 'bajo' => {
    const forecastData = forecast || state.forecast.slice(0, 3); // Próximos 3 días
    
    const frostDays = forecastData.filter(day => day.temperatura_minima <= 2).length;
    const severeFrostDays = forecastData.filter(day => day.temperatura_minima <= -2).length;
    
    if (severeFrostDays > 0) return 'alto';
    if (frostDays >= 2) return 'medio';
    if (frostDays === 1) return 'medio';
    return 'bajo';
  }, [state.forecast]);

  // Cargar proveedores al montar el hook
  useEffect(() => {
    getProviders();
  }, [getProviders]);

  return {
    // Estado
    ...state,
    
    // Métodos principales
    getCurrentWeather,
    getForecast,
    getAlerts,
    getCompleteInfo,
    
    // Métodos auxiliares
    getProviders,
    clearCache,
    healthCheck,
    
    // Utilidades
    formatTemperature,
    formatWind,
    getAlertColor,
    getWeatherIcon,
    
    // Filtros y búsquedas
    filterAlertsBySeverity,
    filterAlertsByType,
    getActiveAlerts,
    
    // Predicciones específicas
    getTodayForecast,
    getTomorrowForecast,
    getWeekForecast,
    
    // Análisis agrícola
    isGoodForFieldWork,
    getIrrigationRecommendation,
    getFrostRisk,
  };
};