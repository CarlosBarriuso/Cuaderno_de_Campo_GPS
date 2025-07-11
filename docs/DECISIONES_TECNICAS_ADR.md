# Architecture Decision Records (ADR) - Cuaderno de Campo GPS

## ADR-001: Arquitectura Monorepo vs Multirepo

**Estado**: Aceptado
**Fecha**: 2024-01-15
**Contexto**: Necesidad de coordinar desarrollo entre aplicación web, móvil y backend.

### Problema
Decidir si usar un monorepo único o repositorios separados para cada componente del sistema.

### Opciones Consideradas
1. **Monorepo**: Un repositorio para web, móvil y backend
2. **Multirepo**: Repositorios separados por componente
3. **Híbrido**: Monorepo para frontend, repo separado para backend

### Decisión
**Seleccionado**: Monorepo con herramientas de workspace

### Justificación
- **Sincronización**: Cambios en API reflejados inmediatamente en todos los clientes
- **Código compartido**: Utilidades, tipos y validaciones reutilizables
- **CI/CD simplificado**: Pipeline único para todos los componentes
- **Desarrollo coordenado**: Features desarrolladas end-to-end
- **Versionado consistente**: Una sola fuente de verdad para releases

### Estructura Adoptada
```
cuaderno-campo-gps/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── mobile/       # React Native app
│   └── backend/      # Node.js API
├── packages/
│   ├── shared/       # Código compartido
│   ├── ui/           # Componentes UI compartidos
│   └── types/        # TypeScript types
├── tools/
│   ├── eslint-config/
│   └── jest-config/
└── docs/
```

### Consecuencias
- ✅ Desarrollo más eficiente
- ✅ Menos duplicación de código
- ✅ Testing integrado más fácil
- ❌ Repositorio más grande
- ❌ Curva de aprendizaje para herramientas monorepo

---

## ADR-002: Base de Datos para Datos Geoespaciales

**Estado**: Aceptado
**Fecha**: 2024-01-15
**Contexto**: Necesidad de almacenar y consultar datos geográficos eficientemente.

### Problema
Seleccionar sistema de base de datos optimizado para operaciones geoespaciales y agricultura de precisión.

### Opciones Consideradas
1. **PostgreSQL + PostGIS**: Base relacional con extensión espacial
2. **MongoDB**: Base documental con soporte geoespacial nativo
3. **MySQL + Spatial Extensions**: Base relacional con capacidades espaciales básicas

### Decisión
**Seleccionado**: PostgreSQL + PostGIS

### Justificación
- **Madurez**: PostGIS es el estándar oro para datos geoespaciales
- **Funcionalidades**: Operaciones espaciales avanzadas (intersecciones, buffers, cálculos de área)
- **Precisión**: Soporte para múltiples sistemas de coordenadas
- **ACID**: Garantías transaccionales para datos críticos
- **Ecosystem**: Integración excelente con herramientas GIS

### Capacidades Clave Utilizadas
```sql
-- Ejemplos de operaciones geoespaciales
SELECT ST_Area(geometria) as superficie_ha 
FROM parcelas 
WHERE ST_Contains(geometria, ST_Point(-3.7038, 40.4168));

-- Búsqueda por proximidad
SELECT nombre, ST_Distance(geometria, usuario_location) as distancia
FROM parcelas 
WHERE ST_DWithin(geometria, usuario_location, 1000)
ORDER BY distancia;

-- Intersección de parcelas
SELECT p1.nombre, p2.nombre, ST_Area(ST_Intersection(p1.geometria, p2.geometria))
FROM parcelas p1, parcelas p2
WHERE ST_Intersects(p1.geometria, p2.geometria) AND p1.id != p2.id;
```

### Consecuencias
- ✅ Consultas geoespaciales eficientes
- ✅ Precisión cartográfica profesional
- ✅ Escalabilidad para grandes datasets
- ✅ Compatibilidad con herramientas GIS estándar
- ❌ Mayor complejidad operacional
- ❌ Curva de aprendizaje para desarrolladores

