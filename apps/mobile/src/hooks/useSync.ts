// useSync.ts - Hook React para sincronización offline
import { useState, useEffect, useCallback } from 'react';
import syncService, { SyncState, ConnectivityState } from '../services/syncService';
import { SyncMetadata } from '../database/watermelonConfig';

interface SyncProgress {
  phase: 'preparation' | 'pulling' | 'pushing' | 'completion';
  progress: number;
  message: string;
  totalRecords?: number;
  processedRecords?: number;
}

interface SyncStats {
  totalRecords: number;
  syncedRecords: number;
  pendingRecords: number;
  errorRecords: number;
  lastSyncDate: Date | null;
  syncSuccessRate: number;
}

interface UseSyncReturn {
  // Estado actual
  syncState: SyncState;
  connectivityState: ConnectivityState;
  syncInProgress: boolean;
  pendingOperations: number;
  progress?: SyncProgress;
  
  // Metadatos
  metadata: SyncMetadata | null;
  stats: SyncStats | null;
  
  // Acciones
  sync: () => Promise<boolean>;
  forceSync: () => Promise<boolean>;
  startAutoSync: (intervalMinutes?: number) => void;
  stopAutoSync: () => void;
  resetData: () => Promise<void>;
  
  // Estado de loading
  loading: boolean;
  error: string | null;
  
  // Utilidades
  canSync: boolean;
  hasUnsyncedChanges: boolean;
  syncHealthy: boolean;
  
  // Información de conectividad
  isOnline: boolean;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
  
  // Operaciones offline
  addOfflineOperation: (
    type: 'create' | 'update' | 'delete',
    table: string,
    recordId: string,
    data: any
  ) => Promise<void>;
}

export const useSync = (): UseSyncReturn => {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [connectivityState, setConnectivityState] = useState<ConnectivityState>('offline');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  const [progress, setProgress] = useState<SyncProgress | undefined>();
  const [metadata, setMetadata] = useState<SyncMetadata | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar estado inicial
  const loadInitialState = useCallback(async () => {
    try {
      setLoading(true);
      
      const [initialState, initialMetadata, initialStats] = await Promise.all([
        Promise.resolve(syncService.getState()),
        syncService.getSyncMetadata(),
        syncService.getSyncStats(),
      ]);

      setSyncState(initialState.syncState);
      setConnectivityState(initialState.connectivityState);
      setSyncInProgress(initialState.syncInProgress);
      setPendingOperations(initialState.pendingOperations);
      setMetadata(initialMetadata);
      setStats(initialStats);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sync state');
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar estadísticas
  const updateStats = useCallback(async () => {
    try {
      const newStats = await syncService.getSyncStats();
      setStats(newStats);
    } catch (err) {
      console.error('Error updating stats:', err);
    }
  }, []);

  // Suscribirse a cambios de estado de sincronización
  useEffect(() => {
    const unsubscribeSync = syncService.addSyncStateListener((state, progressData) => {
      setSyncState(state);
      setProgress(progressData);
      
      const currentState = syncService.getState();
      setSyncInProgress(currentState.syncInProgress);
      setPendingOperations(currentState.pendingOperations);
      
      // Actualizar estadísticas después de cambios
      if (state === 'success' || state === 'error') {
        updateStats();
        syncService.getSyncMetadata().then(setMetadata);
      }
    });

    return unsubscribeSync;
  }, [updateStats]);

  // Suscribirse a cambios de conectividad
  useEffect(() => {
    const unsubscribeConnectivity = syncService.addConnectivityListener((state) => {
      setConnectivityState(state);
    });

    return unsubscribeConnectivity;
  }, []);

  // Cargar estado inicial al montar
  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);

  // Actualizar estadísticas periódicamente
  useEffect(() => {
    const interval = setInterval(updateStats, 30000); // Cada 30 segundos
    return () => clearInterval(interval);
  }, [updateStats]);

  // Acciones principales
  const sync = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const result = await syncService.autoSync();
      
      if (!result && connectivityState === 'offline') {
        setError('No hay conexión a internet disponible');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante la sincronización';
      setError(errorMessage);
      return false;
    }
  }, [connectivityState]);

  const forceSync = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const result = await syncService.forcSync();
      
      if (!result) {
        setError('La sincronización forzada ha fallado');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error durante la sincronización forzada';
      setError(errorMessage);
      return false;
    }
  }, []);

  const startAutoSync = useCallback((intervalMinutes: number = 15) => {
    syncService.startAutoSync(intervalMinutes);
  }, []);

  const stopAutoSync = useCallback(() => {
    syncService.stopAutoSync();
  }, []);

  const resetData = useCallback(async () => {
    try {
      setError(null);
      await syncService.resetLocalData();
      await loadInitialState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al resetear datos';
      setError(errorMessage);
      throw err;
    }
  }, [loadInitialState]);

  const addOfflineOperation = useCallback(async (
    type: 'create' | 'update' | 'delete',
    table: string,
    recordId: string,
    data: any
  ) => {
    try {
      await syncService.addOfflineOperation(type, table, recordId, data);
      
      // Actualizar estado local
      const newState = syncService.getState();
      setPendingOperations(newState.pendingOperations);
      
    } catch (err) {
      console.error('Error adding offline operation:', err);
      throw err;
    }
  }, []);

  // Estados derivados
  const isOnline = connectivityState !== 'offline';
  const canSync = isOnline && !syncInProgress;
  const hasUnsyncedChanges = pendingOperations > 0 || (stats?.pendingRecords || 0) > 0;
  
  const syncHealthy = (
    (stats?.syncSuccessRate || 0) > 80 && 
    (metadata?.errorCount || 0) < 3 &&
    (metadata?.lastSyncAt ? Date.now() - metadata.lastSyncAt < 24 * 60 * 60 * 1000 : false)
  );

  const connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' = (() => {
    switch (connectivityState) {
      case 'online': return 'excellent';
      case 'poor': return 'poor';
      case 'offline': return 'offline';
      default: return 'offline';
    }
  })();

  return {
    // Estado actual
    syncState,
    connectivityState,
    syncInProgress,
    pendingOperations,
    progress,
    
    // Metadatos
    metadata,
    stats,
    
    // Acciones
    sync,
    forceSync,
    startAutoSync,
    stopAutoSync,
    resetData,
    
    // Estado de loading
    loading,
    error,
    
    // Utilidades
    canSync,
    hasUnsyncedChanges,
    syncHealthy,
    
    // Información de conectividad
    isOnline,
    connectionQuality,
    
    // Operaciones offline
    addOfflineOperation,
  };
};

