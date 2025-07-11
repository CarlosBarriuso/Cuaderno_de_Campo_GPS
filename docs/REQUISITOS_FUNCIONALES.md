# Requisitos Funcionales - Cuaderno de Campo GPS

## Visión del Producto

Sistema integral de gestión agrícola que permite a agricultores, cooperativas y sociedades agrícolas registrar, gestionar y analizar actividades de campo mediante geolocalización GPS, proporcionando herramientas para optimización de cultivos y cumplimiento normativo PAC.

## Actores del Sistema

### Agricultor Individual
- Propietario o gestor de parcelas
- Usuario principal de la aplicación móvil
- Registra actividades directamente en campo

### Cooperativa/Sociedad Agrícola
- Gestiona múltiples agricultores
- Acceso a analytics agregados
- Administra permisos y configuraciones

### Técnico de Campo
- Asiste a múltiples agricultores
- Registra actividades en nombre de terceros
- Genera informes técnicos

### Administrador del Sistema
- Gestión de usuarios y organizaciones
- Configuración del sistema
- Monitoreo y soporte

## Módulos Funcionales

## 1. Gestión de Usuarios y Autenticación

### RF-001: Registro de Usuario
**Prioridad**: Alta
**Actor**: Todos los usuarios

**Descripción**: El sistema debe permitir el registro de nuevos usuarios con diferentes roles.

**Criterios de Aceptación**:
- Usuario puede registrarse con email/contraseña
- Validación de email obligatoria
- Selección de tipo de organización (individual, cooperativa, etc.)
- Asignación automática de rol básico
- Integración con Clerk para autenticación

**Flujo Principal**:
1. Usuario accede a formulario de registro
2. Completa datos personales y de organización
3. Selecciona plan de suscripción
4. Confirma email de verificación
5. Accede al dashboard con permisos básicos

### RF-002: Autenticación Multi-Factor
**Prioridad**: Media
**Actor**: Todos los usuarios

**Descripción**: Autenticación segura con soporte para múltiples métodos.

**Criterios de Aceptación**:
- Login con email/contraseña
- Soporte para autenticación biométrica en móvil
- Recuperación de contraseña por email
- Sesión persistente configurable
- Logout automático por inactividad

### RF-003: Gestión de Roles y Permisos
**Prioridad**: Alta
**Actor**: Administrador, Cooperativa

**Descripción**: Sistema granular de permisos por rol y organización.

**Roles Definidos**:
- **Agricultor**: CRUD sobre sus parcelas y actividades
- **Técnico**: Lectura/escritura parcelas asignadas
- **Administrador Cooperativa**: Gestión completa de su organización
- **Super Admin**: Gestión global del sistema

**Permisos por Módulo**:
```
Parcelas: [crear, leer, actualizar, eliminar, asignar]
Actividades: [registrar, consultar, modificar, eliminar]
Informes: [generar, exportar, compartir]
Usuarios: [invitar, activar, desactivar, eliminar]
Analytics: [ver_propios, ver_organizacion, ver_comparativas]
```

## 2. Gestión de Parcelas

### RF-004: Registro Manual de Parcelas
**Prioridad**: Alta
**Actor**: Agricultor, Técnico

**Descripción**: Creación de parcelas mediante coordenadas manuales o selección en mapa.

**Criterios de Aceptación**:
- Dibujo de polígonos en mapa interactivo
- Cálculo automático de superficie
- Asignación de nombre y descripción
- Categorización por tipo de cultivo principal
- Validación de no solapamiento con parcelas existentes

**Datos Requeridos**:
```json
{
  "nombre": "Parcela Norte 1",
  "descripcion": "Terreno para cereales de invierno",
  "superficie_calculada": 2.45,
  "cultivo_principal": "trigo",
  "tipo_cultivo": "cereal_secano",
  "geometria": "POLYGON((...))",
  "propietario_id": "user_123",
  "fecha_creacion": "2024-01-15T10:30:00Z"
}
```

### RF-005: Integración SIGPAC
**Prioridad**: Alta
**Actor**: Agricultor, Técnico

**Descripción**: Importación automática de parcelas mediante referencia catastral SIGPAC.

