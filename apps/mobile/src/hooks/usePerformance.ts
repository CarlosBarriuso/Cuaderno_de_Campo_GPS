import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { 
  performanceMonitor, 
  DatabaseOptimizer, 
  NetworkOptimizer, 
  StorageOptimizer,
  PERFORMANCE_THRESHOLDS 
} from '../utils/performance';

interface PerformanceStats {
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  networkQueue: {
    pending: number;
    active: number;
  };
  databaseCache: {
    size: number;
    hitRate: number;
  };
  storageUsage: {
    totalKeys: number;
    estimatedSize: number;
  };
  lastUpdated: Date;
}

export const usePerformance = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update performance statistics
  const updateStats = useCallback(async () => {
    try {
      const memoryInfo = performanceMonitor.getMemoryUsage();
      const networkStats = NetworkOptimizer.getQueueStats();
      const cacheStats = DatabaseOptimizer.getCacheStats();
      const storageStats = await StorageOptimizer.getStorageStats();

      const newStats: PerformanceStats = {
        memoryUsage: {
          total: memoryInfo.totalMemory,
          free: memoryInfo.freeMemory,
          used: memoryInfo.usedMemory,
          percentage: (memoryInfo.usedMemory / memoryInfo.totalMemory) * 100
        },
        networkQueue: networkStats,
        databaseCache: cacheStats,
        storageUsage: storageStats,
        lastUpdated: new Date()
      };

      setStats(newStats);

      // Check for performance alerts
      const newAlerts: string[] = [];
      
      if (newStats.memoryUsage.percentage > PERFORMANCE_THRESHOLDS.HIGH_MEMORY_USAGE) {
        newAlerts.push(`Uso de memoria alto: ${newStats.memoryUsage.percentage.toFixed(1)}%`);
      }
      
      if (newStats.networkQueue.pending > PERFORMANCE_THRESHOLDS.MAX_QUEUE_SIZE) {
        newAlerts.push(`Cola de red sobrecargada: ${newStats.networkQueue.pending} requests pendientes`);
      }
      
      if (newStats.storageUsage.estimatedSize > 10240) { // 10MB
        newAlerts.push(`Almacenamiento elevado: ${(newStats.storageUsage.estimatedSize / 1024).toFixed(1)}MB`);
      }

      setAlerts(newAlerts);

    } catch (error) {
      console.error('Error updating performance stats:', error);
    }
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    updateStats(); // Initial update

    // Update stats every 30 seconds
    intervalRef.current = setInterval(updateStats, 30000);

    // Monitor app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        updateStats();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [isMonitoring, updateStats]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isMonitoring]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  // Performance optimization actions
  const optimizePerformance = useCallback(async () => {
    try {
      // Clear expired database cache
      DatabaseOptimizer.clearExpiredCache();
      
      // Cleanup old storage data
      await StorageOptimizer.cleanupOldData();
      
      // Clear performance metrics
      performanceMonitor.clearMetrics();
      
      // Update stats after optimization
      await updateStats();
      
      return true;
    } catch (error) {
      console.error('Error optimizing performance:', error);
      return false;
    }
  }, [updateStats]);

  // Force garbage collection (if available)
  const forceGarbageCollection = useCallback(() => {
    // In development, we might have access to global.gc()
    if (typeof (global as any).gc === 'function') {
      (global as any).gc();
      updateStats();
      return true;
    }
    return false;
  }, [updateStats]);

  // Get performance recommendations
  const getRecommendations = useCallback((): string[] => {
    if (!stats) return [];

    const recommendations: string[] = [];

    if (stats.memoryUsage.percentage > 70) {
      recommendations.push('Considere cerrar funcionalidades no utilizadas para liberar memoria');
    }

    if (stats.networkQueue.pending > 20) {
      recommendations.push('Conexión lenta detectada. Algunas operaciones se completarán cuando mejore la conectividad');
    }

    if (stats.storageUsage.estimatedSize > 5120) { // 5MB
      recommendations.push('Considere limpiar datos antiguos para optimizar el almacenamiento');
    }

    if (stats.databaseCache.size > 100) {
      recommendations.push('Cache de base de datos grande. Se limpiará automáticamente');
    }

    return recommendations;
  }, [stats]);

  return {
    stats,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    updateStats,
    optimizePerformance,
    forceGarbageCollection,
    getRecommendations
  };
};

// Hook for measuring operation performance
export const useOperationPerformance = (operationName: string) => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [averageDuration, setAverageDuration] = useState<number | null>(null);
  const durationsRef = useRef<number[]>([]);

  const startOperation = useCallback((metadata?: any) => {
    if (isRunning) return;
    
    setIsRunning(true);
    performanceMonitor.startMeasure(operationName, metadata);
  }, [operationName, isRunning]);

  const endOperation = useCallback(() => {
    if (!isRunning) return null;
    
    const duration = performanceMonitor.endMeasure(operationName);
    if (duration !== null) {
      setLastDuration(duration);
      
      // Update running average
      durationsRef.current.push(duration);
      if (durationsRef.current.length > 10) {
        durationsRef.current.shift(); // Keep only last 10 measurements
      }
      
      const avg = durationsRef.current.reduce((sum, d) => sum + d, 0) / durationsRef.current.length;
      setAverageDuration(Math.round(avg));
    }
    
    setIsRunning(false);
    return duration;
  }, [operationName, isRunning]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setLastDuration(null);
    setAverageDuration(null);
    durationsRef.current = [];
  }, []);

  return {
    isRunning,
    lastDuration,
    averageDuration,
    startOperation,
    endOperation,
    reset,
    isSlow: lastDuration !== null && lastDuration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION
  };
};

// Hook for monitoring component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderCountRef = useRef(0);
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState<number | null>(null);

  useEffect(() => {
    const start = Date.now();
    renderCountRef.current++;
    setRenderCount(renderCountRef.current);

    return () => {
      const duration = Date.now() - start;
      setLastRenderTime(duration);
      
      if (duration > PERFORMANCE_THRESHOLDS.SLOW_OPERATION) {
        console.warn(`Slow render detected in ${componentName}: ${duration}ms`);
      }
    };
  });

  const resetRenderCount = useCallback(() => {
    renderCountRef.current = 0;
    setRenderCount(0);
    setLastRenderTime(null);
  }, []);

  return {
    renderCount,
    lastRenderTime,
    resetRenderCount,
    isSlowRender: lastRenderTime !== null && lastRenderTime > 100 // 100ms threshold for renders
  };
};

// Hook for network request optimization
export const useOptimizedRequest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeRequest = useCallback(async <T>(
    requestFn: () => Promise<T>,
    options?: {
      cache?: boolean;
      cacheKey?: string;
      cacheTTL?: number;
    }
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first if enabled
      if (options?.cache && options?.cacheKey) {
        const cached = DatabaseOptimizer.getCachedQuery(options.cacheKey);
        if (cached) {
          setIsLoading(false);
          return cached;
        }
      }

      // Queue the request to respect network optimization
      const result = await NetworkOptimizer.queueRequest(requestFn);

      // Cache the result if requested
      if (options?.cache && options?.cacheKey) {
        DatabaseOptimizer.cacheQuery(
          options.cacheKey,
          result,
          options.cacheTTL || PERFORMANCE_THRESHOLDS.CACHE_TTL_DEFAULT
        );
      }

      setIsLoading(false);
      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    executeRequest
  };
};