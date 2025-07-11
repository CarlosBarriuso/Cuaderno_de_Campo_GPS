// types.ts - Tipos para integración meteorológica
export interface WeatherData {
  temperatura: number; // °C
  humedad: number; // %
  precipitacion: number; // mm
  viento: {
    velocidad: number; // km/h
    direccion: number; // grados (0-360)
    rafagas?: number; // km/h
  };
  presion: number; // hPa
  visibilidad?: number; // km
  nubosidad?: number; // %
  punto_rocio?: number; // °C
  indice_uv?: number;
  sensacion_termica?: number; // °C
  
  // Metadatos
  timestamp: Date;
  estacion?: string;
  fuente: 'AEMET' | 'OPENWEATHER' | 'LOCAL';
  coordenadas: {
    lat: number;
    lng: number;
  };
}

export interface WeatherForecast {
  fecha: Date;
  temperatura_maxima: number;
  temperatura_minima: number;
  probabilidad_precipitacion: number; // %
  precipitacion_esperada: number; // mm
  descripcion: string;
  icono: string;
  viento_max: number; // km/h
  humedad_media: number; // %
  
  // Datos específicos por hora (si disponibles)
  datos_horarios?: Array<{
    hora: number; // 0-23
    temperatura: number;
    precipitacion: number;
    viento: number;
    humedad: number;
  }>;
}

export interface AgriculturalAlert {
  id: string;
  tipo: 'helada' | 'granizo' | 'viento_fuerte' | 'lluvia_intensa' | 'sequia' | 'calor_extremo' | 'niebla';
  severidad: 'baja' | 'media' | 'alta' | 'extrema';
  titulo: string;
  descripcion: string;
  
  // Temporal
  inicio: Date;
  fin: Date;
  
  // Geográfico
  area_afectada: {
    centro: { lat: number; lng: number };
    radio: number; // km
    provincias?: string[];
    municipios?: string[];
  };
  
  // Específico agrícola
  cultivos_afectados?: string[];
  actividades_riesgo?: string[];
  recomendaciones: string[];
  
  // Metadatos
  fuente: string;
  confianza: number; // 0-1
  actualizado: Date;
}

export interface WeatherStation {
  indicativo: string;
  nombre: string;
  provincia: string;
  altitud: number;
  coordenadas: {
    latitud: number;
    longitud: number;
  };
  activa: boolean;
  tipo: 'automatica' | 'convencional' | 'maritima';
}

export interface AEMETResponse {
  estado: number;
  datos?: string; // URL a los datos reales
  descripcion: string;
  metadatos?: string;
}

export interface AEMETWeatherData {
  fhora: string; // Fecha y hora
  ta?: number; // Temperatura aire (°C)
  hr?: number; // Humedad relativa (%)
  prec?: number; // Precipitación (mm)
  vv?: number; // Velocidad viento (km/h)
  dv?: number; // Dirección viento (grados)
  pres?: number; // Presión (hPa)
  vis?: number; // Visibilidad (km)
  nub?: number; // Nubosidad (%)
  rocio?: number; // Punto de rocío (°C)
  inso?: number; // Insolación (horas)
}

export interface OpenWeatherData {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
  snow?: {
    '1h'?: number;
    '3h'?: number;
  };
  visibility?: number;
  dt: number;
}

export interface WeatherConfig {
  providers: {
    aemet: {
      enabled: boolean;
      api_key: string;
      endpoints: {
        observacion: string;
        prediccion: string;
        alertas: string;
        estaciones: string;
      };
    };
    openweather: {
      enabled: boolean;
      api_key: string;
      endpoint: string;
    };
  };
  cache_ttl: number; // segundos
  alerts_enabled: boolean;
  default_location: {
    lat: number;
    lng: number;
  };
}

export interface WeatherAlert {
  id: string;
  codigo_fenomeno: string;
  nivel_riesgo: 'amarillo' | 'naranja' | 'rojo';
  ambito_geografico: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  descripcion: string;
  instrucciones?: string;
  
  // Específico agrícola
  relevancia_agricola: boolean;
  cultivos_afectados: string[];
  recomendaciones_agricolas: string[];
}

export interface WeatherError extends Error {
  code: 'API_ERROR' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'STATION_NOT_FOUND' | 'QUOTA_EXCEEDED';
  provider?: string;
  status?: number;
}

export interface GeolocationData {
  lat: number;
  lng: number;
  municipio?: string;
  provincia?: string;
  codigo_postal?: string;
  estacion_cercana?: WeatherStation;
}