// wmsClient.ts - Cliente WMS para consultar servicios SIGPAC
import fetch from 'node-fetch';
import { SIGPACReferencia, SIGPACParcela, WMSResponse, WMSFeature, SIGPACError } from './types';
import { SIGPACReferenceParser } from './referenceParser';

export class SIGPACWMSClient {
  private readonly logger: any;
  
  private readonly WMS_ENDPOINTS = {
    nacional: 'https://wms.mapama.gob.es/sig/redes/wms.aspx',
    andalucia: 'https://www.juntadeandalucia.es/medioambiente/sigpac/wms',
    castilla_leon: 'http://servicios.jcyl.es/wms/wms_sigpac',
    cataluna: 'https://sig.gencat.cat/cgi-bin/wms/wms_sigpac',
    valencia: 'https://terrasit.gva.es/sigpac/wms'
  };

  constructor(logger: any) {
    this.logger = logger;
  }

  /**
   * Obtiene la geometría de una parcela SIGPAC por referencia catastral
   */
  async getParcelaGeometry(referencia: string | SIGPACReferencia): Promise<SIGPACParcela | null> {
    const parsedRef = typeof referencia === 'string' 
      ? SIGPACReferenceParser.parse(referencia)
      : referencia;

    this.logger.info('Consultando geometría SIGPAC', { referencia: parsedRef.full });

    try {
      // Intentar endpoint nacional primero
      let result = await this.queryWMS('nacional', parsedRef);
      
      if (!result) {
        // Fallback a endpoints autonómicos según la provincia
        const autonomia = this.getEndpointByProvincia(parsedRef.provincia);
        if (autonomia && autonomia !== 'nacional') {
          this.logger.info('Fallback a endpoint autonómico', { autonomia, provincia: parsedRef.provincia });
          result = await this.queryWMS(autonomia, parsedRef);
        }
      }

      if (result) {
        this.logger.info('Geometría SIGPAC obtenida exitosamente', { 
          referencia: parsedRef.full,
          superficie: result.superficie,
          fuente: result.fuente
        });
      }

      return result;

    } catch (error) {
      this.logger.error('Error consultando SIGPAC WMS', { 
        referencia: parsedRef.full, 
        error: error.message 
      });
      throw this.createError('WMS_ERROR', `Error en consulta WMS: ${error.message}`, parsedRef.full);
    }
  }

