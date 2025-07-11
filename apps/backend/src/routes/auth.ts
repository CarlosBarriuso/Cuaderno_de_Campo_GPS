import { Router, Request, Response } from 'express';
import { protectedRoute, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

const router = Router();

// Ruta para obtener información del usuario actual
router.get('/me', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'User not authenticated',
    });
  }

  logger.info('User info requested', { userId: user.id });

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      organizationId: user.organizationId,
      role: user.role,
    },
  });
}));

// Ruta para verificar estado de autenticación
router.get('/status', optionalAuth, (req: Request, res: Response) => {
  const isAuthenticated = !!req.auth?.userId;
  
  res.json({
    success: true,
    data: {
      isAuthenticated,
      userId: req.auth?.userId || null,
      sessionId: req.auth?.sessionId || null,
      organizationId: req.auth?.orgId || null,
    },
  });
});

// Ruta para logout (opcional - Clerk maneja esto en el frontend)
router.post('/logout', protectedRoute, asyncHandler(async (req: Request, res: Response) => {
  logger.info('User logout', { userId: req.user?.id });
  
  // Clerk maneja el logout en el cliente, aquí solo confirmamos
  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

export { router as authRoutes };