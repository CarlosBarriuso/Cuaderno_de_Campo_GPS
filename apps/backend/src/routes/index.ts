import { Router } from 'express';
import { parcelasRoutes } from './parcelas';
import { actividadesRoutes } from './actividades';
import { authRoutes } from './auth';
import { sigpacRoutes } from './sigpac';
import { ocrRoutes } from './ocr';
import weatherRoutes from './weather';
import performanceRoutes from './performance';
// import { analyticsRoutes } from './analytics';
// import { informesRoutes } from './informes';

const router = Router();

// Rutas principales de la API
router.use('/auth', authRoutes);
router.use('/parcelas', parcelasRoutes);
router.use('/actividades', actividadesRoutes);
router.use('/sigpac', sigpacRoutes);
router.use('/ocr', ocrRoutes);
router.use('/weather', weatherRoutes);
router.use('/performance', performanceRoutes);
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
      sigpac: '/api/sigpac',
      ocr: '/api/ocr',
      weather: '/api/weather',
      performance: '/api/performance',
      health: '/health',
    },
    documentation: 'https://github.com/CarlosBarriuso/Cuaderno_de_Campo_GPS/docs',
  });
});

export { router as apiRoutes };