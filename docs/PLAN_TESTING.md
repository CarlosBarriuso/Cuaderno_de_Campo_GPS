# Plan de Testing y QA - Cuaderno de Campo GPS

## Estrategia General de Testing

### Objetivos de Calidad
- **Funcionalidad**: 100% de requisitos funcionales cubiertos
- **Usabilidad**: Tiempo de aprendizaje < 2 horas para funciones básicas
- **Performance**: Tiempo de respuesta < 2s para operaciones críticas
- **Fiabilidad**: 99.5% uptime, 0% pérdida de datos
- **Seguridad**: Cumplimiento GDPR, protección datos sensibles
- **Compatibilidad**: Soporte multiplataforma y multi-dispositivo

### Principios de Testing
1. **Shift-Left**: Testing temprano en el ciclo de desarrollo
2. **Test Automation**: Automatización de pruebas repetitivas
3. **Risk-Based**: Priorización por criticidad y riesgo
4. **Continuous Testing**: Integración con CI/CD pipeline
5. **Real User Conditions**: Testing en condiciones reales de campo

## Niveles de Testing

### 1. Unit Testing (Pruebas Unitarias)

#### Backend (Node.js)
**Framework**: Jest + Supertest
**Cobertura Target**: 90%+

**Componentes a Testear**:
```javascript
// Ejemplo: Testing de servicios GPS
describe('GPSService', () => {
  test('should calculate distance between coordinates', () => {
    const point1 = { lat: 40.4168, lng: -3.7038 };
    const point2 = { lat: 40.4200, lng: -3.7000 };
    const distance = GPSService.calculateDistance(point1, point2);
    expect(distance).toBeCloseTo(0.42, 2); // km
  });

  test('should validate GPS precision', () => {
    const coords = { lat: 40.4168, lng: -3.7038, accuracy: 3 };
    expect(GPSService.isHighPrecision(coords)).toBe(true);
  });
});

// Testing de modelos de datos
describe('ParcelaModel', () => {
  test('should calculate surface area correctly', () => {
    const polygon = [[lat1, lng1], [lat2, lng2], [lat3, lng3]];
    const parcela = new Parcela({ geometria: polygon });
    expect(parcela.superficie).toBeCloseTo(2.45, 2);
  });
});
```

**Tests Críticos Backend**:
- Cálculos geoespaciales (distancias, áreas, intersecciones)
- Validaciones de actividades por cultivo
- Transformaciones de coordenadas
- Lógica de sincronización offline
- Generación de informes PAC
- Cálculos de rentabilidad
- API endpoints (CRUD operations)
- Autenticación y autorización

#### Frontend Web (React/Next.js)
**Framework**: Jest + Testing Library + MSW (Mock Service Worker)

```javascript
// Ejemplo: Testing de componentes
import { render, screen, fireEvent } from '@testing-library/react';
import ParcelaForm from '@/components/ParcelaForm';

describe('ParcelaForm', () => {
  test('should validate required fields', async () => {
    render(<ParcelaForm />);
    
    const submitBtn = screen.getByRole('button', { name: /guardar/i });
    fireEvent.click(submitBtn);
    
    expect(await screen.findByText(/nombre es requerido/i)).toBeInTheDocument();
  });

  test('should submit form with valid data', async () => {
    const mockOnSubmit = jest.fn();
    render(<ParcelaForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Parcela Test' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nombre: 'Parcela Test'
      });
    });
  });
});
```

#### Mobile App (React Native)
**Framework**: Jest + React Native Testing Library

```javascript
// Ejemplo: Testing GPS functionality
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ActividadForm from '@/screens/ActividadForm';

describe('ActividadForm', () => {
  test('should detect location automatically', async () => {
    const mockLocation = {
      coords: { latitude: 40.4168, longitude: -3.7038, accuracy: 5 }
    };
    
    jest.spyOn(Location, 'getCurrentPositionAsync').mockResolvedValue(mockLocation);
    
    const { getByText } = render(<ActividadForm />);
    
    await waitFor(() => {
      expect(getByText(/ubicación detectada/i)).toBeTruthy();
    });
  });
});
```

### 2. Integration Testing (Pruebas de Integración)

#### Backend Integration Tests
**Scope**: Integración entre módulos, base de datos, APIs externas

