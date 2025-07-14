const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3004;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3005'],
  credentials: true
}));

app.use(express.json());

// Simulación de middleware de autenticación para testing
const mockAuthMiddleware = (req, res, next) => {
  // Simular headers de Clerk
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Simular validación de token
    if (token === 'test-token' || token === 'valid-jwt-token') {
      req.auth = {
        userId: 'user_123abc',
        sessionId: 'sess_456def',
        orgId: 'org_789ghi'
      };
      
      req.user = {
        id: 'user_123abc',
        email: 'agricultor@test.com',
        firstName: 'Juan',
        lastName: 'García',
        imageUrl: 'https://example.com/avatar.jpg',
        organizationId: 'org_789ghi',
        role: 'agricultor',
        subscription: {
          plan: 'basico',
          status: 'active',
          hectareasLimite: 50,
          hectareasUsadas: 23.6,
          fechaInicio: '2025-01-01',
          fechaVencimiento: '2025-02-01',
          precio: 30.00,
          moneda: 'EUR'
        }
      };
    } else {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Invalid token'
      });
    }
  }
  
  next();
};

// Middleware que requiere autenticación
const requireAuth = (req, res, next) => {
  if (!req.auth?.userId) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cuaderno-campo-auth-test',
    version: '1.0.0'
  });
});

// Rutas de autenticación para testing
app.get('/api/auth/status', mockAuthMiddleware, (req, res) => {
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

app.get('/api/auth/me', mockAuthMiddleware, requireAuth, (req, res) => {
  const user = req.user;
  
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
      subscription: user.subscription,
    },
  });
});

app.post('/api/auth/logout', mockAuthMiddleware, requireAuth, (req, res) => {
  console.log('User logout', { userId: req.user?.id });
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Rutas protegidas para testing
app.get('/api/parcelas', mockAuthMiddleware, requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        nombre: 'Parcela Norte',
        superficie: 15.5,
        tipoCultivo: 'CEREALES',
        propietarioId: req.user.id,
        referenciaSigpac: '28:001:A:0001:001:001',
        coordenadas: {
          lat: 40.4165,  // Madrid - coordenadas corregidas
          lng: -3.7026
        }
      },
      {
        id: '2', 
        nombre: 'Parcela Sur',
        superficie: 8.1,
        tipoCultivo: 'OLIVAR',
        propietarioId: req.user.id,
        referenciaSigpac: '42344A005058700009',
        coordenadas: {
          lat: 42.3440,  // León - coordenadas correctas desde SIGPAC
          lng: -5.0587
        }
      }
    ],
    total: 2
  });
});

app.get('/api/actividades', mockAuthMiddleware, requireAuth, (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        tipo: 'SIEMBRA',
        fecha: '2025-01-10',
        parcelaId: '1',
        usuarioId: req.user.id,
        notas: 'Siembra de trigo'
      },
      {
        id: '2',
        tipo: 'FERTILIZACION',
        fecha: '2025-01-08',
        parcelaId: '2',
        usuarioId: req.user.id,
        notas: 'Aplicación de fertilizante NPK'
      }
    ],
    total: 2
  });
});

// Ruta pública para testing (sin auth)
app.get('/api/public/info', (req, res) => {
  res.json({
    success: true,
    message: 'Public endpoint working',
    timestamp: new Date().toISOString()
  });
});

// SIGPAC endpoint para testing
app.get('/api/sigpac/:referencia', mockAuthMiddleware, requireAuth, (req, res) => {
  const referencia = req.params.referencia;
  
  // Simulación de datos SIGPAC con coordenadas reales de España
  const mockSigpacData = {
    '42344A005058700009': {
      referencia: '42:344:A:00505:8700:009',
      coordenadas_centroide: {
        lat: 42.3440,  // Coordenada corregida para León
        lng: -5.0587   // Coordenada corregida para León
      },
      superficie: 8.1,
      cultivo: 'OLIVAR',
      uso_sigpac: 'OV',
      geometria: {
        type: 'Polygon',
        coordinates: [[
          [-5.0597, 42.3430],
          [-5.0577, 42.3430], 
          [-5.0577, 42.3450],
          [-5.0597, 42.3450],
          [-5.0597, 42.3430]
        ]]
      }
    }
  };

  const data = mockSigpacData[referencia];
  
  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'SIGPAC_NOT_FOUND',
      message: `Referencia catastral ${referencia} no encontrada`
    });
  }

  res.json({
    success: true,
    data: {
      ...data,
      fuente: 'SIGPAC_TEST',
      fecha_consulta: new Date().toISOString(),
      confianza: 0.9
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Auth test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth status: http://localhost:${PORT}/api/auth/status`);
  console.log(`👤 User info: http://localhost:${PORT}/api/auth/me`);
  console.log(`🌾 Protected routes: http://localhost:${PORT}/api/parcelas`);
  console.log(`🌐 CORS enabled for: http://localhost:3001`);
  console.log('');
  console.log('Para probar autenticación, usa:');
  console.log('- Sin auth: curl http://localhost:' + PORT + '/api/auth/status');
  console.log('- Con auth: curl -H "Authorization: Bearer test-token" http://localhost:' + PORT + '/api/auth/me');
});