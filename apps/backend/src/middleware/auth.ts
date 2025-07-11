import { Request, Response, NextFunction } from 'express';
import { clerkAuth, extractUserInfo, requireAuth } from '@/config/auth';
import { logger } from '@/config/logger';

// Middleware principal de autenticación que combina Clerk + extracción de usuario
export const authMiddleware = [
  // 1. Autenticación con Clerk
  clerkAuth,
  
  // 2. Extraer información del usuario
  extractUserInfo,
  
  // 3. Log de autenticación (opcional)
  (req: Request, res: Response, next: NextFunction) => {
    if (req.auth?.userId) {
      logger.debug('Request authenticated', {
        method: req.method,
        path: req.path,
        userId: req.auth.userId,
        ip: req.ip,
      });
    }
    next();
  },
];

// Middleware para rutas que requieren autenticación obligatoria
export const protectedRoute = [
  ...authMiddleware,
  requireAuth,
];

// Middleware para rutas opcionales (pueden ser públicas o autenticadas)
export const optionalAuth = authMiddleware;

export { requireAuth };