```javascript
// Ejemplo: Testing integración SIGPAC
describe('SIGPAC Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  test('should import parcela from SIGPAC reference', async () => {
    const referencia = '28:079:0001:00001:0001:WI';
    
    const response = await request(app)
      .post('/api/parcelas/import-sigpac')
      .send({ referencia })
      .expect(201);
    
    expect(response.body.superficie).toBeGreaterThan(0);
    expect(response.body.geometria).toBeDefined();
    
    // Verificar en BD
    const parcela = await Parcela.findById(response.body.id);
    expect(parcela.origen).toBe('SIGPAC');
  });
});

// Testing OCR integration
describe('OCR Service Integration', () => {
  test('should extract text from product image', async () => {
    const imageBuffer = await fs.readFile('./fixtures/herbicide-label.jpg');
    
    const result = await OCRService.extractText(imageBuffer);
    
    expect(result.producto).toContain('Glifosato');
    expect(result.concentracion).toContain('36%');
    expect(result.registro).toMatch(/\d{5,}/);
  });
});
```

#### Frontend-Backend Integration
```javascript
// Testing API calls con datos reales
describe('Parcela API Integration', () => {
  test('should create, read, update, delete parcela', async () => {
    const parcelaData = {
      nombre: 'Test Parcela',
      cultivo: 'trigo',
      superficie: 2.5
    };
    
    // Create
    const createResponse = await apiClient.post('/parcelas', parcelaData);
    const parcelaId = createResponse.data.id;
    
    // Read
    const getResponse = await apiClient.get(`/parcelas/${parcelaId}`);
    expect(getResponse.data.nombre).toBe(parcelaData.nombre);
    
    // Update
    const updateData = { nombre: 'Updated Parcela' };
    await apiClient.put(`/parcelas/${parcelaId}`, updateData);
    
    // Delete
    await apiClient.delete(`/parcelas/${parcelaId}`);
    
    // Verify deletion
    await expect(apiClient.get(`/parcelas/${parcelaId}`))
      .rejects.toThrow('404');
  });
});
```

### 3. System Testing (Pruebas de Sistema)

#### End-to-End Testing Web
**Framework**: Playwright

```javascript
// Ejemplo: E2E completo registro actividad
import { test, expect } from '@playwright/test';

test.describe('Complete Activity Registration Flow', () => {
  test('should register activity from login to report', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=email]', 'test@farmer.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.click('[data-testid=login-btn]');
    
    // Navigate to map
    await page.click('[data-testid=nav-map]');
    await expect(page.locator('.leaflet-container')).toBeVisible();
    
    // Select parcela
    await page.click('.parcela-polygon[data-id="parcela-1"]');
    await page.click('[data-testid=nueva-actividad]');
    
    // Fill activity form
    await page.selectOption('[data-testid=tipo-actividad]', 'siembra');
    await page.fill('[data-testid=producto]', 'Trigo Blando');
    await page.fill('[data-testid=cantidad]', '180');
    
    // Submit
    await page.click('[data-testid=guardar-actividad]');
    await expect(page.locator('.success-message')).toBeVisible();
    
    // Verify in dashboard
    await page.click('[data-testid=nav-dashboard]');
    await expect(page.locator('.recent-activities')).toContainText('Siembra');
    
    // Generate report
    await page.click('[data-testid=nav-reports]');
    await page.click('[data-testid=generate-pac-report]');
    await page.waitForDownload();
  });
});
```

#### End-to-End Testing Mobile
**Framework**: Detox (React Native)

```javascript
// Ejemplo: E2E mobile GPS registration
describe('Mobile GPS Activity Registration', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should register activity using GPS', async () => {
    // Login
    await element(by.id('email-input')).typeText('test@farmer.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();
    
    // Navigate to activity registration
    await element(by.id('register-activity-tab')).tap();
    
    // Wait for GPS location
    await waitFor(element(by.id('gps-status')))
      .toHaveText('Ubicación detectada')
      .withTimeout(10000);
    
    // Select activity type
    await element(by.id('activity-type-picker')).tap();
    await element(by.text('Fertilización')).tap();
    
    // Fill form
    await element(by.id('product-input')).typeText('Nitrato Amónico');
    await element(by.id('quantity-input')).typeText('200');
    
    // Take photo (optional)
    await element(by.id('camera-button')).tap();
    await element(by.id('capture-button')).tap();
    await element(by.id('accept-photo')).tap();
    
    // Save activity
    await element(by.id('save-activity')).tap();
    
    // Verify success
    await expect(element(by.id('success-message'))).toBeVisible();
  });
});
```

## Testing Específico por Funcionalidad

### 1. Testing Geoespacial

