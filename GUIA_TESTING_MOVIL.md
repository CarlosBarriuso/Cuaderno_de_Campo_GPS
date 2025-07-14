# 📱 Guía de Testing Móvil - Cuaderno de Campo GPS

**Fecha**: 13 de Julio de 2025  
**Estado**: Entorno preparado para testing en dispositivos físicos  
**Dispositivos objetivo**: iPhone (iOS) y Android

## 🚀 Estado Actual del Entorno

### ✅ Servicios Levantados y Funcionando

#### 1. **Backend API** - Puerto 3005
- **URL**: http://localhost:3005
- **Estado**: ✅ Funcionando correctamente
- **Endpoints disponibles**:
  - `GET /health` - Health check básico
  - `GET /api/v1/health` - Health check completo
  - `GET /api/v1/parcelas` - Listar parcelas
  - `POST /api/v1/parcelas` - Crear parcela
  - `GET /api/v1/actividades` - Listar actividades
  - `POST /api/v1/actividades` - Crear actividad
  - `GET /api/v1/sigpac/parcela/:referencia` - Consulta SIGPAC
  - `GET /api/v1/weather/current/:lat/:lng` - Datos meteorológicos
  - `GET /api/v1/user/profile` - Perfil de usuario
  - `POST /api/v1/sync` - Sincronización offline

#### 2. **Frontend Web** - Puerto 3002
- **URL**: http://localhost:3002
- **Estado**: ✅ Funcionando correctamente
- **Características**: Next.js 14 + Clerk Auth + Diseño responsivo

#### 3. **Base de Datos**
- **PostgreSQL**: Puerto 5434 ✅
- **Redis**: Puerto 6379 ✅
- **Estado**: Optimizada con índices de Phase 4

## 📲 Instrucciones para Testing Móvil

### Para Android (Recomendado para testing inicial)

#### Opción 1: Expo Go (Más fácil para desarrollo)
1. **Instalar Expo Go** en tu Android desde Google Play Store
2. **Abrir terminal** en la carpeta del proyecto móvil
3. **Ejecutar comando**:
   ```bash
   cd /home/cbcmsi/Escritorio/Proyectos/Cuaderno_de_campo_GPS/apps/mobile
   npx expo start --tunnel
   ```
4. **Escanear QR** que aparece en terminal con Expo Go
5. **Conectar dispositivo** a la misma red WiFi que tu PC

#### Opción 2: Build de desarrollo
1. **Configurar Android Studio** y SDK
2. **Habilitar Developer Options** en Android
3. **Ejecutar**:
   ```bash
   npx expo run:android
   ```

### Para iPhone (iOS)

#### Opción 1: Expo Go
1. **Instalar Expo Go** desde App Store
2. **Usar misma red WiFi** que el PC
3. **Ejecutar**:
   ```bash
   npx expo start --tunnel
   ```
4. **Escanear QR** con cámara del iPhone

#### Opción 2: Build nativo (requiere macOS + Xcode)
1. **Configurar Xcode** y simulador iOS
2. **Ejecutar**:
   ```bash
   npx expo run:ios
   ```

## 🔧 Configuración Actual de la App Móvil

### Variables de Entorno (`.env.local`)
```env
EXPO_PUBLIC_API_URL=http://localhost:3005
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aHVtYW5lLWd1cHB5LTIyLmNsZXJrLmFjY291bnRzLmRldiQ
EXPO_PUBLIC_ENABLE_DEV_MENU=true
EXPO_PUBLIC_ENABLE_GPS_SIMULATION=true
EXPO_PUBLIC_ENABLE_MOCK_DATA=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

### Tecnologías Implementadas
- **React Native + Expo** (Framework)
- **WatermelonDB** (Base de datos offline)
- **Clerk** (Autenticación)
- **React Navigation** (Navegación)
- **Expo Location** (GPS)
- **Expo Camera** (Cámara/OCR)

## 🧪 Plan de Testing por Funcionalidad

### 1. **Autenticación y Onboarding**
**Objetivo**: Verificar login y configuración inicial

#### Tests a realizar:
- [ ] Abrir app y ver pantalla de bienvenida
- [ ] Hacer login con Clerk (Google, email, etc.)
- [ ] Verificar navegación después del login
- [ ] Probar logout y re-login

#### Errores comunes a verificar:
- Login no funciona → Verificar conectividad API
- Pantalla blanca → Verificar logs en Expo Go
- Error Clerk → Verificar API keys

### 2. **Gestión de Parcelas**
**Objetivo**: Crear, ver y editar parcelas

#### Tests a realizar:
- [ ] Acceder a lista de parcelas
- [ ] Ver parcelas de ejemplo (2 parcelas mock)
- [ ] Crear nueva parcela
- [ ] Completar formulario con datos válidos
- [ ] Probar GPS para obtener coordenadas
- [ ] Verificar guardado local (offline)

#### Datos de prueba:
```
Nombre: Parcela de Prueba
Superficie: 5.5 hectáreas
Cultivo: Trigo
Referencia SIGPAC: 28:123:45:67:890:XY
```

### 3. **Registro de Actividades**
**Objetivo**: Registrar trabajo en campo

#### Tests a realizar:
- [ ] Acceder a "Nueva Actividad"
- [ ] Seleccionar parcela
- [ ] Elegir tipo de actividad (ej: Siembra)
- [ ] Capturar ubicación GPS actual
- [ ] Añadir productos utilizados
- [ ] Tomar foto de la actividad
- [ ] Verificar guardado offline

### 4. **Funcionalidad Offline**
**Objetivo**: Verificar que funciona sin conexión

#### Tests a realizar:
- [ ] Activar modo avión en el dispositivo
- [ ] Abrir la aplicación
- [ ] Crear nueva actividad
- [ ] Verificar que se guarda localmente
- [ ] Desactivar modo avión
- [ ] Verificar sincronización automática

### 5. **Integraciones GPS**
**Objetivo**: Verificar precisión y funcionalidad GPS

#### Tests a realizar:
- [ ] Salir al exterior (señal GPS clara)
- [ ] Crear actividad y capturar ubicación
- [ ] Verificar coordenadas precisas (±3 metros)
- [ ] Probar en diferentes condiciones (edificios, campo abierto)

### 6. **Cámara y OCR**
**Objetivo**: Escanear productos agrícolas

#### Tests a realizar:
- [ ] Acceder a función OCR
- [ ] Tomar foto de etiqueta de producto
- [ ] Verificar reconocimiento de texto
- [ ] Probar con diferentes etiquetas
- [ ] Verificar extracción de datos relevantes

### 7. **Mapas y Visualización**
**Objetivo**: Ver parcelas en mapa

#### Tests a realizar:
- [ ] Acceder a vista de mapa
- [ ] Verificar carga de mapa base
- [ ] Ver parcelas superpuestas
- [ ] Probar zoom y navegación
- [ ] Verificar información de parcelas

### 8. **Sincronización y API**
**Objetivo**: Conectividad con backend

#### Tests a realizar:
- [ ] Verificar carga de datos desde API
- [ ] Crear datos offline y sincronizar
- [ ] Probar conflictos de sincronización
- [ ] Verificar indicadores de estado de red

## 🐛 Troubleshooting - Errores Comunes

### 1. **App no inicia**
```bash
# Limpiar cache de Expo
npx expo start --clear

