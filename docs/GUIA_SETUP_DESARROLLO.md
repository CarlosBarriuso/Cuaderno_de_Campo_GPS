# Guía de Setup del Entorno de Desarrollo - Cuaderno de Campo GPS

## Requisitos Previos

### Software Necesario
- **Node.js**: v18.0+ (recomendado v18.17+)
- **npm**: v9.0+ (incluido con Node.js)
- **Git**: v2.30+
- **Docker**: v20.0+ (para base de datos local)
- **PostgreSQL**: v13+ con PostGIS (o usar Docker)
- **Redis**: v6.0+ (o usar Docker)

### Cuentas de Desarrollo
- **GitHub**: Para repositorio y CI/CD
- **Clerk**: Para autenticación (plan gratuito)
- **Google Cloud**: Para Vision API (créditos gratuitos)
- **Railway**: Para deployment inicial (plan gratuito)

## Configuración Inicial

### 1. Clonar y Configurar Repositorio

```bash
# Clonar repositorio
git clone https://github.com/tu-org/cuaderno-campo-gps.git
cd cuaderno-campo-gps

# Instalar dependencias del monorepo
npm install

# Configurar workspaces
npm run setup
```

### 2. Variables de Entorno

Crear archivos de configuración para cada entorno:

```bash
# Archivos de environment
cp .env.example .env.local
cp apps/backend/.env.example apps/backend/.env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

#### `.env.local` (Raíz del proyecto)
```bash
# Configuración general
NODE_ENV=development
LOG_LEVEL=debug

# Base de datos local
DATABASE_URL=postgresql://postgres:password@localhost:5432/cuaderno_campo_dev
REDIS_URL=redis://localhost:6379

# URLs de servicios
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

#### `apps/backend/.env.local`
```bash
# Server configuration
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/cuaderno_campo_dev
REDIS_URL=redis://localhost:6379

# Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# External APIs
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./credentials/google-cloud-key.json
AEMET_API_KEY=your_aemet_api_key
OPENWEATHER_API_KEY=your_openweather_api_key

# Feature flags
ENABLE_SIGPAC_SCRAPING=false
ENABLE_OCR_PROCESSING=true
ENABLE_WEATHER_INTEGRATION=true

# Security
JWT_SECRET=your-super-secret-jwt-key-for-development
ENCRYPTION_KEY=your-32-character-encryption-key

# Rate limiting
SIGPAC_RATE_LIMIT=100
OCR_RATE_LIMIT=50
```

#### `apps/web/.env.local`
```bash
# Next.js configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# API endpoints
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MAP_TILES_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

#### `apps/mobile/.env.local`
```bash
# Expo configuration
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key

# Feature flags
EXPO_PUBLIC_ENABLE_DEV_MENU=true
EXPO_PUBLIC_ENABLE_GPS_SIMULATION=true
```

### 3. Base de Datos Local con Docker

```bash
# Crear docker-compose.dev.yml
cat > docker-compose.dev.yml << EOF
version: '3.8'

services:
  postgres:
    image: postgis/postgis:13-3.1
    container_name: cuaderno-campo-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: cuaderno_campo_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    command: >
      postgres -c log_statement=all
               -c log_destination=stderr
               -c log_min_messages=info

  redis:
    image: redis:7-alpine
    container_name: cuaderno-campo-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: cuaderno-campo-pgadmin
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@cuadernocampo.local
      PGADMIN_DEFAULT_PASSWORD: admin
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:
EOF

# Levantar servicios de desarrollo
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Configuración de Base de Datos

```bash
# Generar y ejecutar migraciones
cd apps/backend
npm run db:generate
npm run db:migrate
npm run db:seed

# Verificar instalación de PostGIS
npm run db:check-postgis
```

#### Script de verificación PostGIS
```sql
-- database/check-postgis.sql
SELECT PostGIS_version();
SELECT ST_AsText(ST_Point(-3.7038, 40.4168));

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;
```

### 5. Configuración de Servicios Externos

#### Google Cloud Vision API
```bash
# 1. Crear proyecto en Google Cloud Console
# 2. Habilitar Vision API
# 3. Crear service account
# 4. Descargar key JSON

mkdir -p apps/backend/credentials
# Mover google-cloud-key.json a apps/backend/credentials/

# Verificar configuración
cd apps/backend
npm run test:ocr
```

#### Clerk Authentication
```bash
# 1. Crear cuenta en https://clerk.com
# 2. Crear nueva aplicación
# 3. Configurar providers (email, Google, etc.)
# 4. Copiar keys a .env files

# Verificar configuración
cd apps/web
npm run test:auth
```

## Estructura del Proyecto

