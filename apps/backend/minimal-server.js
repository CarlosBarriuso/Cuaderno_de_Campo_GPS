const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Basic middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'cuaderno-campo-backend',
    version: '1.0.0'
  });
});

// Basic API test routes
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is working',
    timestamp: new Date().toISOString()
  });
});

// SIGPAC test endpoint
app.get('/api/sigpac/test', (req, res) => {
  res.json({
    success: true,
    message: 'SIGPAC integration ready',
    service: 'sigpac',
    status: 'available'
  });
});

// Weather test endpoint  
app.get('/api/weather/test', (req, res) => {
  res.json({
    success: true,
    message: 'Weather integration ready',
    service: 'weather',
    status: 'available'
  });
});

// OCR test endpoint
app.get('/api/ocr/test', (req, res) => {
  res.json({
    success: true,
    message: 'OCR integration ready',
    service: 'ocr',
    status: 'available'
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
  console.log(`🚀 Minimal backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API test: http://localhost:${PORT}/api/test`);
  console.log(`🌐 CORS enabled for: http://localhost:3001`);
});