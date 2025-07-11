-- Configuración inicial de PostGIS para Cuaderno de Campo GPS

-- Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Verificar que PostGIS está instalado correctamente
SELECT PostGIS_version();

-- Configurar sistema de coordenadas para España
-- EPSG:4326 - WGS84 (usado por GPS)
-- EPSG:25830 - ETRS89 / UTM zone 30N (España peninsular)

-- Insertar sistemas de coordenadas si no existen
INSERT INTO spatial_ref_sys (srid, auth_name, auth_srid, proj4text, srtext) 
VALUES (
  4326, 
  'EPSG', 
  4326, 
  '+proj=longlat +datum=WGS84 +no_defs', 
  'GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.0174532925199433,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]]'
) ON CONFLICT (srid) DO NOTHING;

-- Crear funciones personalizadas para agricultura

-- Función para calcular área en hectáreas
CREATE OR REPLACE FUNCTION calculate_area_hectares(geom geometry)
RETURNS NUMERIC AS $$
BEGIN
  -- Convertir a proyección UTM para España y calcular área
  RETURN ST_Area(ST_Transform(geom, 25830)) / 10000.0;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular centroide
CREATE OR REPLACE FUNCTION calculate_centroid(geom geometry)
RETURNS geometry AS $$
BEGIN
  RETURN ST_Centroid(geom);
END;
$$ LANGUAGE plpgsql;

-- Función para validar geometría de parcela
CREATE OR REPLACE FUNCTION validate_parcela_geometry(geom geometry)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar que es un polígono válido
  IF ST_GeometryType(geom) != 'ST_Polygon' AND ST_GeometryType(geom) != 'ST_MultiPolygon' THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que es una geometría válida
  IF NOT ST_IsValid(geom) THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que el área no es demasiado pequeña (mínimo 100 m²)
  IF ST_Area(ST_Transform(geom, 25830)) < 100 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar que está en España (aproximadamente)
  IF NOT ST_Contains(
    ST_GeomFromText('POLYGON((-10 35, 5 35, 5 44, -10 44, -10 35))', 4326),
    ST_Centroid(geom)
  ) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Función para encontrar parcela por punto GPS
CREATE OR REPLACE FUNCTION find_parcela_by_point(lat NUMERIC, lng NUMERIC)
RETURNS TABLE(parcela_id TEXT, nombre TEXT, distancia NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT,
    p.nombre,
    ST_Distance(
      ST_GeomFromText(p.geometria, 4326),
      ST_Point(lng, lat)
    ) as distancia
  FROM parcelas p
  WHERE ST_Contains(
    ST_GeomFromText(p.geometria, 4326),
    ST_Point(lng, lat)
  )
  ORDER BY distancia ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Crear índices espaciales (se aplicarán después de crear las tablas)
-- Estos comandos se ejecutarán en las migraciones de Prisma

-- Mostrar información de configuración
SELECT 
  'PostGIS configurado correctamente' as status,
  PostGIS_version() as postgis_version,
  version() as postgres_version;