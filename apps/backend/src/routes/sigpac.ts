// routes/sigpac.ts - Rutas para la integración SIGPAC
import { Router } from 'express';
import { SIGPACController } from '../controllers/sigpacController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Crear instancia del controlador SIGPAC
const sigpacController = new SIGPACController(console); // Usar logger apropiado

/**
 * @route GET /api/sigpac/health
 * @description Health check del servicio SIGPAC
 * @access Public (para monitoreo)
 */
router.get('/health', sigpacController.healthCheck.bind(sigpacController));

/**
 * @route GET /api/sigpac/provincias
 * @description Lista todas las provincias españolas con códigos SIGPAC
 * @access Public
 */
router.get('/provincias', sigpacController.getProvincias.bind(sigpacController));

/**
 * @route GET /api/sigpac/test
 * @description Referencias de prueba para testing
 * @access Public (solo en desarrollo)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/test', sigpacController.getTestReferences.bind(sigpacController));
}

// Aplicar autenticación para endpoints que requieren usuario
router.use(authMiddleware);

/**
 * @route GET /api/sigpac/parcela/:referencia
 * @description Obtiene información de una parcela por referencia catastral
 * @param {string} referencia - Referencia catastral (formato: "PP:MMM:AAAA:ZZZZZ:PPPP:RR")
 * @access Private
 * @example GET /api/sigpac/parcela/28:079:0001:00001:0001:WI
 */
router.get('/parcela/:referencia', sigpacController.getParcela.bind(sigpacController));

/**
 * @route POST /api/sigpac/parcelas/search
 * @description Busca parcelas por coordenadas geográficas
 * @body {number} lat - Latitud (grados decimales)
 * @body {number} lng - Longitud (grados decimales)  
 * @body {number} [radius=100] - Radio de búsqueda en metros
 * @access Private
 */
router.post('/parcelas/search', sigpacController.searchByCoordinates.bind(sigpacController));

/**
 * @route POST /api/sigpac/referencias/validate
 * @description Valida múltiples referencias catastrales en batch
 * @body {string[]} referencias - Array de referencias a validar (máximo 100)
 * @access Private
 */
router.post('/referencias/validate', sigpacController.validateReferencias.bind(sigpacController));

export { router as sigpacRoutes };