// parcelaSchema.ts - Esquema WatermelonDB para parcelas
import { tableSchema } from '@nozbe/watermelondb';

export const parcelaSchema = tableSchema({
  name: 'parcelas',
  columns: [
    // Campos básicos
    { name: 'nombre', type: 'string' },
    { name: 'descripcion', type: 'string' },
    { name: 'superficie', type: 'number' },
    { name: 'ubicacion', type: 'string' },

    // Geometría GIS
    { name: 'geometria', type: 'string' }, // JSON
    { name: 'latitud', type: 'number' },
    { name: 'longitud', type: 'number' },

    // Información de cultivo
    { name: 'cultivo', type: 'string' }, // JSON

    // Metadatos adicionales
    { name: 'metadatos', type: 'string' }, // JSON

    // Estados de sincronización
    { name: 'sync_status', type: 'string' },
    { name: 'sync_error', type: 'string' },
    { name: 'last_sync_at', type: 'number', isOptional: true },

    // Auditoría
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'created_by', type: 'string' },
    { name: 'updated_by', type: 'string' },

    // Campos offline
    { name: 'offline_created', type: 'boolean' },
    { name: 'offline_updated', type: 'boolean' },
    { name: 'offline_deleted', type: 'boolean' },
  ],
});