// aemetProvider.ts - Proveedor para AEMET (Agencia Estatal de Meteorología)
import fetch from 'node-fetch';
import { 
  WeatherData, 
  WeatherForecast, 
  WeatherStation, 
  AEMETResponse, 
  AEMETWeatherData,
  WeatherAlert,
  WeatherError 
} from './types';

export class AEMETProvider {
  private readonly API_BASE = 'https://opendata.aemet.es/opendata/api';
  private readonly API_KEY: string;
  private logger: any;
  private stationsCache: Map<string, WeatherStation> = new Map();
  private lastStationsUpdate: Date | null = null;

  constructor(apiKey: string, logger: any) {
    this.API_KEY = apiKey;
    this.logger = logger;
  }

  /**
   * Obtiene datos meteorológicos actuales por coordenadas
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      // Encontrar estación más cercana
      const station = await this.findNearestStation(lat, lng);
      if (!station) {
        this.logger.warn('No se encontró estación cercana', { lat, lng });
        return null;
      }

      // Obtener datos de observación
      const weatherData = await this.getStationObservation(station.indicativo);
      if (!weatherData) {
        return null;
      }

      return this.transformAEMETData(weatherData, station, lat, lng);

    } catch (error) {
      this.logger.error('Error obteniendo datos AEMET:', error);
      throw this.createWeatherError('API_ERROR', error.message, 'AEMET');
    }
  }

  /**
   * Obtiene predicción meteorológica por municipio
   */
  async getForecast(lat: number, lng: number, days: number = 7): Promise<WeatherForecast[]> {
    try {
      // Obtener código de municipio por coordenadas
      const municipioId = await this.getMunicipioIdByCoordinates(lat, lng);
      if (!municipioId) {
        throw new Error('No se pudo determinar el municipio');
      }

      // Obtener predicción
      const forecastData = await this.getMunicipioForecast(municipioId);
      return this.transformForecastData(forecastData, days);

    } catch (error) {
      this.logger.error('Error obteniendo predicción AEMET:', error);
      throw this.createWeatherError('API_ERROR', error.message, 'AEMET');
    }
  }

  /**
   * Obtiene alertas meteorológicas
   */
  async getWeatherAlerts(lat?: number, lng?: number): Promise<WeatherAlert[]> {
    try {
      const response = await this.makeAEMETRequest('/avisos_cap/ultimoelaborado');
      
      if (!response.datos) {
        return [];
      }

      const alertsData = await this.fetchDataFromUrl(response.datos);
      return this.transformAlertsData(alertsData, lat, lng);

    } catch (error) {
      this.logger.error('Error obteniendo alertas AEMET:', error);
      return []; // No fallar si no hay alertas
    }
  }

