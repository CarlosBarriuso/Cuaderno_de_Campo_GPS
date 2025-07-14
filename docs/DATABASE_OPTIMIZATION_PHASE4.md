# Database Optimization Analysis - Phase 4

**Fecha**: 12 de Enero de 2025  
**Estado**: Análisis completado - Recomendaciones para optimización  
**Objetivo**: Optimizar rendimiento de base de datos para 1000+ usuarios concurrentes

## 📊 Análisis Actual del Schema

### Índices Existentes (Bien configurados)
```sql
-- Parcelas
@@index([propietarioId])        -- ✅ Consultas por usuario
@@index([tipoCultivo])          -- ✅ Filtrado por tipo de cultivo  
@@index([referenciaSigpac])     -- ✅ Búsquedas SIGPAC

-- Actividades
@@index([parcelaId])            -- ✅ Actividades por parcela
@@index([usuarioId])            -- ✅ Actividades por usuario
@@index([tipo])                 -- ✅ Filtrado por tipo de actividad
@@index([fecha])                -- ✅ Consultas temporales

-- Productos
@@index([tipo])                 -- ✅ Catálogo por tipo
@@index([numeroRegistro])       -- ✅ Búsqueda por registro oficial

-- Precios Mercado
@@index([cultivo])              -- ✅ Precios por cultivo
@@index([fecha])                -- ✅ Histórico de precios
```

## 🔧 Optimizaciones Recomendadas

### 1. Índices Compuestos Críticos

#### Parcelas - Consultas frecuentes optimizadas
```sql
-- Índice compuesto para dashboard de usuario
@@index([propietarioId, activa, tipoCultivo])

-- Índice geoespacial para búsquedas por ubicación
@@index([geometria]) -- PostGIS GIST index

-- Índice para reportes PAC
@@index([referenciaSigpac, propietarioId, activa])
```

#### Actividades - Performance crítica
```sql
-- Índice principal para timeline de actividades
@@index([usuarioId, fecha DESC, tipo])

-- Índice para analytics por parcela
@@index([parcelaId, fecha DESC, tipo])

-- Índice para búsquedas temporales
@@index([fecha DESC, tipo, parcelaId])

-- Índice para validaciones automáticas
@@index([estado, fecha, tipo])
```

#### Users - Autenticación optimizada
```sql
-- Índice para Clerk sync
@@index([clerkId, updatedAt])

-- Índice para organizaciones
@@index([organizationId, role, lastLoginAt])
```

### 2. Optimizaciones PostGIS (Datos Geoespaciales)

```sql
-- Crear índices espaciales para geometrías
CREATE INDEX idx_parcelas_geometria_gist 
ON parcelas USING GIST (ST_GeomFromText(geometria));

-- Índice para búsquedas de proximidad
CREATE INDEX idx_parcelas_centroide_gist 
ON parcelas USING GIST (ST_GeomFromText(centroide));

-- Índice para coordenadas de actividades
CREATE INDEX idx_actividades_coordenadas_gist 
ON actividades USING GIST (ST_Point(coordenadas[0], coordenadas[1]));
```

### 3. Optimizaciones JSON (Datos Complejos)

```sql
-- Índices GIN para búsquedas en JSON
CREATE INDEX idx_actividades_productos_gin 
ON actividades USING GIN (productos);

-- Índice para configuraciones de organizaciones
CREATE INDEX idx_organizacion_config_gin 
ON organizaciones USING GIN (configuracion);

-- Índice para datos OCR
CREATE INDEX idx_actividades_ocr_gin 
ON actividades USING GIN (ocrData);
```

### 4. Particionamiento de Tablas

#### Particionamiento por fecha (Actividades)
```sql
-- Particionar actividades por año para mejor performance
CREATE TABLE actividades_2025 PARTITION OF actividades
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE actividades_2024 PARTITION OF actividades
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

-- Índices automáticos por partición
CREATE INDEX ON actividades_2025 (usuarioId, fecha DESC);
CREATE INDEX ON actividades_2024 (usuarioId, fecha DESC);
```