---

## ADR-003: Estrategia de Autenticación

**Estado**: Aceptado
**Fecha**: 2024-01-16
**Contexto**: Necesidad de sistema de autenticación flexible que permita migración futura.

### Problema
Implementar autenticación que sea rápida de desarrollar inicialmente pero permita cambios posteriores.

### Opciones Consideradas
1. **Auth0**: Servicio completo de identidad
2. **Clerk**: Autenticación moderna con UI pre-construida
3. **Firebase Auth**: Solución de Google
4. **Custom JWT**: Implementación propia

### Decisión
**Seleccionado**: Clerk con capa de abstracción

### Justificación
- **Desarrollo rápido**: UI components listos para usar
- **Developer Experience**: Excelente documentación y herramientas
- **Pricing**: Competitivo para startup (gratuito hasta 5000 MAU)
- **Features**: MFA, social login, organizaciones incluidas
- **Migración**: Capa de abstracción permite cambio futuro

### Implementación de Abstracción
```typescript
// auth/adapter.ts
interface AuthAdapter {
  signIn(credentials: LoginCredentials): Promise<AuthResult>;
  signUp(userData: RegisterData): Promise<AuthResult>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  getToken(): Promise<string | null>;
}

class ClerkAdapter implements AuthAdapter {
  async signIn(credentials: LoginCredentials): Promise<AuthResult> {
    return clerk.signIn.create(credentials);
  }
  // ... implementación específica de Clerk
}

// Uso en la aplicación
const auth = new ClerkAdapter();
```

### Plan de Migración Futura
- **6 meses**: Evaluar costos vs Auth0
- **12 meses**: Considerar solución self-hosted si escala lo requiere
- **18 meses**: Evaluar necesidades enterprise (SSO, LDAP)

### Consecuencias
- ✅ Desarrollo MVP acelerado
- ✅ UI/UX profesional out-of-the-box
- ✅ Flexibilidad para migración
- ✅ Soporte multi-tenant nativo
- ❌ Dependencia externa para función crítica
- ❌ Costos escalables con usuarios

---

## ADR-004: Framework para Aplicación Móvil

**Estado**: Aceptado
**Fecha**: 2024-01-18
**Contexto**: Evaluación entre React Native + Expo vs Framework7 + Cordova.

### Problema
Seleccionar tecnología móvil que optimice desarrollo, performance y capacidades nativas.

### Opciones Consideradas
1. **React Native + Expo**: Framework nativo con desarrollo JavaScript
2. **Framework7 + Cordova**: Aplicación híbrida web-based
3. **Flutter**: Framework de Google
4. **Native iOS/Android**: Desarrollo nativo separado

### Decisión
**Seleccionado**: React Native + Expo

### Justificación Detallada
#### Capacidades GPS y Geolocalización
- **React Native**: APIs nativas con precisión superior (1-3m)
- **Framework7**: Dependiente de WebView, precisión limitada (5-10m)

#### Performance
- **React Native**: Rendering nativo, 55-60 FPS
- **Framework7**: Limitado por WebView, 30-40 FPS

#### Ecosistema
- **React Native**: Librerías especializadas para agricultura
- **Framework7**: Ecosistema limitado, dependiente de plugins Cordova

#### Código Compartido
```typescript
// Lógica de negocio compartida entre web y móvil
// packages/shared/src/validations/actividad.ts
export const validateActividad = (actividad: Actividad): ValidationResult => {
  // Validaciones comunes para web y móvil
  if (!actividad.tipo) return { valid: false, error: 'TIPO_REQUERIDO' };
  if (!actividad.coordenadas) return { valid: false, error: 'GPS_REQUERIDO' };
  return { valid: true };
};
```

