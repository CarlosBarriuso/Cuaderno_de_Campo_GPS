// referenceParser.ts - Parser para referencias catastrales SIGPAC
import { SIGPACReferencia, SIGPACError } from './types';

export class SIGPACReferenceParser {
  /**
   * Parsea una referencia catastral SIGPAC española
   * Formato: "PP:MMM:AAAA:ZZZZZ:PPPP:RR"
   * PP = Provincia (2 dígitos)
   * MMM = Municipio (3 dígitos)
   * AAAA = Agregado (4 dígitos)
   * ZZZZZ = Zona (5 dígitos)
   * PPPP = Parcela (4 dígitos)
   * RR = Recinto (2 caracteres alfanuméricos)
   */
  static parse(referencia: string): SIGPACReferencia {
    if (!referencia || typeof referencia !== 'string') {
      throw this.createError('INVALID_REFERENCE', 'Referencia vacía o inválida', referencia);
    }

    // Limpiar referencia (quitar espacios y convertir a mayúsculas)
    const cleanRef = referencia.trim().toUpperCase().replace(/\s/g, '');

    // Validar formato básico
    if (!this.isValidFormat(cleanRef)) {
      throw this.createError('INVALID_REFERENCE', 'Formato de referencia inválido', referencia);
    }

    const parts = cleanRef.split(':');
    
    if (parts.length !== 6) {
      throw this.createError('INVALID_REFERENCE', 'La referencia debe tener 6 partes separadas por :', referencia);
    }

    const [provincia, municipio, agregado, zona, parcela, recinto] = parts;

    // Validaciones específicas
    this.validateProvincia(provincia!);
    this.validateMunicipio(municipio!);
    this.validateAgregado(agregado!);
    this.validateZona(zona!);
    this.validateParcela(parcela!);
    this.validateRecinto(recinto!);

    return {
      provincia: provincia!,
      municipio: municipio!,
      agregado: agregado!,
      zona: zona!,
      parcela: parcela!,
      recinto: recinto!,
      full: cleanRef
    };
  }

  /**
   * Genera una referencia completa desde sus componentes
   */
  static build(components: Omit<SIGPACReferencia, 'full'>): SIGPACReferencia {
    const full = `${components.provincia}:${components.municipio}:${components.agregado}:${components.zona}:${components.parcela}:${components.recinto}`;
    
    return {
      ...components,
      full
    };
  }

  /**
   * Valida si una cadena tiene el formato básico de referencia SIGPAC
   */
  private static isValidFormat(referencia: string): boolean {
    // Patrón: 2 dígitos : 3 dígitos : 4 dígitos : 5 dígitos : 4 dígitos : 2 alfanuméricos
    const pattern = /^\d{2}:\d{3}:\d{4}:\d{5}:\d{4}:[A-Z0-9]{2}$/;
    return pattern.test(referencia);
  }

  /**
   * Valida código de provincia (01-52)
   */
  private static validateProvincia(provincia: string): void {
    const code = parseInt(provincia, 10);
    if (isNaN(code) || code < 1 || code > 52) {
      throw this.createError('INVALID_REFERENCE', `Código de provincia inválido: ${provincia}. Debe estar entre 01 y 52`, provincia);
    }
  }

  /**
   * Valida código de municipio (001-999)
   */
  private static validateMunicipio(municipio: string): void {
    const code = parseInt(municipio, 10);
    if (isNaN(code) || code < 1 || code > 999) {
      throw this.createError('INVALID_REFERENCE', `Código de municipio inválido: ${municipio}. Debe estar entre 001 y 999`, municipio);
    }
  }

  /**
   * Valida código de agregado (0000-9999)
   */
  private static validateAgregado(agregado: string): void {
    const code = parseInt(agregado, 10);
    if (isNaN(code) || code < 0 || code > 9999) {
      throw this.createError('INVALID_REFERENCE', `Código de agregado inválido: ${agregado}. Debe estar entre 0000 y 9999`, agregado);
    }
  }

  /**
   * Valida código de zona (00001-99999)
   */
  private static validateZona(zona: string): void {
    const code = parseInt(zona, 10);
    if (isNaN(code) || code < 1 || code > 99999) {
      throw this.createError('INVALID_REFERENCE', `Código de zona inválido: ${zona}. Debe estar entre 00001 y 99999`, zona);
    }
  }

  /**
   * Valida código de parcela (0001-9999)
   */
  private static validateParcela(parcela: string): void {
    const code = parseInt(parcela, 10);
    if (isNaN(code) || code < 1 || code > 9999) {
      throw this.createError('INVALID_REFERENCE', `Código de parcela inválido: ${parcela}. Debe estar entre 0001 y 9999`, parcela);
    }
  }