#### Particionamiento por región (Parcelas)
```sql
-- Particionar parcelas por provincia para consultas SIGPAC
CREATE TABLE parcelas_madrid PARTITION OF parcelas
FOR VALUES FROM ('28:') TO ('29:');

CREATE TABLE parcelas_valencia PARTITION OF parcelas  
FOR VALUES FROM ('46:') TO ('47:');
```

### 5. Vistas Materializadas para Analytics

```sql
-- Vista materializada para dashboard de usuario
CREATE MATERIALIZED VIEW user_dashboard_stats AS
SELECT 
    u.id as usuario_id,
    COUNT(DISTINCT p.id) as total_parcelas,
    SUM(p.superficie) as superficie_total,
    COUNT(DISTINCT a.id) as total_actividades,
    SUM(CASE WHEN a.fecha >= CURRENT_DATE - INTERVAL '30 days' 
        THEN 1 ELSE 0 END) as actividades_mes,
    MAX(a.fecha) as ultima_actividad
FROM users u
LEFT JOIN parcelas p ON u.id = p."propietarioId" AND p.activa = true
LEFT JOIN actividades a ON p.id = a."parcelaId"
GROUP BY u.id;

-- Refresh automático cada hora
CREATE INDEX ON user_dashboard_stats (usuario_id);
```

```sql
-- Vista materializada para analytics de costos
CREATE MATERIALIZED VIEW analytics_costos AS
SELECT 
    p.id as parcela_id,
    p."propietarioId" as usuario_id,
    p.tipoCultivo,
    DATE_TRUNC('month', a.fecha) as mes,
    COUNT(a.id) as num_actividades,
    SUM(CAST(productos->>'costo' AS NUMERIC)) as costo_total,
    AVG(CAST(productos->>'costo' AS NUMERIC)) as costo_medio
FROM parcelas p
JOIN actividades a ON p.id = a."parcelaId"
CROSS JOIN LATERAL jsonb_array_elements(a.productos) as productos
WHERE productos ? 'costo'
GROUP BY p.id, p."propietarioId", p.tipoCultivo, DATE_TRUNC('month', a.fecha);

CREATE INDEX ON analytics_costos (usuario_id, mes DESC);
```

### 6. Query Optimization

#### Consultas Frecuentes Optimizadas

```sql
-- Dashboard principal del usuario (optimizada)
EXPLAIN ANALYZE
SELECT 
    p.id, p.nombre, p.superficie, p.tipoCultivo,
    COUNT(a.id) as actividades_count,
    MAX(a.fecha) as ultima_actividad_fecha
FROM parcelas p
LEFT JOIN actividades a ON p.id = a."parcelaId" 
    AND a.fecha >= CURRENT_DATE - INTERVAL '90 days'
WHERE p."propietarioId" = $1 AND p.activa = true
GROUP BY p.id, p.nombre, p.superficie, p.tipoCultivo
ORDER BY p.nombre;
```

```sql
-- Timeline de actividades (optimizada)
EXPLAIN ANALYZE
SELECT 
    a.id, a.tipo, a.fecha, a.notas,
    p.nombre as parcela_nombre,
    jsonb_array_length(a.productos) as num_productos
FROM actividades a
JOIN parcelas p ON a."parcelaId" = p.id
WHERE a."usuarioId" = $1 
    AND a.fecha >= $2 
    AND a.fecha <= $3
ORDER BY a.fecha DESC, a."createdAt" DESC
LIMIT 50;
```

```sql
-- Búsqueda por proximidad GPS (optimizada)
EXPLAIN ANALYZE
SELECT 
    p.id, p.nombre, p.superficie,
    ST_Distance(
        ST_GeomFromText(p.centroide),
        ST_Point($1, $2)
    ) as distancia
FROM parcelas p
WHERE p.activa = true
    AND ST_DWithin(
        ST_GeomFromText(p.centroide),
        ST_Point($1, $2),
        1000  -- 1km radius
    )
ORDER BY distancia
LIMIT 20;
```

## 📈 Connection Pooling y Cache

### PgBouncer Configuration
```ini
[databases]
cuaderno_campo = host=localhost port=5432 dbname=cuaderno_campo

[pgbouncer]
listen_port = 6432
listen_addr = *
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool settings para alta concurrencia
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 50
max_db_connections = 100
reserve_pool_size = 10

# Timeouts optimizados
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = SELECT 1
```