### Configuración Expo
```json
{
  "expo": {
    "name": "Cuaderno Campo GPS",
    "slug": "cuaderno-campo-gps",
    "platforms": ["ios", "android"],
    "plugins": [
      "expo-location",
      "expo-camera", 
      "expo-sqlite",
      "expo-background-fetch"
    ],
    "location": {
      "locationAlwaysAndWhenInUsePermission": "Esta app necesita acceso a ubicación para registrar actividades de campo."
    }
  }
}
```

### Consecuencias
- ✅ Performance nativa superior
- ✅ GPS de alta precisión
- ✅ Ecosistema maduro
- ✅ Desarrollo unificado con web
- ❌ Bundle size mayor que híbrida
- ❌ Curva de aprendizaje más pronunciada

---

## ADR-005: Estrategia de Estado Global

**Estado**: Aceptado
**Fecha**: 2024-01-20
**Contexto**: Gestión de estado complejo entre componentes web y sincronización de datos.

### Problema
Manejar estado de aplicación web con datos locales, cache server y sincronización optimista.

### Opciones Consideradas
1. **Redux Toolkit**: Estado predecible con actions/reducers
2. **Zustand + React Query**: Estado local simple + cache servidor
3. **Context API + SWR**: Solución nativa React
4. **Recoil**: Estado atómico de Facebook

### Decisión
**Seleccionado**: Zustand + React Query

### Justificación
#### Zustand para Estado Local
```typescript
// stores/parcelasStore.ts
interface ParcelasStore {
  selectedParcela: string | null;
  mapFilter: MapFilter;
  setSelectedParcela: (id: string | null) => void;
  updateMapFilter: (filter: Partial<MapFilter>) => void;
}

export const useParcelasStore = create<ParcelasStore>((set) => ({
  selectedParcela: null,
  mapFilter: { cultivo: 'all', fechaDesde: null },
  setSelectedParcela: (id) => set({ selectedParcela: id }),
  updateMapFilter: (filter) => set((state) => ({ 
    mapFilter: { ...state.mapFilter, ...filter } 
  })),
}));
```

#### React Query para Estado Servidor
```typescript
// hooks/useParcelas.ts
export const useParcelas = () => {
  return useQuery({
    queryKey: ['parcelas'],
    queryFn: () => api.getParcelas(),
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
  });
};

export const useCreateActividad = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.createActividad,
    onSuccess: () => {
      // Invalidar cache relacionado
      queryClient.invalidateQueries(['actividades']);
      queryClient.invalidateQueries(['parcelas']);
    },
    onError: (error) => {
      toast.error('Error al crear actividad');
    }
  });
};
```

### Ventajas de la Combinación
- **Zustand**: Boilerplate mínimo, TypeScript-first
- **React Query**: Cache inteligente, sincronización automática
- **Bundle size**: Significativamente menor que Redux
- **Developer Experience**: Menos verbosidad, más productividad

### Comparativa de Bundle Size
```
Redux Toolkit + RTK Query: ~47kb
Zustand + React Query: ~23kb
Context + SWR: ~15kb (pero más complejidad manual)
```

### Consecuencias
- ✅ Desarrollo más rápido
- ✅ Menos boilerplate
- ✅ Cache inteligente automático
- ✅ Mejor TypeScript support
- ❌ Menos establecido que Redux
- ❌ Ecosistema de dev tools menor

---

## ADR-006: Estrategia de Sincronización Offline

**Estado**: Aceptado
**Fecha**: 2024-01-22
**Contexto**: Aplicación móvil debe funcionar en zonas rurales sin conectividad.

### Problema
Implementar sincronización robusta que maneje operaciones offline y resolución de conflictos.

### Opciones Consideradas
1. **WatermelonDB**: ORM optimizado para React Native con sync
2. **Redux Persist + Custom Sync**: Persistencia manual con lógica custom
3. **Firebase Firestore**: Sincronización automática en tiempo real
4. **PouchDB + CouchDB**: Sincronización bidireccional

### Decisión
**Seleccionado**: WatermelonDB

