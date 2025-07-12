// usuarioSchema.ts - Esquema WatermelonDB para usuarios
import { tableSchema } from '@nozbe/watermelondb';

export const usuarioSchema = tableSchema({
  name: 'usuarios',
  columns: [
    // Información básica
    { name: 'clerk_id', type: 'string', isIndexed: true },
    { name: 'email', type: 'string' },
    { name: 'nombre', type: 'string' },
    { name: 'apellidos', type: 'string' },
    { name: 'telefono', type: 'string', isOptional: true },

    // Información agrícola
    { name: 'tipo_usuario', type: 'string' }, // agricultor, cooperativa, tecnico, etc.
    { name: 'empresa', type: 'string', isOptional: true },
    { name: 'nif_cif', type: 'string', isOptional: true },
    { name: 'direccion', type: 'string', isOptional: true },
    { name: 'municipio', type: 'string', isOptional: true },
    { name: 'provincia', type: 'string', isOptional: true },
    { name: 'codigo_postal', type: 'string', isOptional: true },

    // Preferencias de la aplicación
    { name: 'preferencias', type: 'string' }, // JSON

    // Configuración de notificaciones
    { name: 'notificaciones_push', type: 'boolean' },
    { name: 'notificaciones_email', type: 'boolean' },
    { name: 'notificaciones_sms', type: 'boolean' },

    // Estado de sincronización
    { name: 'sync_status', type: 'string' },
    { name: 'sync_error', type: 'string' },
    { name: 'last_sync_at', type: 'number', isOptional: true },

    // Auditoría
    { name: 'created_at', type: 'number' },
    { name: 'updated_at', type: 'number' },
    { name: 'last_login_at', type: 'number', isOptional: true },

    // Campos offline
    { name: 'offline_created', type: 'boolean' },
    { name: 'offline_updated', type: 'boolean' },
    { name: 'offline_deleted', type: 'boolean' },

    // Estado del usuario
    { name: 'activo', type: 'boolean' },
    { name: 'email_verificado', type: 'boolean' },
    { name: 'onboarding_completado', type: 'boolean' },
  ],
});