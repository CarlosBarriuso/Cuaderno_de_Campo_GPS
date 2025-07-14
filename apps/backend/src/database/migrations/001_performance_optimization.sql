-- Database Performance Optimization Migration
-- Phase 4 - Cuaderno de Campo GPS
-- Date: 2025-01-12

-- =====================================
-- 1. COMPOSITE INDEXES FOR CRITICAL QUERIES
-- =====================================

-- Parcelas: Usuario + Estado + Tipo de Cultivo (Dashboard principal)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcelas_usuario_activa_cultivo 
ON parcelas ("propietarioId", activa, "tipoCultivo");

-- Parcelas: SIGPAC + Usuario + Estado (Reportes PAC)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcelas_sigpac_usuario_activa 
ON parcelas ("referenciaSigpac", "propietarioId", activa) 
WHERE "referenciaSigpac" IS NOT NULL;

-- Actividades: Usuario + Fecha + Tipo (Timeline principal)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_usuario_fecha_tipo 
ON actividades ("usuarioId", fecha DESC, tipo);

-- Actividades: Parcela + Fecha + Tipo (Analytics por parcela)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_parcela_fecha_tipo 
ON actividades ("parcelaId", fecha DESC, tipo);

-- Actividades: Fecha + Tipo + Parcela (Búsquedas temporales)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_fecha_tipo_parcela 
ON actividades (fecha DESC, tipo, "parcelaId");

-- Actividades: Estado + Fecha + Tipo (Validaciones automáticas)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_estado_fecha_tipo 
ON actividades (estado, fecha, tipo);

-- Users: Clerk + UpdatedAt (Sincronización Clerk)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_clerk_updated 
ON users ("clerkId", "updatedAt");

-- Users: Organización + Rol + Último Login (Gestión organizaciones)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_org_rol_login 
ON users ("organizationId", role, "lastLoginAt") 
WHERE "organizationId" IS NOT NULL;

-- =====================================
-- 2. POSTGIS SPATIAL INDEXES
-- =====================================

-- Geometrías de parcelas (búsquedas espaciales)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcelas_geometria_gist 
ON parcelas USING GIST (ST_GeomFromText(geometria)) 
WHERE geometria IS NOT NULL;

-- Centroides de parcelas (búsquedas por proximidad)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parcelas_centroide_gist 
ON parcelas USING GIST (ST_GeomFromText(centroide)) 
WHERE centroide IS NOT NULL;

-- Coordenadas de actividades (geolocalización de actividades)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_coordenadas_gist 
ON actividades USING GIST (ST_Point(coordenadas[1], coordenadas[2])) 
WHERE array_length(coordenadas, 1) >= 2;

-- =====================================
-- 3. JSON/JSONB INDEXES
-- =====================================

-- Productos en actividades (búsquedas por producto)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_productos_gin 
ON actividades USING GIN (productos) 
WHERE productos IS NOT NULL AND productos != '[]'::json;

-- Configuraciones de organizaciones
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizacion_config_gin 
ON organizaciones USING GIN (configuracion) 
WHERE configuracion IS NOT NULL;

-- Datos OCR en actividades (búsquedas por OCR)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_ocr_gin 
ON actividades USING GIN ("ocrData") 
WHERE "ocrData" IS NOT NULL;

-- Condiciones meteorológicas
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_actividades_meteo_gin 
ON actividades USING GIN ("condicionesMeteorologicas") 
WHERE "condicionesMeteorologicas" IS NOT NULL;

-- =====================================
-- 4. MATERIALIZED VIEWS FOR ANALYTICS
-- =====================================

-- Vista materializada: Dashboard de usuario
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT 
    u.id as usuario_id,
    u."firstName",
    u."lastName",
    COUNT(DISTINCT p.id) as total_parcelas,
    COALESCE(SUM(p.superficie), 0) as superficie_total,
    COUNT(DISTINCT a.id) as total_actividades,
    COUNT(DISTINCT CASE 
        WHEN a.fecha >= CURRENT_DATE - INTERVAL '30 days' 
        THEN a.id 
    END) as actividades_mes_actual,
    COUNT(DISTINCT CASE 
        WHEN a.fecha >= CURRENT_DATE - INTERVAL '7 days' 
        THEN a.id 
    END) as actividades_semana_actual,
    MAX(a.fecha) as ultima_actividad,
    COUNT(DISTINCT p."tipoCultivo") as tipos_cultivo,
    ARRAY_AGG(DISTINCT p."tipoCultivo") FILTER (WHERE p."tipoCultivo" IS NOT NULL) as cultivos_lista,
    NOW() as last_updated
