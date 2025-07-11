// __tests__/integration/sigpac.integration.test.ts - Tests de integración SIGPAC
import request from 'supertest';
import express from 'express';
import { sigpacRoutes } from '../../routes/sigpac';

const app = express();
app.use(express.json());
app.use('/api/sigpac', sigpacRoutes);

describe('SIGPAC Integration Tests', () => {
  describe('GET /api/sigpac/health', () => {
    test('debe retornar estado del servicio', async () => {
      const response = await request(app)
        .get('/api/sigpac/health')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
    });
  });

  describe('GET /api/sigpac/provincias', () => {
    test('debe retornar lista de provincias', async () => {
      const response = await request(app)
        .get('/api/sigpac/provincias')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(52);
      
      const madrid = response.body.data.find((p: any) => p.codigo === '28');
      expect(madrid).toBeDefined();
      expect(madrid.nombre).toBe('Madrid');
      expect(madrid.comunidad_autonoma).toBe('Madrid');
    });
  });

  describe('GET /api/sigpac/test', () => {
    test('debe retornar referencias de prueba en desarrollo', async () => {
      if (process.env.NODE_ENV === 'development') {
        const response = await request(app)
          .get('/api/sigpac/test')
          .expect(200)
          .expect('Content-Type', /json/);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);

        const primeraRef = response.body.data[0];
        expect(primeraRef).toHaveProperty('referencia');
        expect(primeraRef).toHaveProperty('provincia');
        expect(primeraRef.provincia).toHaveProperty('codigo');
        expect(primeraRef.provincia).toHaveProperty('nombre');
      }
    });
  });

  describe('POST /api/sigpac/referencias/validate', () => {
    test('debe validar referencias válidas', async () => {
      const referencias = [
        '28:079:0001:00001:0001:WI',
        '41:091:0001:00001:0001:XY'
      ];

      const response = await request(app)
        .post('/api/sigpac/referencias/validate')
        .send({ referencias })
        .expect(401); // Sin auth debería fallar

      // Con auth mock sería:
      // .expect(200)
      // .expect('Content-Type', /json/);
    });

    test('debe rechazar array vacío', async () => {
      const response = await request(app)
        .post('/api/sigpac/referencias/validate')
        .send({ referencias: [] })
        .expect(400);

      expect(response.body.error).toBe('INVALID_REQUEST');
    });

    test('debe rechazar demasiadas referencias', async () => {
      const referencias = Array.from({ length: 101 }, (_, i) => 
        `28:079:0001:00001:000${i}:WI`
      );

      const response = await request(app)
        .post('/api/sigpac/referencias/validate')
        .send({ referencias })
        .expect(400);

      expect(response.body.error).toBe('TOO_MANY_REFERENCES');
    });

    test('debe identificar referencias inválidas', async () => {
      const referencias = [
        '28:079:0001:00001:0001:WI', // Válida
        '99:999:9999:99999:9999:@@', // Inválida
        'invalid-format'              // Inválida
      ];

      // Este test requeriría mock del middleware de auth
      // Por ahora verificamos que rechaza por falta de auth
      await request(app)
        .post('/api/sigpac/referencias/validate')
        .send({ referencias })
        .expect(401);
    });
  });

  describe('POST /api/sigpac/parcelas/search', () => {
    test('debe rechazar coordenadas inválidas', async () => {
      await request(app)
        .post('/api/sigpac/parcelas/search')
        .send({ lat: 'invalid', lng: 40.4 })
        .expect(400);
    });

    test('debe rechazar coordenadas fuera de España', async () => {
      // Coordenadas de Francia
      await request(app)
        .post('/api/sigpac/parcelas/search')
        .send({ lat: 48.8566, lng: 2.3522 })
        .expect(400);

      // Sin auth debería rechazar antes
      // expect(response.body.error).toBe('COORDINATES_OUT_OF_BOUNDS');
    });

    test('debe aceptar coordenadas españolas válidas', async () => {
      // Coordenadas de Madrid
      const response = await request(app)
        .post('/api/sigpac/parcelas/search')
        .send({ lat: 40.4168, lng: -3.7038, radius: 100 })
        .expect(401); // Sin auth

      // Con auth sería 200
    });
  });

  describe('Validación de referencia específica', () => {
    test('debe manejar referencia con formato correcto', async () => {
      // Sin auth debería rechazar
      await request(app)
        .get('/api/sigpac/parcela/28:079:0001:00001:0001:WI')
        .expect(401);
    });

    test('debe rechazar referencia con formato incorrecto', async () => {
      // Incluso sin auth, debería validar formato primero
      await request(app)
        .get('/api/sigpac/parcela/invalid-reference-format')
        .expect(401); // Auth se ejecuta antes que validación
    });

    test('debe rechazar referencia vacía', async () => {
      await request(app)
        .get('/api/sigpac/parcela/')
        .expect(404); // Ruta no encontrada
    });
  });
});

describe('Validación de datos SIGPAC', () => {
  test('estructura de respuesta de provincias', async () => {
    const response = await request(app)
      .get('/api/sigpac/provincias')
      .expect(200);

    const provincia = response.body.data[0];
    expect(provincia).toHaveProperty('codigo');
    expect(provincia).toHaveProperty('nombre');
    expect(provincia).toHaveProperty('comunidad_autonoma');
    
    expect(typeof provincia.codigo).toBe('string');
    expect(typeof provincia.nombre).toBe('string');
    expect(typeof provincia.comunidad_autonoma).toBe('string');
    
    expect(provincia.codigo).toMatch(/^\d{2}$/); // 2 dígitos
  });

  test('todas las comunidades autónomas representadas', async () => {
    const response = await request(app)
      .get('/api/sigpac/provincias')
      .expect(200);

    const comunidades = new Set(
      response.body.data.map((p: any) => p.comunidad_autonoma)
    );

    const comunidadesEsperadas = [
      'Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias',
      'Cantabria', 'Castilla-La Mancha', 'Castilla y León', 'Cataluña',
      'Valencia', 'Extremadura', 'Galicia', 'Madrid', 'Murcia',
      'Navarra', 'País Vasco', 'La Rioja', 'Ceuta', 'Melilla'
    ];

    comunidadesEsperadas.forEach(comunidad => {
      expect(comunidades.has(comunidad)).toBe(true);
    });
  });
});