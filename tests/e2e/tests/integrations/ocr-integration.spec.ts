import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('OCR Integration Tests', () => {
  
  test('OCR API endpoints respond correctly', async ({ request }) => {
    // Test health endpoint
    await test.step('OCR health check', async () => {
      const response = await request.get('http://localhost:3002/api/ocr/health');
      expect(response.ok()).toBeTruthy();
      
      const health = await response.json();
      expect(health.status).toBe('healthy');
      expect(health.service).toBe('OCR');
      expect(health.tesseract_ready).toBe(true);
    });

    // Test patterns endpoint
    await test.step('OCR patterns endpoint', async () => {
      const response = await request.get('http://localhost:3002/api/ocr/patterns');
      expect(response.ok()).toBeTruthy();
      
      const patterns = await response.json();
      expect(patterns.herbicidas).toBeDefined();
      expect(patterns.fungicidas).toBeDefined();
      expect(patterns.insecticidas).toBeDefined();
      expect(patterns.fertilizantes).toBeDefined();
      
      // Check that patterns contain expected entries
      expect(patterns.herbicidas.length).toBeGreaterThan(5);
      expect(patterns.fertilizantes.length).toBeGreaterThan(3);
    });

    // Test OCR test endpoint (generates synthetic image)
    await test.step('OCR test with synthetic image', async () => {
      const response = await request.post('http://localhost:3002/api/ocr/test', {
        data: {
          producto: 'GLIFOSATO 36% SL',
          contenido: 'Herbicida sistémico\nDosis: 3-4 l/ha\nReg. Sanit.: 12345/HA'
        }
      });
      expect(response.ok()).toBeTruthy();
      
      const result = await response.json();
      expect(result.texto_extraido).toBeDefined();
      expect(result.productos_detectados).toBeDefined();
      expect(result.productos_detectados.length).toBeGreaterThan(0);
      
      // Check detected product structure
      const producto = result.productos_detectados[0];
      expect(producto.tipo).toBe('herbicida');
      expect(producto.principios_activos).toContain('glifosato');
      expect(producto.concentracion).toBe('36%');
    });
  });

  test('OCR pattern matching accuracy', async ({ request }) => {
    await test.step('Test herbicide detection', async () => {
      const testTexts = [
        'GLIFOSATO 36% SL Dosis: 3-4 l/ha',
        'MCPA 40% Herbicida selectivo 2 l/ha',
        '2,4-D ESTER Dosis recomendada: 1.5 l/ha'
      ];
      
      for (const texto of testTexts) {
        const response = await request.post('http://localhost:3002/api/ocr/test', {
          data: { producto: 'Test', contenido: texto }
        });
        expect(response.ok()).toBeTruthy();
        
        const result = await response.json();
        expect(result.productos_detectados.length).toBeGreaterThan(0);
        
        const producto = result.productos_detectados[0];
        expect(producto.tipo).toBe('herbicida');
        expect(producto.principios_activos).toBeDefined();
        expect(producto.dosis).toBeDefined();
      }
    });

    await test.step('Test fertilizer NPK detection', async () => {
      const fertilizers = [
        'NPK 15-15-15 Fertilizante complejo',
        'UREA 46% Nitrógeno 200 kg/ha',
        'SULFATO POTÁSICO 50% K2O'
      ];
      
      for (const texto of fertilizers) {
        const response = await request.post('http://localhost:3002/api/ocr/test', {
          data: { producto: 'Fertilizante', contenido: texto }
        });
        expect(response.ok()).toBeTruthy();
        
        const result = await response.json();
        const producto = result.productos_detectados[0];
        
        expect(producto.tipo).toBe('fertilizante');
        if (texto.includes('NPK')) {
          expect(producto.npk).toBeDefined();
          expect(producto.npk.nitrogeno).toBe(15);
          expect(producto.npk.fosforo).toBe(15);
          expect(producto.npk.potasio).toBe(15);
        }
      }
    });

    await test.step('Test safety information extraction', async () => {
      const safetyText = 'Plazo seguridad: 21 días\nReg. Sanit.: ES-12345/HA\nCaducidad: 12/2025';
      
      const response = await request.post('http://localhost:3002/api/ocr/test', {
        data: { producto: 'Producto Test', contenido: safetyText }
      });
      expect(response.ok()).toBeTruthy();
      
      const result = await response.json();
      if (result.productos_detectados.length > 0) {
        const producto = result.productos_detectados[0];
        
        if (producto.plazo_seguridad) {
          expect(producto.plazo_seguridad).toBe('21 días');
        }
        
        if (producto.registro_sanitario) {
          expect(producto.registro_sanitario).toContain('ES-12345');
        }
      }
    });
  });

  test('OCR batch processing', async ({ request }) => {
    await test.step('Test batch OCR processing', async () => {
      const batchData = {
        imagenes: [
          { nombre: 'herbicida1.jpg', contenido: 'GLIFOSATO 36% SL Dosis: 3 l/ha' },
          { nombre: 'fertilizante1.jpg', contenido: 'NPK 20-10-10 Abono complejo' },
          { nombre: 'fungicida1.jpg', contenido: 'AZUFRE 80% WG Fungicida 2 kg/ha' }
        ]
      };
      
      const response = await request.post('http://localhost:3002/api/ocr/batch', {
        data: batchData
      });
      expect(response.ok()).toBeTruthy();
      
      const results = await response.json();
      expect(results.resultados).toHaveLength(3);
      expect(results.total_procesadas).toBe(3);
      expect(results.exitosas).toBe(3);
      expect(results.fallidas).toBe(0);
      
      // Check each result
      results.resultados.forEach((resultado, index) => {
        expect(resultado.nombre).toBe(batchData.imagenes[index].nombre);
        expect(resultado.productos_detectados.length).toBeGreaterThan(0);
        expect(resultado.texto_extraido).toBeDefined();
      });
    });
  });

  test('OCR job management', async ({ request }) => {
    await test.step('Test asynchronous job processing', async () => {
      // Create a job
      const jobResponse = await request.post('http://localhost:3002/api/ocr/job', {
        data: {
          tipo: 'batch',
          imagenes: [
            { nombre: 'test1.jpg', contenido: 'GLIFOSATO 36% Test content' }
          ]
        }
      });
      expect(jobResponse.ok()).toBeTruthy();
      
      const job = await jobResponse.json();
      expect(job.jobId).toBeDefined();
      expect(job.status).toBe('pending');
      
      // Check job status
      let attempts = 0;
      let jobStatus;
      
      do {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await request.get(`http://localhost:3002/api/ocr/job/${job.jobId}`);
        expect(statusResponse.ok()).toBeTruthy();
        
        jobStatus = await statusResponse.json();
        attempts++;
      } while (jobStatus.status === 'processing' && attempts < 10);
      
      // Job should complete
      expect(jobStatus.status).toBe('completed');
      expect(jobStatus.resultado).toBeDefined();
      expect(jobStatus.resultado.resultados).toBeDefined();
    });
  });

  test('OCR error handling', async ({ request }) => {
    await test.step('Handle invalid image format', async () => {
      const response = await request.post('http://localhost:3002/api/ocr/process', {
        multipart: {
          file: {
            name: 'test.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('This is not an image')
          }
        }
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('formato');
    });

    await test.step('Handle oversized image', async () => {
      // Create a large buffer (over 10MB limit)
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 'a');
      
      const response = await request.post('http://localhost:3002/api/ocr/process', {
        multipart: {
          file: {
            name: 'large.jpg',
            mimeType: 'image/jpeg',
            buffer: largeBuffer
          }
        }
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('tamaño');
    });

    await test.step('Handle too many files in batch', async () => {
      const manyImages = Array.from({ length: 10 }, (_, i) => ({
        nombre: `image${i}.jpg`,
        contenido: `Test content ${i}`
      }));
      
      const response = await request.post('http://localhost:3002/api/ocr/batch', {
        data: { imagenes: manyImages }
      });
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error.error).toContain('máximo');
    });

    await test.step('Handle non-existent job ID', async () => {
      const response = await request.get('http://localhost:3002/api/ocr/job/non-existent-id');
      expect(response.status()).toBe(404);
      
      const error = await response.json();
      expect(error.error).toContain('encontrado');
    });
  });

  test('OCR performance and caching', async ({ request }) => {
    await test.step('Verify OCR caching works', async () => {
      const testContent = 'GLIFOSATO 36% SL Dosis: 3-4 l/ha Reg. Sanit.: 12345';
      
      // First request
      const start1 = Date.now();
      const response1 = await request.post('http://localhost:3002/api/ocr/test', {
        data: { producto: 'Cache Test', contenido: testContent }
      });
      const time1 = Date.now() - start1;
      expect(response1.ok()).toBeTruthy();
      
      // Second request with same content (should hit cache)
      const start2 = Date.now();
      const response2 = await request.post('http://localhost:3002/api/ocr/test', {
        data: { producto: 'Cache Test', contenido: testContent }
      });
      const time2 = Date.now() - start2;
      expect(response2.ok()).toBeTruthy();
      
      // Cache hit should be significantly faster
      expect(time2).toBeLessThan(time1 * 0.3);
      
      // Results should be identical
      const result1 = await response1.json();
      const result2 = await response2.json();
      expect(result1.productos_detectados).toEqual(result2.productos_detectados);
    });
  });

  test('OCR confidence scoring', async ({ request }) => {
    await test.step('Test confidence scores', async () => {
      const highConfidenceText = 'GLIFOSATO 36% SL\nDosis: 3-4 l/ha\nReg. Sanit.: ES-12345/HA';
      
      const response = await request.post('http://localhost:3002/api/ocr/test', {
        data: { producto: 'Confidence Test', contenido: highConfidenceText }
      });
      expect(response.ok()).toBeTruthy();
      
      const result = await response.json();
      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      
      // Products should have confidence scores
      result.productos_detectados.forEach(producto => {
        if (producto.confidence) {
          expect(producto.confidence).toBeGreaterThan(0);
          expect(producto.confidence).toBeLessThanOrEqual(100);
        }
      });
    });
  });
});