#### Precisión GPS
```javascript
describe('GPS Precision Testing', () => {
  test('should maintain accuracy within 5 meters', async () => {
    const realCoords = { lat: 40.4168, lng: -3.7038 };
    const testCoords = await GPSService.getCurrentPosition();
    
    const distance = calculateDistance(realCoords, testCoords);
    expect(distance).toBeLessThan(0.005); // 5 meters in km
  });
  
  test('should handle GPS signal loss gracefully', async () => {
    // Mock GPS unavailable
    jest.spyOn(navigator.geolocation, 'getCurrentPosition')
      .mockImplementation((success, error) => {
        error({ code: 2, message: 'Position unavailable' });
      });
    
    const result = await GPSService.getCurrentPosition();
    expect(result.error).toBe('GPS_UNAVAILABLE');
    expect(result.fallback).toBe('LAST_KNOWN_POSITION');
  });
});
```

#### Cálculos Geográficos
```javascript
describe('Geographic Calculations', () => {
  test('should calculate polygon area correctly', () => {
    const polygon = [
      [40.4168, -3.7038],
      [40.4170, -3.7038],
      [40.4170, -3.7035],
      [40.4168, -3.7035]
    ];
    
    const area = calculatePolygonArea(polygon);
    expect(area).toBeCloseTo(0.0006, 4); // hectares
  });
  
  test('should detect point in polygon', () => {
    const polygon = [/* polygon coordinates */];
    const point = [40.4169, -3.7036];
    
    expect(isPointInPolygon(point, polygon)).toBe(true);
  });
});
```

### 2. Testing Sincronización Offline

```javascript
describe('Offline Synchronization', () => {
  test('should queue activities when offline', async () => {
    // Simulate offline
    mockNetworkStatus(false);
    
    const activity = {
      tipo: 'siembra',
      parcela_id: 'p1',
      coordenadas: [40.4168, -3.7038]
    };
    
    await ActivityService.save(activity);
    
    const queuedItems = await OfflineQueue.getAll();
    expect(queuedItems).toHaveLength(1);
    expect(queuedItems[0].action).toBe('CREATE_ACTIVITY');
  });
  
  test('should sync queued items when online', async () => {
    // Setup queued items
    await OfflineQueue.add('CREATE_ACTIVITY', activityData);
    
    // Simulate going online
    mockNetworkStatus(true);
    
    const syncResult = await SyncService.syncAll();
    
    expect(syncResult.synced).toBe(1);
    expect(syncResult.failed).toBe(0);
    
    const queuedItems = await OfflineQueue.getAll();
    expect(queuedItems).toHaveLength(0);
  });
});
```

### 3. Testing OCR y Reconocimiento

```javascript
describe('OCR Recognition Testing', () => {
  test('should extract product info from label', async () => {
    const imageBuffer = await loadTestImage('herbicide-label.jpg');
    
    const result = await OCRService.processImage(imageBuffer);
    
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.product_name).toContain('Glifosato');
    expect(result.active_ingredient).toBe('Glifosato 36%');
    expect(result.registration_number).toMatch(/ES-\d{8}/);
  });
  
  test('should handle poor quality images', async () => {
    const blurryImage = await loadTestImage('blurry-label.jpg');
    
    const result = await OCRService.processImage(blurryImage);
    
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.suggested_action).toBe('RETAKE_PHOTO');
  });
});
```

### 4. Testing Validaciones Agrícolas

```javascript
describe('Agricultural Validations', () => {
  test('should validate wheat seeding density', () => {
    const activity = {
      tipo: 'siembra',
      cultivo: 'trigo',
      cantidad: 180, // kg/ha
      superficie: 2.5
    };
    
    const validation = ActivityValidator.validate(activity);
    expect(validation.valid).toBe(true);
  });
  
  test('should reject excessive pesticide dose', () => {
    const activity = {
      tipo: 'herbicida',
      cultivo: 'trigo',
      producto: 'Glifosato 36%',
      dosis: 15 // L/ha - excessive
    };
    
    const validation = ActivityValidator.validate(activity);
    expect(validation.valid).toBe(false);
    expect(validation.errors).toContain('DOSIS_EXCESIVA');
  });
  
  test('should check safety periods', () => {
    const lastTreatment = new Date('2024-01-15');
    const harvestDate = new Date('2024-01-20');
    
    const safetyCheck = SafetyValidator.checkSafetyPeriod(
      'fungicida_cereales',
      lastTreatment,
      harvestDate
    );
    
    expect(safetyCheck.safe).toBe(false);
    expect(safetyCheck.daysRemaining).toBe(35);
  });
});
```