**Criterios de Aceptación**:
- Búsqueda por referencia catastral
- Importación automática de geometría oficial
- Validación de datos con fuente oficial
- Actualización periódica de cambios catastrales
- Manejo de errores por parcelas no encontradas

**Flujo Principal**:
1. Usuario introduce referencia catastral (formato: XX:XX:XXX:XXXXX:XXXX:XX)
2. Sistema consulta API SIGPAC
3. Valida existencia y acceso a la parcela
4. Importa geometría y datos oficiales
5. Usuario confirma y personaliza información adicional

### RF-006: Visualización de Parcelas en Mapa
**Prioridad**: Alta
**Actor**: Todos los usuarios

**Descripción**: Mapa interactivo con visualización estado actual de parcelas.

**Criterios de Aceptación**:
- Mapa base configurable (OSM, satélite, híbrido)
- Colores por estado de última actividad
- Filtros por tipo de cultivo, fecha de actividad
- Información emergente (popup) con datos clave
- Zoom automático a parcelas del usuario

**Estados Visuales**:
- 🟢 Verde: Actividad reciente (< 7 días)
- 🟡 Amarillo: Actividad media (7-30 días)
- 🔴 Rojo: Sin actividad reciente (> 30 días)
- ⚪ Gris: Parcela inactiva/en barbecho

### RF-007: Gestión de Propiedades de Parcela
**Prioridad**: Media
**Actor**: Agricultor, Técnico

**Descripción**: Edición de características agronómicas y metadatos.

**Propiedades Editables**:
- Tipo de suelo (arcilloso, arenoso, franco, etc.)
- pH del suelo
- Pendiente promedio
- Sistema de riego (secano, goteo, aspersión, etc.)
- Certificaciones (ecológico, integrado, etc.)
- Notas adicionales

## 3. Personalización de Actividades por Tipo de Cultivo

### RF-008: Configuración de Tipos de Cultivo
**Prioridad**: Alta
**Actor**: Agricultor, Administrador

**Descripción**: Sistema de categorización y personalización de cultivos con actividades específicas.

**Tipos de Cultivo Predefinidos**:
- **Cereales de Secano** (trigo, cebada, avena, centeno)
- **Cereales de Regadío** (maíz, arroz)
- **Leguminosas** (garbanzo, lenteja, guisante, habas)
- **Oleaginosas** (girasol, colza, soja)
- **Cultivos Industriales** (remolacha, algodón, tabaco)
- **Frutales de Hueso** (melocotón, albaricoque, ciruela)
- **Frutales de Pepita** (manzana, pera)
- **Cítricos** (naranja, limón, mandarina)
- **Frutos Secos** (almendra, nuez, avellana)
- **Viñedo**
- **Olivar**
- **Hortalizas de Aire Libre**
- **Hortalizas de Invernadero**
- **Forrajes** (alfalfa, ray-grass, veza)

**Criterios de Aceptación**:
- Cada tipo de cultivo tiene actividades específicas disponibles
- Usuario puede personalizar actividades por cultivo
- Sistema sugiere actividades según época del año
- Validación de coherencia cultivo-actividad

### RF-009: Personalización de Actividades por Cultivo
**Prioridad**: Alta
**Actor**: Agricultor, Técnico

**Descripción**: Configuración de actividades específicas según el tipo de cultivo de cada parcela.

**Actividades Diferenciadas por Tipo**:

#### Cereales de Secano
```json
{
  "preparacion_terreno": [
    "alzado", "pase_cultivador", "grada_discos", "siembra_directa"
  ],
  "siembra": [
    "sembradora_lineas", "voleo", "semilla_certificada", "densidad_siembra"
  ],
  "fertilizacion": [
    "abonado_fondo", "cobertera", "abono_complejo", "urea"
  ],
  "tratamientos": [
    "herbicida_preemergencia", "herbicida_postemergencia", "fungicida_cereal"
  ],
  "cosecha": [
    "cosechadora", "rendimiento_ha", "humedad_grano", "peso_hectolitro"
  ]
}
```

