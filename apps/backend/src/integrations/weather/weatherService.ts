// weatherService.ts - Servicio unificado de meteorología
import { AEMETProvider } from './aemetProvider';
import { OpenWeatherProvider } from './openWeatherProvider';
import { AlertsProcessor } from './alertsProcessor';
import { 
  WeatherData, 
  WeatherForecast, 
  AgriculturalAlert,
  WeatherConfig,
  WeatherError,
  GeolocationData 
} from './types';

export class WeatherService {
  private aemetProvider: AEMETProvider;
  private openWeatherProvider: OpenWeatherProvider;
  private alertsProcessor: AlertsProcessor;
  private logger: any;
  private cache: Map<string, { data: any; expires: Date }> = new Map();
  private config: WeatherConfig;

  constructor(config: WeatherConfig, logger: any) {
    this.config = config;
    this.logger = logger;
    
    // Inicializar proveedores
    this.aemetProvider = new AEMETProvider(config.providers.aemet.api_key, logger);
    this.openWeatherProvider = new OpenWeatherProvider(config.providers.openweather.api_key, logger);
    this.alertsProcessor = new AlertsProcessor(logger);
  }

  /**
   * Obtiene datos meteorológicos actuales con fallback
   */
  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    const cacheKey = `current-${lat}-${lng}`;
    
