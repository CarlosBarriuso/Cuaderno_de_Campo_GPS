// sigpacService.ts - Servicio principal para integración SIGPAC
import { SIGPACReferencia, SIGPACParcela, SIGPACError, SIGPACConfig } from './types';
import { SIGPACReferenceParser } from './referenceParser';
import { SIGPACWMSClient } from './wmsClient';

export class SIGPACService {
  private readonly wmsClient: SIGPACWMSClient;
  private readonly logger: any;
  private readonly config: SIGPACConfig;

  constructor(
    logger: any,
    config: Partial<SIGPACConfig> = {}
  ) {
    this.logger = logger;
    this.wmsClient = new SIGPACWMSClient(logger);
    
    this.config = {
      enableScraping: config.enableScraping ?? false,
      maxRequestsPerHour: config.maxRequestsPerHour ?? 100,
      cacheTimeoutDays: config.cacheTimeoutDays ?? 30,
      endpoints: {
        wms_nacional: config.endpoints?.wms_nacional ?? 'https://wms.mapama.gob.es/sig/redes/wms.aspx',
        ...config.endpoints
      }
    };

    this.logger.info('SIGPACService iniciado', { 
      enableScraping: this.config.enableScraping,
      maxRequestsPerHour: this.config.maxRequestsPerHour 
    });
  }

  /**
   * Obtiene información de una parcela por referencia catastral
   * Implementa strategy pattern con fallbacks
   */
  async getParcelaByReferencia(referencia: string): Promise<SIGPACParcela> {
    // 1. Validar y parsear referencia
    const parsedRef = SIGPACReferenceParser.parse(referencia);
    
    this.logger.info('Consultando parcela SIGPAC', { 
      referencia: parsedRef.full,
      provincia: SIGPACReferenceParser.getProvinciaNombre(parsedRef.provincia),
      comunidad: SIGPACReferenceParser.getComunidadAutonoma(parsedRef.provincia)
    });

    // 2. Verificar cache local
    const cached = await this.getCachedParcela(parsedRef.full);
    if (cached && this.isCacheValid(cached)) {
      this.logger.info('Parcela servida desde cache', { referencia: parsedRef.full });
      return cached;
    }

    // 3. Intentar obtener desde WMS (método preferido)
    try {
      const wmsResult = await this.wmsClient.getParcelaGeometry(parsedRef);
      if (wmsResult) {
        await this.cacheParcela(parsedRef.full, wmsResult);
        return wmsResult;
      }
    } catch (error) {
      this.logger.warn('Consulta WMS falló, intentando métodos alternativos', { 
        referencia: parsedRef.full, 
        error: error.message 
      });
    }

    // 4. Buscar en base de datos local (datos previos)
    const localResult = await this.getLocalParcela(parsedRef.full);
    if (localResult) {
      this.logger.info('Parcela servida desde base de datos local', { referencia: parsedRef.full });
      return localResult;
    }

    // 5. Si todo falla, crear entrada manual placeholder
    const manualEntry = this.createManualEntry(parsedRef);
    this.logger.warn('Parcela no encontrada en fuentes oficiales, creando entrada manual', { 
      referencia: parsedRef.full 
    });
    
    return manualEntry;
  }

  /**
   * Búsqueda de parcelas por coordenadas geográficas
   */
  async findParcelasByCoordinates(lat: number, lng: number, radius: number = 100): Promise<SIGPACParcela[]> {
    this.logger.info('Buscando parcelas por coordenadas', { lat, lng, radius });

    try {
      // Consultar WMS con bbox alrededor de las coordenadas
      const parcelas = await this.searchParcelasByBbox(lat, lng, radius);
      
      if (parcelas.length > 0) {
        this.logger.info('Parcelas encontradas por coordenadas', { 
          count: parcelas.length,
          lat, lng 
        });
      }

      return parcelas;
    } catch (error) {
      this.logger.error('Error buscando parcelas por coordenadas', { lat, lng, error: error.message });
      return [];
    }
  }

  /**
   * Búsqueda de parcelas en un área (bounding box)
   */
  private async searchParcelasByBbox(lat: number, lng: number, radiusMeters: number): Promise<SIGPACParcela[]> {
    // Convertir radio en metros a grados (aproximado)
    const radiusDegrees = radiusMeters / 111000; // 1 grado ≈ 111km
    
    const bbox = {
      minLat: lat - radiusDegrees,
      maxLat: lat + radiusDegrees,
      minLng: lng - radiusDegrees,
      maxLng: lng + radiusDegrees
    };

    // Aquí implementaríamos la consulta WMS con BBOX
    // Por ahora retornamos array vacío como placeholder
    this.logger.debug('Búsqueda por BBOX', { bbox });
    return [];
  }