# Reinstalar dependencias
rm -rf node_modules && npm install
```

### 2. **Error de conectividad API**
- Verificar que backend esté corriendo en puerto 3005
- Comprobar URL en `.env.local`
- Verificar firewall/permisos de red

### 3. **Problemas GPS**
- Dar permisos de ubicación a Expo Go
- Probar en exterior con señal GPS clara
- Verificar configuración de ubicación del dispositivo

### 4. **Errores de Clerk/Auth**
- Verificar API keys en `.env.local`
- Comprobar configuración Clerk dashboard
- Verificar conexión a internet

### 5. **Problemas de cámara**
- Dar permisos de cámara a Expo Go
- Verificar que la cámara del dispositivo funcione
- Probar con buena iluminación

## 📊 Métricas de Testing

### Performance Esperada
- **Tiempo de inicio**: <3 segundos
- **Carga de lista de parcelas**: <2 segundos
- **Captura GPS**: <10 segundos
- **Sincronización**: <5 segundos
- **Tiempo de respuesta API**: <200ms

### Indicadores de Éxito
- [ ] Login funciona correctamente
- [ ] Se pueden crear parcelas
- [ ] GPS obtiene coordenadas precisas
- [ ] Funcionalidad offline operativa
- [ ] Sincronización exitosa
- [ ] Cámara/OCR funcional
- [ ] Rendimiento aceptable
- [ ] No crashes frecuentes

## 🚀 Comandos Rápidos para Testing

### Iniciar entorno completo:
```bash
# Terminal 1: Backend
cd /home/cbcmsi/Escritorio/Proyectos/Cuaderno_de_campo_GPS/apps/backend
node simple-server.js

# Terminal 2: App móvil
cd /home/cbcmsi/Escritorio/Proyectos/Cuaderno_de_campo_GPS/apps/mobile
npx expo start --tunnel

# Terminal 3: Frontend web (opcional)
cd /home/cbcmsi/Escritorio/Proyectos/Cuaderno_de_campo_GPS/apps/web
npm run dev
```

### Verificar APIs:
```bash
# Health check
curl http://localhost:3005/health

# Listar parcelas
curl http://localhost:3005/api/v1/parcelas

# Datos meteorológicos
curl http://localhost:3005/api/v1/weather/current/40.4168/-3.7038
```

## 📝 Formato de Reporte de Testing

Para cada funcionalidad probada, documenta:

1. **Funcionalidad**: Nombre de la característica
2. **Dispositivo**: iPhone X / Samsung Galaxy S21, etc.
3. **OS**: iOS 16.5 / Android 13
4. **Estado**: ✅ Funciona / ❌ Error / ⚠️ Problema menor
5. **Descripción**: Qué funciona y qué no
6. **Screenshots**: Capturas de pantalla si hay problemas
7. **Logs**: Errores específicos de consola

## 🎯 Próximos Pasos

1. **Resolver conflicto de dependencias** en app móvil
2. **Generar build de desarrollo** para testing
3. **Probar en dispositivo Android** físico
4. **Probar en dispositivo iOS** físico
5. **Documentar errores** encontrados
6. **Iterar y corregir** problemas críticos

---

**El entorno está preparado para testing extensivo. El backend funciona correctamente y proporciona todas las APIs necesarias para probar la funcionalidad completa de la aplicación móvil.**