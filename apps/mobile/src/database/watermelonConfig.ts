// watermelonConfig.ts - Configuración WatermelonDB para sincronización offline
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';

// Modelos
import Parcela from './models/Parcela';
import Actividad from './models/Actividad';
import Usuario from './models/Usuario';
import SyncOperation from './models/SyncOperation';

// Esquemas
import { parcelaSchema } from './schemas/parcelaSchema';
import { actividadSchema } from './schemas/actividadSchema';
import { usuarioSchema } from './schemas/usuarioSchema';
import { syncOperationSchema } from './schemas/syncOperationSchema';

// Migraciones
import migrations from './migrations';

// Configuración del adaptador SQLite
const adapter = new SQLiteAdapter({
  schema: {
    version: 1,
    tables: [
      parcelaSchema,
      actividadSchema,
      usuarioSchema,
      syncOperationSchema,
    ],
  },
  migrations,
  jsi: Platform.OS === 'ios', // JSI para mejor performance en iOS
  onSetUpError: (error) => {
    console.error('Database setup error:', error);
  },
});

// Configuración de la base de datos
export const database = new Database({
  adapter,
  modelClasses: [
    Parcela,
    Actividad,
    Usuario,
    SyncOperation,
  ],
});

// Configuración de sincronización
export const syncConfig = {
  // URL del servidor de sincronización
  pullURL: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/api/sync/pull`,
  pushURL: `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002'}/api/sync/push`,
  
  // Headers de autenticación
  sendCreatedAsUpdated: true,
  
  // Configuración de conflictos
  conflictResolver: {
    strategy: 'last_write_wins', // 'last_write_wins' | 'manual' | 'server_wins'
    
    // Función personalizada para resolver conflictos
    resolve: (conflict: any) => {
      // Por defecto, el servidor gana en conflictos
      // En una implementación completa, se podría mostrar UI para resolución manual
      return conflict.server;
    },
  },
  
  // Configuración de batch
  batchSize: 50,
  
  // Configuración de retry
  retryConfig: {
    maxAttempts: 3,
    backoffDelay: 1000, // ms
    backoffMultiplier: 2,
  },
  
  // Configuración de logs
  log: {
    enabled: __DEV__,
    level: 'info', // 'debug' | 'info' | 'warn' | 'error'
  },
};

// Tipos para la sincronización
export interface SyncPullResponse {
  changes: {
    parcelas?: {
      created: Array<any>;
      updated: Array<any>;
      deleted: Array<string>;
    };
    actividades?: {
      created: Array<any>;
      updated: Array<any>;
      deleted: Array<string>;
    };
    usuarios?: {
      created: Array<any>;
      updated: Array<any>;
      deleted: Array<string>;
    };
  };
  timestamp: number;
}

export interface SyncPushPayload {
  changes: {
    parcelas?: {
      created: Array<any>;
      updated: Array<any>;
      deleted: Array<{ id: string; _status: string }>;
    };
    actividades?: {
      created: Array<any>;
      updated: Array<any>;
      deleted: Array<{ id: string; _status: string }>;
    };
  };
  lastPulledAt: number | null;
}

export interface SyncMetadata {
  lastSyncAt: number | null;
  lastPullAt: number | null;
  lastPushAt: number | null;
  syncInProgress: boolean;
  pendingOperations: number;
  errorCount: number;
  lastError: string | null;
}

// Estados de conectividad
export type ConnectivityState = 'online' | 'offline' | 'poor';

// Estados de sincronización
export type SyncState = 'idle' | 'pulling' | 'pushing' | 'error' | 'success';

// Configuración de storage local para metadatos
export const STORAGE_KEYS = {
  LAST_SYNC_TIMESTAMP: '@cuaderno_campo/last_sync_timestamp',
  SYNC_METADATA: '@cuaderno_campo/sync_metadata',
  OFFLINE_OPERATIONS: '@cuaderno_campo/offline_operations',
  USER_PREFERENCES: '@cuaderno_campo/user_preferences',
  CACHED_DATA: '@cuaderno_campo/cached_data',
} as const;

// Configuración de caché
export const CACHE_CONFIG = {
  // TTL para diferentes tipos de datos (en ms)
  TTL: {
    weather: 30 * 60 * 1000,        // 30 minutos
    sigpac: 24 * 60 * 60 * 1000,    // 24 horas
    ocr: 60 * 60 * 1000,            // 1 hora
    activities: 5 * 60 * 1000,      // 5 minutos
    parcelas: 10 * 60 * 1000,       // 10 minutos
  },
  
  // Tamaño máximo del caché
  MAX_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Estrategia de limpieza
  CLEANUP_STRATEGY: 'lru', // 'lru' | 'fifo' | 'size_based'
};

// Configuración de notificaciones offline
export const NOTIFICATION_CONFIG = {
  // Mostrar notificaciones cuando se vuelve online
  showOnlineNotification: true,
  
  // Mostrar progreso de sincronización
  showSyncProgress: true,
  
  // Mostrar errores de sincronización
  showSyncErrors: true,
  
  // Auto-dismiss timeout (ms)
  autoDismissTimeout: 5000,
};

export default database;