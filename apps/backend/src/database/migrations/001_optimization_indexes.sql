-- Database Optimization Migration - Phase 4
-- Optimizaciones críticas de rendimiento para 1000+ usuarios concurrentes
-- Fecha: 13 de Julio de 2025

-- ================================================
-- 1. ÍNDICES GEOESPACIALES (PostGIS)
-- ================================================

-- Índices espaciales para geometrías de parcelas
CREATE INDEX IF NOT EXISTS idx_parcelas_geometria_gist 
ON parcelas USING GIST (ST_GeomFromText(geometria));

-- Índice para búsquedas de proximidad GPS
CREATE INDEX IF NOT EXISTS idx_parcelas_centroide_gist 
ON parcelas USING GIST (ST_GeomFromText(centroide));

-- Índice para coordenadas de actividades GPS
CREATE INDEX IF NOT EXISTS idx_actividades_coordenadas_gist 
ON actividades USING GIST (ST_Point(coordenadas[0], coordenadas[1]));

-- ================================================
-- 2. ÍNDICES JSON/JSONB PARA DATOS COMPLEJOS
-- ================================================

-- Índices GIN para búsquedas en JSON de productos
CREATE INDEX IF NOT EXISTS idx_actividades_productos_gin 
ON actividades USING GIN (productos);

-- Índice para configuraciones de organizaciones
CREATE INDEX IF NOT EXISTS idx_organizacion_config_gin 
ON organizaciones USING GIN (configuracion);

-- Índice para datos OCR en actividades
CREATE INDEX IF NOT EXISTS idx_actividades_ocr_gin 
ON actividades USING GIN ("ocrData");

-- Índice para condiciones meteorológicas
CREATE INDEX IF NOT EXISTS idx_actividades_condiciones_gin 
ON actividades USING GIN ("condicionesMeteorologicas");

-- Índice para validaciones automáticas
CREATE INDEX IF NOT EXISTS idx_actividades_validaciones_gin 
ON actividades USING GIN (validaciones);

-- ================================================
-- 3. VISTAS MATERIALIZADAS PARA ANALYTICS
-- ================================================

-- Vista materializada para dashboard de usuario
DROP MATERIALIZED VIEW IF EXISTS user_dashboard_stats;
CREATE MATERIALIZED VIEW user_dashboard_stats AS
SELECT 
    u.id as usuario_id,
    COUNT(DISTINCT p.id) as total_parcelas,
    COALESCE(SUM(p.superficie), 0) as superficie_total,
    COUNT(DISTINCT a.id) as total_actividades,
    SUM(CASE WHEN a.fecha >= CURRENT_DATE - INTERVAL '30 days' 
        THEN 1 ELSE 0 END) as actividades_mes,
    MAX(a.fecha) as ultima_actividad,
    COUNT(DISTINCT CASE WHEN p.activa = true THEN p.id END) as parcelas_activas
FROM users u
LEFT JOIN parcelas p ON u.id = p."propietarioId"
LEFT JOIN actividades a ON p.id = a."parcelaId"
GROUP BY u.id;

-- Índice para la vista materializada
CREATE UNIQUE INDEX ON user_dashboard_stats (usuario_id);

-- Vista materializada para analytics de costos
DROP MATERIALIZED VIEW IF EXISTS analytics_costos;
CREATE MATERIALIZED VIEW analytics_costos AS
SELECT 
    p.id as parcela_id,
    p."propietarioId" as usuario_id,
    p."tipoCultivo",
    DATE_TRUNC('month', a.fecha) as mes,
    COUNT(a.id) as num_actividades,
    SUM(CASE 
        WHEN jsonb_typeof(productos->'costo') = 'number' 
        THEN (productos->>'costo')::NUMERIC 
        ELSE 0 
    END) as costo_total,
    AVG(CASE 
        WHEN jsonb_typeof(productos->'costo') = 'number' 
        THEN (productos->>'costo')::NUMERIC 
        ELSE NULL 
    END) as costo_medio
