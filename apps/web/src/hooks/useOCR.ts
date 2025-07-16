// hooks/useOCR.ts - Hook para integración OCR
import { useState, useCallback } from 'react';
import { apiClient } from '../lib/api';

interface ProductInfo {
  nombre_comercial?: string;
  fabricante?: string;
  tipo?: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'acaricida' | 'otros';
  principios_activos?: Array<{
    nombre: string;
    concentracion: string;
    unidad: string;
  }>;
  numero_registro?: string;
  dosis_recomendada?: string;
  unidad_dosis?: string;
  composicion?: {
    nitrogeno?: number;
    fosforo?: number;
    potasio?: number;
    azufre?: number;
    micronutrientes?: Array<{
      elemento: string;
      concentracion: number;
      unidad: string;
    }>;
  };
  plazo_seguridad?: number;
  categoria_toxicologica?: string;
  fecha_caducidad?: string;
  contenido_envase?: string;
  lote?: string;
}

interface OCRResult {
  success: boolean;
  text: string;
  confidence: number;
  product_info?: ProductInfo;
  processing_time?: number;
  bounding_boxes?: number;
}

interface OCRJobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  result?: OCRResult;
  error?: string;
  metadata?: {
    filename?: string;
    file_size: number;
    provider_used?: string;
    processing_time?: number;
  };
}

