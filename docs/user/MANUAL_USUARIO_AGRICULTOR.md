# Manual de Usuario - Cuaderno de Campo GPS
## Para Agricultores

**Versión**: 3.0.0  
**Fecha**: Enero 2025  
**Público**: Agricultores españoles  

---

## 📚 Índice

1. [Primeros Pasos](#primeros-pasos)
2. [Dashboard Principal](#dashboard-principal)
3. [Gestión de Parcelas](#gestión-de-parcelas)
4. [Registro de Actividades](#registro-de-actividades)
5. [Información Meteorológica](#información-meteorológica)
6. [Validación SIGPAC](#validación-sigpac)
7. [Reconocimiento de Productos (OCR)](#reconocimiento-de-productos-ocr)
8. [Mapas y Visualización](#mapas-y-visualización)
9. [Informes y Analytics](#informes-y-analytics)
10. [Sincronización y Backup](#sincronización-y-backup)
11. [Solución de Problemas](#solución-de-problemas)

---

## 🚀 Primeros Pasos

### ¿Qué es Cuaderno de Campo GPS?

Cuaderno de Campo GPS es una aplicación integral que te ayuda a:
- ✅ Registrar todas tus actividades agrícolas con precisión GPS
- ✅ Validar automáticamente tus parcelas con SIGPAC oficial
- ✅ Generar informes PAC de forma automática
- ✅ Optimizar costos y calcular rentabilidad
- ✅ Recibir alertas meteorológicas personalizadas
- ✅ Trabajar sin conexión y sincronizar después

### Requisitos del Sistema

**Aplicación Web:**
- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet para sincronización
- Resolución mínima: 1024x768

**Aplicación Móvil:**
- Android 8.0+ o iOS 12.0+
- 2GB RAM mínimo (4GB recomendado)
- 1GB espacio disponible
- GPS habilitado
- Cámara para fotos

### Primer Acceso

1. **Registro de Cuenta**
   - Accede a `cuadernodecampo.es`
   - Haz clic en "Crear Cuenta"
   - Introduce tu email y crea una contraseña segura
   - Verifica tu email haciendo clic en el enlace recibido

2. **Configuración Inicial**
   - Completa tu perfil básico
   - Selecciona tu ubicación (provincia/comarca)
   - Configura tus cultivos principales
   - Ajusta unidades de medida (hectáreas, kg/ha, etc.)

3. **Descarga la App Móvil**
   - iOS: App Store → "Cuaderno Campo GPS"
   - Android: Google Play → "Cuaderno Campo GPS"
   - Inicia sesión con las mismas credenciales

---

## 🏠 Dashboard Principal

### Vista General

El dashboard es tu centro de control donde ves:

```
┌─────────────────────────────────────────────────┐
│  📊 RESUMEN RÁPIDO                              │
│  • Total Parcelas: 8                           │
│  • Superficie Total: 156.7 ha                  │
│  • Actividades este mes: 23                    │
│  • Última sincronización: Hace 5 min           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🌤️ INFORMACIÓN METEOROLÓGICA                   │
│  Madrid - Hoy 12/01/2025                       │
│  🌡️ 8°C → 15°C  🌧️ 20%  💨 12 km/h            │
│  ⚠️ Alerta helada nocturna                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📋 ACTIVIDADES RECIENTES                       │
│  • Aplicación herbicida - Parcela Norte         │
│  • Siembra trigo - Parcela Sur                  │
│  • Abonado - Parcela Este                       │
└─────────────────────────────────────────────────┘
```

### Widgets Disponibles

**Resumen de Explotación:**
- Número total de parcelas
- Superficie gestionada
- Distribución por cultivos
- Estado de actividades

**Meteorología:**
- Condiciones actuales
- Predicción 5 días
- Alertas agrícolas activas
- Recomendaciones trabajo campo

**Actividades Recientes:**
- Últimas 10 actividades registradas
- Estado de sincronización
- Accesos rápidos a parcelas

**Alertas y Notificaciones:**
- Plazos de seguridad próximos
- Recordatorios actividades
- Alertas meteorológicas
- Notificaciones sistema

---

## 🗺️ Gestión de Parcelas

### Crear Nueva Parcela

1. **Acceso:** Dashboard → "Parcelas" → "Nueva Parcela"

2. **Información Básica:**
   ```
   Nombre: ________________________
   Superficie: _____ ha
   Cultivo Principal: [Desplegable]
   Régimen: [ ] Secano [ ] Regadío
   ```

3. **Ubicación GPS:**
   - **Opción 1:** Usar GPS actual
     - Haz clic en "📍 Usar mi ubicación"
     - Espera a que se obtengan coordenadas precisas
   
   - **Opción 2:** Introducir coordenadas manualmente
     - Latitud: 40.4168 (ejemplo Madrid)
     - Longitud: -3.7038 (ejemplo Madrid)
   
   - **Opción 3:** Seleccionar en mapa
     - Haz clic en el mapa para marcar ubicación
     - Ajusta precisión haciendo zoom

4. **Validación SIGPAC:**
   ```
   Referencia Catastral: PP:MMM:AAAA:ZZZZZ:PPPP:RR
   
   Ejemplo válido:
   28:079:0001:00001:0001:WX (Madrid)
   
   [Validar SIGPAC] → ✅ Parcela encontrada
   Superficie oficial: 15.3 ha
   Municipio: Alcalá de Henares
   ```

5. **Información Adicional:**
   - Variedad específica (opcional)
   - Notas sobre la parcela
   - Foto de referencia
   - Titular de la explotación

### Editar Parcela Existente

- Ve a "Parcelas" → Selecciona parcela → "✏️ Editar"
- Modifica cualquier campo excepto coordenadas GPS
- Los cambios se sincronizan automáticamente

### Eliminar Parcela

- ⚠️ **Cuidado**: Eliminar una parcela borra todas sus actividades
- Ve a "Parcelas" → Selecciona parcela → "🗑️ Eliminar"
- Confirma escribiendo el nombre de la parcela

---

## 📝 Registro de Actividades

### Tipos de Actividades Disponibles

**Preparación del Suelo:**
- Alzado/laboreo
- Gradeo
- Cultivado
- Subsolado
- Pase de rodillo

**Siembra:**
- Siembra directa
- Siembra convencional
- Transplante
- Resiembra

**Fertilización:**
- Abonado fondo
- Cobertera
- Fertirrigación
- Abonado foliar

**Tratamientos Fitosanitarios:**
- Herbicida
- Fungicida
- Insecticida
- Acaricida

**Riego:**
- Riego por aspersión
- Riego por goteo
- Riego a manta
- Fertirrigación

**Cosecha:**
- Cosecha mecánica
- Cosecha manual
- Recolección

### Registrar Nueva Actividad

#### Desde la Aplicación Web

1. **Navegar:** Dashboard → "Actividades" → "Nueva Actividad"

2. **Selección de Parcela:**
   ```
   Parcela: [Desplegable con tus parcelas]
   📍 Parcela Norte - 25.5 ha - Trigo
   ```

3. **Tipo de Actividad:**
   ```
   Categoría: [Fertilización]
   Tipo específico: [Abonado cobertera]
   ```

4. **Información Temporal:**
   ```
   Fecha: [12/01/2025]
   Hora inicio: [09:30]
   Hora fin: [11:45] (opcional)
   ```

5. **Productos Utilizados:**
   ```
   Producto: Urea 46%
   Cantidad: 200 kg/ha
   Unidad: kg/ha
   Precio unitario: 0.52 €/kg (opcional)
   ```

6. **Maquinaria:**
   ```
   Tractor: New Holland T6.140
   Apero: Abonadora centrífuga
   Combustible: 12 litros
   ```

7. **Condiciones:**
   ```
   Temperatura: 8°C
   Viento: Suave (5 km/h)
   Humedad suelo: Buena
   ```

#### Desde la Aplicación Móvil (Campo)

1. **Abrir App** → "➕ Nueva Actividad"

2. **GPS Automático:**
   - La app detecta automáticamente tu ubicación
   - Sugiere la parcela más cercana
   - Confirma o selecciona otra parcela

3. **Registro Rápido:**
   ```
   [📍 GPS: Activo]
   Parcela: Detectada automáticamente
   Actividad: [Seleccionar]
   Producto: [Escanear etiqueta] o [Escribir]
   ```

4. **Captura de Evidencias:**
   - 📸 Foto del producto utilizado
   - 📸 Foto del estado del cultivo
   - 📸 Foto de la maquinaria
   - 🎤 Nota de voz (opcional)

5. **Sincronización:**
   - Si hay conexión: Sync inmediata
   - Sin conexión: Guarda local y sync posterior

### Actividades con OCR (Reconocimiento de Productos)

1. **Durante el registro** → "📸 Escanear Producto"

2. **Capturar Foto:**
   - Enfoca la etiqueta del producto
   - Asegúrate de buena iluminación
   - Captura texto claramente legible

3. **Reconocimiento Automático:**
   ```
   📷 Imagen procesada
   ✅ Producto detectado: GLIFOSATO 36% SL
   ✅ Principio activo: Glifosato 360 g/l
   ✅ Dosis recomendada: 3-4 l/ha
   ✅ Plazo seguridad: 15 días
   ✅ Registro sanitario: ES-12345/HA
   ```

4. **Confirmar o Editar:**
   - Revisa información detectada
   - Corrige si es necesario
   - Guarda en tu biblioteca de productos

---

## 🌤️ Información Meteorológica

### Dashboard Meteorológico

**Información Actual:**
```
📍 Tu Ubicación: Madrid
🌡️ Temperatura: 12°C
🌧️ Probabilidad lluvia: 15%
💨 Viento: 8 km/h NO
💧 Humedad: 65%
📊 Presión: 1018 hPa
```

**Predicción 5 Días:**
```
Hoy    | ☀️  8°C → 15°C | 🌧️ 15%
Mañana | 🌤️  6°C → 13°C | 🌧️ 40%
Martes | 🌧️  4°C → 10°C | 🌧️ 80%
Miércoles | ❄️  -2°C → 8°C | 🌧️ 20%
Jueves | ☀️  2°C → 12°C | 🌧️ 5%
```

### Alertas Agrícolas Automáticas

Las alertas se generan automáticamente según:
- Tipo de cultivo
- Época del año
- Condiciones meteorológicas
- Historial de actividades

**Tipos de Alertas:**

**🥶 Alerta Helada:**
```
⚠️ RIESGO DE HELADA
Temperatura mínima prevista: -3°C
Cultivos afectados: Olivo, Almendro
Recomendación: Activar protección antiheladas
Ventana: Esta noche 02:00-07:00
```

**🌪️ Alerta Viento:**
```
⚠️ VIENTOS FUERTES
Velocidad prevista: 45 km/h
Recomendación: Postponer tratamientos
Ventana: Mañana 14:00-20:00
```

**🌧️ Alerta Lluvia:**
```
⚠️ LLUVIA INTENSA
Acumulación prevista: 25mm en 6 horas
Recomendación: Evitar laboreo, revisar drenajes
Ventana: Martes 10:00-16:00
```

### Recomendaciones Agronómicas

**🚜 Trabajo de Campo:**
- ✅ Condiciones favorables para laboreo
- ❌ Suelo demasiado húmedo, esperar 2 días
- ⚠️ Ventana favorable mañana 10:00-16:00

**💧 Riego:**
- ✅ Momento óptimo para riego
- ❌ Lluvia prevista, cancelar riego programado
- ⚠️ Evaluar necesidades en 3 días

**🧪 Tratamientos:**
- ✅ Condiciones perfectas para aplicación
- ❌ Viento excesivo, postponer
- ⚠️ Aplicar antes de las 10:00 por viento tarde

---

## 🏛️ Validación SIGPAC

### ¿Qué es SIGPAC?

SIGPAC (Sistema de Información Geográfica de Parcelas Agrícolas) es el sistema oficial español que:
- Identifica y localiza todas las parcelas agrícolas
- Proporciona información oficial para PAC
- Garantiza el cumplimiento normativo
- Facilita inspecciones y controles

### Formato de Referencias SIGPAC

**Estructura:** `PP:MMM:AAAA:ZZZZZ:PPPP:RR`

```
PP    = Provincia (01-52)
MMM   = Municipio (001-999)
AAAA  = Agregado (0001-9999)
ZZZZZ = Zona (00001-99999)
PPPP  = Polígono (0001-9999)
RR    = Parcela (01-99)
```

**Ejemplos válidos:**
- Madrid: `28:079:0001:00001:0001:WX`
- Sevilla: `41:091:0001:00001:0001:AA`
- Barcelona: `08:019:0001:00001:0001:BB`

### Validar Parcela SIGPAC

#### Opción 1: Desde Gestión de Parcelas

1. **Crear/Editar Parcela** → Campo "Referencia SIGPAC"
2. **Introducir referencia** completa
3. **Hacer clic "Validar"**
4. **Resultado:**
   ```
   ✅ Parcela encontrada
   📍 Coordenadas: 40.4168, -3.7038
   📏 Superficie oficial: 15.34 ha
   🏛️ Municipio: Alcalá de Henares
   🌾 Uso: Tierra arable
   📋 Coeficiente admisibilidad: 1.00
   ```

#### Opción 2: Herramienta Dedicada

1. **Navegar** → "SIGPAC" (menú principal)
2. **Búsqueda por Referencia:**
   ```
   Referencia: 28:079:0001:00001:0001:WX
   [Buscar]
   ```

3. **Búsqueda por Coordenadas:**
   ```
   Latitud: 40.4168
   Longitud: -3.7038
   Radio búsqueda: 500m
   [Buscar Parcelas Cercanas]
   ```

4. **Resultados:**
   - Lista de parcelas encontradas
   - Información detallada cada una
   - Opción de añadir a "Mis Parcelas"

### Códigos de Error SIGPAC

**❌ Referencia no válida:**
- Formato incorrecto
- Provincia no existe
- Municipio no válido

**❌ Parcela no encontrada:**
- Referencia correcta pero parcela inexistente
- Posible error tipográfico
- Verificar con catastro local

**⚠️ Parcela fuera de uso:**
- Parcela existe pero no en uso agrícola
- Verificar elegibilidad PAC

---

## 📸 Reconocimiento de Productos (OCR)

### ¿Qué puede reconocer el OCR?

**Productos Fitosanitarios:**
- Herbicidas (glifosato, MCPA, 2,4-D, etc.)
- Fungicidas (azufre, cobre, mancozeb, etc.)
- Insecticidas (imidacloprid, piretrina, etc.)
- Acaricidas
- Reguladores de crecimiento

**Fertilizantes:**
- NPK (complejos 15-15-15, 20-10-10, etc.)
- Urea (46% N)
- Fosfatos
- Potasa
- Microelementos

**Información Extraída:**
- ✅ Principios activos y concentraciones
- ✅ Dosis recomendadas (l/ha, kg/ha)
- ✅ Números de registro sanitario
- ✅ Plazos de seguridad
- ✅ Categorías toxicológicas
- ✅ Fabricante y contenido

### Usar OCR Durante Actividades

#### Proceso Paso a Paso

1. **Durante registro actividad** → "📸 Escanear Producto"

2. **Preparar la Foto:**
   - Limpia la etiqueta si está sucia
   - Asegúrate de buena iluminación
   - Evita reflejos y sombras
   - Enfoca texto claramente

3. **Capturar Imagen:**
   - Mantén el móvil estable
   - Captura toda la etiqueta principal
   - Asegúrate de que el texto se lee bien

4. **Procesamiento Automático:**
   ```
   📸 Analizando imagen...
   🔍 Detectando texto...
   🧠 Identificando producto...
   ✅ ¡Producto reconocido!
   ```

5. **Revisar Información:**
   ```
   📦 Producto: GLIFOSATO 36% SL
   🧪 Principio activo: Glifosato 360 g/L
   💊 Dosis: 3-4 L/ha
   ⏱️ Plazo seguridad: 15 días
   📋 Registro: ES-12345/HA
   ⚠️ Categoría: III (Atención)
   🏭 Fabricante: Bayer CropScience
   📏 Contenido: 20 L
   ```

6. **Confirmar o Corregir:**
   - Revisa que toda la información sea correcta
   - Edita campos si es necesario
   - Guarda en tu biblioteca personal

### Biblioteca de Productos

**Acceso:** Menú → "Productos" → "Mi Biblioteca"

**Gestión:**
- Ver todos los productos escaneados
- Editar información de productos
- Eliminar productos obsoletos
- Exportar lista de productos

**Búsqueda Rápida:**
- Filtrar por tipo (herbicida, fertilizante, etc.)
- Buscar por principio activo
- Ordenar por frecuencia de uso

### Consejos para Mejor Reconocimiento

**✅ Buenas Prácticas:**
- Foto perpendicular a la etiqueta
- Iluminación uniforme y abundante
- Etiqueta limpia y seca
- Texto enfocado y legible
- Incluir toda la información principal

**❌ Evitar:**
- Fotos en ángulo pronunciado
- Poca luz o contraluz
- Etiquetas deterioradas
- Zoom excesivo que recorte información
- Reflejos en plásticos

---

## 🗺️ Mapas y Visualización

### Vista de Mapa Principal

**Acceso:** Dashboard → "Mapa"

**Elementos del Mapa:**
```
🗺️ Mapa base (OpenStreetMap)
📍 Marcadores de parcelas
🌾 Código de colores por cultivo
📊 Información emergente (hover)
🔍 Controles de zoom
📏 Herramientas de medición
```

### Capas de Información

**Parcelas:**
- Ubicación exacta
- Límites (si disponible)
- Información básica
- Estado de actividades

**Meteorología:**
- Estaciones cercanas
- Overlay precipitación
- Dirección viento
- Alertas activas

**SIGPAC:**
- Límites oficiales
- Información catastral
- Usos del suelo
- Coeficientes

### Interacción con el Mapa

**Click en Parcela:**
```
🌾 Parcela Norte
📏 25.5 ha - Trigo
📍 40.4168, -3.7038
📅 Última actividad: Hace 3 días
[Ver Detalles] [Registrar Actividad]
```

**Herramientas Disponibles:**
- 📏 Medir distancias
- 📐 Calcular superficies
- 📍 Añadir marcadores
- 🖨️ Imprimir/exportar
- 📤 Compartir ubicación

### Navegación GPS

**Para ir a una parcela:**
1. Click en marcador de parcela
2. "🧭 Navegar hasta aquí"
3. Se abre app de navegación preferida
4. Navegación turn-by-turn hasta destino

---

## 📊 Informes y Analytics

### Dashboard de Analytics

**Métricas Principales:**
```
💰 ECONÓMICAS
├── Costos totales: 15,234€
├── Ingresos estimados: 23,890€
├── Margen bruto: 8,656€
└── ROI: 56.8%

📊 OPERACIONALES
├── Actividades registradas: 156
├── Productos utilizados: 23
├── Horas maquinaria: 234h
└── Consumo combustible: 1,235L

🌾 PRODUCTIVIDAD
├── Rendimiento medio: 6.2 t/ha
├── Eficiencia aplicaciones: 94%
├── Cumplimiento planificado: 87%
└── Índice sostenibilidad: 8.2/10
```

### Informes PAC

#### Generar Informe PAC

1. **Navegar:** Analytics → "Informes PAC"

2. **Seleccionar Período:**
   ```
   Campaña: 2024/2025
   Desde: 01/10/2024
   Hasta: 30/09/2025
   ```

3. **Seleccionar Parcelas:**
   - ✅ Todas las parcelas
   - ⬜ Solo parcelas específicas

4. **Configurar Informe:**
   ```
   Formato: [ ] PDF [ ] Excel [✅] Ambos
   Idioma: [✅] Español [ ] Catalán [ ] Gallego
   Incluir fotos: [✅] Sí [ ] No
   Nivel detalle: [✅] Completo [ ] Resumen
   ```

5. **Generar:**
   ```
   📄 Generando informe...
   ✅ Informe PAC generado
   📧 Enviado a tu email
   💾 Disponible en Descargas
   ```

#### Contenido Informe PAC

**Sección 1: Identificación**
- Datos titular explotación
- CIF/DNI
- Código explotación REGA
- Superficie total declarada

**Sección 2: Parcelas**
- Listado completo parcelas
- Referencias SIGPAC
- Superficies declaradas vs reales
- Cultivos por parcela

**Sección 3: Actividades**
- Cronograma completo actividades
- Productos fitosanitarios aplicados
- Dosis y fechas aplicación
- Plazos de seguridad cumplidos

**Sección 4: Cumplimiento**
- Verificación normativa PAC
- Alertas de incumplimiento
- Recomendaciones mejora

### Analytics Avanzados

#### Análisis de Costos

```
📊 DISTRIBUCIÓN COSTOS POR CATEGORÍA

Semillas: 28% (4,265€)
██████████████████████████████

Fertilizantes: 31% (4,720€)
███████████████████████████████████

Fitosanitarios: 18% (2,742€)
████████████████████

Combustible: 15% (2,285€)
█████████████████

Mano de obra: 8% (1,220€)
███████████
```

#### Análisis de Rentabilidad

```
📈 EVOLUCIÓN RENTABILIDAD (€/ha)

        2022    2023    2024    Tendencia
Ingresos  856     923    1,047      ↗️
Costos    542     634     687       ↗️
Margen    314     289     360       ↗️
ROI%     57.9%   45.6%   52.4%      ↗️
```

#### Comparativas Sector

```
🏆 BENCHMARKING VS SECTOR

Métrica             Tu Valor    Sector    Posición
Rendimiento trigo    6.2 t/ha    5.1 t/ha    Top 25%
Costo producción     687€/ha     754€/ha     Top 30%
Margen bruto         360€/ha     298€/ha     Top 20%
Eficiencia riego     94%         87%         Top 15%
```

### Exportar Datos

**Formatos Disponibles:**
- 📄 PDF (informes formateados)
- 📊 Excel (datos para análisis)
- 📋 CSV (importar otros sistemas)
- 📱 Compartir (email, WhatsApp)

**Opciones Exportación:**
```
Período: [Desde] [Hasta]
Parcelas: [Todas] o [Seleccionar]
Datos: [✅] Actividades [✅] Costos [✅] Parcelas
Formato: [PDF] [Excel] [CSV]
[Exportar]
```

---

## 🔄 Sincronización y Backup

### Funcionamiento Offline

**La aplicación funciona completamente sin conexión:**
- ✅ Registrar actividades
- ✅ Crear parcelas
- ✅ Capturar fotos
- ✅ Usar OCR
- ✅ Ver datos existentes

**Limitaciones offline:**
- ❌ Validación SIGPAC
- ❌ Información meteorológica actualizada
- ❌ Sincronización con web
- ❌ Backup automático

### Sincronización Automática

**Cuándo sincroniza:**
- Al conectar a WiFi/datos
- Cada 15 minutos (si conectado)
- Al abrir la aplicación
- Al registrar actividad importante

**Proceso de sincronización:**
```
🔄 Sincronizando...
📤 Subiendo 3 actividades nuevas
📤 Subiendo 7 fotos
📥 Descargando datos meteorológicos
📥 Sincronizando configuración
✅ Sincronización completa
```

### Estado de Sincronización

**Indicadores en la interfaz:**
- 🟢 Sincronizado - Todo actualizado
- 🟡 Pendiente - Datos por sincronizar
- 🔴 Error - Problema sincronización
- 📶 Offline - Sin conexión

**Ver detalles:**
```
📊 Estado Sincronización
├── Última sync: Hace 5 minutos
├── Datos pendientes: 0
├── Errores recientes: 0
└── Próxima sync: Automática
```

### Resolución de Conflictos

**Cuando hay conflictos:**
```
⚠️ Conflicto detectado
Actividad: Aplicación herbicida
Parcela: Norte

Versión Local (móvil):
- Fecha: 12/01/2025 10:30
- Producto: Glifosato 36%
- Dosis: 4 L/ha

Versión Servidor (web):
- Fecha: 12/01/2025 10:45  
- Producto: Glifosato 36%
- Dosis: 3.5 L/ha

[Mantener Local] [Usar Servidor] [Editar Manual]
```

**Estrategias de resolución:**
- **Mantener Local:** Usa versión del móvil
- **Usar Servidor:** Usa versión de la web
- **Editar Manual:** Combinar o corregir manualmente

### Backup y Recuperación

**Backup automático:**
- Diario a las 02:00 (datos completos)
- Cada hora (cambios incrementales)
- Antes de operaciones críticas
- Al exportar informes importantes

**Recuperación de datos:**
```
⚠️ ¿Problema con tus datos?

Opciones de recuperación:
├── Restaurar desde backup (24h)
├── Restaurar desde backup (7 días)
├── Restaurar desde backup (30 días)
└── Contactar soporte técnico

[Seleccionar Opción]
```

---

## 🆘 Solución de Problemas

### Problemas Comunes

#### GPS no funciona

**Síntomas:**
- No se obtienen coordenadas
- Ubicación incorrecta
- "Esperando GPS..." permanente

**Soluciones:**
1. **Permisos:**
   - Android: Ajustes → Apps → Cuaderno Campo → Permisos → Ubicación → Permitir
   - iOS: Ajustes → Privacidad → Ubicación → Cuaderno Campo → Permitir

2. **Precisión GPS:**
   - Activar "Ubicación de alta precisión"
   - Salir al exterior (mejor señal satelital)
   - Esperar 30-60 segundos

3. **Reiniciar servicios:**
   - Desactivar/activar GPS
   - Reiniciar aplicación
   - Reiniciar dispositivo

#### OCR no reconoce productos

**Síntomas:**
- "No se pudo procesar imagen"
- Información incorrecta
- Reconocimiento muy lento

**Soluciones:**
1. **Calidad imagen:**
   - Más luz (natural preferible)
   - Limpiar etiqueta producto
   - Foto perpendicular, sin ángulo
   - Enfocar bien el texto

2. **Productos soportados:**
   - Verificar que el producto esté en base datos
   - Usar nombres comerciales conocidos
   - Productos con etiquetas claras

3. **Conexión:**
   - OCR requiere conexión internet
   - Verificar que tienes datos/WiFi
   - Esperar mejor cobertura

#### Problemas de sincronización

**Síntomas:**
- Datos no aparecen en web
- "Error de sincronización"
- Datos duplicados

**Soluciones:**
1. **Conexión:**
   - Verificar conexión internet estable
   - Cambiar de WiFi a datos móviles
   - Reiniciar conexión

2. **Forzar sincronización:**
   - Ir a Configuración → Sincronización
   - "🔄 Sincronizar Ahora"
   - Esperar a que complete

3. **Limpiar cache:**
   - Configuración → Almacenamiento
   - "Limpiar cache aplicación"
   - Volver a iniciar sesión

#### App muy lenta

**Síntomas:**
- Respuesta lenta al tocar
- Carga de pantallas muy lenta
- Crashes o cierres inesperados

**Soluciones:**
1. **Memoria dispositivo:**
   - Cerrar otras aplicaciones
   - Liberar espacio almacenamiento
   - Reiniciar dispositivo

2. **Optimización app:**
   - Configuración → Performance
   - Activar "Modo optimización"
   - Reducir calidad fotos si necesario

3. **Actualización:**
   - Verificar actualizaciones disponibles
   - Instalar última versión
   - Reiniciar tras actualizar

### Contacto con Soporte

**Antes de contactar, prepara:**
- Modelo de dispositivo
- Versión del sistema operativo
- Versión de la aplicación
- Descripción detallada del problema
- Pasos para reproducir el error

**Canales de soporte:**
- 📧 Email: soporte@cuadernodecampo.es
- 📱 WhatsApp: +34 XXX XXX XXX
- 💬 Chat web: cuadernodecampo.es
- 📞 Teléfono: +34 XXX XXX XXX (9:00-18:00)

**Información automática que enviamos:**
- Logs de error (anonimizados)
- Información técnica dispositivo
- Estado de sincronización
- Configuración relevante

### Preguntas Frecuentes (FAQ)

**¿Puedo usar la app sin conexión?**
Sí, todas las funciones básicas funcionan offline. Los datos se sincronizan cuando recuperes conexión.

**¿Mis datos están seguros?**
Sí, usamos encriptación completa y backup automático. Tus datos están protegidos según GDPR.

**¿Puedo usar en varios dispositivos?**
Sí, inicia sesión con la misma cuenta en móvil, tablet y web. Todo se sincroniza automáticamente.

**¿Qué pasa si pierdo el móvil?**
Tus datos están seguros en la nube. Instala la app en el nuevo dispositivo e inicia sesión.

**¿Cuántas parcelas puedo gestionar?**
No hay límite en el número de parcelas. El precio se calcula por superficie total gestionada.

**¿Funciona en toda España?**
Sí, tenemos cobertura completa SIGPAC para todas las provincias españolas.

---

## 📞 Contacto y Soporte

### Información de Contacto

**Soporte Técnico:**
- 📧 Email: soporte@cuadernodecampo.es
- 📱 WhatsApp: +34 XXX XXX XXX
- 📞 Teléfono: +34 XXX XXX XXX
- 🕒 Horario: Lunes-Viernes 9:00-18:00

**Comercial:**
- 📧 Email: comercial@cuadernodecampo.es  
- 📞 Teléfono: +34 XXX XXX XXX

**Web y Recursos:**
- 🌐 Website: cuadernodecampo.es
- 📚 Documentación: docs.cuadernodecampo.es
- 📹 Tutoriales: youtube.com/cuadernodecampo
- 💬 Comunidad: telegram.me/cuadernodecampo

### Recursos Adicionales

**Videos Tutoriales:**
- ▶️ Primeros pasos (10 min)
- ▶️ Registro de actividades (15 min)
- ▶️ Validación SIGPAC (8 min)  
- ▶️ OCR productos (12 min)
- ▶️ Informes PAC (20 min)

**Documentación Técnica:**
- 📋 API Reference
- 🔧 Guía integración sistemas
- 📊 Especificaciones formatos exportación
- 🔐 Política de privacidad y seguridad

---

**Última actualización**: Enero 2025  
**Versión manual**: 3.0.0  
**Versión aplicación**: 3.0.0+build.2025.01.12