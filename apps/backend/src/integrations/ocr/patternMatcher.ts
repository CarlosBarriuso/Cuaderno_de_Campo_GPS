// patternMatcher.ts - Patrones para extraer información de productos agrícolas
import { ProductInfo, PatternMatcher } from './types';

export class AgriculturalPatternMatcher {
  private patterns: PatternMatcher[] = [
    // Número de registro sanitario
    {
      name: 'registro_sanitario',
      pattern: /n[úº]?\s*reg[istro]*[\s.:]*(\d+)/i,
      extract: (match) => ({ numero_registro: match[1] }),
      confidence_weight: 0.9
    },
    
    // Principios activos - Herbicidas
    {
      name: 'glifosato',
      pattern: /glifosato\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Glifosato', concentracion: match[1], unidad: '%' }],
        tipo: 'herbicida'
      }),
      confidence_weight: 0.95
    },
    
    {
      name: 'mcpa',
      pattern: /mcpa\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'MCPA', concentracion: match[1], unidad: '%' }],
        tipo: 'herbicida'
      }),
      confidence_weight: 0.9
    },
    
    {
      name: '24d',
      pattern: /2[,\s]*4[-\s]*d\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: '2,4-D', concentracion: match[1], unidad: '%' }],
        tipo: 'herbicida'
      }),
      confidence_weight: 0.9
    },
    
    // Principios activos - Fungicidas
    {
      name: 'azufre',
      pattern: /azufre\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Azufre', concentracion: match[1], unidad: '%' }],
        tipo: 'fungicida'
      }),
      confidence_weight: 0.85
    },
    
    {
      name: 'cobre',
      pattern: /cobre\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Cobre', concentracion: match[1], unidad: '%' }],
        tipo: 'fungicida'
      }),
      confidence_weight: 0.85
    },
    
    {
      name: 'mancozeb',
      pattern: /mancozeb\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Mancozeb', concentracion: match[1], unidad: '%' }],
        tipo: 'fungicida'
      }),
      confidence_weight: 0.9
    },
    
    // Principios activos - Insecticidas
    {
      name: 'imidacloprid',
      pattern: /imidacloprid\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Imidacloprid', concentracion: match[1], unidad: '%' }],
        tipo: 'insecticida'
      }),
      confidence_weight: 0.9
    },
    
    {
      name: 'lambda_cihalotrina',
      pattern: /lambda[- ]cihalotrina\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        principios_activos: [{ nombre: 'Lambda-cihalotrina', concentracion: match[1], unidad: '%' }],
        tipo: 'insecticida'
      }),
      confidence_weight: 0.9
    },
    
    // Fertilizantes - NPK
    {
      name: 'nitrogeno',
      pattern: /n[itrógeno]*\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        composicion: { nitrogeno: parseFloat(match[1]) },
        tipo: 'fertilizante'
      }),
      confidence_weight: 0.8
    },
    
    {
      name: 'fosforo',
      pattern: /p[2o5]*\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        composicion: { fosforo: parseFloat(match[1]) },
        tipo: 'fertilizante'
      }),
      confidence_weight: 0.8
    },
    
    {
      name: 'potasio',
      pattern: /k[2o]*\s*(\d+(?:\.\d+)?)\s*%/i,
      extract: (match) => ({
        composicion: { potasio: parseFloat(match[1]) },
        tipo: 'fertilizante'
      }),
      confidence_weight: 0.8
    },
    
    {
      name: 'npk_complejo',
      pattern: /(\d+)[-\s]+(\d+)[-\s]+(\d+)/,
      extract: (match) => ({
        composicion: {
          nitrogeno: parseInt(match[1]),
          fosforo: parseInt(match[2]),
          potasio: parseInt(match[3])
        },
        tipo: 'fertilizante'
      }),
      confidence_weight: 0.7
    },
    
    // Dosis de aplicación
    {
      name: 'dosis_litros_ha',
      pattern: /dosis[\s:]*(\d+(?:\.\d+)?)\s*(l|litros?)\/ha/i,
      extract: (match) => ({
        dosis_recomendada: `${match[1]} ${match[2]}/ha`,
        unidad_dosis: 'l/ha'
      }),
      confidence_weight: 0.85
    },
    
    {
      name: 'dosis_kg_ha',
      pattern: /dosis[\s:]*(\d+(?:\.\d+)?)\s*(kg|kilograms?)\/ha/i,
      extract: (match) => ({
        dosis_recomendada: `${match[1]} ${match[2]}/ha`,
        unidad_dosis: 'kg/ha'
      }),
      confidence_weight: 0.85
    },
    
    {
      name: 'dosis_ml_ha',
      pattern: /(\d+(?:\.\d+)?)\s*(ml|cc)\/ha/i,
      extract: (match) => ({
        dosis_recomendada: `${match[1]} ${match[2]}/ha`,
        unidad_dosis: 'ml/ha'
      }),
      confidence_weight: 0.8
    },
    
    // Fabricante
    {
      name: 'fabricante',
      pattern: /fabricado\s+por[\s:]*([^\n]+)/i,
      extract: (match) => ({
        fabricante: match[1].trim()
      }),
      confidence_weight: 0.7
    },
    
    {
      name: 'distribuido_por',
      pattern: /distribuido\s+por[\s:]*([^\n]+)/i,
      extract: (match) => ({
        fabricante: match[1].trim()
      }),
      confidence_weight: 0.6
    },
    
    // Plazo de seguridad
    {
      name: 'plazo_seguridad',
      pattern: /plazo\s+de\s+seguridad[\s:]*(\d+)\s*días?/i,
      extract: (match) => ({
        plazo_seguridad: parseInt(match[1])
      }),
      confidence_weight: 0.8
    },
    
    // Contenido del envase
    {
      name: 'contenido_litros',
      pattern: /(\d+(?:\.\d+)?)\s*(l|litros?)\s*$/m,
      extract: (match) => ({
        contenido_envase: `${match[1]} ${match[2]}`
      }),
      confidence_weight: 0.6
    },
    
    {
      name: 'contenido_kg',
      pattern: /(\d+(?:\.\d+)?)\s*(kg|kilograms?)\s*$/m,
      extract: (match) => ({
        contenido_envase: `${match[1]} ${match[2]}`
      }),
      confidence_weight: 0.6
    },
    
    // Fecha de caducidad
    {
      name: 'fecha_caducidad',
      pattern: /(?:caducidad|vencimiento|expire)[\s:]*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i,
      extract: (match) => {
        const year = match[3].length === 2 ? `20${match[3]}` : match[3];
        return {
          fecha_caducidad: `${match[1]}/${match[2]}/${year}`
        };
      },
      confidence_weight: 0.7
    },
    
    // Categoría toxicológica
    {
      name: 'categoria_toxicologica',
      pattern: /categoría\s+toxicológica[\s:]*([IVX]+)/i,
      extract: (match) => ({
        categoria_toxicologica: match[1]
      }),
      confidence_weight: 0.8
    },
    
    // Tipos de producto (detección general)
    {
      name: 'tipo_herbicida',
      pattern: /herbicida/i,
      extract: () => ({ tipo: 'herbicida' }),
      confidence_weight: 0.6
    },
    
    {
      name: 'tipo_fungicida',
      pattern: /fungicida/i,
      extract: () => ({ tipo: 'fungicida' }),
      confidence_weight: 0.6
    },
    
    {
      name: 'tipo_insecticida',
      pattern: /insecticida/i,
      extract: () => ({ tipo: 'insecticida' }),
      confidence_weight: 0.6
    },
    
    {
      name: 'tipo_fertilizante',
      pattern: /(?:fertilizante|abono)/i,
      extract: () => ({ tipo: 'fertilizante' }),
      confidence_weight: 0.6
    },
    
    // Lote
    {
      name: 'lote',
      pattern: /lote[\s:]*([A-Z0-9]+)/i,
      extract: (match) => ({
        lote: match[1]
      }),
      confidence_weight: 0.7
    }
  ];

  /**
   * Procesa texto y extrae información del producto
   */
  extractProductInfo(text: string): { productInfo: ProductInfo; confidence: number } {
    const productInfo: ProductInfo = {};
    let totalConfidence = 0;
    let matchCount = 0;
    const matches: Array<{ pattern: string; confidence: number; data: any }> = [];

    // Limpiar y normalizar texto
    const cleanText = this.cleanText(text);

    // Aplicar todos los patrones
    for (const pattern of this.patterns) {
      const match = cleanText.match(pattern.pattern);
      if (match) {
        try {
          const extractedData = pattern.extract(match);
          this.mergeProductInfo(productInfo, extractedData);
          
          totalConfidence += pattern.confidence_weight;
          matchCount++;
          
          matches.push({
            pattern: pattern.name,
            confidence: pattern.confidence_weight,
            data: extractedData
          });
        } catch (error) {
          console.warn(`Error procesando patrón ${pattern.name}:`, error);
        }
      }
    }

    // Calcular confianza promedio
    const confidence = matchCount > 0 ? totalConfidence / matchCount : 0;

    // Post-procesamiento y validaciones
    this.validateAndEnhanceProductInfo(productInfo);

    return {
      productInfo,
      confidence: Math.min(confidence, 1.0)
    };
  }

  /**
   * Limpia y normaliza el texto para mejor matching
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[''`]/g, '') // Remover comillas problemáticas
      .replace(/º/g, 'o') // Normalizar caracteres especiales
      .trim();
  }

  /**
   * Combina información extraída en el objeto producto
   */
  private mergeProductInfo(target: ProductInfo, source: any): void {
    Object.keys(source).forEach(key => {
      if (key === 'principios_activos') {
        if (!target.principios_activos) {
          target.principios_activos = [];
        }
        target.principios_activos.push(...source[key]);
      } else if (key === 'composicion') {
        if (!target.composicion) {
          target.composicion = {};
        }
        Object.assign(target.composicion, source[key]);
      } else {
        // Para otros campos, tomar el valor si no existe
        if (!target[key as keyof ProductInfo]) {
          (target as any)[key] = source[key];
        }
      }
    });
  }

  /**
   * Valida y mejora la información extraída
   */
  private validateAndEnhanceProductInfo(productInfo: ProductInfo): void {
    // Detectar tipo si no está definido pero hay principios activos
    if (!productInfo.tipo && productInfo.principios_activos) {
      productInfo.tipo = this.inferProductType(productInfo.principios_activos);
    }

    // Normalizar unidades
    if (productInfo.dosis_recomendada) {
      productInfo.dosis_recomendada = this.normalizeUnits(productInfo.dosis_recomendada);
    }

    // Validar composición NPK para fertilizantes
    if (productInfo.tipo === 'fertilizante' && productInfo.composicion) {
      this.validateNPKComposition(productInfo.composicion);
    }

    // Limpiar valores vacíos
    this.removeEmptyValues(productInfo);
  }

  /**
   * Infiere el tipo de producto basado en principios activos
   */
  private inferProductType(principiosActivos: Array<{ nombre: string }>): string {
    const nombres = principiosActivos.map(pa => pa.nombre.toLowerCase());
    
    const herbicidas = ['glifosato', 'mcpa', '2,4-d', 'dicamba', 'atrazina'];
    const fungicidas = ['azufre', 'cobre', 'mancozeb', 'propiconazol', 'tebuconazol'];
    const insecticidas = ['imidacloprid', 'lambda-cihalotrina', 'clorpirifos', 'deltametrina'];
    
    if (nombres.some(n => herbicidas.some(h => n.includes(h)))) return 'herbicida';
    if (nombres.some(n => fungicidas.some(f => n.includes(f)))) return 'fungicida';
    if (nombres.some(n => insecticidas.some(i => n.includes(i)))) return 'insecticida';
    
    return 'otros';
  }

  /**
   * Normaliza unidades de medida
   */
  private normalizeUnits(dosis: string): string {
    return dosis
      .replace(/litros?/gi, 'l')
      .replace(/kilograms?/gi, 'kg')
      .replace(/gramos?/gi, 'g')
      .replace(/cc/gi, 'ml');
  }

  /**
   * Valida composición NPK
   */
  private validateNPKComposition(composicion: any): void {
    ['nitrogeno', 'fosforo', 'potasio'].forEach(nutriente => {
      if (composicion[nutriente] && (composicion[nutriente] < 0 || composicion[nutriente] > 100)) {
        delete composicion[nutriente]; // Valor inválido
      }
    });
  }

  /**
   * Remueve valores vacíos del objeto
   */
  private removeEmptyValues(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
        delete obj[key];
      } else if (Array.isArray(obj[key]) && obj[key].length === 0) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && Object.keys(obj[key]).length === 0) {
        delete obj[key];
      }
    });
  }

  /**
   * Obtiene patrones disponibles
   */
  getAvailablePatterns(): string[] {
    return this.patterns.map(p => p.name);
  }

  /**
   * Agrega un patrón personalizado
   */
  addCustomPattern(pattern: PatternMatcher): void {
    this.patterns.push(pattern);
  }
}