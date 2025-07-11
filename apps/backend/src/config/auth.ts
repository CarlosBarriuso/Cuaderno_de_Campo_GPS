import { ClerkExpressWithAuth } from '@clerk/backend';
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
export const clerkAuth = ClerkExpressWithAuth({
  secretKey: clerkConfig.secretKey,
});

// Interfaz para el usuario autenticado
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  organizationId?: string;
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
      // Aquí podríamos obtener más información del usuario desde Clerk
      // o desde nuestra base de datos local
      req.user = {
        id: req.auth.userId,
        email: '', // Se obtendría de Clerk API si es necesario
        organizationId: req.auth.orgId,
      };
      
      logger.debug('User authenticated', {
        userId: req.auth.userId,
        sessionId: req.auth.sessionId,
        orgId: req.auth.orgId,
      });
    }
    
    next();
  } catch (error) {
    logger.error('Error extracting user info:', error);
    next(error);
  }
};

// Middleware para verificar que el usuario esté autenticado
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth?.userId) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }
  
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
    
    next();
  };
};

// Adapter para migración futura a otros proveedores de auth
export class AuthAdapter {
  constructor(private provider: 'clerk' | 'auth0' | 'custom' = 'clerk') {}
  
  getMiddleware() {
    switch (this.provider) {
      case 'clerk':
        return [clerkAuth, extractUserInfo];
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