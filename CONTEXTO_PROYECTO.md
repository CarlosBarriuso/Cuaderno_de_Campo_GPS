# Contexto del Proyecto - Cuaderno de Campo GPS

**Fecha de creación**: 2024-07-11  
**Estado actual**: Documentación completa - Listo para implementación  
**Próxima fase**: Desarrollo MVP (Fase 1)

## Resumen Ejecutivo

### Visión del Proyecto
Sistema integral de gestión agrícola que permite a agricultores, cooperativas y sociedades agrícolas registrar, gestionar y analizar actividades de campo mediante geolocalización GPS, con herramientas para optimización de cultivos y cumplimiento normativo PAC.

### Componentes Principales
- **Dashboard Web** (Next.js) - Gestión, analytics y reportes
- **App Móvil** (React Native + Expo) - Registro en campo con GPS
- **Backend API** (Node.js + Express) - Lógica de negocio y datos
- **Base Datos** (PostgreSQL + PostGIS) - Almacenamiento geoespacial

## Decisiones Técnicas Clave Tomadas

### ✅ Stack Tecnológico Confirmado
```typescript
const finalTechStack = {
  // Backend
  runtime: 'Node.js 18+',
  framework: 'Express.js',
  database: 'PostgreSQL + PostGIS',
  orm: 'Prisma',
  auth: 'Clerk (con abstracción para migración futura)',
  
  // Frontend Web
  framework: 'Next.js 14 (App Router)',
  ui: 'Tailwind CSS + Shadcn/ui',
  state: 'Zustand + React Query',
  maps: 'Leaflet + OpenStreetMap',
  
  // Mobile
  framework: 'React Native + Expo',
  storage: 'WatermelonDB + SQLite (sincronización offline)',
  navigation: 'React Navigation 6',
  
  // DevOps
  deployment: 'Railway (MVP) → AWS (escala)',
  ci_cd: 'GitHub Actions',
  monitoring: 'Sentry + métricas custom',
  
  // Repository
  structure: 'Monorepo con npm workspaces'
};
```

### ✅ Framework7 vs React Native - Decisión Final
**RECHAZADO Framework7** tras análisis exhaustivo:
- Precisión GPS limitada (5-10m vs 1-3m en React Native)
- Performance inferior para datasets grandes
- Ecosistema limitado para funcionalidades agrícolas
- Dependencia de Cordova con debugging complejo

**CONFIRMADO React Native + Expo** por:
- APIs nativas robustas para GPS y cámara
- Performance superior para operaciones offline
- Ecosistema maduro con librerías especializadas
- Sincronización optimizada con WatermelonDB

### ✅ Personalización por Tipos de Cultivo
Sistema adaptativo implementado para:
- **Cereales** (secano/regadío): Formularios específicos de siembra, fertilización
- **Frutales**: Actividades de poda, riego, tratamientos específicos
- **Olivar**: Calendario especializado (poda, cosecha, molturación)
- **Viñedo**: Gestión vitivinícola (poda, vendimia, grados Brix)
- **Hortalizas**: Diferenciación aire libre vs invernadero

### ✅ Modelo de Monetización Híbrido
**Estrategia seleccionada**: Freemium + Pricing por Hectárea
- Plan gratuito: Hasta 5 hectáreas
- Plan básico: 0.60€/ha/mes (mínimo 12€/mes)
- Plan profesional: 0.45€/ha/mes + analytics avanzados
- Plan enterprise: 0.30€/ha/mes + servicios personalizados

**Proyecciones**: 900K€ - 2.5M€ anuales en año 2

## Integraciones Externas Implementadas

### 🔗 SIGPAC (Sistema Información Geográfica Parcelas Agrícolas)
**Estrategia**: Híbrida WMS + scraping ético + cache local
- WMS services oficiales como fuente primaria
- Scraping controlado con rate limiting (100 req/hora)
- Cache Redis (30 días) + base datos local como fallback
- Manejo de referencias catastrales formato español

### 🔗 OCR para Productos Agrícolas
**Servicios**: Google Vision API (primario) + Azure Cognitive Services (fallback)
- Patrones específicos para productos españoles
- Extracción automática: principio activo, dosis, registro sanitario
- Optimización de imágenes para mejor reconocimiento
- Confidence scoring y validación cruzada

