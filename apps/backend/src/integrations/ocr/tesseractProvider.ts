// tesseractProvider.ts - Proveedor OCR usando Tesseract.js (libre)
import { createWorker } from 'tesseract.js';
import { OCRResult, ProductInfo } from './types';
import { AgriculturalPatternMatcher } from './patternMatcher';
import sharp from 'sharp';

export class TesseractOCRProvider {
  private worker: any = null;
  private patternMatcher: AgriculturalPatternMatcher;
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
    this.patternMatcher = new AgriculturalPatternMatcher();
  }

  /**
   * Inicializa el worker de Tesseract
   */
  async initialize(): Promise<void> {
    if (this.worker) {
      return; // Ya inicializado
    }

    try {
      this.logger.info('Inicializando Tesseract OCR worker...');
      
      this.worker = await createWorker({
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`Tesseract progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });

      await this.worker.loadLanguage('spa+eng'); // Español e inglés
      await this.worker.initialize('spa+eng');
      
      // Configurar parámetros optimizados para etiquetas de productos
      await this.worker.setParameters({
        'tessedit_char_whitelist': 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,%-/:° ',
        'tessedit_pageseg_mode': '6', // Assume a single uniform block of text
        'tessedit_ocr_engine_mode': '1' // Neural nets LSTM engine only
      });

      this.logger.info('Tesseract OCR worker inicializado exitosamente');
    } catch (error) {
      this.logger.error('Error inicializando Tesseract worker:', error);
      throw error;
    }
  }

  /**
   * Procesa una imagen y extrae texto
   */
  async processImage(imageBuffer: Buffer, options: any = {}): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      // Asegurar que el worker esté inicializado
      await this.initialize();

      // Optimizar imagen para mejor OCR
      const optimizedImage = await this.optimizeImageForOCR(imageBuffer);

      this.logger.info('Iniciando reconocimiento OCR con Tesseract');

      // Procesar imagen con Tesseract
      const result = await this.worker.recognize(optimizedImage);
      
      const processingTime = Date.now() - startTime;
      
      if (!result.data.text || result.data.text.trim().length === 0) {
        return {
          success: false,
          confidence: 0,
          raw_text: '',
          error: 'No se detectó texto en la imagen',
          processing_time: processingTime
        };
      }

      // Extraer información específica del producto
      const { productInfo, confidence: patternConfidence } = this.patternMatcher.extractProductInfo(result.data.text);

      // Combinar confianza de Tesseract con confianza de patrones
      const tesseractConfidence = result.data.confidence / 100; // Tesseract da 0-100
      const combinedConfidence = (tesseractConfidence * 0.3) + (patternConfidence * 0.7);

      this.logger.info('OCR completado', {
        processing_time: processingTime,
        text_length: result.data.text.length,
        tesseract_confidence: tesseractConfidence,
        pattern_confidence: patternConfidence,
        combined_confidence: combinedConfidence
      });

      return {
        success: true,
        confidence: combinedConfidence,
        raw_text: result.data.text,
        product_info: productInfo,
        processing_time: processingTime,
        bounding_boxes: this.extractBoundingBoxes(result.data)
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Error en procesamiento OCR:', error);
      
      return {
        success: false,
        confidence: 0,
        raw_text: '',
        error: `Error OCR: ${error.message}`,
        processing_time: processingTime
      };
    }
  }

  /**
   * Optimiza imagen para mejor reconocimiento OCR
   */
  private async optimizeImageForOCR(imageBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        // Redimensionar si es muy grande (máximo 2000px en cualquier dimensión)
        .resize(2000, 2000, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        // Mejorar contraste
        .normalize()
        // Convertir a escala de grises para mejor OCR
        .grayscale()
        // Aumentar nitidez para texto más claro
        .sharpen(2, 1, 0.5)
        // Optimizar compresión
        .png({ 
          quality: 90,
          compressionLevel: 6 
        })
        .toBuffer();
    } catch (error) {
      this.logger.warn('Error optimizando imagen, usando original:', error);
      return imageBuffer;
    }
  }

  /**
   * Extrae bounding boxes de palabras detectadas
   */
  private extractBoundingBoxes(tesseractData: any): Array<any> {
    if (!tesseractData.words) {
      return [];
    }

    return tesseractData.words
      .filter((word: any) => word.confidence > 30) // Solo palabras con confianza > 30%
      .map((word: any) => ({
        text: word.text,
        confidence: word.confidence / 100,
        coordinates: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        }
      }));
  }

  /**
   * Verifica el estado del proveedor
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.initialize();
      return this.worker !== null;
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Libera recursos del worker
   */
  async cleanup(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
        this.worker = null;
        this.logger.info('Tesseract worker terminado');
      } catch (error) {
        this.logger.error('Error terminando Tesseract worker:', error);
      }
    }
  }

  /**
   * Obtiene información del proveedor
   */
  getProviderInfo(): any {
    return {
      name: 'Tesseract.js',
      version: '4.x',
      languages: ['spa', 'eng'],
      offline: true,
      free: true,
      status: this.worker ? 'ready' : 'not_initialized'
    };
  }

  /**
   * Configura parámetros específicos de Tesseract
   */
  async configure(options: any): Promise<void> {
    if (!this.worker) {
      await this.initialize();
    }

    const parameters: any = {};

    // Configurar lista de caracteres permitidos
    if (options.allowedChars) {
      parameters['tessedit_char_whitelist'] = options.allowedChars;
    }

    // Configurar modo de segmentación de página
    if (options.pageSegMode) {
      parameters['tessedit_pageseg_mode'] = options.pageSegMode.toString();
    }

    // Configurar modo del motor OCR
    if (options.ocrEngineMode) {
      parameters['tessedit_ocr_engine_mode'] = options.ocrEngineMode.toString();
    }

    // Aplicar parámetros
    if (Object.keys(parameters).length > 0) {
      await this.worker.setParameters(parameters);
      this.logger.info('Parámetros Tesseract configurados:', parameters);
    }
  }

  /**
   * Procesa múltiples imágenes en batch
   */
  async processBatch(images: Buffer[]): Promise<OCRResult[]> {
    const results: OCRResult[] = [];
    
    for (let i = 0; i < images.length; i++) {
      this.logger.info(`Procesando imagen ${i + 1}/${images.length}`);
      const result = await this.processImage(images[i]);
      results.push(result);
    }

    return results;
  }
}