  /**
   * Validar múltiples referencias en batch
   */
  async validateReferenciasBatch(referencias: string[]): Promise<{ valid: string[], invalid: string[], errors: Record<string, string> }> {
    const valid: string[] = [];
    const invalid: string[] = [];
    const errors: Record<string, string> = {};

    for (const ref of referencias) {
      try {
        SIGPACReferenceParser.parse(ref);
        valid.push(ref);
      } catch (error) {
        invalid.push(ref);
        errors[ref] = error.message;
      }
    }

    this.logger.info('Validación batch completada', { 
      total: referencias.length,
      valid: valid.length,
      invalid: invalid.length 
    });

    return { valid, invalid, errors };
  }

  /**
   * Obtener estadísticas de uso del servicio
   */
  async getServiceStats(): Promise<any> {
    return {
      totalConsultas: await this.getTotalConsultas(),
      consultasHoy: await this.getConsultasHoy(),
      cacheHitRate: await this.getCacheHitRate(),
      endpointHealth: await this.getEndpointHealth(),
      ultimaActualizacion: new Date()
    };
  }

  /**
   * Health check del servicio completo
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy', details: any }> {
    const checks = {
      wmsNacional: false,
      wmsAutonomicos: false,
      cache: false,
      database: false
    };

    try {
      // Verificar WMS endpoints
      checks.wmsNacional = await this.wmsClient.healthCheck('nacional');
      checks.wmsAutonomicos = await this.wmsClient.healthCheck('andalucia');
      
      // Verificar cache (implementar según cache usado)
      checks.cache = await this.checkCacheHealth();
      
      // Verificar base de datos
      checks.database = await this.checkDatabaseHealth();

      const healthyCount = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === totalChecks) {
        status = 'healthy';
      } else if (healthyCount >= totalChecks / 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, details: checks };

    } catch (error) {
      this.logger.error('Error en health check SIGPAC', error);
      return { 
        status: 'unhealthy', 
        details: { ...checks, error: error.message } 
      };
    }
  }

  // Métodos privados de utilidad

  private async getCachedParcela(referencia: string): Promise<SIGPACParcela | null> {
    // Implementar según sistema de cache elegido (Redis, etc.)
    // Por ahora retorna null
    return null;
  }

  private isCacheValid(parcela: SIGPACParcela): boolean {
    const cacheAge = Date.now() - parcela.fecha_consulta.getTime();
    const maxAge = this.config.cacheTimeoutDays * 24 * 60 * 60 * 1000;
    return cacheAge < maxAge;
  }

  private async cacheParcela(referencia: string, parcela: SIGPACParcela): Promise<void> {
    // Implementar caching
    // También guardar en base de datos para futuras consultas offline
    this.logger.debug('Cacheando parcela', { referencia });
  }

  private async getLocalParcela(referencia: string): Promise<SIGPACParcela | null> {
    // Implementar consulta a base de datos local
    return null;
  }

  private createManualEntry(referencia: SIGPACReferencia): SIGPACParcela {
    // Crear entrada básica que el usuario puede completar manualmente
    return {
      referencia,
      geometria: {
        type: 'Polygon',
        coordinates: [[[]]] // Geometría vacía
      },
      superficie: 0,
      coordenadas_centroide: { lat: 0, lng: 0 },
      fuente: 'MANUAL',
      fecha_consulta: new Date(),
      confianza: 0.1 // Baja confianza para entradas manuales
    };
  }

  private async getTotalConsultas(): Promise<number> {
    // Implementar según sistema de métricas
    return 0;
  }

  private async getConsultasHoy(): Promise<number> {
    // Implementar según sistema de métricas
    return 0;
  }

  private async getCacheHitRate(): Promise<number> {
    // Implementar según sistema de métricas
    return 0;
  }

  private async getEndpointHealth(): Promise<Record<string, boolean>> {
    // Implementar health check endpoints
    return {};
  }

  private async checkCacheHealth(): Promise<boolean> {
    // Implementar verificación de cache
    return true;
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    // Implementar verificación de base de datos
    return true;
  }

  /**
   * Crear error específico de SIGPAC
   */
  private createError(code: SIGPACError['code'], message: string, reference?: string): SIGPACError {
    const error = new Error(message) as SIGPACError;
    error.code = code;
    error.reference = reference;
    error.name = 'SIGPACServiceError';
    return error;
  }
}