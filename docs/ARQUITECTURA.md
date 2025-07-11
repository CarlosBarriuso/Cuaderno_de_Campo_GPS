# Arquitectura del Sistema - Cuaderno de Campo GPS

## Visión General

Sistema integral de gestión agrícola compuesto por una aplicación web (dashboard) y una aplicación móvil para el registro de actividades en campo mediante GPS.

## Componentes del Sistema

### 1. Dashboard Web
- **Propósito**: Gestión, visualización y análisis de datos agrícolas
- **Usuarios**: Agricultores, cooperativas, sociedades agrícolas
- **Funcionalidades Principales**:
  - Gestión de parcelas con integración SIGPAC
  - Visualización en mapas del estado de parcelas
  - Estadísticas de rentabilidad
  - Generación de informes PAC
  - Gestión de usuarios y permisos

### 2. Aplicación Móvil
- **Propósito**: Registro de actividades en campo
- **Usuarios**: Agricultores y trabajadores de campo
- **Funcionalidades Principales**:
  - Registro de actividades por GPS
  - Captura de fotos con OCR
  - Sincronización offline/online
  - Geolocalización automática de parcelas

### 3. Backend API
- **Propósito**: Lógica de negocio y gestión de datos
- **Responsabilidades**:
  - Autenticación y autorización
  - Gestión de datos geoespaciales
  - Integración con servicios externos
  - Procesamiento de imágenes y OCR

## Arquitectura Técnica

### Backend
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │    │   Auth Service  │
│    (Nginx)      │────│   (Express)     │────│    (Clerk)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌───────▼────────┐
            │  Core Services │  │  External APIs │
            │               │  │               │
            │ • Parcelas    │  │ • SIGPAC       │
            │ • Actividades │  │ • OCR Service  │
            │ • Reportes    │  │ • Weather API  │
            └───────┬────────┘  └────────────────┘
                    │
        ┌───────────▼───────────┐
        │     Base de Datos     │
        │  PostgreSQL + PostGIS │
        └───────────────────────┘
```

### Frontend
```
┌─────────────────┐    ┌─────────────────┐
│   Dashboard Web │    │   App Móvil     │
│   (Next.js)     │    │ (React Native)  │
│                 │    │                 │
│ • Mapas         │    │ • GPS           │
│ • Analytics     │    │ • Cámara        │
│ • Gestión       │    │ • Offline       │
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
           ┌─────────▼─────────┐
           │    REST API       │
           │   (Backend)       │
           └───────────────────┘