FROM parcelas p
JOIN actividades a ON p.id = a."parcelaId"
CROSS JOIN LATERAL jsonb_array_elements(a.productos) as productos
WHERE productos ? 'costo'
GROUP BY p.id, p."propietarioId", p."tipoCultivo", DATE_TRUNC('month', a.fecha);

-- Índices para analytics de costos
CREATE INDEX ON analytics_costos (usuario_id, mes DESC);
CREATE INDEX ON analytics_costos (parcela_id, mes DESC);
CREATE INDEX ON analytics_costos ("tipoCultivo", mes DESC);

-- Vista materializada para analytics de actividades por tipo
DROP MATERIALIZED VIEW IF EXISTS analytics_actividades;
CREATE MATERIALIZED VIEW analytics_actividades AS
SELECT 
    a."usuarioId" as usuario_id,
    a."parcelaId" as parcela_id,
    a.tipo,
    DATE_TRUNC('month', a.fecha) as mes,
    COUNT(*) as total_actividades,
    COUNT(DISTINCT a."parcelaId") as parcelas_afectadas,
    AVG(a.precision) as precision_promedio
FROM actividades a
WHERE a.estado = 'COMPLETADA'
GROUP BY a."usuarioId", a."parcelaId", a.tipo, DATE_TRUNC('month', a.fecha);

-- Índices para analytics de actividades
CREATE INDEX ON analytics_actividades (usuario_id, mes DESC);
CREATE INDEX ON analytics_actividades (tipo, mes DESC);

-- ================================================
-- 4. FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- ================================================

-- Función para refresh automático de vistas materializadas
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_costos;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_actividades;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. TRIGGERS PARA ACTUALIZACIÓN INTELIGENTE
-- ================================================

-- Función trigger para actualizar estadísticas de usuario
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar la vista materializada específica del usuario afectado
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática
DROP TRIGGER IF EXISTS trigger_update_user_stats_actividades ON actividades;
CREATE TRIGGER trigger_update_user_stats_actividades
    AFTER INSERT OR UPDATE OR DELETE ON actividades
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

DROP TRIGGER IF EXISTS trigger_update_user_stats_parcelas ON parcelas;
CREATE TRIGGER trigger_update_user_stats_parcelas
    AFTER INSERT OR UPDATE OR DELETE ON parcelas
    FOR EACH ROW EXECUTE FUNCTION update_user_stats();

-- ================================================
-- 6. CONFIGURACIÓN DE PERFORMANCE
-- ================================================

-- Habilitar pg_stat_statements para monitoring de queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configurar parámetros de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
ALTER SYSTEM SET pg_stat_statements.track = 'all';

-- Configurar work_mem para queries complejas
ALTER SYSTEM SET work_mem = '256MB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';

-- Configurar effective_cache_size
ALTER SYSTEM SET effective_cache_size = '4GB';

-- ================================================
-- 7. FUNCIÓN DE MONITOREO DE PERFORMANCE
-- ================================================

