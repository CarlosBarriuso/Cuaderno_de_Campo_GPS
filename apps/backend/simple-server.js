const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors({
  origin: ['http://localhost:3002', 'http://localhost:3001', 'http://localhost:19006'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cuaderno-campo-api',
    version: '1.0.0'
  });
});

// API Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      database: 'connected',
      services: {
        auth: 'ok',
        gps: 'ok',
        offline: 'ok'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Mock parcelas data
const mockParcelas = [
  {
    id: '1',
    nombre: 'Parcela Norte',
    superficie: 12.5,
    tipoCultivo: 'CEREAL_SECANO',
    cultivo: 'Trigo',
    referenciaSigpac: '28:123:45:67:890:AB',
    geometria: 'POLYGON((-3.7038 40.4168, -3.7028 40.4168, -3.7028 40.4158, -3.7038 40.4158, -3.7038 40.4168))',
    activa: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    nombre: 'Parcela Sur',
    superficie: 8.3,
    tipoCultivo: 'OLIVAR',
    cultivo: 'Olivo',
    referenciaSigpac: '28:123:45:67:891:CD',
    geometria: 'POLYGON((-3.7048 40.4148, -3.7038 40.4148, -3.7038 40.4138, -3.7048 40.4138, -3.7048 40.4148))',
    activa: true,
    createdAt: new Date().toISOString()
  }
];

// Mock actividades data
const mockActividades = [
  {
    id: '1',
    tipo: 'SIEMBRA',
    fecha: new Date().toISOString(),
    parcelaId: '1',
    coordenadas: [40.4168, -3.7038],
    precision: 2.5,
    productos: [
      {
        nombre: 'Semilla de Trigo',
        cantidad: 150,
        unidad: 'kg',
        costo: 45.00
      }
    ],
    notas: 'Siembra de trigo en condiciones óptimas',
    estado: 'COMPLETADA',
    createdAt: new Date().toISOString()
  }
];

// Parcelas endpoints
app.get('/api/v1/parcelas', (req, res) => {
  res.json({
    success: true,
    data: mockParcelas,
    pagination: {
      total: mockParcelas.length,
      page: 1,
      limit: 10
    }
  });
});

app.post('/api/v1/parcelas', (req, res) => {
  const newParcela = {
    id: String(mockParcelas.length + 1),
    ...req.body,
    activa: true,
    createdAt: new Date().toISOString()
  };
  mockParcelas.push(newParcela);
  
  res.status(201).json({
    success: true,
    data: newParcela
  });
});

app.get('/api/v1/parcelas/:id', (req, res) => {
  const parcela = mockParcelas.find(p => p.id === req.params.id);
  if (!parcela) {
    return res.status(404).json({
      success: false,
      error: 'PARCELA_NOT_FOUND',
      message: 'Parcela no encontrada'
    });
  }
  res.json({
    success: true,
    data: parcela
  });
});

// Actividades endpoints
app.get('/api/v1/actividades', (req, res) => {
  const { parcelaId } = req.query;
  let actividades = mockActividades;
  
  if (parcelaId) {
    actividades = mockActividades.filter(a => a.parcelaId === parcelaId);
  }
  
  res.json({
    success: true,
    data: actividades,
    pagination: {
      total: actividades.length,
      page: 1,
      limit: 10
    }
  });
});

app.post('/api/v1/actividades', (req, res) => {
  const newActividad = {
    id: String(mockActividades.length + 1),
    ...req.body,
    estado: 'COMPLETADA',
    createdAt: new Date().toISOString()
  };
  mockActividades.push(newActividad);
  
  res.status(201).json({
    success: true,
    data: newActividad
  });
});

// SIGPAC endpoints
app.get('/api/v1/sigpac/parcela/:referencia', (req, res) => {
  const { referencia } = req.params;
  
  res.json({
    success: true,
    data: {
      referencia: referencia,
      superficie: 12.5,
      coordenadas_centroide: [40.4168, -3.7038],
      geometria: 'POLYGON((-3.7038 40.4168, -3.7028 40.4168, -3.7028 40.4158, -3.7038 40.4158, -3.7038 40.4168))',
      cultivo: 'Cereales',
      uso_sigpac: 'TI',
      fuente: 'SIGPAC_WMS',
      confianza: 0.95,
      fecha_consulta: new Date().toISOString(),
      provincia_nombre: 'Madrid',
      comunidad_autonoma: 'Comunidad de Madrid'
    }
  });
});

// Weather endpoints
app.get('/api/v1/weather/current/:lat/:lng', (req, res) => {
  const { lat, lng } = req.params;
  
  res.json({
    success: true,
    data: {
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      current: {
        temperature: 22.5,
        humidity: 65,
        wind_speed: 12.3,
        wind_direction: 'SW',
        pressure: 1013.2,
        description: 'Parcialmente nublado',
        icon: 'partly-cloudy'
      },
      forecast_5days: [
        {
          date: new Date().toISOString(),
          temp_max: 25,
          temp_min: 15,
          humidity: 60,
          precipitation: 0,
          description: 'Soleado'
        }
      ],
      alerts: [],
      recommendations: [
        'Condiciones óptimas para trabajo en campo',
        'No se esperan precipitaciones en las próximas 48h'
      ]
    }
  });
});

// User profile endpoint
app.get('/api/v1/user/profile', (req, res) => {
  res.json({
    success: true,
    data: {
      id: 'user_123',
      email: 'agricultor@ejemplo.com',
      firstName: 'Juan',
      lastName: 'Agricultores',
      role: 'AGRICULTOR',
      organizationId: null,
      stats: {
        totalParcelas: mockParcelas.length,
        totalSuperficie: mockParcelas.reduce((sum, p) => sum + p.superficie, 0),
        actividadesEsteeMes: mockActividades.length
      }
    }
  });
});

// Sync endpoint for offline functionality
app.post('/api/v1/sync', (req, res) => {
  const { changes } = req.body;
  
  // Mock sync processing
  res.json({
    success: true,
    data: {
      processed: changes?.length || 0,
      conflicts: [],
      server_timestamp: new Date().toISOString()
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Error interno del servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Endpoint no encontrado'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Cuaderno de Campo API corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌾 API docs: http://localhost:${PORT}/api/v1/health`);
});

module.exports = app;