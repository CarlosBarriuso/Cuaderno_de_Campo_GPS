// syncService.ts - Servicio de sincronización offline
import { synchronize } from '@nozbe/watermelondb/sync';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database, syncConfig, SyncMetadata, STORAGE_KEYS } from '../database/watermelonConfig';
import { useAuth } from '@clerk/clerk-expo';

export type SyncState = 'idle' | 'pulling' | 'pushing' | 'error' | 'success';
export type ConnectivityState = 'online' | 'offline' | 'poor';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  recordId: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

interface SyncProgress {
  phase: 'preparation' | 'pulling' | 'pushing' | 'completion';
  progress: number; // 0-100
  message: string;
  totalRecords?: number;
  processedRecords?: number;
}

class SyncService {
  private syncState: SyncState = 'idle';
  private connectivityState: ConnectivityState = 'offline';
  private syncInProgress = false;
  private listeners: Array<(state: SyncState, progress?: SyncProgress) => void> = [];
  private connectivityListeners: Array<(state: ConnectivityState) => void> = [];
  private pendingOperations: SyncOperation[] = [];
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeConnectivityMonitoring();
    this.loadPendingOperations();
  }

  /**
   * Inicializa el monitoreo de conectividad
   */
  private initializeConnectivityMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOffline = this.connectivityState === 'offline';
      
      if (state.isConnected) {
        if (state.type === 'wifi' || (state.type === 'cellular' && state.details.cellularGeneration === '4g')) {
          this.connectivityState = 'online';
        } else {
          this.connectivityState = 'poor';
        }
      } else {
        this.connectivityState = 'offline';
      }

      // Notificar cambio de conectividad
      this.notifyConnectivityListeners();

      // Auto-sync cuando vuelve la conectividad
      if (wasOffline && this.connectivityState === 'online') {
        this.autoSync();
      }
    });
  }

  /**
   * Carga operaciones pendientes desde el almacenamiento local
   */
  private async loadPendingOperations() {
    try {
      const storedOperations = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_OPERATIONS);
      if (storedOperations) {
        this.pendingOperations = JSON.parse(storedOperations);
      }
    } catch (error) {
      console.error('Error loading pending operations:', error);
    }
  }

  /**
   * Guarda operaciones pendientes en el almacenamiento local
   */
  private async savePendingOperations() {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_OPERATIONS,
        JSON.stringify(this.pendingOperations)
      );
    } catch (error) {
      console.error('Error saving pending operations:', error);
    }
  }

  /**
   * Obtiene el token de autenticación
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // En un hook real de React, esto se haría diferente
      // Aquí es una implementación simplificada
      const { getToken } = useAuth();
      return await getToken();
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Realiza sincronización completa
   */
  async fullSync(): Promise<boolean> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return false;
    }

    if (this.connectivityState === 'offline') {
      console.log('No connectivity available for sync');
      return false;
    }

    this.syncInProgress = true;
    this.syncState = 'pulling';
    this.notifyListeners();

    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
          this.notifyProgress({
            phase: 'pulling',
            progress: 10,
            message: 'Descargando cambios del servidor...'
          });

          const response = await fetch(syncConfig.pullURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              lastPulledAt,
              schemaVersion,
              migration,
            }),
          });

          if (!response.ok) {
            throw new Error(`Pull failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          
          this.notifyProgress({
            phase: 'pulling',
            progress: 80,
            message: 'Aplicando cambios localmente...'
          });

          return data;
        },

        pushChanges: async ({ changes, lastPulledAt }) => {
          this.syncState = 'pushing';
          this.notifyListeners();

          this.notifyProgress({
            phase: 'pushing',
            progress: 10,
            message: 'Enviando cambios al servidor...'
          });

          const response = await fetch(syncConfig.pushURL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              changes,
              lastPulledAt,
            }),
          });

          if (!response.ok) {
            throw new Error(`Push failed: ${response.status} ${response.statusText}`);
          }

          this.notifyProgress({
            phase: 'pushing',
            progress: 80,
            message: 'Confirmando cambios...'
          });

          // Limpiar operaciones pendientes exitosas
          await this.clearSyncedOperations();
        },

        sendCreatedAsUpdated: syncConfig.sendCreatedAsUpdated,
        
        log: syncConfig.log.enabled ? console.log : undefined,
      });

      // Actualizar metadatos de sincronización
      await this.updateSyncMetadata({
        lastSyncAt: Date.now(),
        lastPullAt: Date.now(),
        lastPushAt: Date.now(),
        syncInProgress: false,
        pendingOperations: this.pendingOperations.length,
        errorCount: 0,
        lastError: null,
      });

      this.syncState = 'success';
      this.notifyProgress({
        phase: 'completion',
        progress: 100,
        message: 'Sincronización completada'
      });

      return true;

    } catch (error) {
      console.error('Sync error:', error);
      
      this.syncState = 'error';
      await this.updateSyncMetadata({
        lastSyncAt: Date.now(),
        syncInProgress: false,
        errorCount: (await this.getSyncMetadata()).errorCount + 1,
        lastError: error.message,
      });

      this.notifyProgress({
        phase: 'completion',
        progress: 0,
        message: `Error: ${error.message}`
      });

      return false;
    } finally {
      this.syncInProgress = false;
      setTimeout(() => {
        this.syncState = 'idle';
        this.notifyListeners();
      }, 2000);
    }
  }

  /**
   * Sincronización automática inteligente
   */
  async autoSync(): Promise<boolean> {
    if (this.connectivityState !== 'online') {
      return false;
    }

    const metadata = await this.getSyncMetadata();
    const timeSinceLastSync = Date.now() - (metadata.lastSyncAt || 0);
    const minSyncInterval = 5 * 60 * 1000; // 5 minutos

    // Solo hacer auto-sync si ha pasado suficiente tiempo
    if (timeSinceLastSync < minSyncInterval) {
      return false;
    }

    // Solo hacer auto-sync si hay operaciones pendientes
    if (this.pendingOperations.length === 0) {
      const unsyncedRecords = await this.getUnsyncedRecordsCount();
      if (unsyncedRecords === 0) {
        return false;
      }
    }

    console.log('Performing auto-sync...');
    return await this.fullSync();
  }

  /**
   * Agrega una operación offline a la cola
   */
  async addOfflineOperation(
    type: 'create' | 'update' | 'delete',
    table: string,
    recordId: string,
    data: any
  ) {
    const operation: SyncOperation = {
      id: this.generateOperationId(),
      type,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.pendingOperations.push(operation);
    await this.savePendingOperations();

    // Intentar sincronización inmediata si hay conectividad
    if (this.connectivityState === 'online') {
      setTimeout(() => this.autoSync(), 1000);
    }
  }

  /**
   * Obtiene el número de registros sin sincronizar
   */
  async getUnsyncedRecordsCount(): Promise<number> {
    try {
      const parcelas = await database.get('parcelas').query().fetch();
      const actividades = await database.get('actividades').query().fetch();
      
      const unsyncedParcelas = parcelas.filter(p => p.syncStatus !== 'synced').length;
      const unsyncedActividades = actividades.filter(a => a.syncStatus !== 'synced').length;
      
      return unsyncedParcelas + unsyncedActividades + this.pendingOperations.length;
    } catch (error) {
      console.error('Error counting unsynced records:', error);
      return 0;
    }
  }

  /**
   * Limpia operaciones sincronizadas exitosamente
   */
  private async clearSyncedOperations() {
    // En una implementación real, esto se basaría en la respuesta del servidor
    this.pendingOperations = [];
    await this.savePendingOperations();
  }

  /**
   * Inicia sincronización automática periódica
   */
  startAutoSync(intervalMinutes: number = 15) {
    this.stopAutoSync();
    
    this.autoSyncInterval = setInterval(async () => {
      if (this.connectivityState === 'online' && !this.syncInProgress) {
        await this.autoSync();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Detiene sincronización automática
   */
  stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  /**
   * Fuerza sincronización manual
   */
  async forcSync(): Promise<boolean> {
    return await this.fullSync();
  }

  /**
   * Obtiene metadatos de sincronización
   */
  async getSyncMetadata(): Promise<SyncMetadata> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_METADATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading sync metadata:', error);
    }

    return {
      lastSyncAt: null,
      lastPullAt: null,
      lastPushAt: null,
      syncInProgress: false,
      pendingOperations: 0,
      errorCount: 0,
      lastError: null,
    };
  }

  /**
   * Actualiza metadatos de sincronización
   */
  async updateSyncMetadata(updates: Partial<SyncMetadata>) {
    try {
      const current = await this.getSyncMetadata();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_METADATA, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating sync metadata:', error);
    }
  }

  /**
   * Obtiene estado actual
   */
  getState(): {
    syncState: SyncState;
    connectivityState: ConnectivityState;
    syncInProgress: boolean;
    pendingOperations: number;
  } {
    return {
      syncState: this.syncState,
      connectivityState: this.connectivityState,
      syncInProgress: this.syncInProgress,
      pendingOperations: this.pendingOperations.length,
    };
  }

  /**
   * Suscribirse a cambios de estado de sincronización
   */
  addSyncStateListener(listener: (state: SyncState, progress?: SyncProgress) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Suscribirse a cambios de conectividad
   */
  addConnectivityListener(listener: (state: ConnectivityState) => void) {
    this.connectivityListeners.push(listener);
    return () => {
      this.connectivityListeners = this.connectivityListeners.filter(l => l !== listener);
    };
  }

  /**
   * Limpia todos los datos locales (reset completo)
   */
  async resetLocalData() {
    if (this.syncInProgress) {
      throw new Error('Cannot reset data while sync is in progress');
    }

    await database.write(async () => {
      await database.unsafeResetDatabase();
    });

    // Limpiar almacenamiento local
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.SYNC_METADATA,
      STORAGE_KEYS.OFFLINE_OPERATIONS,
      STORAGE_KEYS.CACHED_DATA,
    ]);

    this.pendingOperations = [];
    await this.updateSyncMetadata({
      lastSyncAt: null,
      lastPullAt: null,
      lastPushAt: null,
      syncInProgress: false,
      pendingOperations: 0,
      errorCount: 0,
      lastError: null,
    });
  }

  // Métodos privados de utilidad

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.syncState));
  }

  private notifyProgress(progress: SyncProgress) {
    this.listeners.forEach(listener => listener(this.syncState, progress));
  }

  private notifyConnectivityListeners() {
    this.connectivityListeners.forEach(listener => listener(this.connectivityState));
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtiene estadísticas de sincronización
   */
  async getSyncStats(): Promise<{
    totalRecords: number;
    syncedRecords: number;
    pendingRecords: number;
    errorRecords: number;
    lastSyncDate: Date | null;
    syncSuccessRate: number;
  }> {
    try {
      const parcelas = await database.get('parcelas').query().fetch();
      const actividades = await database.get('actividades').query().fetch();
      const allRecords = [...parcelas, ...actividades];

      const totalRecords = allRecords.length;
      const syncedRecords = allRecords.filter(r => r.syncStatus === 'synced').length;
      const pendingRecords = allRecords.filter(r => r.syncStatus === 'pending').length;
      const errorRecords = allRecords.filter(r => r.syncStatus === 'error').length;

      const metadata = await this.getSyncMetadata();
      const lastSyncDate = metadata.lastSyncAt ? new Date(metadata.lastSyncAt) : null;
      
      const syncSuccessRate = totalRecords > 0 ? (syncedRecords / totalRecords) * 100 : 100;

      return {
        totalRecords,
        syncedRecords,
        pendingRecords,
        errorRecords,
        lastSyncDate,
        syncSuccessRate,
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        totalRecords: 0,
        syncedRecords: 0,
        pendingRecords: 0,
        errorRecords: 0,
        lastSyncDate: null,
        syncSuccessRate: 0,
      };
    }
  }
}

// Singleton instance
export const syncService = new SyncService();
export default syncService;