export const useOCR = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Procesar una sola imagen
  const processImage = useCallback(async (
    file: File, 
    options: {
      extractProductInfo?: boolean;
      enhanceImage?: boolean;
    } = {}
  ): Promise<OCRResult | null> => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Validar archivo
      if (!file) {
        throw new Error('No se proporcionó archivo');
      }

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no soportado. Use JPEG, PNG, WebP o TIFF');
      }

      // Validar tamaño (10MB máximo)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Archivo demasiado grande. Máximo 10MB');
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('image', file);
      formData.append('extract_product_info', options.extractProductInfo !== false ? 'true' : 'false');
      formData.append('enhance_image', options.enhanceImage !== false ? 'true' : 'false');

      setProgress(25);

      const response = await apiClient.post('/ocr/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProgress(100);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error procesando imagen');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error procesando imagen';
      setError(errorMessage);
      console.error('Error OCR:', err);
      return null;
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  // Procesar múltiples imágenes
  const processBatch = useCallback(async (files: FileList | File[]): Promise<OCRResult[]> => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      const fileArray = Array.from(files);

      if (fileArray.length === 0) {
        throw new Error('No se proporcionaron archivos');
      }

      if (fileArray.length > 5) {
        throw new Error('Máximo 5 imágenes por lote');
      }

      // Validar todos los archivos
      for (const file of fileArray) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(`Archivo ${file.name}: tipo no soportado`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Archivo ${file.name}: demasiado grande (máximo 10MB)`);
        }
      }

      const formData = new FormData();
      fileArray.forEach(file => {
        formData.append('images', file);
      });

      setProgress(25);

      const response = await apiClient.post('/ocr/batch', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProgress(100);

      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Error procesando imágenes');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error procesando imágenes';
      setError(errorMessage);
      console.error('Error OCR batch:', err);
      return [];
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  // Crear job asíncrono
  const createJob = useCallback(async (file: File): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/ocr/job', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        return response.data.data.job_id;
      } else {
        throw new Error(response.data.message || 'Error creando job');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error creando job';
      setError(errorMessage);
      console.error('Error creando job OCR:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estado de job
  const getJobStatus = useCallback(async (jobId: string): Promise<OCRJobStatus | null> => {
    try {
      const response = await apiClient.get(`/ocr/job/${jobId}`);

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Error obteniendo estado de job');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo estado de job';
      setError(errorMessage);
      console.error('Error obteniendo estado de job:', err);
      return null;
    }
  }, []);

  // Obtener patrones disponibles
  const getPatterns = useCallback(async () => {
    try {
      const response = await apiClient.get('/ocr/patterns');

      if (response.data.success) {
        return response.data.data || [];
      } else {
        throw new Error(response.data.message || 'Error obteniendo patrones');
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error obteniendo patrones';
      setError(errorMessage);
      console.error('Error obteniendo patrones OCR:', err);
      return [];
    }
  }, []);

  // Health check del servicio
  const checkHealth = useCallback(async () => {
    try {
      const response = await apiClient.get('/ocr/health');
      return response.data;
    } catch (err: any) {
      console.error('Error en health check OCR:', err);
      return { status: 'unhealthy', error: err.message };
    }
  }, []);

  // Test del servicio
  const testOCR = useCallback(async () => {
    try {
      const response = await apiClient.post('/ocr/test');
      return response.data;
    } catch (err: any) {
      console.error('Error en test OCR:', err);
      return { success: false, error: err.message };
    }
  }, []);

  // Validar archivo localmente
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!file) {
      return { valid: false, error: 'No se proporcionó archivo' };
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'];
    if (!allowedTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: 'Tipo de archivo no soportado. Use JPEG, PNG, WebP o TIFF' 
      };
    }

    if (file.size > 10 * 1024 * 1024) {
      return { 
        valid: false, 
        error: 'Archivo demasiado grande. Máximo 10MB' 
      };
    }

    if (file.size === 0) {
      return { 
        valid: false, 
        error: 'Archivo vacío' 
      };
    }

    return { valid: true };
  }, []);

  // Formatear información de producto para mostrar
  const formatProductInfo = useCallback((productInfo: ProductInfo) => {
    const formatted: Array<{ label: string; value: string; category: string }> = [];

    // Información básica
    if (productInfo.nombre_comercial) {
      formatted.push({ 
        label: 'Nombre comercial', 
        value: productInfo.nombre_comercial, 
        category: 'basic' 
      });
    }

    if (productInfo.tipo) {
      formatted.push({ 
        label: 'Tipo de producto', 
        value: productInfo.tipo, 
        category: 'basic' 
      });
    }

    if (productInfo.fabricante) {
      formatted.push({ 
        label: 'Fabricante', 
        value: productInfo.fabricante, 
        category: 'basic' 
      });
    }

    // Registro
    if (productInfo.numero_registro) {
      formatted.push({ 
        label: 'Número de registro', 
        value: productInfo.numero_registro, 
        category: 'registry' 
      });
    }

    // Principios activos
    if (productInfo.principios_activos && productInfo.principios_activos.length > 0) {
      productInfo.principios_activos.forEach(pa => {
        formatted.push({ 
          label: `Principio activo: ${pa.nombre}`, 
          value: `${pa.concentracion}${pa.unidad}`, 
          category: 'active_ingredients' 
        });
      });
    }

    // Dosificación
    if (productInfo.dosis_recomendada) {
      formatted.push({ 
        label: 'Dosis recomendada', 
        value: productInfo.dosis_recomendada, 
        category: 'dosage' 
      });
    }

    // Composición (fertilizantes)
    if (productInfo.composicion) {
      const comp = productInfo.composicion;
      if (comp.nitrogeno) {
        formatted.push({ 
          label: 'Nitrógeno (N)', 
          value: `${comp.nitrogeno}%`, 
          category: 'composition' 
        });
      }
      if (comp.fosforo) {
        formatted.push({ 
          label: 'Fósforo (P2O5)', 
          value: `${comp.fosforo}%`, 
          category: 'composition' 
        });
      }
      if (comp.potasio) {
        formatted.push({ 
          label: 'Potasio (K2O)', 
          value: `${comp.potasio}%`, 
          category: 'composition' 
        });
      }
    }

    // Seguridad
    if (productInfo.plazo_seguridad) {
      formatted.push({ 
        label: 'Plazo de seguridad', 
        value: `${productInfo.plazo_seguridad} días`, 
        category: 'safety' 
      });
    }

    if (productInfo.categoria_toxicologica) {
      formatted.push({ 
        label: 'Categoría toxicológica', 
        value: productInfo.categoria_toxicologica, 
        category: 'safety' 
      });
    }

    // Información adicional
    if (productInfo.lote) {
      formatted.push({ 
        label: 'Lote', 
        value: productInfo.lote, 
        category: 'additional' 
      });
    }

    if (productInfo.fecha_caducidad) {
      formatted.push({ 
        label: 'Fecha de caducidad', 
        value: productInfo.fecha_caducidad, 
        category: 'additional' 
      });
    }

    if (productInfo.contenido_envase) {
      formatted.push({ 
        label: 'Contenido', 
        value: productInfo.contenido_envase, 
        category: 'additional' 
      });
    }

    return formatted;
  }, []);

  return {
    // Estados
    loading,
    error,
    progress,

    // Métodos principales
    processImage,
    processBatch,
    createJob,
    getJobStatus,

    // Utilidades
    getPatterns,
    checkHealth,
    testOCR,
    validateFile,
    formatProductInfo,

    // Helper para limpiar errores
    clearError: useCallback(() => setError(null), [])
  };
};