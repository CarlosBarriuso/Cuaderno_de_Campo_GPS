-- Migration script to update actividades table schema to match SQLAlchemy model
-- This fixes the massive schema mismatch between database and model

-- Create enum types for actividades
DO $$ BEGIN
    CREATE TYPE tipoactividad AS ENUM (
        'SIEMBRA',
        'FERTILIZACION', 
        'TRATAMIENTO',
        'RIEGO',
        'PODA',
        'COSECHA',
        'LABOREO',
        'ABONADO',
        'OTROS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estadoactividad AS ENUM (
        'PLANIFICADA',
        'EN_CURSO',
        'COMPLETADA', 
        'CANCELADA'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Rename existing columns to match model
ALTER TABLE actividades 
RENAME COLUMN tipo_actividad TO tipo_actividad_old;

ALTER TABLE actividades 
RENAME COLUMN fecha_actividad TO fecha_old;

ALTER TABLE actividades 
RENAME COLUMN propietario_id TO usuario_id;

-- Add new columns that match the SQLAlchemy model
ALTER TABLE actividades 
ADD COLUMN IF NOT EXISTS tipo tipoactividad,
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS organizacion_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS duracion_horas FLOAT,
ADD COLUMN IF NOT EXISTS estado estadoactividad DEFAULT 'PLANIFICADA',
ADD COLUMN IF NOT EXISTS coordenadas GEOMETRY(POINT, 4326),
ADD COLUMN IF NOT EXISTS superficie_afectada FLOAT,
ADD COLUMN IF NOT EXISTS productos JSONB,
ADD COLUMN IF NOT EXISTS maquinaria JSONB,
ADD COLUMN IF NOT EXISTS costo_mano_obra FLOAT,
ADD COLUMN IF NOT EXISTS costo_productos FLOAT,
ADD COLUMN IF NOT EXISTS costo_maquinaria FLOAT,
ADD COLUMN IF NOT EXISTS costo_total FLOAT,
ADD COLUMN IF NOT EXISTS condiciones_meteorologicas JSONB,
ADD COLUMN IF NOT EXISTS documentos_ocr JSONB,
ADD COLUMN IF NOT EXISTS imagenes JSONB,
ADD COLUMN IF NOT EXISTS notas TEXT,
ADD COLUMN IF NOT EXISTS configuracion JSONB;

-- Migrate existing data
UPDATE actividades 
SET 
    tipo = 'OTROS',
    nombre = COALESCE(tipo_actividad_old, 'Actividad'),
    fecha = fecha_old::timestamptz
WHERE tipo IS NULL;

-- Make required fields NOT NULL after data migration
ALTER TABLE actividades 
ALTER COLUMN tipo SET NOT NULL,
ALTER COLUMN nombre SET NOT NULL,
ALTER COLUMN fecha SET NOT NULL;

-- Drop old columns (optional - comment out if you want to keep them)
-- ALTER TABLE actividades 
-- DROP COLUMN tipo_actividad_old,
-- DROP COLUMN fecha_old,
-- DROP COLUMN producto_utilizado,
-- DROP COLUMN cantidad_producto,
-- DROP COLUMN unidad_cantidad,
-- DROP COLUMN costo,
-- DROP COLUMN observaciones,
-- DROP COLUMN activa;

RAISE NOTICE 'Migration completed: updated actividades table schema';