### 🔗 APIs Meteorológicas
**Fuentes**: AEMET (oficial español) + OpenWeather (internacional)
- Datos en tiempo real para condiciones de aplicación
- Alertas agrícolas específicas (heladas, viento, lluvia)
- Integración con calendario de actividades
- Recomendaciones automáticas según clima

### 🔗 Precios de Mercado
**Fuentes**: Lonja Agraria Nacional + APIs internacionales (CME, Euronext)
- Actualización diaria de precios por cultivo
- Cálculo automático de rentabilidad
- Diferenciación por calidades y variedades

## Arquitectura y Patrones

### 🏗️ Decisiones Arquitectónicas (ADRs)
9 Architecture Decision Records documentados:
1. **Monorepo** vs Multirepo - Seleccionado monorepo
2. **PostgreSQL + PostGIS** para datos geoespaciales
3. **Clerk** con abstracción para auth (migración futura planificada)
4. **React Native + Expo** confirmado sobre Framework7
5. **Zustand + React Query** para estado global
6. **WatermelonDB** para sincronización offline robusta
7. **Leaflet + OSM** para mapas (control de costos)
8. **Jest + Playwright + Detox** para testing completo
9. **Railway → AWS** para deployment escalable

### 🔄 Sincronización Offline
**Estrategia**: WatermelonDB con queue de operaciones
- Funcionamiento completo sin conectividad
- Queue inteligente de operaciones pendientes
- Resolución de conflictos automática (Last Write Wins + manual)
- Sincronización optimizada en background

### 🗺️ Datos Geoespaciales
**Capacidades PostGIS**:
- Cálculos de superficie automáticos
- Detección de parcela por coordenadas GPS
- Operaciones espaciales (intersecciones, buffers)
- Optimización para consultas de proximidad

## Plan de Desarrollo por Fases

### 📅 Fase 1: Fundación (MVP) - 6 semanas
**Estado**: Documentado, listo para implementación
- ✅ Backend: API REST + autenticación + modelo datos básico
- ✅ Frontend Web: Dashboard + gestión parcelas + mapa básico
- ✅ Mobile: GPS + registro actividades + sincronización

### 📅 Fase 2: Integración Avanzada - 5 semanas
- Integración SIGPAC completa
- Sistema OCR para productos
- Mapas avanzados con capas
- Sincronización offline robusta

### 📅 Fase 3: Analytics y Reportes - 4 semanas
- Motor de cálculo de rentabilidad
- Generador automático informes PAC
- Dashboard analytics avanzado
- Comparativas y benchmarking

### 📅 Fase 4: Optimización y Escalabilidad - 4 semanas
- Performance optimization
- Multi-tenancy completo
- Integraciones adicionales
- Preparación para escala

## Testing y Calidad

### 🧪 Estrategia de Testing
**Cobertura**: Unit (90%+) + Integration (85%+) + E2E (78%+)
- **Unit**: Jest + Testing Library
- **E2E Web**: Playwright con GPS mocking
- **E2E Mobile**: Detox con simulación ubicación
- **Geoespacial**: Tests específicos cálculos GPS
- **OCR**: Dataset imágenes productos test
- **Offline**: Validación sincronización completa

### 🔍 Validaciones Agrícolas
Testing específico por cultivo:
- Densidades siembra dentro rangos por cultivo
- Plazos seguridad fitosanitarios
- Dosis aplicación según superficie
- Coherencia cronológica de actividades

## Aspectos Comerciales

### 💰 Modelo de Negocio
- **Freemium**: Hasta 5 ha gratuitas para adopción
- **Escalabilidad**: Precio por hectárea gestionada
- **Enterprise**: Servicios adicionales (consultoría, formación)
- **Marketplace**: Comisiones futuras en insumos/venta

### 🎯 Segmentos Objetivo
- **Agricultores individuales** (80%): 1-200 ha
- **Cooperativas** (15%): Gestión múltiples socios
- **Empresas servicios** (5%): ATRIAs, asesoramiento