```
cuaderno-campo-gps/
├── apps/
│   ├── backend/                 # API Node.js + Express
│   │   ├── src/
│   │   │   ├── controllers/     # Controladores REST
│   │   │   ├── services/        # Lógica de negocio
│   │   │   ├── models/          # Modelos Prisma
│   │   │   ├── middleware/      # Middleware Express
│   │   │   ├── routes/          # Definición de rutas
│   │   │   ├── utils/           # Utilidades
│   │   │   └── integrations/    # APIs externas
│   │   ├── prisma/              # Schema y migraciones
│   │   ├── tests/               # Tests backend
│   │   └── package.json
│   │
│   ├── web/                     # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/             # App Router (Next.js 14)
│   │   │   ├── components/      # Componentes React
│   │   │   ├── hooks/           # Custom hooks
│   │   │   ├── lib/             # Utilidades frontend
│   │   │   ├── stores/          # Zustand stores
│   │   │   └── styles/          # CSS/Tailwind
│   │   ├── public/              # Assets estáticos
│   │   ├── tests/               # Tests frontend
│   │   └── package.json
│   │
│   └── mobile/                  # App React Native + Expo
│       ├── src/
│       │   ├── screens/         # Pantallas principales
│       │   ├── components/      # Componentes móvil
│       │   ├── navigation/      # React Navigation
│       │   ├── services/        # Servicios móvil
│       │   ├── stores/          # Zustand stores
│       │   └── utils/           # Utilidades móvil
│       ├── assets/              # Imágenes, iconos
│       ├── app.json             # Configuración Expo
│       └── package.json
│
├── packages/
│   ├── shared/                  # Código compartido
│   │   ├── src/
│   │   │   ├── types/           # TypeScript types
│   │   │   ├── validations/     # Esquemas Zod
│   │   │   ├── utils/           # Utilidades comunes
│   │   │   └── constants/       # Constantes
│   │   └── package.json
│   │
│   ├── ui/                      # Componentes UI compartidos
│   │   ├── src/
│   │   │   ├── components/      # Componentes base
│   │   │   ├── icons/           # Iconos SVG
│   │   │   └── styles/          # Estilos base
│   │   └── package.json
│   │
│   └── config/                  # Configuraciones compartidas
│       ├── eslint/              # ESLint config
│       ├── typescript/          # TypeScript config
│       └── jest/                # Jest config
│
├── tools/
│   ├── database/                # Scripts de BD
│   ├── deploy/                  # Scripts deployment
│   └── scripts/                 # Utilidades desarrollo
│
├── docs/                        # Documentación completa
├── .github/                     # GitHub Actions
├── docker-compose.dev.yml       # Desarrollo local
├── package.json                 # Root package.json
└── README.md
```

## Comandos de Desarrollo

### Scripts Principales

```bash
# Instalar dependencias en todo el monorepo
npm install

# Desarrollo completo (todos los servicios)
npm run dev

# Desarrollo individual
npm run dev:backend    # Solo API
npm run dev:web        # Solo frontend web
npm run dev:mobile     # Solo app móvil

# Base de datos
npm run db:migrate     # Ejecutar migraciones
npm run db:seed        # Poblar datos de desarrollo
npm run db:reset       # Reset completo BD
npm run db:studio      # Abrir Prisma Studio

# Testing
npm run test           # Tests todos los workspaces
npm run test:unit      # Solo unit tests
npm run test:e2e       # Solo E2E tests
npm run test:coverage  # Con coverage report

# Linting y formateo
npm run lint           # ESLint en todo el proyecto
npm run lint:fix       # Fix automático
npm run format         # Prettier en todo el proyecto

# Build
npm run build          # Build todos los workspaces
npm run build:web      # Solo frontend
npm run build:mobile   # Solo app móvil

# Deployment
npm run deploy:staging # Deploy a staging
npm run deploy:prod    # Deploy a producción
```

### Scripts Backend Específicos

```bash
cd apps/backend

# Desarrollo con hot reload
npm run dev

# Ejecutar migraciones
npm run db:migrate
npm run db:generate    # Generar Prisma client

# Tests específicos
npm run test:unit
npm run test:integration
npm run test:services  # Tests de servicios externos

# Verificar configuración
npm run health:check   # Health check servicios
npm run test:ocr       # Test Google Vision
npm run test:sigpac    # Test integración SIGPAC
```

### Scripts Frontend Web Específicos

```bash
cd apps/web

# Desarrollo
npm run dev

# Análisis de bundle
npm run analyze

# Tests específicos
npm run test:components
npm run test:pages
npm run test:e2e

# Verificar configuración
npm run test:clerk     # Test autenticación
npm run test:api       # Test conexión backend
```

### Scripts Mobile Específicos

```bash
cd apps/mobile

# Desarrollo
npm run start          # Expo dev server
npm run ios            # iOS simulator
npm run android        # Android emulator
npm run web            # Web version

# Build
npm run build:ios
npm run build:android

# Tests
npm run test:detox:ios
npm run test:detox:android

# Deploy
npm run deploy:expo    # Expo publish
```

## Configuración del IDE

### VS Code (Recomendado)

