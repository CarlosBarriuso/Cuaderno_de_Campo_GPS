// weatherController.ts - Controlador para APIs meteorológicas
import { Request, Response } from 'express';
import { WeatherService } from '../integrations/weather/weatherService';
import { WeatherConfig } from '../integrations/weather/types';
import { logger } from '../config/logger';

// Configuración del servicio meteorológico
const weatherConfig: WeatherConfig = {
  providers: {
    aemet: {
      enabled: true,
      api_key: process.env.AEMET_API_KEY || '',
      endpoints: {
        observacion: '/observacion/convencional/datos/estacion',
        prediccion: '/prediccion/especifica/municipio/diaria',
        alertas: '/avisos_cap/ultimoelaborado',
        estaciones: '/valores/climatologicos/inventarioestaciones/todasestaciones'
      }
    },
    openweather: {
      enabled: true,
      api_key: process.env.OPENWEATHER_API_KEY || '',
      endpoint: 'https://api.openweathermap.org/data/2.5'
    }
  },
  cache_ttl: 3600, // 1 hora
  alerts_enabled: true,
  default_location: {
    lat: 40.4168, // Madrid
    lng: -3.7038
  }
};

const weatherService = new WeatherService(weatherConfig, logger);

export class WeatherController {
  /**
   * GET /api/weather/current
   * Obtiene datos meteorológicos actuales
   */
  static async getCurrentWeather(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Parámetros lat y lng son requeridos'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: 'Coordenadas inválidas'
        });
        return;
      }

      const weatherData = await weatherService.getCurrentWeather(latitude, longitude);

      if (!weatherData) {
        res.status(404).json({
          success: false,
          error: 'No se pudieron obtener datos meteorológicos para esta ubicación'
        });
        return;
      }

      res.json({
        success: true,
        data: weatherData,
        meta: {
          coordinates: { lat: latitude, lng: longitude },
          source: weatherData.fuente,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error en getCurrentWeather:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/weather/forecast
   * Obtiene predicción meteorológica
   */
  static async getForecast(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, days = '7' } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Parámetros lat y lng son requeridos'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const numDays = parseInt(days as string);

      if (isNaN(latitude) || isNaN(longitude) || isNaN(numDays) || numDays < 1 || numDays > 14) {
        res.status(400).json({
          success: false,
          error: 'Parámetros inválidos. Days debe estar entre 1 y 14'
        });
        return;
      }

      const forecastData = await weatherService.getForecast(latitude, longitude, numDays);

      res.json({
        success: true,
        data: forecastData,
        meta: {
          coordinates: { lat: latitude, lng: longitude },
          days_requested: numDays,
          days_returned: forecastData.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error en getForecast:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/weather/alerts
   * Obtiene alertas agrícolas
   */
  static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, crops, radius } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Parámetros lat y lng son requeridos'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const cropTypes = crops ? (crops as string).split(',').map(c => c.trim()) : undefined;
      const searchRadius = radius ? parseFloat(radius as string) : undefined;

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: 'Coordenadas inválidas'
        });
        return;
      }

      const alerts = await weatherService.getAgriculturalAlerts(
        latitude, 
        longitude, 
        cropTypes, 
        searchRadius
      );

      res.json({
        success: true,
        data: alerts,
        meta: {
          coordinates: { lat: latitude, lng: longitude },
          crop_types: cropTypes,
          radius: searchRadius,
          alerts_count: alerts.length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error en getAlerts:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/weather/complete
   * Obtiene información meteorológica completa
   */
  static async getCompleteInfo(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, crops } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Parámetros lat y lng son requeridos'
        });
        return;
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const cropTypes = crops ? (crops as string).split(',').map(c => c.trim()) : undefined;

      if (isNaN(latitude) || isNaN(longitude)) {
        res.status(400).json({
          success: false,
          error: 'Coordenadas inválidas'
        });
        return;
      }

      const completeInfo = await weatherService.getCompleteWeatherInfo(
        latitude, 
        longitude, 
        cropTypes
      );

      res.json({
        success: true,
        data: completeInfo,
        meta: {
          coordinates: { lat: latitude, lng: longitude },
          crop_types: cropTypes,
          has_current: !!completeInfo.current,
          forecast_days: completeInfo.forecast.length,
          alerts_count: completeInfo.alerts.length,
          alerts_severity: completeInfo.alertsSeverity,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error en getCompleteInfo:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/weather/health
   * Health check del servicio meteorológico
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await weatherService.healthCheck();
      const stats = weatherService.getStats();
      const providersInfo = weatherService.getProvidersInfo();

      // Limpiar cache expirado
      const cleanedEntries = weatherService.cleanExpiredCache();

      res.status(health.overall ? 200 : 503).json({
        success: health.overall,
        data: {
          status: health.overall ? 'healthy' : 'degraded',
          providers: health.providers,
          cache: {
            size: health.cache_size,
            cleaned_entries: cleanedEntries
          },
          stats,
          providers_info: providersInfo
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error en weatherHealthCheck:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/weather/providers
   * Información de proveedores disponibles
   */
  static async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providersInfo = weatherService.getProvidersInfo();
      
      res.json({
        success: true,
        data: providersInfo,
        meta: {
          total_providers: providersInfo.length,
          enabled_providers: providersInfo.filter(p => p.enabled).length,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error) {
      logger.error('Error en getProviders:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/weather/cache/clear
   * Limpia cache del servicio meteorológico
   */
  static async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const cleanedEntries = weatherService.cleanExpiredCache();
      
      res.json({
        success: true,
        data: {
          message: 'Cache limpiado exitosamente',
          cleaned_entries: cleanedEntries
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error en clearCache:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }
  }
}