  /**
   * Valida código de recinto (01-ZZ)
   */
  private static validateRecinto(recinto: string): void {
    if (!/^[A-Z0-9]{2}$/.test(recinto)) {
      throw this.createError('INVALID_REFERENCE', `Código de recinto inválido: ${recinto}. Debe ser de 2 caracteres alfanuméricos`, recinto);
    }
  }

  /**
   * Obtiene el nombre de la provincia por código
   */
  static getProvinciaNombre(codigo: string): string | null {
    const provincias: Record<string, string> = {
      '01': 'Álava',
      '02': 'Albacete',
      '03': 'Alicante',
      '04': 'Almería',
      '05': 'Ávila',
      '06': 'Badajoz',
      '07': 'Baleares',
      '08': 'Barcelona',
      '09': 'Burgos',
      '10': 'Cáceres',
      '11': 'Cádiz',
      '12': 'Castellón',
      '13': 'Ciudad Real',
      '14': 'Córdoba',
      '15': 'A Coruña',
      '16': 'Cuenca',
      '17': 'Girona',
      '18': 'Granada',
      '19': 'Guadalajara',
      '20': 'Gipuzkoa',
      '21': 'Huelva',
      '22': 'Huesca',
      '23': 'Jaén',
      '24': 'León',
      '25': 'Lleida',
      '26': 'La Rioja',
      '27': 'Lugo',
      '28': 'Madrid',
      '29': 'Málaga',
      '30': 'Murcia',
      '31': 'Navarra',
      '32': 'Ourense',
      '33': 'Asturias',
      '34': 'Palencia',
      '35': 'Las Palmas',
      '36': 'Pontevedra',
      '37': 'Salamanca',
      '38': 'Santa Cruz de Tenerife',
      '39': 'Cantabria',
      '40': 'Segovia',
      '41': 'Sevilla',
      '42': 'Soria',
      '43': 'Tarragona',
      '44': 'Teruel',
      '45': 'Toledo',
      '46': 'Valencia',
      '47': 'Valladolid',
      '48': 'Bizkaia',
      '49': 'Zamora',
      '50': 'Zaragoza',
      '51': 'Ceuta',
      '52': 'Melilla'
    };

    return provincias[codigo] || null;
  }

  /**
   * Obtiene la comunidad autónoma por código de provincia
   */
  static getComunidadAutonoma(codigoProvincia: string): string | null {
    const comunidades: Record<string, string> = {
      '01': 'País Vasco',
      '20': 'País Vasco',
      '48': 'País Vasco',
      '31': 'Navarra',
      '26': 'La Rioja',
      '22': 'Aragón',
      '44': 'Aragón',
      '50': 'Aragón',
      '08': 'Cataluña',
      '17': 'Cataluña',
      '25': 'Cataluña',
      '43': 'Cataluña',
      '07': 'Baleares',
      '46': 'Valencia',
      '12': 'Valencia',
      '03': 'Valencia',
      '30': 'Murcia',
      '04': 'Andalucía',
      '11': 'Andalucía',
      '14': 'Andalucía',
      '18': 'Andalucía',
      '21': 'Andalucía',
      '23': 'Andalucía',
      '29': 'Andalucía',
      '41': 'Andalucía',
      '06': 'Extremadura',
      '10': 'Extremadura',
      '13': 'Castilla-La Mancha',
      '16': 'Castilla-La Mancha',
      '19': 'Castilla-La Mancha',
      '45': 'Castilla-La Mancha',
      '02': 'Castilla-La Mancha',
      '28': 'Madrid',
      '05': 'Castilla y León',
      '09': 'Castilla y León',
      '24': 'Castilla y León',
      '34': 'Castilla y León',
      '37': 'Castilla y León',
      '40': 'Castilla y León',
      '47': 'Castilla y León',
      '49': 'Castilla y León',
      '42': 'Castilla y León',
      '15': 'Galicia',
      '27': 'Galicia',
      '32': 'Galicia',
      '36': 'Galicia',
      '33': 'Asturias',
      '39': 'Cantabria',
      '35': 'Canarias',
      '38': 'Canarias',
      '51': 'Ceuta',
      '52': 'Melilla'
    };

    return comunidades[codigoProvincia] || null;
  }

  /**
   * Crea un error específico de SIGPAC
   */
  private static createError(code: SIGPACError['code'], message: string, reference?: string): SIGPACError {
    const error = new Error(message) as SIGPACError;
    error.code = code;
    error.reference = reference || '';
    error.name = 'SIGPACError';
    return error;
  }

  /**
   * Genera referencias de ejemplo para testing
   */
  static generateTestReferences(): string[] {
    return [
      '28:079:0001:00001:0001:WI', // Madrid - Getafe
      '41:091:0001:00001:0001:XY', // Sevilla - Sevilla
      '08:019:0001:00001:0001:AB', // Barcelona - Barcelona
      '46:250:0001:00001:0001:CD', // Valencia - Valencia
      '14:021:0001:00001:0001:EF'  // Córdoba - Córdoba
    ];
  }
}