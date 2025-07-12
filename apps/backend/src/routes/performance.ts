import { Router } from 'express';
import { getPerformanceMetrics, clearCache, memoryMonitor } from '../middleware/performance';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Get performance metrics (admin only)
router.get('/metrics', requireAuth, (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving performance metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get memory usage
router.get('/memory', requireAuth, (req, res) => {
  try {
    const memory = memoryMonitor();
    
    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving memory metrics'
    });
  }
});

// Clear cache (admin only)
router.post('/cache/clear', requireAuth, (req, res) => {
  try {
    const { pattern } = req.body;
    const result = clearCache(pattern);
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error clearing cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Performance health check
router.get('/health', (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    const memory = memoryMonitor();
    
    // Define health thresholds
    const thresholds = {
      averageResponseTime: 1000, // 1 second
      errorRate: 5, // 5%
      memoryHeapUsed: 500 // 500 MB
    };
    
    const health = {
      status: 'healthy',
      checks: {
        responseTime: {
          status: metrics.averageResponseTime < thresholds.averageResponseTime ? 'healthy' : 'warning',
          value: metrics.averageResponseTime,
          threshold: thresholds.averageResponseTime,
          unit: 'ms'
        },
        errorRate: {
          status: metrics.errorRate < thresholds.errorRate ? 'healthy' : 'warning',
          value: metrics.errorRate,
          threshold: thresholds.errorRate,
          unit: '%'
        },
        memory: {
          status: memory.heapUsed < thresholds.memoryHeapUsed ? 'healthy' : 'warning',
          value: memory.heapUsed,
          threshold: thresholds.memoryHeapUsed,
          unit: 'MB'
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Determine overall health status
    const hasWarnings = Object.values(health.checks).some(check => check.status === 'warning');
    if (hasWarnings) {
      health.status = 'warning';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      success: health.status === 'healthy',
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error checking performance health',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get performance optimization recommendations
router.get('/recommendations', requireAuth, (req, res) => {
  try {
    const metrics = getPerformanceMetrics();
    const recommendations = [];
    
    // Analyze metrics and provide recommendations
    if (metrics.averageResponseTime > 500) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Tiempo de respuesta elevado',
        description: `Tiempo promedio de respuesta: ${metrics.averageResponseTime}ms`,
        suggestion: 'Considere optimizar consultas de base de datos y agregar más cache',
        impact: 'Usuario experimentará lentitud en la aplicación'
      });
    }
    
    if (metrics.errorRate > 2) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'Tasa de errores elevada',
        description: `Tasa de error: ${metrics.errorRate}%`,
        suggestion: 'Revise logs de errores y implemente mejor manejo de excepciones',
        impact: 'Usuarios experimentarán fallos en funcionalidades'
      });
    }
    
    // Memory recommendations
    const memory = memoryMonitor();
    if (memory.heapUsed > 400) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: 'Uso de memoria elevado',
        description: `Memoria heap utilizada: ${memory.heapUsed}MB`,
        suggestion: 'Revise potenciales memory leaks y optimice cache',
        impact: 'Puede causar degradación de performance y crashes'
      });
    }
    
    // Endpoint-specific recommendations
    const slowEndpoints = metrics.endpointStats?.filter(ep => ep.averageTime > 1000) || [];
    slowEndpoints.forEach(endpoint => {
      recommendations.push({
        type: 'endpoint',
        priority: 'medium',
        title: `Endpoint lento: ${endpoint.endpoint}`,
        description: `Tiempo promedio: ${endpoint.averageTime}ms`,
        suggestion: 'Optimice este endpoint específico con cache o mejores consultas',
        impact: 'Funcionalidad específica lenta para usuarios'
      });
    });
    
    // Cache recommendations
    if (metrics.requestCount > 100) {
      recommendations.push({
        type: 'cache',
        priority: 'low',
        title: 'Oportunidad de optimización de cache',
        description: `${metrics.requestCount} requests en últimos 5 minutos`,
        suggestion: 'Incremente TTL de cache para endpoints frecuentemente accedidos',
        impact: 'Mejorará performance general y reducirá carga del servidor'
      });
    }
    
    res.json({
      success: true,
      data: {
        recommendations,
        metrics: {
          averageResponseTime: metrics.averageResponseTime,
          errorRate: metrics.errorRate,
          requestCount: metrics.requestCount,
          memoryUsage: memory.heapUsed
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error generating recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;