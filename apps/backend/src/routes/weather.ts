// weather.ts - Rutas para el servicio meteorológico
import { Router } from 'express';
import { WeatherController } from '../controllers/weatherController';
import { requireAuth } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting específico para weather API
const weatherRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: {
    success: false,
    error: 'Demasiadas consultas meteorológicas. Inténtalo más tarde.',
    retry_after: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting más restrictivo para operaciones intensivas
const intensiveRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // máximo 10 requests por ventana para operaciones intensivas
  message: {
    success: false,
    error: 'Demasiadas consultas complejas. Inténtalo más tarde.',
    retry_after: '5 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   GET /api/weather/current
 * @desc    Obtiene datos meteorológicos actuales por coordenadas
 * @access  Private
 * @params  lat, lng (query parameters)
 * @example GET /api/weather/current?lat=40.4168&lng=-3.7038
 */
router.get('/current', 
  requireAuth,
  weatherRateLimit,
  WeatherController.getCurrentWeather
);

/**
 * @route   GET /api/weather/forecast
 * @desc    Obtiene predicción meteorológica
 * @access  Private
 * @params  lat, lng, days (query parameters)
 * @example GET /api/weather/forecast?lat=40.4168&lng=-3.7038&days=7
 */
router.get('/forecast',
  requireAuth,
  weatherRateLimit,
  WeatherController.getForecast
);

/**
 * @route   GET /api/weather/alerts
 * @desc    Obtiene alertas agrícolas para una ubicación
 * @access  Private
 * @params  lat, lng, crops (optional), radius (optional)
 * @example GET /api/weather/alerts?lat=40.4168&lng=-3.7038&crops=tomate,trigo&radius=25
 */
router.get('/alerts',
  requireAuth,
  weatherRateLimit,
  WeatherController.getAlerts
);

/**
 * @route   GET /api/weather/complete
 * @desc    Obtiene información meteorológica completa (actual + predicción + alertas)
 * @access  Private
 * @params  lat, lng, crops (optional)
 * @example GET /api/weather/complete?lat=40.4168&lng=-3.7038&crops=trigo,cebada
 */
router.get('/complete',
  requireAuth,
  intensiveRateLimit, // Más restrictivo porque combina múltiples APIs
  WeatherController.getCompleteInfo
);

/**
 * @route   GET /api/weather/providers
 * @desc    Obtiene información de proveedores meteorológicos disponibles
 * @access  Private
 */
router.get('/providers',
  requireAuth,
  WeatherController.getProviders
);

/**
 * @route   GET /api/weather/health
 * @desc    Health check del servicio meteorológico
 * @access  Public (para monitoreo)
 */
router.get('/health',
  WeatherController.healthCheck
);

/**
 * @route   POST /api/weather/cache/clear
 * @desc    Limpia cache del servicio meteorológico
 * @access  Private (solo para administradores/debugging)
 */
router.post('/cache/clear',
  requireAuth,
  // TODO: Agregar middleware de autorización de admin cuando esté disponible
  WeatherController.clearCache
);

export default router;