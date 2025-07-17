-- Migration script to update parcelas table schema to match SQLAlchemy model
-- Run this to fix the schema mismatch causing 500 errors

-- Create enum type for tipo_cultivo
DO $$ BEGIN
    CREATE TYPE tipocultivo AS ENUM (
        'CEREAL_SECANO',
        'CEREAL_REGADIO', 
        'OLIVAR',
        'VINEDO',
        'FRUTAL',
        'HORTALIZA_AIRE_LIBRE',
        'HORTALIZA_INVERNADERO',
        'LEGUMINOSA',
        'FORRAJE',
        'BARBECHO',
        'OTROS'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to parcelas table
ALTER TABLE parcelas 
ADD COLUMN IF NOT EXISTS tipo_cultivo tipocultivo,
ADD COLUMN IF NOT EXISTS referencia_sigpac VARCHAR(50),
ADD COLUMN IF NOT EXISTS centroide GEOMETRY(POINT, 4326),
ADD COLUMN IF NOT EXISTS organizacion_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS configuracion JSONB;

-- Add unique constraint for referencia_sigpac
DO $$ BEGIN
    ALTER TABLE parcelas ADD CONSTRAINT parcelas_referencia_sigpac_key UNIQUE (referencia_sigpac);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Set default values for existing records
UPDATE parcelas 
SET tipo_cultivo = 'OTROS'
WHERE tipo_cultivo IS NULL;

-- Make tipo_cultivo NOT NULL after setting defaults
ALTER TABLE parcelas ALTER COLUMN tipo_cultivo SET NOT NULL;

RAISE NOTICE 'Migration completed: added missing columns to parcelas table';