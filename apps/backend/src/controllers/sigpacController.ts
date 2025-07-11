// sigpacController.ts - Controlador para endpoints SIGPAC
import { Request, Response, NextFunction } from 'express';
import { SIGPACService } from '../integrations/sigpac/sigpacService';
import { SIGPACReferenceParser } from '../integrations/sigpac/referenceParser';

export class SIGPACController {
  private sigpacService: SIGPACService;
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
    this.sigpacService = new SIGPACService(logger, {
      enableScraping: process.env.ENABLE_SIGPAC_SCRAPING === 'true',
      maxRequestsPerHour: parseInt(process.env.SIGPAC_RATE_LIMIT || '100'),
      cacheTimeoutDays: 30
    });
  }

  /**
   * GET /api/sigpac/parcela/:referencia
   * Obtiene información de una parcela por referencia catastral
   */
  async getParcela(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { referencia } = req.params;

      if (!referencia) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Referencia catastral requerida'
        });
        return;
      }

      this.logger.info('Solicitud consulta SIGPAC', { 
        referencia,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      const parcela = await this.sigpacService.getParcelaByReferencia(referencia);

      res.json({
        success: true,
        data: {
          referencia: parcela.referencia,
          superficie: parcela.superficie,
          coordenadas_centroide: parcela.coordenadas_centroide,
          geometria: parcela.geometria,
          cultivo: parcela.cultivo,
          uso_sigpac: parcela.uso_sigpac,
          fuente: parcela.fuente,
          confianza: parcela.confianza,
          fecha_consulta: parcela.fecha_consulta,
          provincia_nombre: SIGPACReferenceParser.getProvinciaNombre(parcela.referencia.provincia),
          comunidad_autonoma: SIGPACReferenceParser.getComunidadAutonoma(parcela.referencia.provincia)
        },
        meta: {
          timestamp: new Date(),
          fuente: parcela.fuente,
          confianza: parcela.confianza
        }
      });

    } catch (error) {
      this.logger.error('Error consultando parcela SIGPAC', { 
        referencia: req.params.referencia,
        error: error.message,
        stack: error.stack
      });

      if (error.name === 'SIGPACError') {
        res.status(400).json({
          error: error.code,
          message: error.message,
          referencia: error.reference
        });
      } else {
        next(error);
      }
    }
  }

  /**
   * POST /api/sigpac/parcelas/search
   * Busca parcelas por coordenadas geográficas
   */
  async searchByCoordinates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lat, lng, radius = 100 } = req.body;

      if (!lat || !lng || typeof lat !== 'number' || typeof lng !== 'number') {
        res.status(400).json({
          error: 'INVALID_COORDINATES',
          message: 'Coordenadas lat/lng válidas requeridas'
        });
        return;
      }

      if (lat < 27 || lat > 44 || lng < -18 || lng > 5) {
        res.status(400).json({
          error: 'COORDINATES_OUT_OF_BOUNDS',
          message: 'Coordenadas fuera del territorio español'
        });
        return;
      }

      this.logger.info('Búsqueda SIGPAC por coordenadas', { lat, lng, radius });

      const parcelas = await this.sigpacService.findParcelasByCoordinates(lat, lng, radius);

      res.json({
        success: true,
        data: parcelas.map(parcela => ({
          referencia: parcela.referencia.full,
          superficie: parcela.superficie,
          coordenadas_centroide: parcela.coordenadas_centroide,
          cultivo: parcela.cultivo,
          fuente: parcela.fuente,
          confianza: parcela.confianza
        })),
        meta: {
          total: parcelas.length,
          coordenadas_consulta: { lat, lng },
          radio_metros: radius,
          timestamp: new Date()
        }
      });

    } catch (error) {
      this.logger.error('Error en búsqueda por coordenadas', { 
        body: req.body,
        error: error.message 
      });
      next(error);
    }
  }

  /**
   * POST /api/sigpac/referencias/validate
   * Valida múltiples referencias catastrales
   */
  async validateReferencias(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { referencias } = req.body;

      if (!Array.isArray(referencias) || referencias.length === 0) {
        res.status(400).json({
          error: 'INVALID_REQUEST',
          message: 'Array de referencias requerido'
        });
        return;
      }

      if (referencias.length > 100) {
        res.status(400).json({
          error: 'TOO_MANY_REFERENCES',
          message: 'Máximo 100 referencias por solicitud'
        });
        return;
      }

      this.logger.info('Validación batch referencias SIGPAC', { count: referencias.length });

      const validation = await this.sigpacService.validateReferenciasBatch(referencias);

      res.json({
        success: true,
        data: {
          validas: validation.valid.map(ref => ({
            referencia: ref,
            detalle: this.getReferenciaDetails(ref)
          })),
          invalidas: validation.invalid.map(ref => ({
            referencia: ref,
            error: validation.errors[ref]
          }))
        },
        meta: {
          total: referencias.length,
          validas: validation.valid.length,
          invalidas: validation.invalid.length,
          timestamp: new Date()
        }
      });

    } catch (error) {
      this.logger.error('Error validando referencias', { 
        count: req.body?.referencias?.length,
        error: error.message 
      });
      next(error);
    }
  }

  /**
   * GET /api/sigpac/health
   * Health check del servicio SIGPAC
   */
  async healthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await this.sigpacService.healthCheck();
      const stats = await this.sigpacService.getServiceStats();

      res.status(health.status === 'healthy' ? 200 : 503).json({
        status: health.status,
        details: health.details,
        stats,
        timestamp: new Date()
      });

    } catch (error) {
      this.logger.error('Error en health check SIGPAC', error);
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * GET /api/sigpac/provincias
   * Lista de provincias con códigos SIGPAC
   */
  async getProvincias(req: Request, res: Response): Promise<void> {
    const provincias = [];
    
    for (let i = 1; i <= 52; i++) {
      const codigo = i.toString().padStart(2, '0');
      const nombre = SIGPACReferenceParser.getProvinciaNombre(codigo);
      const comunidad = SIGPACReferenceParser.getComunidadAutonoma(codigo);
      
      if (nombre) {
        provincias.push({
          codigo,
          nombre,
          comunidad_autonoma: comunidad
        });
      }
    }

    res.json({
      success: true,
      data: provincias,
      meta: {
        total: provincias.length,
        timestamp: new Date()
      }
    });
  }

  /**
   * GET /api/sigpac/test
   * Endpoint de prueba con referencias de ejemplo
   */
  async getTestReferences(req: Request, res: Response): Promise<void> {
    const testRefs = SIGPACReferenceParser.generateTestReferences();
    
    res.json({
      success: true,
      data: testRefs.map(ref => {
        const parsed = SIGPACReferenceParser.parse(ref);
        return {
          referencia: ref,
          provincia: {
            codigo: parsed.provincia,
            nombre: SIGPACReferenceParser.getProvinciaNombre(parsed.provincia),
            comunidad: SIGPACReferenceParser.getComunidadAutonoma(parsed.provincia)
          },
          municipio: parsed.municipio,
          agregado: parsed.agregado,
          zona: parsed.zona,
          parcela: parsed.parcela,
          recinto: parsed.recinto
        };
      }),
      meta: {
        total: testRefs.length,
        descripcion: 'Referencias de prueba para testing',
        timestamp: new Date()
      }
    });
  }

  /**
   * Obtiene detalles adicionales de una referencia
   */
  private getReferenciaDetails(referencia: string) {
    try {
      const parsed = SIGPACReferenceParser.parse(referencia);
      return {
        provincia: {
          codigo: parsed.provincia,
          nombre: SIGPACReferenceParser.getProvinciaNombre(parsed.provincia)
        },
        comunidad_autonoma: SIGPACReferenceParser.getComunidadAutonoma(parsed.provincia),
        componentes: {
          municipio: parsed.municipio,
          agregado: parsed.agregado,
          zona: parsed.zona,
          parcela: parsed.parcela,
          recinto: parsed.recinto
        }
      };
    } catch (error) {
      return null;
    }
  }
}