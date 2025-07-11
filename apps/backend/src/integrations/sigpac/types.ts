// types.ts - Tipos para la integración SIGPAC
export interface SIGPACReferencia {
  provincia: string;
  municipio: string;
  agregado: string;
  zona: string;
  parcela: string;
  recinto: string;
  full: string; // Referencia completa: "28:079:0001:00001:0001:WI"
}

export interface SIGPACParcela {
  referencia: SIGPACReferencia;
  geometria: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  superficie: number; // en hectáreas
  cultivo?: string;
  uso_sigpac?: string;
  region_geometrica?: number;
  coef_regadio?: number;
  pendiente_media?: number;
  coordenadas_centroide: {
    lat: number;
    lng: number;
  };
  fuente: 'WMS' | 'SCRAPING' | 'LOCAL' | 'MANUAL';
  fecha_consulta: Date;
  confianza: number; // 0-1
}

export interface WMSResponse {
  type: 'FeatureCollection';
  features: WMSFeature[];
}

export interface WMSFeature {
  type: 'Feature';
  geometry: {
    type: string;
    coordinates: any;
  };
  properties: {
    DN_PK?: string;
    SUPERFICIE?: number;
    USO_SIGPAC?: string;
    COEF_REGADIO?: number;
    PENDIENTE_MEDIA?: number;
    [key: string]: any;
  };
}

export interface SIGPACError extends Error {
  code: 'INVALID_REFERENCE' | 'WMS_ERROR' | 'NOT_FOUND' | 'RATE_LIMITED' | 'NETWORK_ERROR';
  reference?: string;
  details?: any;
}

export interface SIGPACConfig {
  enableScraping: boolean;
  maxRequestsPerHour: number;
  cacheTimeoutDays: number;
  endpoints: {
    wms_nacional: string;
    wms_andalucia?: string;
    wms_castilla_leon?: string;
    wms_cataluna?: string;
  };
}

export interface WMSEndpoint {
  name: string;
  url: string;
  version: string;
  layers: string[];
  supported_provinces?: string[];
}