FROM users u
LEFT JOIN parcelas p ON u.id = p."propietarioId" AND p.activa = true
LEFT JOIN actividades a ON p.id = a."parcelaId"
GROUP BY u.id, u."firstName", u."lastName";

-- Índice para la vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_usuario 
ON user_dashboard_stats (usuario_id);

-- Vista materializada: Analytics de costos por usuario
CREATE MATERIALIZED VIEW IF NOT EXISTS user_cost_analytics AS
SELECT 
    p."propietarioId" as usuario_id,
    p."tipoCultivo",
    DATE_TRUNC('month', a.fecha) as mes,
    COUNT(a.id) as num_actividades,
    COUNT(DISTINCT p.id) as num_parcelas,
    SUM(p.superficie) as superficie_total,
    -- Extraer costos de productos JSON
    SUM(
        CASE 
            WHEN jsonb_typeof(productos.value->'costo') = 'number' 
            THEN (productos.value->>'costo')::numeric 
            ELSE 0 
        END
    ) as costo_total_productos,
    AVG(
        CASE 
            WHEN jsonb_typeof(productos.value->'costo') = 'number' 
            THEN (productos.value->>'costo')::numeric 
        END
    ) as costo_medio_producto,
    COUNT(DISTINCT a.tipo) as tipos_actividad_distintos,
    NOW() as last_updated
FROM parcelas p
JOIN actividades a ON p.id = a."parcelaId"
CROSS JOIN LATERAL jsonb_array_elements(a.productos) as productos(value)
WHERE p.activa = true 
    AND a.fecha >= CURRENT_DATE - INTERVAL '2 years'
    AND jsonb_typeof(productos.value->'costo') = 'number'
GROUP BY p."propietarioId", p."tipoCultivo", DATE_TRUNC('month', a.fecha);

-- Índice para analytics de costos
CREATE INDEX IF NOT EXISTS idx_user_cost_analytics_usuario_mes 
ON user_cost_analytics (usuario_id, mes DESC);

CREATE INDEX IF NOT EXISTS idx_user_cost_analytics_cultivo_mes 
ON user_cost_analytics ("tipoCultivo", mes DESC);

-- Vista materializada: Estadísticas de parcelas por región
CREATE MATERIALIZED VIEW IF NOT EXISTS regional_stats AS
SELECT 
    SUBSTRING("referenciaSigpac", 1, 2) as provincia_codigo,
    p."tipoCultivo",
    COUNT(*) as num_parcelas,
    SUM(p.superficie) as superficie_total,
    AVG(p.superficie) as superficie_media,
    COUNT(DISTINCT p."propietarioId") as num_propietarios,
    COUNT(DISTINCT a.id) as num_actividades_total,
    COUNT(DISTINCT CASE 
        WHEN a.fecha >= CURRENT_DATE - INTERVAL '12 months' 
        THEN a.id 
    END) as actividades_ultimo_año,
    NOW() as last_updated
FROM parcelas p
LEFT JOIN actividades a ON p.id = a."parcelaId"
WHERE p.activa = true 
    AND p."referenciaSigpac" IS NOT NULL
    AND LENGTH(p."referenciaSigpac") >= 2
GROUP BY SUBSTRING("referenciaSigpac", 1, 2), p."tipoCultivo";

-- Índice para estadísticas regionales
CREATE INDEX IF NOT EXISTS idx_regional_stats_provincia_cultivo 
ON regional_stats (provincia_codigo, "tipoCultivo");

-- =====================================
-- 5. FUNCTIONS FOR COMMON QUERIES
-- =====================================

