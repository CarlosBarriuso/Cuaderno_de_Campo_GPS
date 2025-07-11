// ocrService.ts - Servicio principal de OCR para productos agrícolas
import { OCRResult, OCRRequest, OCRConfig, ProductInfo, OCRJobStatus } from './types';
import { TesseractOCRProvider } from './tesseractProvider';
import { AgriculturalPatternMatcher } from './patternMatcher';
import crypto from 'crypto';

export class OCRService {
  private tesseractProvider: TesseractOCRProvider;
  private patternMatcher: AgriculturalPatternMatcher;
  private logger: any;
  private config: OCRConfig;
  private cache: Map<string, OCRResult> = new Map();
  private jobs: Map<string, OCRJobStatus> = new Map();

  constructor(logger: any, config: Partial<OCRConfig> = {}) {
    this.logger = logger;
    this.tesseractProvider = new TesseractOCRProvider(logger);
    this.patternMatcher = new AgriculturalPatternMatcher();
    
    // Configuración por defecto
    this.config = {
      providers: [
        {
          name: 'tesseract',
          enabled: true,
          priority: 1,
          config: {}
        }
      ],
      fallback_enabled: true,
      max_image_size: 10 * 1024 * 1024, // 10MB
      supported_formats: ['jpeg', 'jpg', 'png', 'webp', 'tiff'],
      confidence_threshold: 0.3,
      cache_enabled: true,
      cache_ttl: 24 * 60 * 60, // 24 horas
      ...config
    };

    this.logger.info('OCRService inicializado', { 
      providers: this.config.providers.length,
      cache_enabled: this.config.cache_enabled 
    });
  }

  /**
   * Procesa una imagen y extrae información de producto
   */
  async processProductImage(request: OCRRequest): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      // Validar imagen
      const validation = this.validateImage(request.image, request.filename);
      if (!validation.valid) {
        return {
          success: false,
          confidence: 0,
          raw_text: '',
          error: validation.error
        };
      }