### Justificación
#### Performance para Datasets Grandes
```typescript
// models/Actividad.ts
import { Model, field, relation, date, json } from '@nozbe/watermelondb/decorators';

export class Actividad extends Model {
  static table = 'actividades';
  
  @field('tipo') tipo!: string;
  @field('parcela_id') parcelaId!: string;
  @field('coordenadas_lat') coordenadasLat!: number;
  @field('coordenadas_lng') coordenadasLng!: number;
  @date('fecha') fecha!: Date;
  @json('productos', sanitizeProductos) productos!: Producto[];
  
  @relation('parcelas', 'parcela_id') parcela!: Relation<Parcela>;
}
```

#### Sincronización Optimizada
```typescript
// sync/syncManager.ts
export class SyncManager {
  async synchronize(): Promise<SyncResult> {
    const { changes, timestamp } = await this.pullChanges();
    await this.applyChanges(changes);
    
    const localChanges = await this.getLocalChanges();
    await this.pushChanges(localChanges);
    
    return { 
      pulled: changes.length, 
      pushed: localChanges.length,
      lastSync: timestamp 
    };
  }
  
  private async handleConflicts(conflicts: Conflict[]): Promise<void> {
    // Estrategia: Last Write Wins con timestamp del servidor
    for (const conflict of conflicts) {
      if (conflict.remote.updated_at > conflict.local.updated_at) {
        await conflict.local.update(conflict.remote.data);
      }
    }
  }
}
```

#### Queue de Operaciones Offline
```typescript
// offline/offlineQueue.ts
export class OfflineQueue {
  async addOperation(operation: OfflineOperation): Promise<void> {
    await database.write(async () => {
      await operationsCollection.create(op => {
        op.type = operation.type;
        op.payload = operation.payload;
        op.timestamp = new Date();
        op.retryCount = 0;
      });
    });
  }
  
  async processQueue(): Promise<void> {
    const pendingOps = await operationsCollection
      .query(Q.where('status', 'pending'))
      .fetch();
    
    for (const op of pendingOps) {
      try {
        await this.executeOperation(op);
        await op.update(o => o.status = 'completed');
      } catch (error) {
        await this.handleRetry(op, error);
      }
    }
  }
}
```

### Estrategia de Resolución de Conflictos
1. **Last Write Wins**: Para datos simples (timestamp servidor prevalece)
2. **Manual Resolution**: Para datos críticos (mostrar conflicto al usuario)
3. **Merge Strategies**: Para listas y arrays (combinar cambios)

### Consecuencias
- ✅ Performance superior para datasets grandes
- ✅ Sincronización automática eficiente
- ✅ Resolución de conflictos configurable
- ✅ Soporte nativo para React Native
- ❌ Curva de aprendizaje para ORM específico
- ❌ Dependencia de librería menos mainstream

---

## ADR-007: Arquitectura de Mapas y Visualización

**Estado**: Aceptado
**Fecha**: 2024-01-25
**Contexto**: Necesidad de mapas interactivos con datos geoespaciales complejos.

### Problema
Seleccionar stack de mapas que balance performance, costo y funcionalidades.

### Opciones Consideradas
1. **Leaflet + OpenStreetMap**: Open source, sin límites de API
2. **Google Maps API**: Mapas premium con costos por uso
3. **Mapbox**: Mapas customizables con API moderna
4. **ArcGIS**: Solución enterprise para GIS

### Decisión
**Seleccionado**: Leaflet + OpenStreetMap + Complementos

### Justificación
#### Costos y Sostenibilidad
```typescript
// Comparativa de costos anuales (10,000 usuarios activos)
const costComparison = {
  leaflet_osm: 0, // Gratuito
  google_maps: 12000, // $1 per 1000 requests
  mapbox: 6000, // $0.50 per 1000 requests
  arcgis: 24000 // Enterprise licensing
};
```