// Hook simplificado para solo verificar conectividad
export const useConnectivity = () => {
  const { connectivityState, isOnline, connectionQuality } = useSync();
  
  return {
    connectivityState,
    isOnline,
    connectionQuality,
    isOffline: !isOnline,
    hasGoodConnection: connectionQuality === 'excellent' || connectionQuality === 'good',
  };
};

// Hook para estadísticas de sincronización
export const useSyncStats = () => {
  const { stats, metadata, syncHealthy, hasUnsyncedChanges, loading } = useSync();
  
  const getHealthStatus = useCallback((): 'healthy' | 'warning' | 'error' => {
    if (!stats || loading) return 'warning';
    
    if (stats.errorRecords > 0) return 'error';
    if (stats.pendingRecords > 10) return 'warning';
    if (!syncHealthy) return 'warning';
    
    return 'healthy';
  }, [stats, loading, syncHealthy]);

  const getNextSyncRecommendation = useCallback((): string => {
    if (!metadata) return 'Sincronizar ahora';
    
    const timeSinceSync = metadata.lastSyncAt ? Date.now() - metadata.lastSyncAt : 0;
    const hoursAgo = Math.floor(timeSinceSync / (1000 * 60 * 60));
    
    if (hoursAgo > 24) return 'Sincronización urgente recomendada';
    if (hoursAgo > 8) return 'Sincronización recomendada';
    if (hasUnsyncedChanges) return 'Hay cambios pendientes';
    
    return 'Todo sincronizado';
  }, [metadata, hasUnsyncedChanges]);

  return {
    stats,
    metadata,
    healthStatus: getHealthStatus(),
    recommendation: getNextSyncRecommendation(),
    syncHealthy,
    hasUnsyncedChanges,
    loading,
  };
};