  /**
   * Encuentra la estación meteorológica más cercana
   */
  private async findNearestStation(lat: number, lng: number): Promise<WeatherStation | null> {
    // Actualizar cache de estaciones si es necesario
    await this.updateStationsCache();

    let nearestStation: WeatherStation | null = null;
    let minDistance = Infinity;

    for (const station of this.stationsCache.values()) {
      if (!station.activa) continue;

      const distance = this.calculateDistance(
        lat, lng,
        station.coordenadas.latitud,
        station.coordenadas.longitud
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    return nearestStation;
  }

  /**
   * Actualiza el cache de estaciones meteorológicas
   */
  private async updateStationsCache(): Promise<void> {
    const now = new Date();
    
    // Actualizar cache cada 24 horas
    if (this.lastStationsUpdate && 
        (now.getTime() - this.lastStationsUpdate.getTime()) < 24 * 60 * 60 * 1000) {
      return;
    }

    try {
      const response = await this.makeAEMETRequest('/valores/climatologicos/inventarioestaciones/todasestaciones');
      
      if (response.datos) {
        const stationsData = await this.fetchDataFromUrl(response.datos);
        
        this.stationsCache.clear();
        stationsData.forEach((stationData: any) => {
          const station: WeatherStation = {
            indicativo: stationData.indicativo,
            nombre: stationData.nombre,
            provincia: stationData.provincia,
            altitud: parseFloat(stationData.altitud) || 0,
            coordenadas: {
              latitud: this.parseCoordinate(stationData.latitud),
              longitud: this.parseCoordinate(stationData.longitud)
            },
            activa: stationData.estado === 'ACTIVA',
            tipo: this.determineStationType(stationData)
          };

          this.stationsCache.set(station.indicativo, station);
        });

        this.lastStationsUpdate = now;
        this.logger.info(`Cache de estaciones actualizado: ${this.stationsCache.size} estaciones`);
      }

    } catch (error) {
      this.logger.error('Error actualizando cache de estaciones:', error);
    }
  }

  /**
   * Obtiene observación de una estación específica
   */
  private async getStationObservation(indicativo: string): Promise<AEMETWeatherData | null> {
    try {
      const response = await this.makeAEMETRequest(`/observacion/convencional/datos/estacion/${indicativo}`);
      
      if (!response.datos) {
        return null;
      }

      const observationData = await this.fetchDataFromUrl(response.datos);
      
      // Tomar la observación más reciente
      if (Array.isArray(observationData) && observationData.length > 0) {
        return observationData[observationData.length - 1];
      }

      return null;

    } catch (error) {
      this.logger.warn(`Error obteniendo observación de estación ${indicativo}:`, error);
      return null;
    }
  }

  /**
   * Obtiene código de municipio por coordenadas (aproximación)
   */
  private async getMunicipioIdByCoordinates(lat: number, lng: number): Promise<string | null> {
    // Esta es una implementación simplificada
    // En producción se usaría un servicio de geocodificación inversa
    
    // Códigos de algunas capitales de provincia como ejemplo
    const municipios = [
      { id: '28079', lat: 40.4168, lng: -3.7038, nombre: 'Madrid' },
      { id: '41091', lat: 37.3891, lng: -5.9845, nombre: 'Sevilla' },
      { id: '08019', lat: 41.3851, lng: 2.1734, nombre: 'Barcelona' },
      { id: '46250', lat: 39.4699, lng: -0.3763, nombre: 'Valencia' },
      { id: '48020', lat: 43.2627, lng: -2.9253, nombre: 'Bilbao' }
    ];

    let nearestMunicipio = municipios[0];
    let minDistance = this.calculateDistance(lat, lng, nearestMunicipio.lat, nearestMunicipio.lng);

    for (const municipio of municipios) {
      const distance = this.calculateDistance(lat, lng, municipio.lat, municipio.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestMunicipio = municipio;
      }
    }

    return nearestMunicipio.id;
  }

  /**
   * Obtiene predicción de un municipio
   */
  private async getMunicipioForecast(municipioId: string): Promise<any> {
    const response = await this.makeAEMETRequest(`/prediccion/especifica/municipio/diaria/${municipioId}`);
    
    if (!response.datos) {
      throw new Error('No hay datos de predicción disponibles');
    }

    return await this.fetchDataFromUrl(response.datos);
  }

  /**
   * Realiza petición a la API de AEMET
   */
  private async makeAEMETRequest(endpoint: string): Promise<AEMETResponse> {
    const url = `${this.API_BASE}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'api_key': this.API_KEY,
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('API key de AEMET inválida');
      } else if (response.status === 429) {
        throw new Error('Límite de consultas AEMET excedido');
      }
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json() as AEMETResponse;
  }

  /**
   * Obtiene datos desde URL proporcionada por AEMET
   */
  private async fetchDataFromUrl(dataUrl: string): Promise<any> {
    const response = await fetch(dataUrl, {
      timeout: 10000
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo datos: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Transforma datos de AEMET al formato interno
   */
  private transformAEMETData(
    data: AEMETWeatherData, 
    station: WeatherStation, 
    lat: number, 
    lng: number
  ): WeatherData {
    return {
      temperatura: data.ta || 0,
      humedad: data.hr || 0,
      precipitacion: data.prec || 0,
      viento: {
        velocidad: data.vv || 0,
        direccion: data.dv || 0
      },
      presion: data.pres || 1013,
      visibilidad: data.vis,
      punto_rocio: data.rocio,
      timestamp: new Date(data.fhora),
      estacion: station.nombre,
      fuente: 'AEMET',
      coordenadas: { lat, lng }
    };
  }

  /**
   * Transforma datos de predicción
   */
  private transformForecastData(forecastData: any, days: number): WeatherForecast[] {
    // Implementación simplificada
    // En producción se parsearian los datos complejos de AEMET
    const forecasts: WeatherForecast[] = [];
    
    if (forecastData && forecastData[0] && forecastData[0].prediccion) {
      const prediccion = forecastData[0].prediccion;
      
      for (let i = 0; i < Math.min(days, prediccion.dia?.length || 0); i++) {
        const dia = prediccion.dia[i];
        
        forecasts.push({
          fecha: new Date(dia.fecha),
          temperatura_maxima: dia.temperatura?.maxima || 0,
          temperatura_minima: dia.temperatura?.minima || 0,
          probabilidad_precipitacion: dia.probPrecipitacion?.[0]?.value || 0,
          precipitacion_esperada: 0,
          descripcion: dia.estadoCielo?.[0]?.descripcion || '',
          icono: '',
          viento_max: dia.viento?.[0]?.velocidad || 0,
          humedad_media: dia.humedadRelativa?.media || 50
        });
      }
    }

    return forecasts;
  }

  /**
   * Transforma alertas meteorológicas
   */
  private transformAlertsData(alertsData: any, lat?: number, lng?: number): WeatherAlert[] {
    // Implementación simplificada
    return [];
  }

  /**
   * Calcula distancia entre dos puntos (fórmula haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Parsea coordenadas de AEMET (formato: 12°34'56"N)
   */
  private parseCoordinate(coord: string): number {
    if (!coord) return 0;
    
    // Implementación simplificada
    // En producción se parsearia el formato completo de AEMET
    const numericValue = parseFloat(coord.replace(/[^\d.,\-]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }

  /**
   * Determina tipo de estación
   */
  private determineStationType(stationData: any): 'automatica' | 'convencional' | 'maritima' {
    if (stationData.nombre?.toLowerCase().includes('automatica')) {
      return 'automatica';
    } else if (stationData.nombre?.toLowerCase().includes('maritima')) {
      return 'maritima';
    }
    return 'convencional';
  }

  /**
   * Crea error específico de weather
   */
  private createWeatherError(code: WeatherError['code'], message: string, provider: string): WeatherError {
    const error = new Error(message) as WeatherError;
    error.code = code;
    error.provider = provider;
    error.name = 'WeatherError';
    return error;
  }

  /**
   * Health check del proveedor
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test simple con endpoint de estaciones
      const response = await this.makeAEMETRequest('/valores/climatologicos/inventarioestaciones/todasestaciones');
      return response.estado === 200;
    } catch (error) {
      this.logger.error('Health check AEMET failed:', error);
      return false;
    }
  }

  /**
   * Obtiene información del proveedor
   */
  getProviderInfo(): any {
    return {
      name: 'AEMET',
      description: 'Agencia Estatal de Meteorología',
      country: 'España',
      official: true,
      stations_count: this.stationsCache.size,
      last_update: this.lastStationsUpdate
    };
  }
}