#### Frutales
```json
{
  "preparacion": [
    "poda_formacion", "poda_fructificacion", "laboreo", "pase_rotovator"
  ],
  "plantacion": [
    "apertura_hoyos", "plantacion_plantones", "marco_plantacion", "tutor"
  ],
  "fertilizacion": [
    "abonado_fondo", "fertirrigacion", "abono_foliar", "enmienda_calcica"
  ],
  "tratamientos": [
    "tratamiento_invernal", "fungicida_preventivo", "insecticida_especifico", "aclareo_frutos"
  ],
  "riego": [
    "riego_goteo", "riego_microaspersion", "programacion_riego", "fertirriego"
  ],
  "cosecha": [
    "recoleccion_manual", "calibrado", "envasado", "conservacion_camara"
  ]
}
```

#### Olivar
```json
{
  "preparacion": [
    "poda_olivar", "triturado_restos", "laboreo_olivar", "siega_hierba"
  ],
  "fertilizacion": [
    "abonado_olivar", "fertirrigacion_olivo", "aplicacion_foliar"
  ],
  "tratamientos": [
    "tratamiento_mosca", "fungicida_repilo", "herbicida_olivar", "aceituna_mesa"
  ],
  "riego": [
    "riego_deficit_controlado", "riego_sostenido", "control_humedad"
  ],
  "cosecha": [
    "vareo_tradicional", "vibrador_tronco", "paraguas_vibradores", "aceituna_almazara"
  ]
}
```

#### Viñedo
```json
{
  "preparacion": [
    "poda_vid", "atado_sarmientos", "laboreo_viña", "despampanado"
  ],
  "tratamientos": [
    "tratamiento_mildiu", "tratamiento_oidio", "herbicida_viña", "deshojado"
  ],
  "riego": [
    "riego_goteo_vid", "riego_deficit", "control_estres_hidrico"
  ],
  "cosecha": [
    "vendimia_manual", "vendimia_mecanica", "grado_azucar", "acidez"
  ]
}
```

### RF-010: Editor de Actividades Personalizadas
**Prioridad**: Media
**Actor**: Agricultor, Administrador

**Descripción**: Herramienta para crear y modificar actividades específicas por cultivo.

**Criterios de Aceptación**:
- Interface drag & drop para ordenar actividades
- Campos personalizables por actividad
- Plantillas de actividades compartibles
- Validación de campos obligatorios por actividad
- Activación/desactivación de actividades por cultivo

**Configuración de Actividad Personalizada**:
```json
{
  "nombre": "Aplicación Cobre Preventivo",
  "categoria": "tratamiento",
  "cultivos_aplicables": ["citricos", "frutales_hueso"],
  "epoca_recomendada": ["otoño", "invierno"],
  "campos_requeridos": [
    {
      "nombre": "producto_comercial",
      "tipo": "texto",
      "obligatorio": true
    },
    {
      "nombre": "dosis_por_ha",
      "tipo": "numero",
      "unidad": "kg/ha",
      "obligatorio": true,
      "min": 0.5,
      "max": 5.0
    },
    {
      "nombre": "concentracion_cobre",
      "tipo": "porcentaje",
      "obligatorio": true
    }
  ],
  "validaciones": [
    "verificar_plazo_recoleccion",
    "comprobar_compatibilidad_otros_tratamientos"
  ]
}
```

## 4. Registro de Actividades

### RF-011: Registro de Actividad con GPS
**Prioridad**: Alta
**Actor**: Agricultor, Técnico

**Descripción**: Registro de actividades agrícolas usando geolocalización automática con formularios adaptados por tipo de cultivo.

**Criterios de Aceptación**:
- Detección automática de parcela por GPS
- Formulario automático según cultivo de la parcela
- Campos específicos por tipo de actividad
- Precisión mínima de 5 metros
- Registro offline con sincronización posterior
- Captura de timestamp automático
- Validación de ubicación dentro de parcela conocida

**Flujo Adaptativo por Cultivo**:
1. Usuario inicia registro en parcela
2. Sistema detecta tipo de cultivo de la parcela
3. Muestra actividades disponibles para ese cultivo
4. Presenta formulario específico con campos relevantes
5. Aplica validaciones específicas del cultivo
6. Almacena con metadatos de cultivo y época

### RF-012: Captura de Fotos y OCR
**Prioridad**: Media
**Actor**: Agricultor, Técnico

**Descripción**: Captura y reconocimiento automático de productos agrícolas.