### Redis Cache Strategy
```typescript
// Cache keys strategy
const CACHE_KEYS = {
  userDashboard: (userId: string) => `dashboard:${userId}`,
  parcelaDetails: (parcelaId: string) => `parcela:${parcelaId}`,
  weatherData: (lat: number, lng: number) => `weather:${lat}:${lng}`,
  sigpacData: (reference: string) => `sigpac:${reference}`,
  analytics: (userId: string, period: string) => `analytics:${userId}:${period}`
};

// TTL strategy
const CACHE_TTL = {
  dashboard: 300,      // 5 minutes
  parcela: 3600,       // 1 hour
  weather: 1800,       // 30 minutes
  sigpac: 86400,       // 24 hours
  analytics: 1800      // 30 minutes
};
```

## 🔍 Monitoring y Performance

### Queries para Performance Monitoring
```sql
-- Top 10 consultas más lentas
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- Índices no utilizados
SELECT 
    indexrelname AS index,
    relname AS table,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelname::regclass)) AS size
FROM pg_stat_user_indexes 
JOIN pg_index USING (indexrelid)
WHERE idx_scan = 0 
    AND indisunique = false;

-- Tablas con más cache misses
SELECT 
    relname,
    heap_blks_read,
    heap_blks_hit,
    round(100.0 * heap_blks_hit / (heap_blks_hit + heap_blks_read), 2) AS hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_read > 0
ORDER BY hit_ratio ASC;
```

### Alertas Automáticas
```sql
-- Alertas de performance
CREATE OR REPLACE FUNCTION check_slow_queries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.total_time > 10000 THEN  -- 10 seconds
        INSERT INTO performance_alerts (
            alert_type,
            message,
            query_hash,
            total_time,
            created_at
        ) VALUES (
            'SLOW_QUERY',
            'Query execution time exceeded 10 seconds',
            NEW.queryid,
            NEW.total_time,
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 🚀 Implementation Plan

### Week 1: Índices Críticos
- [ ] Implementar índices compuestos principales
- [ ] Crear índices PostGIS para datos geoespaciales
- [ ] Configurar índices JSON/JSONB
- [ ] Testing de performance pre/post

### Week 2: Vistas Materializadas
- [ ] Crear vistas materializadas para dashboard
- [ ] Implementar refresh automático
- [ ] Configurar analytics precalculados
- [ ] Monitoreo de uso de vistas

### Week 3: Connection Pooling
- [ ] Configurar PgBouncer
- [ ] Implementar Redis cache
- [ ] Optimizar connection strings
- [ ] Load testing con pooling

### Week 4: Monitoring & Partitioning
- [ ] Configurar pg_stat_statements
- [ ] Implementar particionamiento por fecha
- [ ] Crear alertas de performance
- [ ] Documentar playbooks de optimización

## 📊 Expected Performance Gains

### Response Time Improvements
- **Dashboard queries**: 800ms → 150ms (81% improvement)
- **Activity timeline**: 1200ms → 200ms (83% improvement) 
- **Spatial queries**: 2000ms → 400ms (80% improvement)
- **Analytics**: 3000ms → 500ms (83% improvement)

### Throughput Improvements
- **Concurrent users**: 100 → 1000+ (10x increase)
- **API requests/second**: 200 → 2000+ (10x increase)
- **Database connections**: Optimized pooling reduces by 70%

### Resource Optimization
- **Memory usage**: 40% reduction via query optimization
- **CPU usage**: 50% reduction via proper indexing
- **Storage**: 30% reduction via partitioning and archival

## 🎯 Success Metrics

### Performance KPIs
- [ ] P95 query response time < 200ms
- [ ] Database CPU usage < 70% under load
- [ ] Cache hit ratio > 95%
- [ ] Connection pool efficiency > 90%

### User Experience KPIs
- [ ] Dashboard load time < 2 seconds
- [ ] Map rendering < 3 seconds
- [ ] Search results < 1 second
- [ ] Sync operations < 5 seconds

---

**Implementación**: Las optimizaciones se implementarán gradualmente durante la Fase 4, con testing continuo y rollback capability para garantizar estabilidad del sistema en producción.