    // Verificar cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Weather data from cache', { lat, lng });
      return cached;
    }

    let weatherData: WeatherData | null = null;
    
    try {
      // Intentar primero con AEMET (oficial España)
      if (this.config.providers.aemet.enabled) {
        this.logger.debug('Trying AEMET provider', { lat, lng });
        weatherData = await this.aemetProvider.getCurrentWeather(lat, lng);
      }
    } catch (error) {
      this.logger.warn('AEMET provider failed:', error);
    }

    // Fallback a OpenWeather si AEMET falla
    if (!weatherData && this.config.providers.openweather.enabled) {
      try {
        this.logger.debug('Trying OpenWeather fallback', { lat, lng });
        weatherData = await this.openWeatherProvider.getCurrentWeather(lat, lng);
      } catch (error) {
        this.logger.error('OpenWeather fallback failed:', error);
        throw this.createWeatherError('API_ERROR', 'Todos los proveedores meteorológicos han fallado', 'ALL');
      }
    }

    if (weatherData) {
      // Guardar en cache
      this.setCache(cacheKey, weatherData, this.config.cache_ttl);
      this.logger.info('Weather data retrieved successfully', { 
        source: weatherData.fuente, 
        lat, 
        lng,
        temperature: weatherData.temperatura 
      });
    }

    return weatherData;
  }

  /**
   * Obtiene predicción meteorológica con fallback
   */
  async getForecast(lat: number, lng: number, days: number = 7): Promise<WeatherForecast[]> {
    const cacheKey = `forecast-${lat}-${lng}-${days}`;
    
    // Verificar cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Forecast data from cache', { lat, lng, days });
      return cached;
    }

    let forecastData: WeatherForecast[] = [];
    
    try {
      // Intentar primero con AEMET
      if (this.config.providers.aemet.enabled) {
        this.logger.debug('Trying AEMET forecast', { lat, lng, days });
        forecastData = await this.aemetProvider.getForecast(lat, lng, days);
      }
    } catch (error) {
      this.logger.warn('AEMET forecast failed:', error);
    }

    // Fallback a OpenWeather si AEMET falla o no tiene datos
    if ((!forecastData || forecastData.length === 0) && this.config.providers.openweather.enabled) {
      try {
        this.logger.debug('Trying OpenWeather forecast fallback', { lat, lng, days });
        forecastData = await this.openWeatherProvider.getForecast(lat, lng, days);
      } catch (error) {
        this.logger.error('OpenWeather forecast fallback failed:', error);
        throw this.createWeatherError('API_ERROR', 'Todos los proveedores de predicción han fallado', 'ALL');
      }
    }

    if (forecastData && forecastData.length > 0) {
      // Guardar en cache (cache más largo para predicciones)
      this.setCache(cacheKey, forecastData, this.config.cache_ttl * 2);
      this.logger.info('Forecast data retrieved successfully', { 
        days_retrieved: forecastData.length, 
        lat, 
        lng 
      });
    }

    return forecastData;
  }

  /**
   * Obtiene alertas agrícolas combinando datos actuales y predicción
   */
  async getAgriculturalAlerts(
    lat: number, 
    lng: number, 
    cropTypes?: string[],
    radius?: number
  ): Promise<AgriculturalAlert[]> {
    if (!this.config.alerts_enabled) {
      return [];
    }

    const cacheKey = `alerts-${lat}-${lng}-${cropTypes?.join(',') || 'all'}`;
    
    // Verificar cache (cache más corto para alertas)
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.logger.debug('Agricultural alerts from cache', { lat, lng });
      return cached;
    }

    try {
      // Obtener datos actuales y predicción
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lng),
        this.getForecast(lat, lng, 7)
      ]);

      if (!currentWeather) {
        this.logger.warn('No weather data available for alerts', { lat, lng });
        return [];
      }

      // Obtener información de ubicación
      const location: GeolocationData = {
        lat,
        lng,
        // En una implementación completa, obtendríamos municipio/provincia por geocodificación
        municipio: undefined,
        provincia: undefined
      };

      // Procesar alertas
      let alerts = this.alertsProcessor.processWeatherAlerts(currentWeather, forecast, location);

      // Filtrar por ubicación si se especifica radio
      if (radius) {
        alerts = this.alertsProcessor.filterAlertsByLocation(alerts, lat, lng, radius);
      }

      // Filtrar por tipo de cultivo si se especifica
      if (cropTypes && cropTypes.length > 0) {
        alerts = this.alertsProcessor.filterAlertsByCrop(alerts, cropTypes);
      }

      // Guardar en cache (cache corto para alertas)
      this.setCache(cacheKey, alerts, Math.floor(this.config.cache_ttl / 4));
      
      this.logger.info('Agricultural alerts generated', { 
        alerts_count: alerts.length,
        lat, 
        lng,
        crop_types: cropTypes 
      });

      return alerts;

    } catch (error) {
      this.logger.error('Error generating agricultural alerts:', error);
      return []; // No fallar por alertas
    }
  }

  /**
   * Obtiene información completa del clima para una ubicación
   */
  async getCompleteWeatherInfo(lat: number, lng: number, cropTypes?: string[]): Promise<{
    current: WeatherData | null;
    forecast: WeatherForecast[];
    alerts: AgriculturalAlert[];
    alertsSeverity: 'baja' | 'media' | 'alta' | 'extrema';
  }> {
    try {
      const [current, forecast, alerts] = await Promise.all([
        this.getCurrentWeather(lat, lng),
        this.getForecast(lat, lng, 7),
        this.getAgriculturalAlerts(lat, lng, cropTypes)
      ]);

      const alertsSeverity = this.alertsProcessor.evaluateOverallSeverity(alerts);

      return {
        current,
        forecast,
        alerts,
        alertsSeverity
      };

    } catch (error) {
      this.logger.error('Error getting complete weather info:', error);
      throw error;
    }
  }

  /**
   * Health check de todos los proveedores
   */
  async healthCheck(): Promise<{
    overall: boolean;
    providers: {
      aemet: boolean;
      openweather: boolean;
    };
    cache_size: number;
  }> {
    const results = await Promise.allSettled([
      this.aemetProvider.healthCheck(),
      this.openWeatherProvider.healthCheck()
    ]);

    const aemetHealth = results[0].status === 'fulfilled' ? results[0].value : false;
    const openWeatherHealth = results[1].status === 'fulfilled' ? results[1].value : false;

    const overall = aemetHealth || openWeatherHealth; // Al menos uno debe funcionar

    return {
      overall,
      providers: {
        aemet: aemetHealth,
        openweather: openWeatherHealth
      },
      cache_size: this.cache.size
    };
  }

  /**
   * Obtiene información de todos los proveedores
   */
  getProvidersInfo(): any[] {
    return [
      {
        ...this.aemetProvider.getProviderInfo(),
        enabled: this.config.providers.aemet.enabled,
        priority: 1
      },
      {
        ...this.openWeatherProvider.getProviderInfo(),
        enabled: this.config.providers.openweather.enabled,
        priority: 2
      }
    ];
  }

  /**
   * Limpia cache expirado
   */
  cleanExpiredCache(): number {
    const now = new Date();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned ${cleaned} expired cache entries`);
    }

    return cleaned;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    cache_entries: number;
    providers_enabled: number;
    alerts_enabled: boolean;
  } {
    return {
      cache_entries: this.cache.size,
      providers_enabled: Object.values(this.config.providers).filter(p => p.enabled).length,
      alerts_enabled: this.config.alerts_enabled
    };
  }

  // Métodos privados para gestión de cache
  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (entry && entry.expires > new Date()) {
      return entry.data;
    }
    
    if (entry) {
      this.cache.delete(key); // Limpiar entrada expirada
    }
    
    return null;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    const expires = new Date(Date.now() + ttlSeconds * 1000);
    this.cache.set(key, { data, expires });
  }

  private createWeatherError(code: WeatherError['code'], message: string, provider: string): WeatherError {
    const error = new Error(message) as WeatherError;
    error.code = code;
    error.provider = provider;
    error.name = 'WeatherError';
    return error;
  }
}