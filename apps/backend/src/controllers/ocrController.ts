// ocrController.ts - Controlador para endpoints OCR
import { Request, Response, NextFunction } from 'express';
import { OCRService } from '../integrations/ocr/ocrService';
import multer from 'multer';

// Configuración de multer para upload de imágenes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // máximo 5 archivos por request
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Use: JPEG, PNG, WebP o TIFF'));
    }
  }
});

export class OCRController {
  private ocrService: OCRService;
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
    this.ocrService = new OCRService(logger, {
      max_image_size: 10 * 1024 * 1024,
      confidence_threshold: 0.3,
      cache_enabled: true
    });
  }

  /**
   * Middleware de upload para una sola imagen
   */
  get uploadSingle() {
    return upload.single('image');
  }

  /**
   * Middleware de upload para múltiples imágenes
   */
  get uploadMultiple() {
    return upload.array('images', 5);
  }

  /**
   * POST /api/ocr/process
   * Procesa una imagen y extrae información del producto
   */
  async processImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'NO_IMAGE',
          message: 'No se encontró imagen en la solicitud'
        });
        return;
      }

      const { extract_product_info = true, enhance_image = true } = req.body;

      this.logger.info('Solicitud procesamiento OCR', {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        user_agent: req.get('User-Agent')
      });

      const result = await this.ocrService.processProductImage({
        image: req.file.buffer,
        filename: req.file.originalname,
        options: {
          extract_product_info: extract_product_info === 'true',
          enhance_image: enhance_image === 'true'
        }
      });

      // Respuesta exitosa
      res.json({
        success: result.success,
        data: {
          text: result.raw_text,
          confidence: result.confidence,
          product_info: result.product_info,
          processing_time: result.processing_time,
          bounding_boxes: result.bounding_boxes?.length || 0
        },
        meta: {
          filename: req.file.originalname,
          file_size: req.file.size,
          provider: 'tesseract',
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      this.logger.error('Error procesando imagen OCR:', {
        error: error.message,
        filename: req.file?.originalname,
        stack: error.stack
      });

      res.status(500).json({
        error: 'PROCESSING_ERROR',
        message: 'Error procesando la imagen',
        details: error.message
      });
    }
  }

  /**
   * POST /api/ocr/batch
   * Procesa múltiples imágenes en batch
   */
  async processBatch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        res.status(400).json({
          error: 'NO_IMAGES',
          message: 'No se encontraron imágenes en la solicitud'
        });
        return;
      }

      if (files.length > 5) {
        res.status(400).json({
          error: 'TOO_MANY_IMAGES',
          message: 'Máximo 5 imágenes por solicitud'
        });
        return;
      }

      this.logger.info('Solicitud procesamiento OCR batch', {
        image_count: files.length,
        total_size: files.reduce((sum, file) => sum + file.size, 0)
      });

      const results = [];

      // Procesar cada imagen secuencialmente
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const result = await this.ocrService.processProductImage({
            image: file.buffer,
            filename: file.originalname,
            options: {
              extract_product_info: true,
              enhance_image: true
            }
          });

          results.push({
            filename: file.originalname,
            success: result.success,
            text: result.raw_text,
            confidence: result.confidence,
            product_info: result.product_info,
            processing_time: result.processing_time,
            error: result.error
          });

        } catch (error: any) {
          this.logger.error(`Error procesando imagen ${file.originalname}:`, error);
          results.push({
            filename: file.originalname,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      res.json({
        success: successCount > 0,
        data: results,
        meta: {
          total_images: files.length,
          successful: successCount,
          failed: files.length - successCount,
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      this.logger.error('Error en procesamiento batch OCR:', error);
      next(error);
    }
  }

  /**
   * POST /api/ocr/job
   * Crea un job asíncrono para procesamiento OCR
   */
  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          error: 'NO_IMAGE',
          message: 'No se encontró imagen en la solicitud'
        });
        return;
      }

      const jobId = await this.ocrService.createJob({
        image: req.file.buffer,
        filename: req.file.originalname,
        options: {
          extract_product_info: true,
          enhance_image: true
        }
      });

      this.logger.info('Job OCR creado', {
        job_id: jobId,
        filename: req.file.originalname
      });

      res.status(202).json({
        success: true,
        data: {
          job_id: jobId,
          status: 'pending',
          created_at: new Date()
        },
        meta: {
          filename: req.file.originalname,
          file_size: req.file.size,
          check_url: `/api/ocr/job/${jobId}`
        }
      });

    } catch (error: any) {
      this.logger.error('Error creando job OCR:', error);
      next(error);
    }
  }

  /**
   * GET /api/ocr/job/:jobId
   * Obtiene el estado de un job de procesamiento
   */
  async getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobId } = req.params;

      if (!jobId) {
        res.status(400).json({
          error: 'INVALID_JOB_ID',
          message: 'ID de job requerido'
        });
        return;
      }

      const jobStatus = this.ocrService.getJobStatus(jobId);

      if (!jobStatus) {
        res.status(404).json({
          error: 'JOB_NOT_FOUND',
          message: 'Job no encontrado o expirado'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          job_id: jobStatus.id,
          status: jobStatus.status,
          created_at: jobStatus.created_at,
          completed_at: jobStatus.completed_at,
          result: jobStatus.result,
          error: jobStatus.error,
          metadata: jobStatus.metadata
        }
      });

    } catch (error: any) {
      this.logger.error('Error obteniendo estado de job OCR:', error);
      next(error);
    }
  }

  /**
   * GET /api/ocr/health
   * Health check del servicio OCR
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await this.ocrService.healthCheck();
      const stats = this.ocrService.getStatistics();

      const status = health.status === 'healthy' ? 200 : 503;

      res.status(status).json({
        status: health.status,
        details: health,
        statistics: stats,
        timestamp: new Date()
      });

    } catch (error: any) {
      this.logger.error('Error en health check OCR:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * GET /api/ocr/patterns
   * Lista patrones disponibles para extracción
   */
  async getPatterns(req: Request, res: Response): Promise<void> {
    try {
      // Aquí se obtendría la lista de patrones del pattern matcher
      const patterns = [
        'numero_registro', 'glifosato', 'mcpa', '24d', 'azufre', 'cobre',
        'mancozeb', 'imidacloprid', 'lambda_cihalotrina', 'nitrogeno',
        'fosforo', 'potasio', 'npk_complejo', 'dosis_litros_ha',
        'dosis_kg_ha', 'fabricante', 'plazo_seguridad', 'categoria_toxicologica'
      ];

      res.json({
        success: true,
        data: patterns.map(pattern => ({
          name: pattern,
          description: this.getPatternDescription(pattern),
          category: this.getPatternCategory(pattern)
        })),
        meta: {
          total: patterns.length,
          categories: ['registro', 'principios_activos', 'composicion', 'dosificacion', 'informacion_general']
        }
      });

    } catch (error: any) {
      this.logger.error('Error obteniendo patrones OCR:', error);
      res.status(500).json({
        error: 'PATTERNS_ERROR',
        message: error.message
      });
    }
  }

  /**
   * POST /api/ocr/test
   * Endpoint de prueba con imagen de ejemplo
   */
  async testOCR(req: Request, res: Response): Promise<void> {
    try {
      // Generar imagen de prueba simple con texto
      const testImageBuffer = await this.generateTestImage();

      const result = await this.ocrService.processProductImage({
        image: testImageBuffer,
        filename: 'test_image.png',
        options: {
          extract_product_info: true,
          enhance_image: false
        }
      });

      res.json({
        success: true,
        data: {
          test_result: result,
          message: 'Test OCR completado exitosamente'
        },
        meta: {
          test_mode: true,
          timestamp: new Date()
        }
      });

    } catch (error: any) {
      this.logger.error('Error en test OCR:', error);
      res.status(500).json({
        error: 'TEST_ERROR',
        message: error.message
      });
    }
  }

  // Métodos auxiliares privados

  private getPatternDescription(pattern: string): string {
    const descriptions: Record<string, string> = {
      numero_registro: 'Número de registro sanitario del producto',
      glifosato: 'Concentración de glifosato como principio activo',
      mcpa: 'Concentración de MCPA como principio activo',
      '24d': 'Concentración de 2,4-D como principio activo',
      azufre: 'Concentración de azufre como fungicida',
      cobre: 'Concentración de cobre como fungicida',
      nitrogeno: 'Porcentaje de nitrógeno en fertilizantes',
      fosforo: 'Porcentaje de fósforo (P2O5) en fertilizantes',
      potasio: 'Porcentaje de potasio (K2O) en fertilizantes',
      dosis_litros_ha: 'Dosis recomendada en litros por hectárea',
      fabricante: 'Nombre del fabricante del producto'
    };
    return descriptions[pattern] || 'Patrón de extracción de información';
  }

  private getPatternCategory(pattern: string): string {
    if (pattern.includes('registro')) return 'registro';
    if (['glifosato', 'mcpa', '24d', 'azufre', 'cobre', 'mancozeb', 'imidacloprid'].includes(pattern)) return 'principios_activos';
    if (['nitrogeno', 'fosforo', 'potasio', 'npk_complejo'].includes(pattern)) return 'composicion';
    if (pattern.includes('dosis')) return 'dosificacion';
    return 'informacion_general';
  }

  private async generateTestImage(): Promise<Buffer> {
    // Generar imagen simple de prueba con sharp
    const sharp = require('sharp');
    
    const svg = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="200" fill="white"/>
        <text x="20" y="40" font-family="Arial" font-size="16" fill="black">HERBICIDA GLIFOSATO 36%</text>
        <text x="20" y="70" font-family="Arial" font-size="14" fill="black">Registro Sanitario: 12345</text>
        <text x="20" y="100" font-family="Arial" font-size="14" fill="black">Dosis: 2.5 L/ha</text>
        <text x="20" y="130" font-family="Arial" font-size="14" fill="black">Fabricado por: Test Company</text>
        <text x="20" y="160" font-family="Arial" font-size="12" fill="gray">Plazo de seguridad: 7 días</text>
      </svg>
    `;

    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  }
}