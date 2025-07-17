-- Inicialización de la base de datos para Cuaderno de Campo GPS
-- Este archivo se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verificar que las extensiones estén instaladas
SELECT 
    extname as name,
    extversion as installed_version
FROM pg_extension 
WHERE extname IN ('postgis', 'postgis_topology', 'uuid-ossp');

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear tabla de parcelas
CREATE TABLE IF NOT EXISTS parcelas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propietario_id VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    superficie DECIMAL(10,4) NOT NULL,
    cultivo VARCHAR(255) NOT NULL,
    variedad VARCHAR(255),
    fecha_siembra DATE,
    sistema_riego VARCHAR(255),
    tipo_suelo VARCHAR(255),
    pendiente VARCHAR(255),
    orientacion VARCHAR(255),
    referencias_catastrales VARCHAR(255),
    observaciones TEXT,
    geometria GEOMETRY(POLYGON, 4326),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear trigger para updated_at en parcelas
CREATE TRIGGER update_parcelas_updated_at 
    BEFORE UPDATE ON parcelas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear tabla de actividades
CREATE TABLE IF NOT EXISTS actividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
    propietario_id VARCHAR(255) NOT NULL,
    tipo_actividad VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_actividad DATE NOT NULL,
    producto_utilizado VARCHAR(255),
    cantidad_producto DECIMAL(10,4),
    unidad_cantidad VARCHAR(50),
    costo DECIMAL(10,2),
    observaciones TEXT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear trigger para updated_at en actividades
CREATE TRIGGER update_actividades_updated_at 
    BEFORE UPDATE ON actividades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_parcelas_propietario ON parcelas(propietario_id);
CREATE INDEX IF NOT EXISTS idx_parcelas_activa ON parcelas(activa);
CREATE INDEX IF NOT EXISTS idx_actividades_parcela ON actividades(parcela_id);
CREATE INDEX IF NOT EXISTS idx_actividades_propietario ON actividades(propietario_id);
CREATE INDEX IF NOT EXISTS idx_actividades_fecha ON actividades(fecha_actividad);

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos inicializada correctamente para Cuaderno de Campo GPS';
    RAISE NOTICE 'PostGIS version: %', PostGIS_version();
    RAISE NOTICE 'Tablas creadas: parcelas, actividades';
END $$;