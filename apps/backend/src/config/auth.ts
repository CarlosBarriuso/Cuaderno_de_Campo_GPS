import { ClerkExpressWithAuth, ClerkExpressRequireAuth } from '@clerk/backend';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

// Configuración de Clerk
export const clerkConfig = {
  secretKey: process.env.CLERK_SECRET_KEY!,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
};

// Verificar que las claves estén configuradas
if (!clerkConfig.secretKey || !clerkConfig.publishableKey) {
  throw new Error('Clerk keys not configured. Please check CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY environment variables.');
}

// Middleware de autenticación con Clerk
export const clerkWithAuth = ClerkExpressWithAuth();
export const requireAuth = ClerkExpressRequireAuth();

// Interfaz para el usuario autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  organizationId?: string | undefined;
  role?: string;
}

// Extender Request para incluir usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      auth?: {
        userId?: string;
        sessionId?: string;
        orgId?: string;
      };
    }
  }
}

// Middleware personalizado para extraer información del usuario
export const extractUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.auth?.userId) {
      // Crear objeto usuario básico con información de Clerk
      req.user = {
        id: req.auth.userId,
        email: '', // Se puede obtener de Clerk API si es necesario
        organizationId: req.auth.orgId,
      };
      
      // Log de autenticación exitosa
      logger.debug('User authenticated', {
        userId: req.auth.userId,
        sessionId: req.auth.sessionId,
        orgId: req.auth.orgId,
        path: req.path,
        method: req.method,
      });
      
      // Cache del usuario para evitar llamadas repetidas
      req.app.locals.userCache = req.app.locals.userCache || new Map();
      if (!req.app.locals.userCache.has(req.auth.userId)) {
        req.app.locals.userCache.set(req.auth.userId, {
          ...req.user,
          lastAccess: new Date(),
        });
      }
    }
    
    next();
  } catch (error) {
    logger.error('Error extracting user info:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: req.auth?.userId,
      path: req.path,
    });
    next(error);
  }
};

// Middleware para verificar que el usuario esté autenticado
export const requireAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.auth?.userId) {
    logger.warn('Unauthorized access attempt', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Log de acceso autorizado
  logger.info('Authorized access', {
    userId: req.auth.userId,
    path: req.path,
    method: req.method,
  });
  
  next();
};

// Middleware para verificar roles (implementación futura)
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
    }
    
    return next();
  };
};

// Adapter para migración futura a otros proveedores de auth
export class AuthAdapter {
  constructor(private provider: 'clerk' | 'auth0' | 'custom' = 'clerk') {}
  
  getMiddleware() {
    switch (this.provider) {
      case 'clerk':
        return [clerkWithAuth, extractUserInfo];
      default:
        throw new Error(`Auth provider ${this.provider} not implemented`);
    }
  }
  
  async getUserById(userId: string): Promise<AuthenticatedUser | null> {
    // Implementación específica por proveedor
    switch (this.provider) {
      case 'clerk':
        // Aquí iría la llamada a Clerk API
        return null;
      default:
        return null;
    }
  }
}

export const authAdapter = new AuthAdapter('clerk');