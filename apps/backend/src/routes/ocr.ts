// routes/ocr.ts - Rutas para el sistema OCR
import { Router } from 'express';
import { OCRController } from '../controllers/ocrController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Crear instancia del controlador OCR
const ocrController = new OCRController(console); // Usar logger apropiado

/**
 * @route GET /api/ocr/health
 * @description Health check del servicio OCR
 * @access Public (para monitoreo)
 */
router.get('/health', ocrController.healthCheck.bind(ocrController));

/**
 * @route GET /api/ocr/patterns
 * @description Lista patrones disponibles para extracción
 * @access Public
 */
router.get('/patterns', ocrController.getPatterns.bind(ocrController));

/**
 * @route POST /api/ocr/test
 * @description Test del servicio OCR con imagen de ejemplo
 * @access Public (solo en desarrollo)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', ocrController.testOCR.bind(ocrController));
}

// Aplicar autenticación para endpoints que requieren usuario
router.use(authMiddleware);

/**
 * @route POST /api/ocr/process
 * @description Procesa una imagen y extrae información del producto
 * @access Private
 * @body {file} image - Imagen del producto (JPEG, PNG, WebP, TIFF)
 * @body {boolean} [extract_product_info=true] - Extraer información específica del producto
 * @body {boolean} [enhance_image=true] - Aplicar mejoras a la imagen antes del OCR
 */
router.post('/process', 
  ocrController.uploadSingle,
  ocrController.processImage.bind(ocrController)
);

/**
 * @route POST /api/ocr/batch
 * @description Procesa múltiples imágenes en batch (máximo 5)
 * @access Private
 * @body {file[]} images - Imágenes de productos (máximo 5 archivos)
 */
router.post('/batch',
  ocrController.uploadMultiple,
  ocrController.processBatch.bind(ocrController)
);

/**
 * @route POST /api/ocr/job
 * @description Crea un job asíncrono para procesamiento OCR
 * @access Private
 * @body {file} image - Imagen del producto
 * @returns {string} job_id - ID del job para consultar estado
 */
router.post('/job',
  ocrController.uploadSingle,
  ocrController.createJob.bind(ocrController)
);

/**
 * @route GET /api/ocr/job/:jobId
 * @description Obtiene el estado de un job de procesamiento OCR
 * @access Private
 * @param {string} jobId - ID del job
 */
router.get('/job/:jobId', ocrController.getJobStatus.bind(ocrController));

export { router as ocrRoutes };