#### Extensiones Necesarias
```json
// .vscode/extensions.json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "Prisma.prisma",
    "expo.vscode-expo-tools",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

#### Configuración Workspace
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.suggest.autoImports": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/.expo": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/.expo": true
  },
  "eslint.workingDirectories": ["apps/backend", "apps/web", "apps/mobile"],
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

#### Snippets de Desarrollo
```json
// .vscode/snippets.json
{
  "React Component": {
    "prefix": "rfc",
    "body": [
      "interface ${1:ComponentName}Props {",
      "  ${2:// props}",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({",
      "  ${3:// destructured props}",
      "}) => {",
      "  return (",
      "    <div>",
      "      ${4:// component content}",
      "    </div>",
      "  );",
      "};"
    ]
  },
  "Zustand Store": {
    "prefix": "zustand",
    "body": [
      "interface ${1:StoreName}State {",
      "  ${2:// state properties}",
      "}",
      "",
      "interface ${1:StoreName}Actions {",
      "  ${3:// action methods}",
      "}",
      "",
      "type ${1:StoreName}Store = ${1:StoreName}State & ${1:StoreName}Actions;",
      "",
      "export const use${1:StoreName}Store = create<${1:StoreName}Store>((set, get) => ({",
      "  ${4:// initial state and actions}",
      "}));"
    ]
  }
}
```

## Debugging y Desarrollo

### Configuración Debug Node.js
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/backend/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "cwd": "${workspaceFolder}/apps/backend",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--no-cache"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

### Hot Reload Completo
```bash
# Terminal 1: Base de datos
docker-compose -f docker-compose.dev.yml up

# Terminal 2: Backend con hot reload
cd apps/backend && npm run dev

# Terminal 3: Frontend con hot reload
cd apps/web && npm run dev

# Terminal 4: Mobile development
cd apps/mobile && npm run start
```

### Debugging React Native
```bash
# Flipper para debugging avanzado
npx react-native doctor

# React Native Debugger
npm install -g react-native-debugger

# Configurar debugging en Expo
cd apps/mobile
npx expo install expo-dev-client
```

## Testing en Desarrollo

### Setup Tests Base de Datos
```bash
# Crear BD de test
createdb cuaderno_campo_test

# Variables de entorno para tests
export NODE_ENV=test
export DATABASE_URL=postgresql://postgres:password@localhost:5432/cuaderno_campo_test

# Ejecutar migraciones en BD test
npm run db:migrate:test
```

### Datos de Test
```typescript
// tools/scripts/seed-test-data.ts
export async function seedTestData() {
  // Crear usuario de test
  const testUser = await prisma.user.create({
    data: {
      email: 'test@farmer.com',
      name: 'Test Farmer',
      clerkId: 'user_test_123'
    }
  });

  // Crear parcela de test
  const testParcela = await prisma.parcela.create({
    data: {
      nombre: 'Parcela Test',
      superficie: 2.5,
      cultivo: 'trigo',
      geometria: {
        type: 'Polygon',
        coordinates: [[[40.4168, -3.7038], [40.4170, -3.7038], [40.4170, -3.7035], [40.4168, -3.7035], [40.4168, -3.7038]]]
      },
      propietarioId: testUser.id
    }
  });

  // Crear actividades de test
  await prisma.actividad.createMany({
    data: [
      {
        tipo: 'siembra',
        fecha: new Date('2024-01-15'),
        coordenadas: [40.4169, -3.7036],
        parcelaId: testParcela.id,
        productos: [{ nombre: 'Trigo Blando', cantidad: 180, unidad: 'kg/ha' }]
      }
    ]
  });
}
```

## Solución de Problemas Comunes

### Error: "PostGIS not found"
```bash
# Verificar PostGIS en container
docker exec cuaderno-campo-postgres psql -U postgres -d cuaderno_campo_dev -c "SELECT PostGIS_version();"

# Si falla, recrear container
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Error: "CLERK_SECRET_KEY not found"
```bash
# Verificar variables de entorno
cd apps/web && npm run env:check

# Crear .env.local si no existe
cp .env.example .env.local
# Editar con keys reales de Clerk
```

### Error: Node Modules Dependencies
```bash
# Limpiar y reinstalar
npm run clean
npm install

# Si persiste, borrar node_modules completos
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### Error: Puerto ya en uso
```bash
# Verificar procesos usando puertos
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :5432  # PostgreSQL

# Matar procesos si es necesario
kill -9 <PID>
```

### Error: Expo Metro Bundle
```bash
cd apps/mobile

# Limpiar cache Metro
npx expo start --clear

# Si persiste, reset completo
rm -rf .expo node_modules
npm install
npx expo start
```

## Próximos Pasos

Una vez completado el setup:

1. **Verificar funcionamiento**:
   ```bash
   npm run health:check
   npm run test:integration
   ```

2. **Crear primera feature**:
   - Seguir TDD approach
   - Implementar tests primero
   - Documentar cambios

3. **Configurar CI/CD**:
   - Push a GitHub
   - Verificar GitHub Actions
   - Setup staging environment

4. **Deployment**:
   - Configurar Railway
   - Setup monitoring
   - Configurar dominios

## Recursos Adicionales

- **Documentación API**: http://localhost:3001/docs (cuando backend esté ejecutándose)
- **Prisma Studio**: http://localhost:5555 (con `npm run db:studio`)
- **PgAdmin**: http://localhost:5050 (admin@cuadernocampo.local / admin)
- **Expo DevTools**: Metro bundler interface

Esta guía proporciona todo lo necesario para comenzar el desarrollo local del proyecto de manera eficiente y estructurada.