**Criterios de Aceptación**:
- Captura de fotos de productos/etiquetas
- OCR para extracción automática de texto
- Reconocimiento de códigos de barras
- Geolocalización automática de fotos
- Compresión automática para optimizar almacenamiento

**Información Extraíble por OCR**:
- Nombre comercial del producto
- Principio activo
- Concentración/composición
- Número de registro
- Fabricante
- Dosis recomendada

### RF-013: Validación de Actividades por Cultivo
**Prioridad**: Media
**Actor**: Sistema

**Descripción**: Validación automática según tipo de cultivo y coherencia agronómica.

**Validaciones Específicas por Cultivo**:

#### Cereales
- Densidad de siembra dentro de rangos (150-220 kg/ha para trigo)
- Fertilización nitrogenada según producción esperada
- Tratamientos herbicidas compatibles con variedad

#### Frutales
- Respeto de plazos de seguridad por proximidad a cosecha
- Dosis de riego según estado fenológico
- Compatibilidad de tratamientos con polinización

#### Viñedo
- Tratamientos fungicidas según presión de enfermedad
- Momento de aplicación según estado vegetativo
- Dosis según variedad y sistema de conducción

**Alertas Generadas por Cultivo**:
- ⚠️ Actividad no recomendada para este cultivo
- ⚠️ Época no adecuada para la actividad
- ⚠️ Dosis fuera de rango para el cultivo
- ⚠️ Conflicto con actividad previa

### RF-014: Planificación de Actividades por Cultivo
**Prioridad**: Baja
**Actor**: Agricultor, Técnico

**Descripción**: Calendario automático de actividades recomendadas según cultivo y zona climática.

**Criterios de Aceptación**:
- Calendario automático por tipo de cultivo
- Adaptación a zona climática del usuario
- Notificaciones de épocas óptimas
- Integración con datos meteorológicos
- Personalización según experiencia del agricultor

**Calendarios por Cultivo**:
```json
{
  "trigo_secano": {
    "octubre": ["preparacion_terreno", "siembra"],
    "noviembre": ["nascencia", "control_malas_hierbas"],
    "febrero": ["ahijado", "fertilizacion_cobertera"],
    "abril": ["encañado", "tratamiento_fungicida"],
    "julio": ["cosecha"]
  },
  "olivar": {
    "enero": ["poda"],
    "marzo": ["laboreo", "abonado"],
    "mayo": ["tratamiento_mosca"],
    "septiembre": ["riego_deficit"],
    "noviembre": ["cosecha_aceitunas"]
  }
}
```

## 5. Analytics y Reportes

### RF-015: Dashboard de Gestión
**Prioridad**: Alta
**Actor**: Todos los usuarios

**Descripción**: Panel principal con KPIs y métricas clave adaptadas por tipo de cultivo.

**Métricas por Tipo de Cultivo**:
- **Cereales**: Rendimiento kg/ha, coste por kg producido, margen bruto
- **Frutales**: Kg por árbol, calibre medio, porcentaje de primera calidad
- **Olivar**: Rendimiento graso, coste por litro aceite, precio medio venta
- **Viñedo**: Kg uva/ha, grado azúcar medio, precio por kg

**Widgets Específicos**:
- Comparativa rendimientos por cultivo
- Evolución costes por tipo de actividad y cultivo
- Alertas específicas por cultivo y época
- Predicción de cosecha por tipo de cultivo

### RF-016: Análisis de Rentabilidad por Cultivo
**Prioridad**: Alta
**Actor**: Agricultor, Cooperativa

**Descripción**: Cálculo automático especializado según tipo de cultivo.

**Cálculos Específicos por Cultivo**:

#### Cereales
```
Costes específicos:
- Semilla: kg/ha × precio/kg
- Fertilización: unidades NPK × precio
- Tratamientos: litros/ha × precio/litro
- Cosecha: % sobre producción

Ingresos:
- Grano: kg/ha × precio/kg según humedad y calidad
- Subvención PAC: €/ha según régimen
```

#### Frutales
```
Costes específicos:
- Plantones: número × precio (amortización anual)
- Poda: horas/árbol × coste/hora
- Riego: m³/ha × precio agua + energía
- Recolección: kg × precio/kg recolección

Ingresos:
- Fruta: kg × precio según calibre y calidad
- Diferenciación por categorías comerciales
```