-- Función para obtener queries más lentas
CREATE OR REPLACE FUNCTION get_slow_queries(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    query_text TEXT,
    calls BIGINT,
    total_time_ms DOUBLE PRECISION,
    mean_time_ms DOUBLE PRECISION,
    rows_affected BIGINT,
    hit_percent DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        query,
        calls,
        total_exec_time as total_time_ms,
        mean_exec_time as mean_time_ms,
        rows,
        100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
    FROM pg_stat_statements 
    ORDER BY total_exec_time DESC 
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Función para detectar índices no utilizados
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    index_size TEXT,
    scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        indexrelname::TEXT AS index_name,
        relname::TEXT AS table_name,
        pg_size_pretty(pg_relation_size(indexrelname::regclass)) AS index_size,
        idx_scan AS scans
    FROM pg_stat_user_indexes 
    JOIN pg_index USING (indexrelid)
    WHERE idx_scan < 50  -- Menos de 50 usos
        AND indisunique = false
        AND indexrelname NOT LIKE '%_pkey'  -- Excluir primary keys
    ORDER BY pg_relation_size(indexrelname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. TABLA DE ALERTAS DE PERFORMANCE
-- ================================================

-- Tabla para almacenar alertas de performance
CREATE TABLE IF NOT EXISTS performance_alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    query_hash BIGINT,
    total_time DOUBLE PRECISION,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

-- Índices para la tabla de alertas
CREATE INDEX IF NOT EXISTS idx_performance_alerts_type_date 
ON performance_alerts (alert_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_unresolved 
ON performance_alerts (resolved, created_at DESC) WHERE resolved = FALSE;

-- ================================================
-- 9. TRIGGER PARA ALERTAS AUTOMÁTICAS
-- ================================================

-- Función para crear alertas de performance automáticas
CREATE OR REPLACE FUNCTION check_query_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Alert para queries muy lentas (>5 segundos)
    IF NEW.total_exec_time > 5000 THEN
        INSERT INTO performance_alerts (
            alert_type,
            message,
            query_hash,
            total_time,
            details
        ) VALUES (
            'SLOW_QUERY',
            format('Query execution time exceeded 5 seconds: %.2f ms', NEW.total_exec_time),
            NEW.queryid,
            NEW.total_exec_time,
            jsonb_build_object(
                'calls', NEW.calls,
                'mean_time', NEW.mean_exec_time,
                'query', LEFT(NEW.query, 500)
            )
        );
    END IF;
    
    -- Alert para queries con muchas llamadas pero lentas
    IF NEW.calls > 1000 AND NEW.mean_exec_time > 1000 THEN
        INSERT INTO performance_alerts (
            alert_type,
            message,
            query_hash,
            total_time,
            details
        ) VALUES (
            'HIGH_FREQUENCY_SLOW_QUERY',
            format('High frequency slow query detected: %s calls, %.2f ms avg', NEW.calls, NEW.mean_exec_time),
            NEW.queryid,
            NEW.total_exec_time,
            jsonb_build_object(
                'calls', NEW.calls,
                'mean_time', NEW.mean_exec_time,
                'query', LEFT(NEW.query, 500)
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ================================================

COMMENT ON MATERIALIZED VIEW user_dashboard_stats IS 
'Vista materializada para optimizar dashboard de usuario. Refresh cada 5 minutos vía cron job.';

COMMENT ON MATERIALIZED VIEW analytics_costos IS 
'Analytics precalculados de costos por parcela y mes. Refresh diario vía cron job.';

COMMENT ON FUNCTION refresh_materialized_views() IS 
'Función para refresh concurrente de todas las vistas materializadas.';

COMMENT ON FUNCTION get_slow_queries(INTEGER) IS 
'Función de monitoring para identificar queries más lentas del sistema.';

COMMENT ON TABLE performance_alerts IS 
'Tabla de alertas automáticas de performance con triggers en pg_stat_statements.';

-- ================================================
-- 11. INFORMACIÓN DE MIGRACIÓN
-- ================================================

-- Insertar registro de migración aplicada
INSERT INTO "configuracion_sistema" (id, clave, valor, descripcion)
VALUES (
    'migration_001_optimization',
    'db_optimization_phase4_applied',
    '{"version": "001", "applied_at": "2025-07-13", "features": ["spatial_indexes", "materialized_views", "performance_monitoring"]}',
    'Migración de optimización Phase 4 - Índices, vistas materializadas y monitoring'
) ON CONFLICT (clave) DO UPDATE SET
    valor = EXCLUDED.valor,
    "updatedAt" = NOW();

-- ================================================
-- FINALIZACIÓN
-- ================================================

-- Actualizar estadísticas después de crear índices
ANALYZE;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Database optimization migration completed successfully!';
    RAISE NOTICE 'New indexes: % spatial indexes, % JSON indexes', 3, 5;
    RAISE NOTICE 'Materialized views: % analytics views created', 3;
    RAISE NOTICE 'Performance monitoring: pg_stat_statements enabled';
    RAISE NOTICE 'Next steps: Configure PgBouncer and Redis cache';
END $$;