      // Verificar cache si está habilitado
      let cacheKey: string | null = null;
      if (this.config.cache_enabled) {
        cacheKey = this.generateCacheKey(request.image);
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
          this.logger.info('Resultado servido desde cache', { cache_key: cacheKey });
          return cachedResult;
        }
      }

      this.logger.info('Iniciando procesamiento OCR', {
        filename: request.filename,
        image_size: request.image.length,
        options: request.options
      });

      // Procesar con Tesseract (proveedor principal)
      const result = await this.tesseractProvider.processImage(
        request.image, 
        request.options
      );

      // Aplicar post-procesamiento
      const enhancedResult = await this.enhanceResult(result, request);

      // Guardar en cache si el resultado es exitoso
      if (this.config.cache_enabled && enhancedResult.success && cacheKey) {
        this.cache.set(cacheKey, enhancedResult);
        
        // Limpiar cache después del TTL
        setTimeout(() => {
          this.cache.delete(cacheKey!);
        }, this.config.cache_ttl * 1000);
      }

      const totalTime = Date.now() - startTime;
      this.logger.info('Procesamiento OCR completado', {
        success: enhancedResult.success,
        confidence: enhancedResult.confidence,
        processing_time: totalTime,
        text_length: enhancedResult.raw_text.length
      });

      return {
        ...enhancedResult,
        processing_time: totalTime
      };

    } catch (error) {
      const errorTime = Date.now() - startTime;
      this.logger.error('Error en procesamiento OCR:', error);
      
      return {
        success: false,
        confidence: 0,
        raw_text: '',
        error: `Error procesando imagen: ${error.message}`,
        processing_time: errorTime
      };
    }
  }

  /**
   * Crea un job asíncrono para procesamiento de imagen
   */
  async createJob(request: OCRRequest): Promise<string> {
    const jobId = crypto.randomUUID();
    
    const job: OCRJobStatus = {
      id: jobId,
      status: 'pending',
      created_at: new Date(),
      metadata: {
        filename: request.filename,
        file_size: request.image.length
      }
    };

    this.jobs.set(jobId, job);

    // Procesar de forma asíncrona
    this.processJobAsync(jobId, request);

    return jobId;
  }

  /**
   * Obtiene el estado de un job
   */
  getJobStatus(jobId: string): OCRJobStatus | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Procesa job de forma asíncrona
   */
  private async processJobAsync(jobId: string, request: OCRRequest): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Marcar como procesando
      job.status = 'processing';
      this.jobs.set(jobId, job);

      // Procesar imagen
      const result = await this.processProductImage(request);

      // Actualizar job con resultado
      job.status = 'completed';
      job.completed_at = new Date();
      job.result = result;
      job.metadata!.provider_used = 'tesseract';
      job.metadata!.processing_time = result.processing_time;

      this.jobs.set(jobId, job);

      // Limpiar job después de 1 hora
      setTimeout(() => {
        this.jobs.delete(jobId);
      }, 60 * 60 * 1000);

    } catch (error) {
      // Marcar job como fallido
      job.status = 'failed';
      job.completed_at = new Date();
      job.error = error.message;
      this.jobs.set(jobId, job);

      this.logger.error(`Job ${jobId} falló:`, error);
    }
  }

  /**
   * Valida imagen antes del procesamiento
   */
  private validateImage(imageBuffer: Buffer, filename?: string): { valid: boolean; error?: string } {
    // Verificar tamaño
    if (imageBuffer.length > this.config.max_image_size) {
      return {
        valid: false,
        error: `Imagen demasiado grande. Máximo ${this.config.max_image_size / 1024 / 1024}MB`
      };
    }

    // Verificar que no esté vacía
    if (imageBuffer.length === 0) {
      return {
        valid: false,
        error: 'Imagen vacía'
      };
    }

    // Verificar formato si se proporciona filename
    if (filename) {
      const extension = filename.split('.').pop()?.toLowerCase();
      if (extension && !this.config.supported_formats.includes(extension)) {
        return {
          valid: false,
          error: `Formato no soportado. Formatos válidos: ${this.config.supported_formats.join(', ')}`
        };
      }
    }

    // Verificar que sea una imagen válida (básico)
    const isValidImage = this.isValidImageBuffer(imageBuffer);
    if (!isValidImage) {
      return {
        valid: false,
        error: 'Archivo no es una imagen válida'
      };
    }

    return { valid: true };
  }

  /**
   * Verificación básica de que el buffer es una imagen
   */
  private isValidImageBuffer(buffer: Buffer): boolean {
    // Verificar magic numbers de formatos comunes
    const signatures = [
      [0xFF, 0xD8, 0xFF], // JPEG
      [0x89, 0x50, 0x4E, 0x47], // PNG
      [0x47, 0x49, 0x46], // GIF
      [0x52, 0x49, 0x46, 0x46], // RIFF (WebP)
      [0x49, 0x49, 0x2A, 0x00], // TIFF LE
      [0x4D, 0x4D, 0x00, 0x2A]  // TIFF BE
    ];

    return signatures.some(signature => {
      return signature.every((byte, index) => buffer[index] === byte);
    });
  }

  /**
   * Genera clave de cache para una imagen
   */
  private generateCacheKey(imageBuffer: Buffer): string {
    return crypto.createHash('sha256').update(imageBuffer).digest('hex');
  }

  /**
   * Mejora el resultado con post-procesamiento
   */
  private async enhanceResult(result: OCRResult, request: OCRRequest): Promise<OCRResult> {
    if (!result.success || !result.raw_text) {
      return result;
    }

    try {
      // Re-procesar texto con patrones actualizados
      const { productInfo, confidence: patternConfidence } = 
        this.patternMatcher.extractProductInfo(result.raw_text);

      // Enriquecer con base de datos de productos si hay número de registro
      if (productInfo.numero_registro) {
        const enrichedInfo = await this.enrichFromDatabase(productInfo);
        Object.assign(productInfo, enrichedInfo);
      }

      // Actualizar confianza combinada
      const enhancedConfidence = Math.max(result.confidence, patternConfidence);

      return {
        ...result,
        confidence: enhancedConfidence,
        product_info: productInfo
      };

    } catch (error) {
      this.logger.warn('Error en post-procesamiento:', error);
      return result;
    }
  }

  /**
   * Enriquece información con base de datos de productos
   */
  private async enrichFromDatabase(productInfo: ProductInfo): Promise<Partial<ProductInfo>> {
    // Placeholder para integración con base de datos de productos
    // Aquí se consultaría una base de datos de productos fitosanitarios registrados
    return {};
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<any> {
    try {
      const tesseractStatus = await this.tesseractProvider.healthCheck();
      
      return {
        status: tesseractStatus ? 'healthy' : 'degraded',
        providers: {
          tesseract: tesseractStatus
        },
        cache: {
          enabled: this.config.cache_enabled,
          size: this.cache.size
        },
        jobs: {
          total: this.jobs.size,
          pending: Array.from(this.jobs.values()).filter(j => j.status === 'pending').length,
          processing: Array.from(this.jobs.values()).filter(j => j.status === 'processing').length
        },
        patterns: {
          available: this.patternMatcher.getAvailablePatterns().length
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStatistics(): any {
    const completedJobs = Array.from(this.jobs.values()).filter(j => j.status === 'completed');
    
    return {
      cache_size: this.cache.size,
      total_jobs: this.jobs.size,
      completed_jobs: completedJobs.length,
      average_processing_time: completedJobs.length > 0
        ? completedJobs.reduce((sum, job) => sum + (job.metadata?.processing_time || 0), 0) / completedJobs.length
        : 0,
      success_rate: completedJobs.length > 0
        ? completedJobs.filter(job => job.result?.success).length / completedJobs.length
        : 0
    };
  }

  /**
   * Limpia cache y jobs antiguos
   */
  cleanup(): void {
    // Limpiar cache
    this.cache.clear();
    
    // Limpiar jobs antiguos (más de 24 horas)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oldJobs = Array.from(this.jobs.entries())
      .filter(([_, job]) => job.created_at < cutoff);
    
    oldJobs.forEach(([jobId]) => {
      this.jobs.delete(jobId);
    });

    this.logger.info('Cleanup completado', {
      cache_cleared: true,
      old_jobs_removed: oldJobs.length
    });
  }

  /**
   * Libera recursos
   */
  async destroy(): Promise<void> {
    await this.tesseractProvider.cleanup();
    this.cleanup();
    this.logger.info('OCRService destruido');
  }
}