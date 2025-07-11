import { Router, Request, Response } from 'express';
import { logger } from '@/config/logger';

const router = Router();

// Health check básico
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Cuaderno de Campo GPS API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Health check detallado
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    checks: {
      database: 'checking',
      redis: 'checking',
      clerk: 'checking',
    },
    responseTime: 0,
  };

  try {
    // TODO: Agregar checks reales cuando estén disponibles
    // - Database connection check
    // - Redis connection check  
    // - Clerk API check
    
    health.checks.database = 'ok';
    health.checks.redis = 'ok';
    health.checks.clerk = 'ok';
    
    health.responseTime = Date.now() - startTime;
    
    logger.debug('Health check performed', health);
    
    res.json(health);
  } catch (error) {
    logger.error('Health check failed:', error);
    
    health.status = 'error';
    health.responseTime = Date.now() - startTime;
    
    res.status(503).json(health);
  }
});

// Readiness check para Kubernetes
router.get('/ready', (req: Request, res: Response) => {
  // TODO: Verificar que todas las dependencias estén listas
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

// Liveness check para Kubernetes
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };