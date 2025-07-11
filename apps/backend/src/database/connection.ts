// Re-exportar funciones de database/client.ts para mantener compatibilidad
export { 
  connectDatabase, 
  disconnectDatabase, 
  checkPostGISExtension,
  prisma as default 
} from './client';