## Performance Testing

### Load Testing (Backend)
**Tool**: Artillery.io

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "GPS Activity Registration"
    weight: 40
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@farmer.com"
            password: "password123"
          capture:
            json: "$.token"
            as: "authToken"
      
      - post:
          url: "/api/actividades"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            tipo: "siembra"
            parcela_id: "{{ $randomInt(1, 100) }}"
            coordenadas: [40.4168, -3.7038]
            timestamp: "{{ $timestamp }}"

  - name: "Map Data Loading"
    weight: 30
    flow:
      - get:
          url: "/api/parcelas/{{ $randomInt(1, 50) }}/geojson"
          headers:
            Authorization: "Bearer {{ authToken }}"

  - name: "Report Generation"
    weight: 20
    flow:
      - post:
          url: "/api/reports/pac"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            fecha_inicio: "2024-01-01"
            fecha_fin: "2024-12-31"
```

### Mobile Performance Testing
```javascript
// Performance monitoring
describe('Mobile Performance', () => {
  test('should load map in under 3 seconds', async () => {
    const startTime = Date.now();
    
    await element(by.id('map-tab')).tap();
    await waitFor(element(by.id('map-loaded')))
      .toBeVisible()
      .withTimeout(3000);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('should handle 100+ parcelas without lag', async () => {
    // Setup 100 parcelas in test DB
    await setupLargeParcelas(100);
    
    const startTime = Date.now();
    await element(by.id('map-tab')).tap();
    
    await waitFor(element(by.id('all-parcelas-loaded')))
      .toBeVisible()
      .withTimeout(5000);
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});
```

## Security Testing

### Authentication & Authorization
```javascript
describe('Security Testing', () => {
  test('should prevent unauthorized access', async () => {
    const response = await request(app)
      .get('/api/parcelas')
      .expect(401);
    
    expect(response.body.error).toBe('TOKEN_REQUIRED');
  });
  
  test('should prevent access to other users data', async () => {
    const userToken = await generateTestToken('user1');
    const otherUserParcelaId = 'parcela-user2-1';
    
    const response = await request(app)
      .get(`/api/parcelas/${otherUserParcelaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    
    expect(response.body.error).toBe('ACCESS_DENIED');
  });
  
  test('should sanitize input data', async () => {
    const maliciousData = {
      nombre: '<script>alert("xss")</script>',
      descripcion: 'DROP TABLE parcelas;'
    };
    
    const response = await request(app)
      .post('/api/parcelas')
      .set('Authorization', `Bearer ${validToken}`)
      .send(maliciousData)
      .expect(400);
    
    expect(response.body.error).toBe('INVALID_INPUT');
  });
});
```

### Data Protection
```javascript
describe('Data Protection', () => {
  test('should encrypt sensitive data', async () => {
    const userData = {
      email: 'test@farmer.com',
      telefono: '600123456'
    };
    
    const user = await User.create(userData);
    
    // Check that phone is encrypted in DB
    const rawUser = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
    expect(rawUser.telefono).not.toBe(userData.telefono);
    expect(rawUser.telefono).toMatch(/^encrypted:/);
  });
  
  test('should comply with GDPR data export', async () => {
    const userId = 'user123';
    
    const export = await GDPRService.exportUserData(userId);
    
    expect(export).toHaveProperty('personal_data');
    expect(export).toHaveProperty('parcelas');
    expect(export).toHaveProperty('actividades');
    expect(export.format).toBe('JSON');
  });
});
```

## Usability Testing

### User Journey Testing
```javascript
describe('User Journey Testing', () => {
  test('new user onboarding flow', async ({ page }) => {
    // Landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Cuaderno de Campo GPS');
    
    // Registration
    await page.click('[data-testid=register-btn]');
    await page.fill('[data-testid=name]', 'Juan Agricultor');
    await page.fill('[data-testid=email]', 'juan@test.com');
    await page.fill('[data-testid=password]', 'password123');
    await page.selectOption('[data-testid=farm-type]', 'individual');
    await page.click('[data-testid=submit-register]');
    
    // Onboarding tutorial
    await expect(page.locator('.onboarding-modal')).toBeVisible();
    await page.click('[data-testid=start-tutorial]');
    
    // Step 1: Add first parcela
    await page.click('[data-testid=tutorial-next]');
    await page.click('[data-testid=add-parcela]');
    
    // Measure time to complete onboarding
    const startTime = Date.now();
    await page.click('[data-testid=complete-onboarding]');
    const onboardingTime = Date.now() - startTime;
    
    expect(onboardingTime).toBeLessThan(120000); // 2 minutes max
  });
});
```

## Testing en Condiciones Reales

### Field Testing Protocol
1. **Dispositivos de Prueba**:
   - Android: Samsung Galaxy (diferentes modelos)
   - iOS: iPhone (diferentes versiones)
   - Tablets: iPad, Android tablets

2. **Condiciones de Campo**:
   - Sin conectividad (modo avión)
   - Conectividad limitada (2G/3G)
   - Batería baja (<20%)
   - Condiciones climáticas adversas
   - Diferentes precisiones GPS

3. **Escenarios de Uso Real**:
   - Registro durante jornada completa (8 horas)
   - Múltiples actividades en diferentes parcelas
   - Captura de fotos con diferentes condiciones de luz
   - Sincronización masiva al final del día

### Beta Testing Program
```javascript
// Analytics de uso beta
describe('Beta Testing Analytics', () => {
  test('should track user interaction patterns', async () => {
    const betaEvents = await Analytics.getBetaEvents('last_30_days');
    
    expect(betaEvents.registration_completion_rate).toBeGreaterThan(0.7);
    expect(betaEvents.daily_active_users).toBeGreaterThan(50);
    expect(betaEvents.feature_adoption.gps_registration).toBeGreaterThan(0.8);
    expect(betaEvents.error_rate).toBeLessThan(0.05);
  });
  
  test('should collect feedback metrics', async () => {
    const feedback = await FeedbackService.getSummary();
    
    expect(feedback.nps_score).toBeGreaterThan(7);
    expect(feedback.usability_score).toBeGreaterThan(4);
    expect(feedback.performance_satisfaction).toBeGreaterThan(4);
  });
});
```

## Automation y CI/CD Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:13-3.1
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: campo_gps_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: npx playwright install
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  mobile-tests:
    needs: unit-tests
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup React Native
        uses: ./.github/actions/setup-rn
      
      - name: Run iOS tests
        run: npm run test:ios
      
      - name: Run Android tests
        run: npm run test:android
```

## Métricas y Reporting

### Test Metrics Dashboard
```javascript
// Ejemplo: Reporte de métricas de testing
const testMetrics = {
  coverage: {
    unit_tests: 92,
    integration_tests: 85,
    e2e_tests: 78
  },
  execution_time: {
    unit_tests: '2m 30s',
    integration_tests: '8m 15s',
    e2e_tests: '25m 40s'
  },
  quality_gates: {
    code_coverage: 'PASSED', // >90%
    performance_budget: 'PASSED', // <3s load time
    security_scan: 'PASSED', // No high/critical issues
    accessibility: 'WARNING' // Some A11Y issues
  },
  defect_density: 0.2, // defects per KLOC
  test_automation_ratio: 85 // % of tests automated
};
```

### Continuous Quality Monitoring
- **SonarQube**: Análisis estático de código
- **Lighthouse CI**: Performance y accessibility
- **Snyk**: Vulnerabilidades de seguridad
- **Bundle Analyzer**: Optimización de bundles
- **Real User Monitoring**: Performance en producción

## Test Data Management

### Test Data Strategy
```javascript
// Factory pattern para datos de test
class TestDataFactory {
  static createParcela(overrides = {}) {
    return {
      nombre: faker.lorem.words(2),
      superficie: faker.number.float({ min: 0.5, max: 10.0 }),
      cultivo: faker.helpers.arrayElement(['trigo', 'cebada', 'girasol']),
      geometria: generateRandomPolygon(),
      ...overrides
    };
  }
  
  static createActividad(parcelaId, overrides = {}) {
    return {
      parcela_id: parcelaId,
      tipo: faker.helpers.arrayElement(['siembra', 'fertilizacion', 'cosecha']),
      fecha: faker.date.recent(),
      coordenadas: generateRandomPoint(),
      ...overrides
    };
  }
}

// Seeding para tests
beforeEach(async () => {
  await cleanDatabase();
  await seedTestData({
    parcelas: 10,
    actividades: 50,
    users: 5
  });
});
```

Este plan de testing asegura una cobertura completa y sistemática de todas las funcionalidades críticas del sistema, con especial atención a las características únicas de la aplicación agrícola como GPS, sincronización offline y validaciones específicas por cultivo.