### RF-017: Comparativas Especializadas por Cultivo
**Prioridad**: Media
**Actor**: Agricultor, Cooperativa

**Descripción**: Benchmarking específico según tipo de cultivo.

**Comparativas Disponibles**:
- Rendimiento promedio por cultivo y zona
- Eficiencia en uso de agua (frutales y regadío)
- Coste por unidad de producción
- Comparación con medias sectoriales
- Análisis de correlación clima-rendimiento por cultivo

### RF-018: Generación de Informes PAC Especializados
**Prioridad**: Alta
**Actor**: Agricultor, Técnico

**Descripción**: Informes automáticos adaptados según cultivos declarados.

**Informes Específicos por Cultivo**:
- **Cereales**: Cuaderno de explotación con densidades y variedades
- **Frutales**: Registro de tratamientos y plazos de seguridad
- **Agricultura Ecológica**: Certificación de productos autorizados
- **Regadío**: Justificación de dotaciones hídricas

## 6. Configuración y Administración

### RF-019: Gestión de Catálogos por Cultivo
**Prioridad**: Media
**Actor**: Administrador

**Descripción**: Mantenimiento de catálogos especializados por tipo de cultivo.

**Catálogos Especializados**:
- Variedades por cultivo y zona climática
- Productos fitosanitarios autorizados por cultivo
- Fertilizantes recomendados por tipo de cultivo
- Maquinaria específica por actividad y cultivo
- Precios diferenciados por calidad y cultivo

### RF-020: Configuración de Alertas por Cultivo
**Prioridad**: Baja
**Actor**: Todos los usuarios

**Descripción**: Sistema de alertas especializado según cultivos gestionados.

**Alertas Específicas**:
- **Frutales**: Riesgo de heladas en floración
- **Cereales**: Momento óptimo de cosecha según humedad
- **Viñedo**: Presión de enfermedades según condiciones climáticas
- **Olivar**: Vuelo de mosca del olivo según temperatura

## Casos de Uso Especializados

### CU-001: Registro de Poda en Frutales
**Actor Primario**: Agricultor
**Objetivo**: Registrar actividad de poda específica para frutales

**Precondiciones**:
- Parcela configurada como frutal
- Época adecuada para poda (reposo vegetativo)

**Flujo Principal**:
1. Agricultor accede a parcela de frutales
2. Sistema detecta tipo "frutales" y sugiere actividades de temporada
3. Selecciona "Poda de fructificación"
4. Formulario específico con campos:
   - Tipo de poda (formación/fructificación/renovación)
   - Intensidad de poda (ligera/moderada/severa)
   - Herramientas utilizadas
   - Estado sanitario observado
   - Foto de resultados (opcional)
5. Sistema valida época y registra actividad

### CU-002: Planificación Automática de Viñedo
**Actor Primario**: Sistema
**Objetivo**: Sugerir calendario de actividades para viñedo

**Precondiciones**:
- Parcelas configuradas como viñedo
- Localización y clima conocidos

**Flujo Principal**:
1. Sistema analiza parcelas de viñedo del usuario
2. Consulta datos meteorológicos y fenológicos
3. Genera calendario automático:
   - Enero: Poda de invierno
   - Marzo: Laboreo y abonado
   - Abril: Tratamientos preventivos
   - Mayo: Despampanado y atado
   - Junio: Tratamientos según presión enfermedad
   - Septiembre: Vendimia según maduración
4. Envía notificaciones personalizadas por época
5. Permite confirmación y ajuste manual

## Métricas de Éxito Específicas

### Métricas por Tipo de Cultivo
- **Cereales**: 95% de registros con densidad de siembra
- **Frutales**: 90% de tratamientos con plazos de seguridad respetados
- **Olivar**: 85% de cosechas con rendimiento graso registrado
- **Viñedo**: 90% de vendimias con grados Brix registrados

### Métricas de Personalización
- 80% de usuarios personalizan actividades según sus cultivos
- 70% de actividades registradas usan formularios específicos
- 95% de validaciones por cultivo son consideradas útiles
- 60% de usuarios siguen recomendaciones del calendario automático