### 📈 Métricas de Éxito
- **Adopción**: 80% usuarios registran ≥1 actividad/semana
- **Retención**: <5% churn mensual
- **Eficiencia**: 50% reducción tiempo informes PAC
- **Precisión**: 95% informes sin errores

## Entorno de Desarrollo

### 🛠️ Setup Completo Documentado
- **Docker**: PostgreSQL + PostGIS + Redis
- **Monorepo**: npm workspaces configurado
- **IDEs**: VS Code con extensiones específicas
- **Testing**: Bases datos test + datos seed
- **CI/CD**: GitHub Actions pipeline completo

### 🔧 Herramientas Desarrollo
- **Hot reload**: Backend + Frontend + Mobile simultáneo
- **Debugging**: VS Code launch configs + Flipper móvil
- **Database**: Prisma Studio + PgAdmin
- **Monitoring**: Health checks + métricas custom

## Próximos Pasos Inmediatos

### 🚀 Implementación Fase 1
1. **Setup inicial proyecto** (1 semana)
   - Configurar monorepo
   - Setup CI/CD básico
   - Configurar bases datos desarrollo

2. **Backend core** (2 semanas)
   - API REST endpoints básicos
   - Autenticación Clerk
   - Modelos Prisma + migraciones
   - Testing infrastructure

3. **Frontend web MVP** (2 semanas)
   - Dashboard básico
   - Gestión parcelas
   - Mapa con Leaflet
   - Integración autenticación

4. **Mobile MVP** (2 semanas)
   - Setup React Native + Expo
   - GPS y registro actividades
   - Sincronización básica
   - Testing en dispositivos

### 🎯 Objetivos Fase 1
- **500 usuarios beta** registrados
- **50 parcelas** creadas y gestionadas
- **200 actividades** registradas con GPS
- **0 bugs críticos** en funcionalidades core

### 📋 Validaciones Pendientes
- Testing en condiciones reales de campo
- Validación UX con agricultores reales
- Performance con datasets grandes
- Precisión GPS en diferentes dispositivos

## Consideraciones Futuras

### 🔮 Roadmap Post-MVP
- **Machine Learning**: Predicciones cosecha + recomendaciones
- **IoT Integration**: Sensores campo + weather stations
- **Marketplace**: Insumos + venta producción
- **API Pública**: Ecosistema desarrolladores

### 🌍 Expansión Internacional
- **Mercados prioritarios**: Francia, Italia, Portugal, Polonia
- **Adaptaciones**: Regulaciones locales + idiomas
- **Partnerships**: Distribuidores + cooperativas locales

### 🏢 Escalabilidad Enterprise
- **Microservicios**: Transición gradual según necesidad
- **Multi-tenancy**: Aislamiento datos por organización
- **SLAs**: Garantías uptime + performance
- **Compliance**: GDPR + regulaciones específicas

---

## Resumen Estado Actual

### ✅ COMPLETADO
- **Documentación completa**: 8 documentos técnicos principales
- **Stack tecnológico definido**: Decisiones justificadas y ADRs
- **Arquitectura diseñada**: Monorepo + microservicios futuro
- **Integraciones planificadas**: SIGPAC + OCR + Weather + Pricing
- **Plan desarrollo**: 4 fases con entregables específicos
- **Modelo negocio**: Pricing + proyecciones + go-to-market
- **Testing strategy**: Cobertura completa por tipo
- **Setup desarrollo**: Guía completa environment local

### 🎯 SIGUIENTES ACCIONES
1. **Implementar setup inicial** del monorepo
2. **Configurar CI/CD pipeline** con GitHub Actions
3. **Desarrollar backend core** con autenticación
4. **Crear frontend MVP** con funcionalidades básicas
5. **Implementar mobile MVP** con GPS
6. **Testing en condiciones reales** con usuarios beta

### 💡 DECISIONES PENDIENTES
- Timing exacto migración Railway → AWS
- Evaluación Auth0 vs Clerk a los 6 meses
- Estrategia internacional específica por país
- Roadmap machine learning detallado

**El proyecto está completamente documentado y preparado para comenzar la implementación de la Fase 1 (MVP).**