#### Implementación con Capacidades Avanzadas
```tsx
// components/MapView.tsx
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export const MapView: React.FC<MapViewProps> = ({ parcelas, onParcelaClick }) => {
  return (
    <MapContainer center={[40.4168, -3.7038]} zoom={10}>
      {/* Base map layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© OpenStreetMap contributors'
      />
      
      {/* Satellite overlay (optional) */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        opacity={0.7}
      />
      
      {/* Parcelas layer */}
      {parcelas.map(parcela => (
        <GeoJSON
          key={parcela.id}
          data={parcela.geometria}
          style={getParcelaStyle(parcela)}
          eventHandlers={{
            click: () => onParcelaClick(parcela)
          }}
        />
      ))}
    </MapContainer>
  );
};
```

#### Optimizaciones para Performance
```typescript
// utils/mapOptimizations.ts
export class MapOptimizer {
  // Clustering para muchas parcelas
  static createClusterLayer(parcelas: Parcela[]): L.MarkerClusterGroup {
    return L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50
    });
  }
  
  // Simplificación de geometrías según zoom
  static simplifyGeometry(geometry: GeoJSON, zoomLevel: number): GeoJSON {
    const tolerance = this.getToleranceForZoom(zoomLevel);
    return turf.simplify(geometry, { tolerance });
  }
  
  // Viewport culling
  static filterVisibleParcelas(parcelas: Parcela[], bounds: L.LatLngBounds): Parcela[] {
    return parcelas.filter(p => 
      bounds.intersects(L.geoJSON(p.geometria).getBounds())
    );
  }
}
```

### Plugins y Extensiones Utilizadas
- **Leaflet.markercluster**: Agrupación de marcadores
- **Leaflet.draw**: Herramientas de dibujo
- **Leaflet.fullscreen**: Modo pantalla completa
- **Turf.js**: Operaciones geoespaciales client-side

### Consecuencias
- ✅ Sin costos de API
- ✅ Control total sobre styling
- ✅ Performance optimizable
- ✅ Ecosistema de plugins rico
- ❌ Calidad de imágenes satélite menor
- ❌ Sin servicios premium (routing, geocoding)

---

## ADR-008: Estrategia de Testing Automatizado

**Estado**: Aceptado
**Fecha**: 2024-01-28
**Contexto**: Necesidad de testing robusto para aplicación con componentes geoespaciales.

### Problema
Implementar estrategia de testing que cubra funcionalidades específicas de agricultura.

### Opciones Consideradas
1. **Jest + Testing Library + Playwright**: Stack moderno
2. **Cypress + Jest**: E2E visual + unit testing
3. **Vitest + Testing Library**: Alternativa rápida a Jest
4. **Selenium + JUnit**: Stack tradicional

### Decisión
**Seleccionado**: Jest + Testing Library + Playwright + Detox

### Justificación por Tipo de Testing

#### Unit Testing (Jest + Testing Library)
```typescript
// __tests__/gps.test.ts
describe('GPS Utilities', () => {
  test('should calculate distance between coordinates', () => {
    const madrid = { lat: 40.4168, lng: -3.7038 };
    const barcelona = { lat: 41.3851, lng: 2.1734 };
    
    const distance = calculateDistance(madrid, barcelona);
    expect(distance).toBeCloseTo(504.6, 1); // km
  });
  
  test('should validate GPS precision', () => {
    const highPrecision = { lat: 40.4168, lng: -3.7038, accuracy: 3 };
    const lowPrecision = { lat: 40.4168, lng: -3.7038, accuracy: 15 };
    
    expect(isHighPrecisionGPS(highPrecision)).toBe(true);
    expect(isHighPrecisionGPS(lowPrecision)).toBe(false);
  });
});
```

