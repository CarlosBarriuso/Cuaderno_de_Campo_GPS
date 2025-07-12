// syncOperationSchema.ts - Esquema para operaciones de sincronización
import { tableSchema } from '@nozbe/watermelondb';

export const syncOperationSchema = tableSchema({
  name: 'sync_operations',
  columns: [
    // Información de la operación
    { name: 'operation_id', type: 'string', isIndexed: true },
    { name: 'operation_type', type: 'string' }, // create, update, delete
    { name: 'table_name', type: 'string' },
    { name: 'record_id', type: 'string' },
    
    // Datos de la operación
    { name: 'data', type: 'string' }, // JSON con los datos
    { name: 'previous_data', type: 'string', isOptional: true }, // JSON con datos anteriores para rollback
    
    // Estado de la operación
    { name: 'status', type: 'string' }, // pending, synced, error, conflict
    { name: 'error_message', type: 'string', isOptional: true },
    { name: 'retry_count', type: 'number' },
    { name: 'max_retries', type: 'number' },
    
    // Timestamps
    { name: 'created_at', type: 'number' },
    { name: 'last_attempt_at', type: 'number', isOptional: true },
    { name: 'synced_at', type: 'number', isOptional: true },
    
    // Metadatos de sincronización
    { name: 'sync_batch_id', type: 'string', isOptional: true },
    { name: 'conflict_resolution', type: 'string', isOptional: true }, // server_wins, client_wins, manual
    { name: 'server_timestamp', type: 'number', isOptional: true },
    
    // Información del usuario
    { name: 'user_id', type: 'string' },
    { name: 'device_id', type: 'string' },
    
    // Prioridad y dependencias
    { name: 'priority', type: 'number' }, // 1-10, mayor número = mayor prioridad
    { name: 'depends_on', type: 'string', isOptional: true }, // JSON array de operation_ids
    
    // Flags de control
    { name: 'requires_online', type: 'boolean' },
    { name: 'can_rollback', type: 'boolean' },
    { name: 'auto_retry', type: 'boolean' },
  ],
});