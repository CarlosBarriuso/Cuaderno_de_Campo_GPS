import { Router } from 'express';
import { parcelasRoutes } from './parcelas';
import { actividadesRoutes } from './actividades';
import { authRoutes } from './auth';
// import { analyticsRoutes } from './analytics';
// import { informesRoutes } from './informes';

const router = Router();

// Rutas principales de la API
router.use('/auth', authRoutes);
router.use('/parcelas', parcelasRoutes);
router.use('/actividades', actividadesRoutes);
// router.use('/analytics', analyticsRoutes);
// router.use('/informes', informesRoutes);

// Ruta de información de la API
router.get('/', (req, res) => {
  res.json({
    message: 'Cuaderno de Campo GPS API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      parcelas: '/api/parcelas',
      actividades: '/api/actividades',
      health: '/health',
    },
    documentation: 'https://github.com/CarlosBarriuso/Cuaderno_de_Campo_GPS/docs',
  });
});

export { router as apiRoutes };