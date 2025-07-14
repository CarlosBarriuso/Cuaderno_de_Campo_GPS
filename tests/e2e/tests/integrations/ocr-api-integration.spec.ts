import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * OCR API Integration Tests - Phase 4
 * Tests Tesseract.js offline OCR with Spanish agricultural products
 */
test.describe('OCR API Integration', () => {
  // Test image paths (these would be sample product labels)
  const testImages = {
    herbicide: 'test-assets/herbicide-label.jpg',
    fungicide: 'test-assets/fungicide-label.jpg',
    fertilizer: 'test-assets/fertilizer-label.jpg',
    seed: 'test-assets/seed-package.jpg',
    invalid: 'test-assets/non-product.jpg'
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('OCR API - Single image processing', async ({ request }) => {
    await test.step('Test OCR with mock herbicide label', async () => {
      // Create a mock image data (base64)
      const mockImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      const response = await request.post('/api/ocr/process', {
        data: {
          image: mockImageData,
          confidence: 0.7
        }
      });
      
      expect(response.status()).toBe(200);
      
      const ocrResult = await response.json();
      
      expect(ocrResult).toHaveProperty('textoExtraído');
      expect(ocrResult).toHaveProperty('confianza');
      expect(ocrResult).toHaveProperty('productosDetectados');
      expect(ocrResult).toHaveProperty('información');
      
      // Verify confidence score
      expect(typeof ocrResult.confianza).toBe('number');
      expect(ocrResult.confianza).toBeGreaterThanOrEqual(0);
      expect(ocrResult.confianza).toBeLessThanOrEqual(1);
      
      // Verify detected products structure
      expect(Array.isArray(ocrResult.productosDetectados)).toBe(true);
    });
  });

  test('OCR API - Batch processing', async ({ request }) => {
    await test.step('Test batch OCR processing', async () => {
      const mockImages = [
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
      ];
      
      const response = await request.post('/api/ocr/batch', {
        data: {
          images: mockImages,
          confidence: 0.6
        }
      });
      
      expect(response.status()).toBe(200);
      
      const batchResult = await response.json();
      
      expect(batchResult).toHaveProperty('resultados');
      expect(Array.isArray(batchResult.resultados)).toBe(true);
      expect(batchResult.resultados.length).toBe(2);
      
      // Check each result structure
      batchResult.resultados.forEach((result: any) => {
        expect(result).toHaveProperty('índice');
        expect(result).toHaveProperty('textoExtraído');
        expect(result).toHaveProperty('confianza');
        expect(result).toHaveProperty('productosDetectados');
      });
    });

    await test.step('Test batch size limits', async () => {
      // Test with more than allowed images (should be limited to 5)
      const tooManyImages = Array(10).fill('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
      
      const response = await request.post('/api/ocr/batch', {
        data: {
          images: tooManyImages,
          confidence: 0.6
        }
      });
      
      expect(response.status()).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('máximo');
    });
  });

  test('OCR API - Product pattern matching', async ({ request }) => {
    await test.step('Test herbicide pattern detection', async () => {
      const mockHerbicideText = `
        ROUNDUP ENERGIA
        Herbicida sistémico
        Glifosato 36% p/v
        Dosis: 2-6 L/ha
        Registro: 25.517
        Plazo seguridad: No aplicable
      `;
      
      const response = await request.post('/api/ocr/analyze-text', {
        data: {
          text: mockHerbicideText
        }
      });
      
      expect(response.status()).toBe(200);
      
      const analysis = await response.json();
      
      expect(analysis).toHaveProperty('tipoProducto');
      expect(analysis.tipoProducto).toBe('herbicida');
      
      expect(analysis).toHaveProperty('información');
      expect(analysis.información).toHaveProperty('principioActivo');
      expect(analysis.información.principioActivo).toContain('Glifosato');
      
      expect(analysis.información).toHaveProperty('dosis');
      expect(analysis.información.dosis).toContain('2-6 L/ha');
      
      expect(analysis.información).toHaveProperty('registro');
      expect(analysis.información.registro).toContain('25.517');
    });

    await test.step('Test fertilizer pattern detection', async () => {
      const mockFertilizerText = `
        NITROFOSCA ESPECIAL 15-15-15
        Abono mineral NPK
        15% Nitrógeno total
        15% Anhídrido fosfórico
        15% Óxido de potasio
        Dosis: 300-600 kg/ha
      `;
      
      const response = await request.post('/api/ocr/analyze-text', {
        data: {
          text: mockFertilizerText
        }
      });
      
      expect(response.status()).toBe(200);
      
      const analysis = await response.json();
      
      expect(analysis.tipoProducto).toBe('fertilizante');
      expect(analysis.información).toHaveProperty('npk');
      expect(analysis.información.npk).toEqual({
        nitrógeno: '15%',
        fósforo: '15%',
        potasio: '15%'
      });
    });

    await test.step('Test fungicide pattern detection', async () => {
      const mockFungicideText = `
        MANCOZEB 80 WP
        Fungicida preventivo
        Mancozeb 80% p/p
        Dosis: 200-300 g/hL
        Plazo seguridad: 28 días
        Registro: 12.345
      `;
      
      const response = await request.post('/api/ocr/analyze-text', {
        data: {
          text: mockFungicideText
        }
      });
      
      expect(response.status()).toBe(200);
      
      const analysis = await response.json();
      
      expect(analysis.tipoProducto).toBe('fungicida');
      expect(analysis.información.principioActivo).toContain('Mancozeb');
      expect(analysis.información.plazoSeguridad).toContain('28 días');
    });
  });

  test('OCR API - Image optimization', async ({ request }) => {
    await test.step('Test image preprocessing', async () => {
      const response = await request.post('/api/ocr/optimize', {
        data: {
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          operations: ['resize', 'contrast', 'sharpen']
        }
      });
      
      expect(response.status()).toBe(200);
      
      const optimizedResult = await response.json();
      
      expect(optimizedResult).toHaveProperty('imagenOptimizada');
      expect(optimizedResult).toHaveProperty('operacionesAplicadas');
      expect(optimizedResult).toHaveProperty('mejora');
      
      expect(Array.isArray(optimizedResult.operacionesAplicadas)).toBe(true);
      expect(optimizedResult.operacionesAplicadas).toEqual(['resize', 'contrast', 'sharpen']);
    });
  });

  test('OCR Frontend Integration', async ({ page }) => {
    await test.step('Test OCR in actividad form', async () => {
      await page.goto('/actividades');
      await page.click('text=Nueva Actividad');
      
      // Look for OCR functionality in product section
      const ocrButton = page.locator('[data-testid="ocr-scan-button"]');
      
      if (await ocrButton.isVisible()) {
        await ocrButton.click();
        
        // Check for file upload or camera interface
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeVisible();
        
        // Simulate file selection (would normally upload actual image)
        // In real test, we'd use a test image file
        
        // Check for OCR processing indicators
        const processingIndicator = page.locator('[data-testid="ocr-processing"]');
        if (await processingIndicator.isVisible()) {
          await expect(processingIndicator).toContainText(/procesando|analizando/i);
        }
      }
    });

    await test.step('Test OCR results display', async () => {
      // Simulate OCR completion with mock data
      await page.evaluate(() => {
        // Mock OCR result injection for testing
        const mockResult = {
          tipoProducto: 'herbicida',
          información: {
            nombre: 'ROUNDUP ENERGIA',
            principioActivo: 'Glifosato 36%',
            dosis: '2-6 L/ha',
            registro: '25.517'
          }
        };
        
        // Trigger OCR result display
        window.dispatchEvent(new CustomEvent('ocrComplete', { detail: mockResult }));
      });
      
      // Check if OCR results are displayed
      const ocrResults = page.locator('[data-testid="ocr-results"]');
      if (await ocrResults.isVisible()) {
        await expect(ocrResults).toContainText('ROUNDUP');
        await expect(ocrResults).toContainText('Glifosato');
      }
    });
  });

  test('OCR API - Error handling', async ({ request }) => {
    await test.step('Test invalid image format', async () => {
      const response = await request.post('/api/ocr/process', {
        data: {
          image: 'invalid-image-data'
        }
      });
      
      expect(response.status()).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('formato');
    });

    await test.step('Test image too large', async () => {
      // Create a mock large image (simulate)
      const largeImageData = 'data:image/jpeg;base64,' + 'A'.repeat(10000000); // 10MB
      
      const response = await request.post('/api/ocr/process', {
        data: {
          image: largeImageData
        }
      });
      
      expect(response.status()).toBe(413);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('tamaño');
    });

    await test.step('Test missing image data', async () => {
      const response = await request.post('/api/ocr/process', {
        data: {}
      });
      
      expect(response.status()).toBe(400);
      
      const errorData = await response.json();
      expect(errorData).toHaveProperty('error');
      expect(errorData.error).toContain('imagen');
    });
  });

  test('OCR API - Performance and caching', async ({ request }) => {
    await test.step('Test OCR processing speed', async () => {
      const start = Date.now();
      
      const response = await request.post('/api/ocr/process', {
        data: {
          image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          confidence: 0.7
        }
      });
      
      const processingTime = Date.now() - start;
      
      expect(response.status()).toBe(200);
      expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    await test.step('Test OCR result caching', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
      
      // First request
      const start1 = Date.now();
      const response1 = await request.post('/api/ocr/process', {
        data: { image: imageData, confidence: 0.7 }
      });
      const time1 = Date.now() - start1;
      
      expect(response1.status()).toBe(200);
      
      // Second request (should be cached)
      const start2 = Date.now();
      const response2 = await request.post('/api/ocr/process', {
        data: { image: imageData, confidence: 0.7 }
      });
      const time2 = Date.now() - start2;
      
      expect(response2.status()).toBe(200);
      
      // Second request should be much faster due to caching
      expect(time2).toBeLessThan(time1 / 3);
    });
  });

  test('OCR API - Health monitoring', async ({ request }) => {
    await test.step('Test OCR service health', async () => {
      const response = await request.get('/api/ocr/health');
      
      expect(response.status()).toBe(200);
      
      const healthData = await response.json();
      
      expect(healthData).toHaveProperty('estado');
      expect(healthData).toHaveProperty('tesseract');
      expect(healthData).toHaveProperty('patrones');
      expect(healthData).toHaveProperty('estadísticas');
      
      // Verify Tesseract is operational
      expect(healthData.tesseract.estado).toBe('operativo');
      
      // Verify pattern count
      expect(healthData.patrones.total).toBeGreaterThan(20);
      expect(healthData.patrones.categorías).toHaveProperty('herbicidas');
      expect(healthData.patrones.categorías).toHaveProperty('fungicidas');
      expect(healthData.patrones.categorías).toHaveProperty('fertilizantes');
    });
  });
});