#### E2E Web Testing (Playwright)
```typescript
// e2e/registration-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete activity registration flow', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Mock GPS location
  await page.context().setGeolocation({ 
    latitude: 40.4168, 
    longitude: -3.7038 
  });
  
  await page.click('[data-testid="register-activity"]');
  await page.selectOption('[data-testid="activity-type"]', 'siembra');
  await page.fill('[data-testid="product"]', 'Trigo Blando');
  
  // Verify GPS coordinates are captured
  const coordsText = await page.textContent('[data-testid="coordinates"]');
  expect(coordsText).toContain('40.4168');
  
  await page.click('[data-testid="save-activity"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

#### Mobile E2E Testing (Detox)
```typescript
// e2e/mobile/gps-registration.e2e.ts
describe('GPS Activity Registration', () => {
  beforeAll(async () => {
    await device.launchApp();
    await device.setLocation(40.4168, -3.7038);
  });

  it('should register activity with GPS location', async () => {
    await element(by.id('activity-tab')).tap();
    
    // Wait for GPS to be detected
    await waitFor(element(by.id('gps-indicator')))
      .toHaveText('GPS Detectado')
      .withTimeout(5000);
    
    await element(by.id('activity-type')).tap();
    await element(by.text('Fertilización')).tap();
    
    await element(by.id('product-input')).typeText('Urea 46%');
    await element(by.id('quantity-input')).typeText('200');
    
    await element(by.id('save-button')).tap();
    
    await expect(element(by.id('success-message'))).toBeVisible();
  });
});
```

### Testing de Componentes Geoespaciales
```typescript
// __tests__/map-component.test.tsx
import { render, screen } from '@testing-library/react';
import { MapView } from '@/components/MapView';

// Mock Leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  GeoJSON: ({ data }: any) => <div data-testid="geojson">{JSON.stringify(data)}</div>
}));

describe('MapView', () => {
  const mockParcelas = [
    {
      id: '1',
      nombre: 'Parcela Norte',
      geometria: {
        type: 'Polygon',
        coordinates: [[[40.4168, -3.7038], [40.4169, -3.7038], [40.4169, -3.7037]]]
      }
    }
  ];

  test('should render map with parcelas', () => {
    render(<MapView parcelas={mockParcelas} onParcelaClick={jest.fn()} />);
    
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByTestId('geojson')).toBeInTheDocument();
  });
});
```

### CI/CD Pipeline Integration
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgis/postgis:13-3.1
        env:
          POSTGRES_PASSWORD: test
    steps:
      - run: npm run test:integration

  e2e-web:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright install
      - run: npm run test:e2e

  e2e-mobile:
    runs-on: macos-latest
    steps:
      - run: npm run test:mobile:ios
```

### Consecuencias
- ✅ Cobertura completa de funcionalidades
- ✅ Testing específico para GPS y mapas
- ✅ Detección temprana de regressions
- ✅ Confidence para deployments
- ❌ Setup inicial complejo
- ❌ Tiempo de ejecución considerable

---

## ADR-009: Estrategia de Deployment y DevOps

**Estado**: Aceptado
**Fecha**: 2024-02-01
**Contexto**: Necesidad de deployment automatizado y escalable.

### Problema
Implementar pipeline de deployment que soporte desarrollo ágil y escalado futuro.

### Opciones Consideradas
1. **Railway (MVP) → AWS (Escala)**: Transición gradual
2. **Vercel + PlanetScale**: Stack serverless completo
3. **Docker + VPS**: Control total, gestión manual
4. **AWS desde inicio**: Enterprise-ready desde día 1

### Decisión
**Seleccionado**: Railway (MVP) → AWS (Escala)

### Justificación Fase MVP (Railway)
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
healthcheckTimeout = 300

[[services]]
name = "backend"
source = "apps/backend"

[[services]]
name = "frontend"
source = "apps/web"

