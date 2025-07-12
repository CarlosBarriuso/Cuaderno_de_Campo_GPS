// actividadSchema.ts - Esquema WatermelonDB para actividades
import { tableSchema } from '@nozbe/watermelondb';

export const actividadSchema = tableSchema({
  name: 'actividades',
  columns: [
    // Relación con parcela
    { name: 'parcela_id', type: 'string', isIndexed: true },

    // Información básica
    { name: 'nombre', type: 'string' },
    { name: 'tipo', type: 'string' },
    { name: 'subtipo', type: 'string' },
    { name: 'descripcion', type: 'string' },
    { name: 'fecha_inicio', type: 'number' },
    { name: 'fecha_fin', type: 'number' },
    { name: 'duracion_minutos', type: 'number' },

    // Estado de la actividad
    { name: 'estado', type: 'string' },
    { name: 'progreso', type: 'number' },

    // Ubicación GPS
    { name: 'ubicacion', type: 'string' }, // JSON

    // Productos utilizados
    { name: 'productos', type: 'string' }, // JSON

    // Maquinaria utilizada
    { name: 'maquinaria', type: 'string' }, // JSON

    // Condiciones meteorológicas
    { name: 'condiciones_meteo', type: 'string' }, // JSON

    // Información de costos
    { name: 'costos', type: 'string' }, // JSON

    // Resultados de la actividad
    { name: 'resultados', type: 'string' }, // JSON

    // Documentación
    { name: 'fotos', type: 'string' }, // JSON array
    { name: 'documentos', type: 'string' }, // JSON array

    // Notas y observaciones
    { name: 'notas', type: 'string' },
    { name: 'observaciones', type: 'string' },

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

    // Validaciones y cumplimiento
    { name: 'requiere_plazo_seguridad', type: 'boolean' },
    { name: 'plazo_seguridad_dias', type: 'number' },
    { name: 'cumple_normativa', type: 'boolean' },
    { name: 'alertas_normativas', type: 'string' },
  ],
});