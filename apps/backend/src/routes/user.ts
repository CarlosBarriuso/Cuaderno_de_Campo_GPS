import { Router, Request, Response } from 'express';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/config/logger';

const router = Router();

// Mock data para testing - en producción viene de base de datos
const mockUserData = {
  id: 'user_gustavo_123',
  email: 'yonimeescucho@gmail.com',
  firstName: 'Gustavo',
  lastName: 'Miguel Matamala',
  fullName: 'Gustavo Miguel Matamala',
  direccion: 'Calle Medina 6, 42230 Yelo, Soria',
  telefono: '+34 666 123 456',
  provincia: 'Soria',
  plan: {
    id: 'gratuito',
    nombre: 'Plan Gratuito',
    precio: 0,
    limite_hectareas: 5,
    caracteristicas: [
      'Hasta 5 hectáreas',
      'Funcionalidades básicas',
      'Soporte email'
    ]
  },
  stats: {
    parcelas_registradas: 0, // Gustavo empieza sin parcelas
    hectareas_totales: 0,
    actividades_mes: 0,
    tipos_cultivo: 0
  },
  subscription: {
    status: 'active',
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
};

const availablePlans = [
  {
    id: 'gratuito',
    nombre: 'Plan Gratuito',
    precio_mes: 0,
    precio_ha_mes: 0,
    limite_hectareas: 5,
    popular: false,
    caracteristicas: [
      'Hasta 5 hectáreas',
      'Registro actividades básico',
      'Mapas simples',
      'Soporte email'
    ]
  },
  {
    id: 'basico',
    nombre: 'Plan Básico',
    precio_mes: 45,
    precio_ha_mes: 0.60,
    limite_hectareas: 500,
    popular: true,
    caracteristicas: [
      'Gestión parcelas ilimitadas',
      'Registro actividades GPS',
      'Integración SIGPAC oficial',
      'Weather alerts básicas',
      'Informes PAC automáticos',
      'Soporte email'
    ]
  },
  {
    id: 'profesional',
    nombre: 'Plan Profesional',
    precio_mes: 75,
    precio_ha_mes: 0.45,
    limite_hectareas: 1000,
    popular: false,
    caracteristicas: [
      'Todo Plan Básico',
      'Analytics avanzados ROI',
      'OCR productos offline',
      'Weather intelligence completa',
      'Exportación datos completa',
      'Soporte telefónico prioritario'
    ]
  },
  {
    id: 'enterprise',
    nombre: 'Plan Enterprise',
    precio_mes: 120,
    precio_ha_mes: 0.30,
    limite_hectareas: 'ilimitadas',
    popular: false,
    caracteristicas: [
      'Todo Plan Profesional',
      'Business Intelligence completo',
      'API access para integraciones',
      'Multi-usuario cooperativas',
      'Soporte dedicado 24/7',
      'Formación personalizada'
    ]
  }
];

// GET /api/user/profile - Información del perfil del usuario
router.get('/profile', asyncHandler(async (req: Request, res: Response) => {
  logger.info('User profile requested');

  res.json({
    success: true,
    data: mockUserData
  });
}));

// GET /api/user/subscription - Información de suscripción
router.get('/subscription', asyncHandler(async (req: Request, res: Response) => {
  logger.info('User subscription requested');

  res.json({
    success: true,
    data: {
      plan: mockUserData.plan,
      subscription: mockUserData.subscription,
      usage: {
        hectareas_utilizadas: mockUserData.stats.hectareas_totales,
        limite_hectareas: mockUserData.plan.limite_hectareas,
        porcentaje_uso: mockUserData.plan.limite_hectareas > 0 
          ? Math.round((mockUserData.stats.hectareas_totales / mockUserData.plan.limite_hectareas) * 100)
          : 0
      }
    }
  });
}));

// GET /api/user/plans - Planes disponibles
router.get('/plans', asyncHandler(async (req: Request, res: Response) => {
  logger.info('Available plans requested');

  res.json({
    success: true,
    data: {
      current_plan: mockUserData.plan,
      available_plans: availablePlans
    }
  });
}));

// POST /api/user/change-plan - Cambiar plan de suscripción
router.post('/change-plan', asyncHandler(async (req: Request, res: Response) => {
  const { planId } = req.body;

  logger.info('Plan change requested', { planId });

  const newPlan = availablePlans.find(plan => plan.id === planId);
  
  if (!newPlan) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PLAN',
      message: 'Plan seleccionado no válido'
    });
  }

  // Simulate plan change (en producción actualizar BD y Stripe)
  mockUserData.plan = {
    id: newPlan.id,
    nombre: newPlan.nombre,
    precio: newPlan.precio_mes,
    limite_hectareas: newPlan.limite_hectareas as number,
    caracteristicas: newPlan.caracteristicas
  };

  res.json({
    success: true,
    message: `Plan cambiado exitosamente a ${newPlan.nombre}`,
    data: {
      new_plan: mockUserData.plan,
      effective_date: new Date().toISOString()
    }
  });
}));

// PUT /api/user/profile - Actualizar perfil usuario
router.put('/profile', asyncHandler(async (req: Request, res: Response) => {
  const { firstName, lastName, direccion, telefono, provincia } = req.body;

  logger.info('User profile update requested');

  // Update mock data (en producción actualizar BD)
  if (firstName) mockUserData.firstName = firstName;
  if (lastName) mockUserData.lastName = lastName;
  if (direccion) mockUserData.direccion = direccion;
  if (telefono) mockUserData.telefono = telefono;
  if (provincia) mockUserData.provincia = provincia;

  mockUserData.fullName = `${mockUserData.firstName} ${mockUserData.lastName}`;

  res.json({
    success: true,
    message: 'Perfil actualizado exitosamente',
    data: mockUserData
  });
}));

// GET /api/user/stats - Estadísticas del usuario
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  logger.info('User stats requested');

  // En testing, Gustavo empieza con stats en 0
  const stats = {
    parcelas_registradas: 0,
    hectareas_totales: 0,
    actividades_mes_actual: 0,
    actividades_total: 0,
    tipos_cultivo: 0,
    ultima_actividad: null,
    resumen_mes: {
      siembras: 0,
      fertilizaciones: 0,
      tratamientos: 0,
      cosechas: 0
    }
  };

  res.json({
    success: true,
    data: stats
  });
}));

export { router as userRoutes };