[[services]]
name = "postgres"
plugin = "postgresql"
```

#### Ventajas Railway para MVP
- **Setup zero-config**: Deploy en minutos
- **PostgreSQL managed**: PostGIS incluido
- **Pricing predecible**: $20/mes iniciales
- **Git integration**: Deploy automático en push
- **Monitoreo incluido**: Logs y métricas básicas

### Transición a AWS (Escala)
```yaml
# terraform/main.tf (preparado para futuro)
resource "aws_ecs_cluster" "cuaderno_campo" {
  name = "cuaderno-campo-gps"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_rds_instance" "postgres" {
  identifier = "cuaderno-campo-db"
  engine     = "postgres"
  engine_version = "13.7"
  instance_class = "db.t3.micro"
  
  # PostGIS extension support
  parameter_group_name = aws_db_parameter_group.postgres_postgis.name
}
```

### Pipeline CI/CD Híbrido
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway Staging
        run: railway deploy --environment staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway Production
        run: railway deploy --environment production
      
      # Future: AWS deployment
      - name: Deploy to AWS (when scaled)
        if: env.USE_AWS == 'true'
        run: |
          aws ecs update-service \
            --cluster cuaderno-campo \
            --service backend \
            --force-new-deployment
```

### Monitoring y Observabilidad
```typescript
// monitoring/setup.ts
import { Sentry } from '@sentry/node';
import { createPrometheusMetrics } from './prometheus';

// Error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 0.1,
});

// Custom metrics para agricultura
const metrics = createPrometheusMetrics({
  actividades_registradas: 'counter',
  gps_precision_avg: 'histogram',
  sync_operations: 'counter',
  parcelas_activas: 'gauge'
});
```

### Estrategia de Backup
```sql
-- Backup automatizado con punto de recuperación
-- Railway: Automático diario
-- AWS: Point-in-time recovery habilitado

-- Script de backup manual crítico
pg_dump \
  --verbose \
  --no-acl \
  --no-owner \
  --format=custom \
  --compress=9 \
  $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Consecuencias
- ✅ Deployment rápido para MVP
- ✅ Escalabilidad planificada
- ✅ Costos controlados inicialmente
- ✅ Transición gradual sin downtime
- ❌ Vendor lock-in temporal con Railway
- ❌ Migración futura requerirá planificación

---

## Resumen de Decisiones Técnicas

### Stack Final Confirmado
```typescript
const techStack = {
  // Backend
  runtime: 'Node.js 18+',
  framework: 'Express.js',
  database: 'PostgreSQL + PostGIS',
  orm: 'Prisma',
  auth: 'Clerk (con abstracción)',
  
  // Frontend Web
  framework: 'Next.js 14',
  ui: 'Tailwind CSS + Shadcn/ui',
  state: 'Zustand + React Query',
  maps: 'Leaflet + OpenStreetMap',
  
  // Mobile
  framework: 'React Native + Expo',
  storage: 'WatermelonDB + SQLite',
  navigation: 'React Navigation 6',
  
  // DevOps
  deployment: 'Railway → AWS',
  ci_cd: 'GitHub Actions',
  monitoring: 'Sentry + Custom metrics',
  
  // Testing
  unit: 'Jest + Testing Library',
  e2e_web: 'Playwright',
  e2e_mobile: 'Detox',
  
  // Repository
  structure: 'Monorepo',
  package_manager: 'npm workspaces'
};
```

### Principios Arquitectónicos Adoptados
1. **Escalabilidad Gradual**: Soluciones simples que permiten crecimiento
2. **Abstracción de Dependencias**: Facilitar migraciones futuras
3. **Performance First**: Optimización para casos de uso agrícolas
4. **Developer Experience**: Herramientas que aceleren desarrollo
5. **Cost Optimization**: Balance entre funcionalidad y costos operativos

### Próximas Decisiones Pendientes
- **ADR-010**: Estrategia de internacionalización (i18n)
- **ADR-011**: Implementación de machine learning para predicciones
- **ADR-012**: Integración con IoT y sensores de campo
- **ADR-013**: Arquitectura de microservicios para escala enterprise

Cada ADR será revisado cada 6 meses para validar que las decisiones siguen siendo óptimas conforme evoluciona el proyecto y las necesidades del negocio.