-- Función: Obtener parcelas cercanas por GPS
CREATE OR REPLACE FUNCTION get_nearby_parcelas(
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    radius_meters INTEGER DEFAULT 1000,
    max_results INTEGER DEFAULT 20
)
RETURNS TABLE (
    parcela_id TEXT,
    nombre TEXT,
    superficie DOUBLE PRECISION,
    tipo_cultivo TEXT,
    distancia_metros DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nombre,
        p.superficie,
        p."tipoCultivo"::TEXT,
        ST_Distance(
            ST_GeomFromText(p.centroide),
            ST_Point(lng, lat)::geometry
        ) as distancia
    FROM parcelas p
    WHERE p.activa = true
        AND p.centroide IS NOT NULL
        AND ST_DWithin(
            ST_GeomFromText(p.centroide),
            ST_Point(lng, lat)::geometry,
            radius_meters
        )
    ORDER BY distancia
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función: Analytics de actividades por período
CREATE OR REPLACE FUNCTION get_activity_analytics(
    user_id TEXT,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    tipo_actividad TEXT,
    num_actividades BIGINT,
    num_parcelas BIGINT,
    superficie_afectada DOUBLE PRECISION,
    costo_total NUMERIC,
    fecha_primera DATE,
    fecha_ultima DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.tipo::TEXT,
        COUNT(a.id) as num_actividades,
        COUNT(DISTINCT a."parcelaId") as num_parcelas,
        SUM(DISTINCT p.superficie) as superficie_afectada,
        SUM(
            CASE 
                WHEN jsonb_typeof(productos.value->'costo') = 'number' 
                THEN (productos.value->>'costo')::numeric 
                ELSE 0 
            END
        ) as costo_total,
        MIN(a.fecha::DATE) as fecha_primera,
        MAX(a.fecha::DATE) as fecha_ultima
    FROM actividades a
    JOIN parcelas p ON a."parcelaId" = p.id
    CROSS JOIN LATERAL jsonb_array_elements(a.productos) as productos(value)
    WHERE a."usuarioId" = user_id
        AND a.fecha >= start_date
        AND a.fecha <= end_date
        AND p.activa = true
    GROUP BY a.tipo
    ORDER BY num_actividades DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================
-- 6. AUTOMATIC REFRESH FOR MATERIALIZED VIEWS
-- =====================================

-- Función para refresh automático de vistas materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_cost_analytics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY regional_stats;
    
    -- Log the refresh
    INSERT INTO configuracion_sistema (clave, valor, descripcion)
    VALUES (
        'last_materialized_view_refresh',
        to_jsonb(NOW()),
        'Timestamp of last materialized view refresh'
    )
    ON CONFLICT (clave) 
    DO UPDATE SET 
        valor = to_jsonb(NOW()),
        "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 7. PERFORMANCE MONITORING SETUP
-- =====================================

-- Tabla para alertas de performance
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    query_hash BIGINT,
    total_time DOUBLE PRECISION,
    metadata JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_type_created 
ON performance_alerts (alert_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_unresolved 
ON performance_alerts (resolved, created_at DESC) 
WHERE resolved = FALSE;

-- Función para detectar consultas lentas
CREATE OR REPLACE FUNCTION log_slow_query_alert(
    query_hash BIGINT,
    total_time_ms DOUBLE PRECISION,
    query_text TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF total_time_ms > 5000 THEN -- 5 segundos
        INSERT INTO performance_alerts (
            alert_type,
            message,
            query_hash,
            total_time,
            metadata
        ) VALUES (
            'SLOW_QUERY',
            format('Query execution time: %.2f seconds', total_time_ms / 1000),
            query_hash,
            total_time_ms,
            jsonb_build_object(
                'query_text', COALESCE(query_text, 'N/A'),
                'threshold_ms', 5000,
                'severity', CASE 
                    WHEN total_time_ms > 30000 THEN 'CRITICAL'
                    WHEN total_time_ms > 15000 THEN 'HIGH'
                    WHEN total_time_ms > 10000 THEN 'MEDIUM'
                    ELSE 'LOW'
                END
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 8. CLEANUP OLD DATA
-- =====================================

-- Función para limpiar datos antiguos
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Limpiar alertas de performance resueltas > 30 días
    DELETE FROM performance_alerts 
    WHERE resolved = TRUE 
        AND resolved_at < NOW() - INTERVAL '30 days';
    
    -- Limpiar precios de mercado > 2 años
    DELETE FROM precios_mercado 
    WHERE fecha < NOW() - INTERVAL '2 years';
    
    -- Log cleanup
    INSERT INTO configuracion_sistema (clave, valor, descripcion)
    VALUES (
        'last_data_cleanup',
        to_jsonb(NOW()),
        'Timestamp of last data cleanup'
    )
    ON CONFLICT (clave) 
    DO UPDATE SET 
        valor = to_jsonb(NOW()),
        "updatedAt" = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 9. ANALYZE TABLES FOR UPDATED STATISTICS
-- =====================================

-- Actualizar estadísticas de todas las tablas principales
ANALYZE users;
ANALYZE organizaciones;
ANALYZE parcelas;
ANALYZE actividades;
ANALYZE productos;
ANALYZE precios_mercado;
ANALYZE configuracion_sistema;

-- =====================================
-- 10. FINAL VERIFICATION
-- =====================================

-- Verificar que todos los índices se crearon correctamente
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%';
    
    INSERT INTO configuracion_sistema (clave, valor, descripcion)
    VALUES (
        'migration_001_complete',
        jsonb_build_object(
            'completed_at', NOW(),
            'indexes_created', index_count,
            'materialized_views', 3,
            'functions_created', 4
        ),
        'Performance optimization migration completed'
    );
    
    RAISE NOTICE 'Performance optimization migration completed successfully. % indexes created.', index_count;
END $$;

-- Refresh inicial de vistas materializadas
SELECT refresh_materialized_views();

COMMIT;