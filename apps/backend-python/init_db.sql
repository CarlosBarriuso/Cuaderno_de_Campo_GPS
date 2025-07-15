-- Inicialización de la base de datos para Cuaderno de Campo GPS
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que las extensiones estén instaladas
SELECT 
    name,
    installed_version,
    default_version
FROM pg_extension 
WHERE name IN ('postgis', 'postgis_topology', 'uuid-ossp');

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente para Cuaderno de Campo GPS';
    RAISE NOTICE 'PostGIS version: %', PostGIS_version();
END $$;