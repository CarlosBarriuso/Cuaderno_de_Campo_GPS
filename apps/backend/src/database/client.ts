import { PrismaClient } from '@prisma/client';
import { logger } from '@/config/logger';

// Configuración del cliente Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Crear instancia única de Prisma (patrón singleton)
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Configurar logging de Prisma
prisma.$on('query', (e) => {
  logger.debug('Prisma Query', {
    query: e.query,
    params: e.params,
    duration: `${e.duration}ms`,
  });
});

prisma.$on('error', (e) => {
  logger.error('Prisma Error', e);
});

prisma.$on('info', (e) => {
  logger.info('Prisma Info', e);
});

prisma.$on('warn', (e) => {
  logger.warn('Prisma Warning', e);
});

// En desarrollo, mantener la instancia global para evitar múltiples conexiones
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Función para conectar a la base de datos
export async function connectDatabase(): Promise<void> {
  try {
    logger.info('Attempting to connect to database...');
    
    // Verificar conexión
    await prisma.$connect();
    
    logger.info('Database connected successfully');
    
    // Verificar PostGIS
    await checkPostGISExtension();
    
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

// Función para desconectar de la base de datos
export async function disconnectDatabase(): Promise<void> {
  try {
    logger.info('Disconnecting from database...');
    
    await prisma.$disconnect();
    
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
}

// Verificar que PostGIS esté disponible
export async function checkPostGISExtension(): Promise<void> {
  try {
    logger.info('Checking PostGIS extension...');
    
    const result = await prisma.$queryRaw<Array<{ postgis_version: string }>>`
      SELECT PostGIS_version() as postgis_version;
    `;
    
    if (result && result.length > 0) {
      logger.info('PostGIS extension verified', {
        version: result[0].postgis_version,
      });
    } else {
      throw new Error('PostGIS extension not found');
    }
    
  } catch (error) {
    logger.error('PostGIS extension check failed:', error);
    throw new Error('PostGIS extension is required but not available');
  }
}

// Función para ejecutar funciones PostGIS personalizadas
export async function executePostGISFunction(
  functionName: string,
  params: any[] = []
): Promise<any> {
  try {
    // Construir query dinámicamente
    const placeholders = params.map((_, index) => `$${index + 1}`).join(', ');
    const query = `SELECT ${functionName}(${placeholders}) as result`;
    
    const result = await prisma.$queryRawUnsafe(query, ...params);
    
    return result;
  } catch (error) {
    logger.error(`Error executing PostGIS function ${functionName}:`, error);
    throw error;
  }
}

// Función helper para validar geometrías de parcelas
export async function validateParcelaGeometry(geometryWKT: string): Promise<boolean> {
  try {
    const result = await executePostGISFunction('validate_parcela_geometry', [
      `ST_GeomFromText('${geometryWKT}', 4326)`
    ]);
    
    return result && result.length > 0 ? result[0].result : false;
  } catch (error) {
    logger.error('Error validating parcela geometry:', error);
    return false;
  }
}

// Función helper para calcular área en hectáreas
export async function calculateAreaHectares(geometryWKT: string): Promise<number> {
  try {
    const result = await executePostGISFunction('calculate_area_hectares', [
      `ST_GeomFromText('${geometryWKT}', 4326)`
    ]);
    
    return result && result.length > 0 ? parseFloat(result[0].result) : 0;
  } catch (error) {
    logger.error('Error calculating area:', error);
    return 0;
  }
}

// Función helper para encontrar parcela por coordenadas GPS
export async function findParcelaByPoint(lat: number, lng: number): Promise<any> {
  try {
    const result = await executePostGISFunction('find_parcela_by_point', [lat, lng]);
    
    return result && result.length > 0 ? result[0] : null;
  } catch (error) {
    logger.error('Error finding parcela by point:', error);
    return null;
  }
}

export default prisma;