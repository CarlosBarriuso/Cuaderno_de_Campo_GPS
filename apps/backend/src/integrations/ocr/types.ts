// types.ts - Tipos para el sistema OCR
export interface ProductInfo {
  // Información básica del producto
  nombre_comercial?: string;
  fabricante?: string;
  tipo?: 'herbicida' | 'fungicida' | 'insecticida' | 'fertilizante' | 'acaricida' | 'otros';
  
  // Principios activos
  principios_activos?: Array<{
    nombre: string;
    concentracion: string;
    unidad: string;
  }>;
  
  // Información de registro
  numero_registro?: string;
  registro_sanitario?: string;
  
  // Dosificación
  dosis_recomendada?: string;
  dosis_minima?: string;
  dosis_maxima?: string;
  unidad_dosis?: 'l/ha' | 'kg/ha' | 'ml/ha' | 'g/ha' | 'cc/ha';
  
  // Información nutricional (fertilizantes)
  composicion?: {
    nitrogeno?: number;  // % N
    fosforo?: number;    // % P2O5
    potasio?: number;    // % K2O
    azufre?: number;     // % S
    calcio?: number;     // % Ca
    magnesio?: number;   // % Mg
    micronutrientes?: Array<{
      elemento: string;
      concentracion: number;
      unidad: string;
    }>;
  };
  
  // Información de seguridad
  categoria_toxicologica?: string;
  pictogramas_peligro?: string[];
  plazo_seguridad?: number; // días
  
  // Información adicional extraída
  lote?: string;
  fecha_caducidad?: string;
  contenido_envase?: string;
  codigo_barras?: string;
}

export interface OCRResult {
  success: boolean;
  confidence: number; // 0-1
  raw_text: string;
  product_info?: ProductInfo;
  error?: string;
  processing_time?: number;
  bounding_boxes?: Array<{
    text: string;
    confidence: number;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface OCRProvider {
  name: 'google_vision' | 'azure_cognitive' | 'aws_textract' | 'tesseract';
  enabled: boolean;
  priority: number; // 1 = highest priority
  config: Record<string, any>;
}

export interface OCRConfig {
  providers: OCRProvider[];
  fallback_enabled: boolean;
  max_image_size: number; // bytes
  supported_formats: string[];
  confidence_threshold: number;
  cache_enabled: boolean;
  cache_ttl: number; // seconds
}

export interface ImageOptimization {
  resize_max_width: number;
  resize_max_height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  enhance_contrast: boolean;
  enhance_sharpness: boolean;
  grayscale: boolean;
}

export interface OCRRequest {
  image: Buffer;
  filename?: string;
  options?: {
    provider?: string;
    language?: string;
    enhance_image?: boolean;
    extract_product_info?: boolean;
    confidence_threshold?: number;
  };
}

export interface OCRJobStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  result?: OCRResult;
  error?: string;
  metadata?: {
    filename?: string;
    file_size: number;
    provider_used?: string;
    processing_time?: number;
  };
}

export interface ProductDatabase {
  numero_registro: string;
  nombre_comercial: string;
  fabricante: string;
  tipo: string;
  principios_activos: string[];
  dosis_recomendada?: string;
  plazo_seguridad?: number;
  categoria_toxicologica?: string;
  activo: boolean;
  fecha_actualizacion: Date;
}

export interface PatternMatcher {
  name: string;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => any;
  confidence_weight: number;
}

export interface OCRError extends Error {
  code: 'PROVIDER_ERROR' | 'IMAGE_ERROR' | 'PARSING_ERROR' | 'TIMEOUT' | 'QUOTA_EXCEEDED';
  provider?: string;
  details?: any;
}