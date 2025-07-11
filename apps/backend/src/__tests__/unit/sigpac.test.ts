// __tests__/unit/sigpac.test.ts - Tests unitarios para integración SIGPAC
import { SIGPACReferenceParser } from '../../integrations/sigpac/referenceParser';

describe('SIGPACReferenceParser', () => {
  describe('parse()', () => {
    test('debe parsear referencia válida correctamente', () => {
      const referencia = '28:079:0001:00001:0001:WI';
      const parsed = SIGPACReferenceParser.parse(referencia);

      expect(parsed).toEqual({
        provincia: '28',
        municipio: '079',
        agregado: '0001',
        zona: '00001',
        parcela: '0001',
        recinto: 'WI',
        full: '28:079:0001:00001:0001:WI'
      });
    });

    test('debe limpiar y normalizar referencia con espacios', () => {
      const referencia = ' 28 : 079 : 0001 : 00001 : 0001 : wi ';
      const parsed = SIGPACReferenceParser.parse(referencia);

      expect(parsed.full).toBe('28:079:0001:00001:0001:WI');
    });

    test('debe rechazar referencia con formato inválido', () => {
      const referenciaInvalida = '28:079:0001:00001';
      
      expect(() => {
        SIGPACReferenceParser.parse(referenciaInvalida);
      }).toThrow('La referencia debe tener 6 partes');
    });

    test('debe rechazar provincia inválida', () => {
      const referenciaInvalida = '99:079:0001:00001:0001:WI';
      
      expect(() => {
        SIGPACReferenceParser.parse(referenciaInvalida);
      }).toThrow('Código de provincia inválido');
    });

    test('debe rechazar municipio inválido', () => {
      const referenciaInvalida = '28:999:0001:00001:0001:WI';
      
      expect(() => {
        SIGPACReferenceParser.parse(referenciaInvalida);
      }).toThrow('Código de municipio inválido');
    });

    test('debe rechazar recinto con caracteres inválidos', () => {
      const referenciaInvalida = '28:079:0001:00001:0001:@#';
      
      expect(() => {
        SIGPACReferenceParser.parse(referenciaInvalida);
      }).toThrow('Código de recinto inválido');
    });
  });

  describe('getProvinciaNombre()', () => {
    test('debe retornar nombre correcto para código válido', () => {
      expect(SIGPACReferenceParser.getProvinciaNombre('28')).toBe('Madrid');
      expect(SIGPACReferenceParser.getProvinciaNombre('41')).toBe('Sevilla');
      expect(SIGPACReferenceParser.getProvinciaNombre('08')).toBe('Barcelona');
    });

    test('debe retornar null para código inválido', () => {
      expect(SIGPACReferenceParser.getProvinciaNombre('99')).toBeNull();
      expect(SIGPACReferenceParser.getProvinciaNombre('00')).toBeNull();
    });
  });

  describe('getComunidadAutonoma()', () => {
    test('debe retornar comunidad correcta para provincias', () => {
      expect(SIGPACReferenceParser.getComunidadAutonoma('28')).toBe('Madrid');
      expect(SIGPACReferenceParser.getComunidadAutonoma('41')).toBe('Andalucía');
      expect(SIGPACReferenceParser.getComunidadAutonoma('08')).toBe('Cataluña');
      expect(SIGPACReferenceParser.getComunidadAutonoma('46')).toBe('Valencia');
    });
  });

  describe('build()', () => {
    test('debe construir referencia completa desde componentes', () => {
      const components = {
        provincia: '28',
        municipio: '079',
        agregado: '0001',
        zona: '00001',
        parcela: '0001',
        recinto: 'WI'
      };

      const built = SIGPACReferenceParser.build(components);
      expect(built.full).toBe('28:079:0001:00001:0001:WI');
    });
  });

  describe('generateTestReferences()', () => {
    test('debe generar referencias de prueba válidas', () => {
      const testRefs = SIGPACReferenceParser.generateTestReferences();
      
      expect(testRefs.length).toBeGreaterThan(0);
      
      testRefs.forEach(ref => {
        expect(() => {
          SIGPACReferenceParser.parse(ref);
        }).not.toThrow();
      });
    });
  });
});

describe('Integración SIGPAC General', () => {
  test('referencias de ejemplo de diferentes comunidades', () => {
    const referencias = [
      '28:079:0001:00001:0001:WI', // Madrid
      '41:091:0001:00001:0001:XY', // Sevilla
      '08:019:0001:00001:0001:AB', // Barcelona
      '46:250:0001:00001:0001:CD', // Valencia
      '14:021:0001:00001:0001:EF'  // Córdoba
    ];

    referencias.forEach(ref => {
      const parsed = SIGPACReferenceParser.parse(ref);
      const provincia = SIGPACReferenceParser.getProvinciaNombre(parsed.provincia);
      const comunidad = SIGPACReferenceParser.getComunidadAutonoma(parsed.provincia);
      
      expect(provincia).toBeTruthy();
      expect(comunidad).toBeTruthy();
      expect(parsed.full).toBe(ref);
    });
  });

  test('cobertura de todas las provincias españolas', () => {
    let provinciasValidas = 0;
    
    for (let i = 1; i <= 52; i++) {
      const codigo = i.toString().padStart(2, '0');
      const nombre = SIGPACReferenceParser.getProvinciaNombre(codigo);
      
      if (nombre) {
        provinciasValidas++;
      }
    }
    
    expect(provinciasValidas).toBe(52); // Todas las provincias españolas
  });
});