```

## Modelo de Datos

### Entidades Principales

#### Usuarios
- ID, nombre, email, rol
- Organización/cooperativa
- Permisos y accesos

#### Parcelas
- Referencia catastral SIGPAC
- Coordenadas geográficas (polígonos)
- Superficie, cultivo principal
- Propietario/gestor

#### Actividades
- Tipo (siembra, abono, herbicida, cosecha, otros)
- Coordenadas GPS del registro
- Fecha y hora
- Productos utilizados (tipo, cantidad)
- Fotos y documentación

#### Productos
- Nombre, tipo, categoría
- Unidades de medida
- Información nutricional/química
- Proveedores

## Decisiones de Arquitectura

### 1. Monorepo vs Multirepo
**Decisión**: Monorepo
**Justificación**: Facilita el desarrollo sincronizado entre web y móvil

### 2. Base de Datos
**Decisión**: PostgreSQL + PostGIS
**Justificación**: Soporte nativo para datos geoespaciales y consultas complejas

### 3. Autenticación
**Decisión**: Clerk (inicial) con abstracción para futuro cambio
**Justificación**: Rapidez de implementación manteniendo flexibilidad

### 4. Mapas
**Decisión**: Leaflet + OpenStreetMap
**Justificación**: Open source, flexible, sin limitaciones de API

## Patrones de Diseño

### 1. Repository Pattern
Para abstracción de acceso a datos y facilitar testing

### 2. Service Layer
Separación clara entre lógica de negocio y controladores

### 3. Event-Driven Architecture
Para sincronización entre componentes y auditoría

### 4. CQRS (Command Query Responsibility Segregation)
Para optimizar lecturas vs escrituras en analytics

## Consideraciones de Seguridad

- Encriptación de datos sensibles
- Validación de coordenadas GPS
- Rate limiting en APIs
- Auditoría completa de accesos
- Backup automático de datos críticos

## Escalabilidad

- Containerización con Docker
- Preparado para Kubernetes
- CDN para assets estáticos
- Cache distribuido con Redis
- Particionado de datos por organización

## Monitoreo y Observabilidad

- Logs estructurados
- Métricas de performance
- Health checks
- Error tracking
- Analytics de uso

## Estado de Implementación (Enero 2025)

### ✅ Infraestructura Core Implementada

#### Backend API
- **Express.js + TypeScript**: Servidor principal configurado con middleware de seguridad
- **Prisma ORM**: Configurado con schema completo para agricultura
- **PostgreSQL + PostGIS**: Base de datos con funciones geoespaciales personalizadas
- **Clerk Auth**: Autenticación integrada con middleware personalizado
- **Docker**: Entorno de desarrollo local con Docker Compose

#### Frontend Web  
- **Next.js 14**: Configurado con App Router y SSR
- **Tailwind CSS**: Tema personalizado para agricultura (verde/tierra)
- **Componentes UI**: Sistema de componentes especializado (Card, Button, Badge)
- **Clerk Integration**: Autenticación sincronizada con backend

#### Aplicación Móvil
- **React Native + Expo**: Configurado con SDK 52
- **Expo Router**: Navegación con tabs y autenticación
- **Clerk Mobile**: Autenticación unificada
- **Dashboard Agrícola**: Métricas, clima, acciones rápidas

### 🏗️ Arquitectura Implementada

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile Client  │    │   Auth Service  │
│   (Next.js)     │    │ (React Native)  │    │    (Clerk)      │
│                 │    │                 │    │                 │
│ ✅ UI Components│    │ ✅ Navigation   │    │ ✅ Configured   │
│ ✅ Auth Pages   │    │ ✅ Dashboard    │    │ ✅ Multi-client │
│ ✅ Tema Agrícola│    │ ✅ Auth Flow    │    │ ✅ Middleware   │
└─────────┬───────┘    └─────────┬───────┘    └─────────────────┘
          │                      │
          └──────────┬───────────┘
                     │
           ┌─────────▼─────────┐
           │    Backend API    │
           │   (Express.js)    │
           │                   │
           │ ✅ Auth Middleware│
           │ ✅ Routes Setup   │
           │ ✅ Error Handler  │
           │ ✅ CORS Config    │
           └─────────┬─────────┘
                     │
        ┌────────────▼────────────┐
        │     Base de Datos       │
        │  PostgreSQL + PostGIS   │
        │                         │
        │ ✅ Schema Completo      │
        │ ✅ Funciones PostGIS    │
        │ ✅ Docker Compose       │
        │ ✅ Prisma Client        │
        └─────────────────────────┘
```

### 📊 Modelo de Datos Implementado

```sql
-- ✅ Schema Prisma Completo
Users ──────┐
           │
Organizaciones  ──┐
                  │
Parcelas ─────────┤  ✅ Geometrías PostGIS
│                 │  ✅ Validaciones españolas
│                 │  ✅ Funciones cálculo área
Actividades ──────┤
│                 │
Productos ────────┘
```

### 🎯 Próximos Pasos de Arquitectura

#### Inmediatos (Sprint Actual)
- Conectar frontend con backend API
- Implementar captura GPS en móvil
- Sistema de mapas con Leaflet
- Formularios de actividades

#### Corto Plazo (1-2 Sprints)
- Sincronización offline móvil
- Upload de imágenes
- Sistema de caché con Redis
- Validaciones de datos end-to-end

#### Medio Plazo (3-6 Sprints)
- Integración SIGPAC
- OCR con Google Vision
- Analytics avanzados
- Sistema de notificaciones