import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  memoryUsage: number;
  timestamp: Date;
  status: number;
}

// In-memory store for performance metrics (in production, use Redis)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_STORED = 1000;

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const endMemory = process.memoryUsage().heapUsed;
    const memoryDelta = endMemory - startMemory;

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`);
    }

    // Store metrics
    const metric: PerformanceMetrics = {
      endpoint: req.path,
      method: req.method,
      responseTime,
      memoryUsage: memoryDelta,
      timestamp: new Date(),
      status: res.statusCode
    };

    // Add to metrics store
    performanceMetrics.push(metric);
    
    // Keep only last MAX_METRICS_STORED entries
    if (performanceMetrics.length > MAX_METRICS_STORED) {
      performanceMetrics.shift();
    }

    // Set performance headers
    res.setHeader('X-Response-Time', `${responseTime}ms`);
    res.setHeader('X-Memory-Delta', `${Math.round(memoryDelta / 1024)}KB`);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Cache middleware for GET requests
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const cacheMiddleware = (ttlSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = `${req.path}?${new URLSearchParams(req.query as any).toString()}`;
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl * 1000) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-TTL', `${Math.round((cached.ttl * 1000 - (Date.now() - cached.timestamp)) / 1000)}s`);
      return res.json(cached.data);
    }

    // Override res.json to cache response
    const originalJson = res.json;
    res.json = function(data: any) {
      // Cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: ttlSeconds
        });
      }
      
      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, data);
    };

    next();
  };
};

// Compression middleware for large responses
export const compressionOptimizer = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // For large responses, add compression hint
    const dataSize = JSON.stringify(data).length;
    
    if (dataSize > 10000) { // 10KB threshold
      res.setHeader('X-Large-Response', 'true');
      res.setHeader('Content-Encoding', 'gzip');
    }
    
    res.setHeader('X-Response-Size', `${Math.round(dataSize / 1024)}KB`);
    return originalJson.call(this, data);
  };

  next();
};

// Rate limiting with performance consideration
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const performanceAwareRateLimit = (maxRequests: number = 100, windowMs: number = 60000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < windowStart) {
        rateLimitStore.delete(key);
      }
    }
    
    const client = rateLimitStore.get(clientId) || { count: 0, resetTime: now + windowMs };
    
    if (client.count >= maxRequests && client.resetTime > now) {
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(client.resetTime).toISOString());
      
      return res.status(429).json({
        error: 'Demasiadas solicitudes. Intente más tarde.',
        retryAfter: Math.ceil((client.resetTime - now) / 1000)
      });
    }
    
    client.count++;
    rateLimitStore.set(clientId, client);
    
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - client.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(client.resetTime).toISOString());
    
    next();
  };
};

// Database query optimization helper
export const optimizeQuery = (query: any, options: {
  limit?: number;
  offset?: number;
  select?: string[];
  include?: any;
}) => {
  const optimized = { ...query };
  
  // Apply limit for large datasets
  if (options.limit) {
    optimized.take = Math.min(options.limit, 100); // Max 100 items per request
  }
  
  // Apply offset for pagination
  if (options.offset) {
    optimized.skip = options.offset;
  }
  
  // Select only needed fields
  if (options.select && options.select.length > 0) {
    optimized.select = options.select.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as any);
  }
  
  // Optimize includes
  if (options.include) {
    optimized.include = options.include;
  }
  
  return optimized;
};

// Memory monitoring
export const memoryMonitor = () => {
  const usage = process.memoryUsage();
  const formatBytes = (bytes: number) => Math.round(bytes / 1024 / 1024);
  
  return {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external),
    timestamp: new Date().toISOString()
  };
};

// Get performance metrics
export const getPerformanceMetrics = () => {
  const now = Date.now();
  const last5Minutes = performanceMetrics.filter(
    m => now - m.timestamp.getTime() < 5 * 60 * 1000
  );
  
  if (last5Minutes.length === 0) {
    return {
      averageResponseTime: 0,
      slowestEndpoint: null,
      requestCount: 0,
      errorRate: 0,
      memoryUsage: memoryMonitor()
    };
  }
  
  const averageResponseTime = last5Minutes.reduce((sum, m) => sum + m.responseTime, 0) / last5Minutes.length;
  const errorCount = last5Minutes.filter(m => m.status >= 400).length;
  const errorRate = (errorCount / last5Minutes.length) * 100;
  
  // Find slowest endpoint
  const slowest = last5Minutes.reduce((prev, current) => 
    prev.responseTime > current.responseTime ? prev : current
  );
  
  // Group by endpoint for insights
  const endpointStats = last5Minutes.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = { count: 0, totalTime: 0, errors: 0 };
    }
    acc[key].count++;
    acc[key].totalTime += metric.responseTime;
    if (metric.status >= 400) acc[key].errors++;
    return acc;
  }, {} as any);
  
  return {
    averageResponseTime: Math.round(averageResponseTime),
    slowestEndpoint: {
      endpoint: `${slowest.method} ${slowest.endpoint}`,
      responseTime: slowest.responseTime,
      status: slowest.status
    },
    requestCount: last5Minutes.length,
    errorRate: Math.round(errorRate * 100) / 100,
    endpointStats: Object.entries(endpointStats).map(([endpoint, stats]: [string, any]) => ({
      endpoint,
      count: stats.count,
      averageTime: Math.round(stats.totalTime / stats.count),
      errorRate: Math.round((stats.errors / stats.count) * 10000) / 100
    })).sort((a, b) => b.averageTime - a.averageTime),
    memoryUsage: memoryMonitor()
  };
};

// Clear cache manually
export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return { cleared: 'all', count: cache.size };
  }
  
  const regex = new RegExp(pattern);
  let cleared = 0;
  
  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      cleared++;
    }
  }
  
  return { cleared: pattern, count: cleared };
};