  /**
   * Consulta un endpoint WMS específico
   */
  private async queryWMS(endpoint: keyof typeof this.WMS_ENDPOINTS, referencia: SIGPACReferencia): Promise<SIGPACParcela | null> {
    const wmsUrl = this.buildWMSUrl(endpoint, referencia);
    
    this.logger.debug('Consultando WMS', { endpoint, url: wmsUrl });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(wmsUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'CuadernoCampoGPS/1.0 (+https://cuadernocampo.es)',
          'Accept': 'application/json, application/geo+json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          this.logger.warn('Parcela no encontrada en WMS', { endpoint, referencia: referencia.full });
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      
      if (!contentType.includes('json')) {
        this.logger.warn('Respuesta WMS no es JSON', { endpoint, contentType });
        return null;
      }

      const geoJSON: WMSResponse = await response.json();
      return this.transformWMSResponse(geoJSON, referencia, endpoint);

    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
        throw new Error(`Timeout consultando endpoint ${endpoint}`);
      }
      throw error;
    }
  }

  /**
   * Construye la URL de consulta WMS
   */
  private buildWMSUrl(endpoint: keyof typeof this.WMS_ENDPOINTS, referencia: SIGPACReferencia): string {
    const baseUrl = this.WMS_ENDPOINTS[endpoint];
    
    const wmsParams = new URLSearchParams({
      SERVICE: 'WMS',
      VERSION: '1.3.0',
      REQUEST: 'GetFeature',
      OUTPUTFORMAT: 'application/json',
      SRSNAME: 'EPSG:4326'
    });

    // Parámetros específicos según el endpoint
    switch (endpoint) {
      case 'nacional':
        wmsParams.set('TYPENAME', 'Recintos');
        wmsParams.set('CQL_FILTER', this.buildNacionalFilter(referencia));
        break;
        
      case 'andalucia':
        wmsParams.set('LAYERS', 'SIGPAC:Recintos');
        wmsParams.set('CQL_FILTER', this.buildAndaluciaFilter(referencia));
        break;
        
      case 'castilla_leon':
        wmsParams.set('LAYERS', 'sigpac:recintos');
        wmsParams.set('FILTER', this.buildCastillaLeonFilter(referencia));
        break;
        
      default:
        wmsParams.set('TYPENAME', 'Recintos');
        wmsParams.set('CQL_FILTER', this.buildGenericFilter(referencia));
    }

    return `${baseUrl}?${wmsParams.toString()}`;
  }

  /**
   * Filtro para endpoint nacional
   */
  private buildNacionalFilter(ref: SIGPACReferencia): string {
    return `DN_PK='${ref.provincia}${ref.municipio}${ref.agregado}${ref.zona}${ref.parcela}${ref.recinto}'`;
  }

  /**
   * Filtro para Andalucía
   */
  private buildAndaluciaFilter(ref: SIGPACReferencia): string {
    return `PROVINCIA='${ref.provincia}' AND MUNICIPIO='${ref.municipio}' AND AGREGADO='${ref.agregado}' AND ZONA='${ref.zona}' AND PARCELA='${ref.parcela}' AND RECINTO='${ref.recinto}'`;
  }

  /**
   * Filtro para Castilla y León
   */
  private buildCastillaLeonFilter(ref: SIGPACReferencia): string {
    // Castilla y León usa formato XML Filter
    return `<Filter>
      <And>
        <PropertyIsEqualTo><PropertyName>provincia</PropertyName><Literal>${ref.provincia}</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>municipio</PropertyName><Literal>${ref.municipio}</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>agregado</PropertyName><Literal>${ref.agregado}</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>zona</PropertyName><Literal>${ref.zona}</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>parcela</PropertyName><Literal>${ref.parcela}</Literal></PropertyIsEqualTo>
        <PropertyIsEqualTo><PropertyName>recinto</PropertyName><Literal>${ref.recinto}</Literal></PropertyIsEqualTo>
      </And>
    </Filter>`;
  }

  /**
   * Filtro genérico
   */
  private buildGenericFilter(ref: SIGPACReferencia): string {
    return `provincia='${ref.provincia}' AND municipio='${ref.municipio}' AND agregado='${ref.agregado}' AND zona='${ref.zona}' AND parcela='${ref.parcela}' AND recinto='${ref.recinto}'`;
  }

  /**
   * Transforma la respuesta WMS a formato interno
   */
  private transformWMSResponse(
    geoJSON: WMSResponse, 
    referencia: SIGPACReferencia, 
    endpoint: string
  ): SIGPACParcela | null {
    if (!geoJSON.features || geoJSON.features.length === 0) {
      return null;
    }

    const feature: WMSFeature = geoJSON.features[0];
    
    if (!feature.geometry || !feature.geometry.coordinates) {
      this.logger.warn('Feature sin geometría válida', { referencia: referencia.full });
      return null;
    }

    // Calcular centroide
    const centroide = this.calculateCentroid(feature.geometry);
    
    // Calcular superficie en hectáreas
    const superficie = this.calculateSuperficie(feature.geometry) || 
                      feature.properties.SUPERFICIE || 
                      feature.properties.superficie || 
                      0;

    const parcela: SIGPACParcela = {
      referencia,
      geometria: {
        type: feature.geometry.type as 'Polygon' | 'MultiPolygon',
        coordinates: feature.geometry.coordinates
      },
      superficie: Number(superficie),
      cultivo: feature.properties.CULTIVO || feature.properties.cultivo,
      uso_sigpac: feature.properties.USO_SIGPAC || feature.properties.uso_sigpac,
      region_geometrica: Number(feature.properties.REGION_GEOMETRICA) || undefined,
      coef_regadio: Number(feature.properties.COEF_REGADIO) || undefined,
      pendiente_media: Number(feature.properties.PENDIENTE_MEDIA) || undefined,
      coordenadas_centroide: centroide,
      fuente: 'WMS',
      fecha_consulta: new Date(),
      confianza: 0.9 // Alta confianza para datos oficiales WMS
    };

    return parcela;
  }

  /**
   * Calcula el centroide de una geometría
   */
  private calculateCentroid(geometry: any): { lat: number; lng: number } {
    let coordinates = geometry.coordinates;
    
    // Para MultiPolygon, usar el primer polígono
    if (geometry.type === 'MultiPolygon') {
      coordinates = coordinates[0];
    }
    
    // Para Polygon, usar el anillo exterior
    if (geometry.type === 'Polygon') {
      coordinates = coordinates[0];
    }

    if (!coordinates || !Array.isArray(coordinates)) {
      throw new Error('Coordenadas inválidas para calcular centroide');
    }

    // Calcular centroide promediando coordenadas
    let totalLat = 0;
    let totalLng = 0;
    const numPoints = coordinates.length;

    for (const [lng, lat] of coordinates) {
      totalLat += lat;
      totalLng += lng;
    }

    return {
      lat: totalLat / numPoints,
      lng: totalLng / numPoints
    };
  }

  /**
   * Calcula la superficie aproximada en hectáreas usando fórmula de Shoelace
   */
  private calculateSuperficie(geometry: any): number {
    let coordinates = geometry.coordinates;
    
    if (geometry.type === 'MultiPolygon') {
      coordinates = coordinates[0];
    }
    
    if (geometry.type === 'Polygon') {
      coordinates = coordinates[0];
    }

    if (!coordinates || coordinates.length < 3) {
      return 0;
    }

    // Fórmula de Shoelace para área de polígono
    let area = 0;
    const n = coordinates.length;

    for (let i = 0; i < n - 1; i++) {
      area += coordinates[i][0] * coordinates[i + 1][1];
      area -= coordinates[i + 1][0] * coordinates[i][1];
    }

    area = Math.abs(area) / 2;

    // Convertir de grados cuadrados a hectáreas (aproximado)
    // 1 grado² ≈ 12,100 km² ≈ 1,210,000 hectáreas en latitudes medias españolas
    const hectareas = area * 1210000;

    return hectareas;
  }

  /**
   * Obtiene el endpoint WMS recomendado según la provincia
   */
  private getEndpointByProvincia(codigoProvincia: string): keyof typeof this.WMS_ENDPOINTS {
    const comunidad = SIGPACReferenceParser.getComunidadAutonoma(codigoProvincia);
    
    switch (comunidad) {
      case 'Andalucía':
        return 'andalucia';
      case 'Castilla y León':
        return 'castilla_leon';
      case 'Cataluña':
        return 'cataluna';
      case 'Valencia':
        return 'valencia';
      default:
        return 'nacional';
    }
  }

  /**
   * Crea un error específico de WMS
   */
  private createError(code: SIGPACError['code'], message: string, reference?: string): SIGPACError {
    const error = new Error(message) as SIGPACError;
    error.code = code;
    error.reference = reference;
    error.name = 'SIGPACWMSError';
    return error;
  }

  /**
   * Verifica si un endpoint está disponible
   */
  async healthCheck(endpoint?: keyof typeof this.WMS_ENDPOINTS): Promise<boolean> {
    const endpointsToCheck = endpoint ? [endpoint] : Object.keys(this.WMS_ENDPOINTS) as Array<keyof typeof this.WMS_ENDPOINTS>;
    
    for (const ep of endpointsToCheck) {
      try {
        const healthUrl = `${this.WMS_ENDPOINTS[ep]}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`;
        const response = await fetch(healthUrl, { 
          timeout: 5000,
          method: 'HEAD'
        });
        
        if (!response.ok) {
          this.logger.warn(`Endpoint WMS no disponible: ${ep}`, { status: response.status });
          return false;
        }
      } catch (error) {
        this.logger.warn(`Error verificando endpoint WMS: ${ep}`, { error: error.message });
        return false;
      }
    }
    
    return true;
  }
}