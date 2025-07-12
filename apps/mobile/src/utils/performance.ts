import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: any;
}

interface MemoryInfo {
  totalMemory: number;
  freeMemory: number;
  usedMemory: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private memorySnapshots: MemoryInfo[] = [];
  private isMonitoring = false;

  // Start performance measurement
  startMeasure(name: string, metadata?: any): void {
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata
    };
    this.metrics.set(name, metric);
  }

  // End performance measurement
  endMeasure(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;

    const endTime = Date.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration}ms`);
    }

    return duration;
  }

  // Get performance metrics
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
  }

  // Get memory usage (mock for React Native)
  getMemoryUsage(): MemoryInfo {
    // In real implementation, would use native modules to get actual memory
    const mockMemory: MemoryInfo = {
      totalMemory: Platform.OS === 'ios' ? 2048 : 1536, // MB
      freeMemory: Platform.OS === 'ios' ? 1024 : 768,   // MB
      usedMemory: Platform.OS === 'ios' ? 1024 : 768,   // MB
      timestamp: Date.now()
    };
    
    this.memorySnapshots.push(mockMemory);
    
    // Keep only last 10 snapshots
    if (this.memorySnapshots.length > 10) {
      this.memorySnapshots.shift();
    }
    
    return mockMemory;
  }

  // Check if memory usage is concerning
  isMemoryUsageConcerning(): boolean {
    const current = this.getMemoryUsage();
    const usagePercentage = (current.usedMemory / current.totalMemory) * 100;
    return usagePercentage > 80; // Alert if using more than 80% memory
  }

  // Start continuous monitoring
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    const monitor = setInterval(() => {
      this.getMemoryUsage();
      
      if (this.isMemoryUsageConcerning()) {
        console.warn('High memory usage detected');
        // Could trigger cleanup operations here
      }
    }, intervalMs);

    // Store interval ID for cleanup
    (this as any).monitorInterval = monitor;
  }

  // Stop monitoring
  stopMonitoring(): void {
    if ((this as any).monitorInterval) {
      clearInterval((this as any).monitorInterval);
      (this as any).monitorInterval = null;
    }
    this.isMonitoring = false;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Database performance optimization
export class DatabaseOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  // Cache database queries
  static cacheQuery(key: string, data: any, ttlSeconds: number = 300): void {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  // Get cached query result
  static getCachedQuery(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear expired cache entries
  static clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.queryCache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.queryCache.delete(key);
      }
    }
  }

  // Get cache statistics
  static getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.queryCache.size,
      hitRate: 0 // Would need to implement hit tracking
    };
  }
}

// Image optimization utilities
export class ImageOptimizer {
  
  // Compress image for sync
  static async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    // Mock implementation - in real app would use react-native-image-resizer
    performanceMonitor.startMeasure('image_compression');
    
    // Simulate compression delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    performanceMonitor.endMeasure('image_compression');
    
    return uri; // Return compressed URI
  }

  // Get optimal image size for device
  static getOptimalImageSize(): { width: number; height: number } {
    const { width, height } = Platform.select({
      ios: { width: 1024, height: 768 },
      android: { width: 800, height: 600 },
      default: { width: 800, height: 600 }
    });

    return { width, height };
  }

  // Check if image needs compression
  static needsCompression(fileSize: number): boolean {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    return fileSize > MAX_SIZE;
  }
}

// Network optimization
export class NetworkOptimizer {
  private static requestQueue: Array<() => Promise<any>> = [];
  private static isProcessing = false;
  private static maxConcurrent = 3;
  private static activeRequests = 0;

  // Add request to queue
  static queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  // Process request queue with concurrency limit
  private static async processQueue(): Promise<void> {
    if (this.isProcessing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.requestQueue.shift();
      if (request) {
        this.activeRequests++;
        request().finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
      }
    }

    this.isProcessing = false;
  }

  // Get queue statistics
  static getQueueStats(): { pending: number; active: number } {
    return {
      pending: this.requestQueue.length,
      active: this.activeRequests
    };
  }
}

// Storage optimization
export class StorageOptimizer {
  private static readonly STORAGE_KEYS = {
    PERFORMANCE_METRICS: 'performance_metrics',
    CACHE_CLEANUP_DATE: 'cache_cleanup_date',
    APP_USAGE_STATS: 'app_usage_stats'
  };

  // Store performance metrics to local storage
  static async storeMetrics(metrics: PerformanceMetric[]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.PERFORMANCE_METRICS,
        JSON.stringify(metrics)
      );
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
    }
  }

  // Get stored performance metrics
  static async getStoredMetrics(): Promise<PerformanceMetric[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEYS.PERFORMANCE_METRICS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored metrics:', error);
      return [];
    }
  }

  // Clean up old data
  static async cleanupOldData(): Promise<void> {
    try {
      const lastCleanup = await AsyncStorage.getItem(this.STORAGE_KEYS.CACHE_CLEANUP_DATE);
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);

      if (!lastCleanup || parseInt(lastCleanup) < oneDayAgo) {
        // Clear expired cache
        DatabaseOptimizer.clearExpiredCache();
        
        // Update cleanup date
        await AsyncStorage.setItem(
          this.STORAGE_KEYS.CACHE_CLEANUP_DATE,
          now.toString()
        );
        
        console.log('Storage cleanup completed');
      }
    } catch (error) {
      console.error('Failed to cleanup old data:', error);
    }
  }

  // Get storage usage statistics
  static async getStorageStats(): Promise<{ totalKeys: number; estimatedSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let estimatedSize = 0;

      // Estimate storage size (rough calculation)
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          estimatedSize += value.length * 2; // Rough estimate (UTF-16)
        }
      }

      return {
        totalKeys: keys.length,
        estimatedSize: Math.round(estimatedSize / 1024) // KB
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { totalKeys: 0, estimatedSize: 0 };
    }
  }
}

// Performance utilities for React components
export const withPerformanceMonitor = (componentName: string) => {
  return <P extends object>(Component: React.ComponentType<P>) => {
    return (props: P) => {
      React.useEffect(() => {
        performanceMonitor.startMeasure(`component_${componentName}_mount`);
        
        return () => {
          performanceMonitor.endMeasure(`component_${componentName}_mount`);
        };
      }, []);

      return React.createElement(Component, props);
    };
  };
};

// Hook for performance monitoring
export const usePerformanceMonitor = (operationName: string) => {
  const startMeasure = React.useCallback((metadata?: any) => {
    performanceMonitor.startMeasure(operationName, metadata);
  }, [operationName]);

  const endMeasure = React.useCallback(() => {
    return performanceMonitor.endMeasure(operationName);
  }, [operationName]);

  return { startMeasure, endMeasure };
};

// Export performance monitor instance
export { performanceMonitor };

// Performance constants
export const PERFORMANCE_THRESHOLDS = {
  SLOW_OPERATION: 1000,    // 1 second
  VERY_SLOW_OPERATION: 3000, // 3 seconds
  HIGH_MEMORY_USAGE: 80,   // 80% of total memory
  MAX_QUEUE_SIZE: 50,      // Maximum number of queued requests
  CACHE_TTL_DEFAULT: 300,  // 5 minutes
  CACHE_TTL_LONG: 3600,    // 1 hour
  COMPRESSION_THRESHOLD: 2048 // 2KB
};

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  // Start monitoring
  performanceMonitor.startMonitoring();
  
  // Schedule cleanup
  StorageOptimizer.cleanupOldData();
  
  console.log('Performance monitoring initialized');
};