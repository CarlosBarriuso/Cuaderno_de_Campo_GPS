// hooks/useSIGPAC.ts - Hook para integración SIGPAC
import { useState, useCallback } from 'react';
import { api } from '../lib/api';

interface SIGPACParcela {
  referencia: {
    provincia: string;
    municipio: string;
    agregado: string;
    zona: string;
    parcela: string;
    recinto: string;
    full: string;
  };
  superficie: number;
  coordenadas_centroide: {
    lat: number;
    lng: number;
  };
  geometria: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  cultivo?: string;
  uso_sigpac?: string;
  fuente: 'WMS' | 'SCRAPING' | 'LOCAL' | 'MANUAL';
  confianza: number;
  fecha_consulta: string;
  provincia_nombre?: string;
  comunidad_autonoma?: string;
}

interface SIGPACProvincia {
  codigo: string;
  nombre: string;
  comunidad_autonoma: string;
}

interface SIGPACValidation {
  validas: Array<{
    referencia: string;
    detalle: any;
  }>;
  invalidas: Array<{
    referencia: string;
    error: string;
  }>;
}

interface SIGPACError {
  error: string;
  message: string;
  referencia?: string;
}

export const useSIGPAC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener información de una parcela por referencia
  const getParcela = useCallback(async (referencia: string): Promise<SIGPACParcela | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/sigpac/parcela/${encodeURIComponent(referencia)}`);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error obteniendo parcela');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error consultando SIGPAC';
      setError(errorMessage);
      console.error('Error obteniendo parcela SIGPAC:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar parcelas por coordenadas
  const searchByCoordinates = useCallback(async (
    lat: number, 
    lng: number, 
    radius: number = 100
  ): Promise<SIGPACParcela[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/sigpac/parcelas/search', {
        lat,
        lng,
        radius
      });

      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Error buscando parcelas');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error en búsqueda por coordenadas';
      setError(errorMessage);
      console.error('Error buscando parcelas por coordenadas:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Validar múltiples referencias
  const validateReferences = useCallback(async (referencias: string[]): Promise<SIGPACValidation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/sigpac/referencias/validate', {
        referencias
      });

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error validando referencias');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error validando referencias';
      setError(errorMessage);
      console.error('Error validando referencias SIGPAC:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener lista de provincias
  const getProvincias = useCallback(async (): Promise<SIGPACProvincia[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/sigpac/provincias');

      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Error obteniendo provincias');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo provincias';
      setError(errorMessage);
      console.error('Error obteniendo provincias SIGPAC:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Health check del servicio
  const checkHealth = useCallback(async () => {
    try {
      const response = await api.get('/sigpac/health');
      return response.data;
    } catch (err: any) {
      console.error('Error en health check SIGPAC:', err);
      return { status: 'unhealthy', error: err.message };
    }
  }, []);

  // Validar formato de referencia localmente
  const validateReferenceFormat = useCallback((referencia: string): { valid: boolean; error?: string } => {
    if (!referencia || typeof referencia !== 'string') {
      return { valid: false, error: 'Referencia vacía o inválida' };
    }

    // Limpiar referencia
    const cleanRef = referencia.trim().toUpperCase().replace(/\s/g, '');

    // Validar formato básico: PP:MMM:AAAA:ZZZZZ:PPPP:RR
    const pattern = /^\d{2}:\d{3}:\d{4}:\d{5}:\d{4}:[A-Z0-9]{2}$/;
    
    if (!pattern.test(cleanRef)) {
      return { 
        valid: false, 
        error: 'Formato inválido. Debe ser: PP:MMM:AAAA:ZZZZZ:PPPP:RR' 
      };
    }

    const parts = cleanRef.split(':');
    const [provincia, municipio, agregado, zona, parcela, recinto] = parts;

    // Validar provincia (01-52)
    const provCode = parseInt(provincia, 10);
    if (provCode < 1 || provCode > 52) {
      return { valid: false, error: 'Código de provincia inválido (01-52)' };
    }

    // Validar municipio (001-999)
    const munCode = parseInt(municipio, 10);
    if (munCode < 1 || munCode > 999) {
      return { valid: false, error: 'Código de municipio inválido (001-999)' };
    }

    // Validar recinto (alfanumérico)
    if (!/^[A-Z0-9]{2}$/.test(recinto)) {
      return { valid: false, error: 'Código de recinto inválido (2 caracteres alfanuméricos)' };
    }

    return { valid: true };
  }, []);

  // Obtener nombre de provincia por código
  const getProvinciaNombre = useCallback((codigo: string): string | null => {
    const provincias: Record<string, string> = {
      '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
      '05': 'Ávila', '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona',
      '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
      '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca',
      '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
      '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
      '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
      '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
      '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
      '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
      '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
      '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
      '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta', '52': 'Melilla'
    };

    return provincias[codigo] || null;
  }, []);

  // Parsear referencia en componentes
  const parseReference = useCallback((referencia: string) => {
    const validation = validateReferenceFormat(referencia);
    if (!validation.valid) {
      return null;
    }

    const cleanRef = referencia.trim().toUpperCase().replace(/\s/g, '');
    const parts = cleanRef.split(':');

    return {
      provincia: parts[0],
      municipio: parts[1],
      agregado: parts[2],
      zona: parts[3],
      parcela: parts[4],
      recinto: parts[5],
      full: cleanRef,
      provincia_nombre: getProvinciaNombre(parts[0])
    };
  }, [validateReferenceFormat, getProvinciaNombre]);

  return {
    // Estados
    loading,
    error,

    // Métodos principales
    getParcela,
    searchByCoordinates,
    validateReferences,
    getProvincias,
    checkHealth,

    // Utilidades
    validateReferenceFormat,
    getProvinciaNombre,
    parseReference,

    // Helper para limpiar errores
    clearError: useCallback(() => setError(null), [])
  };
};