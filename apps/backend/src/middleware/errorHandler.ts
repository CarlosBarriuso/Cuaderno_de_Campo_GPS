import { Request, Response, NextFunction } from 'express';
import { logger } from '@/config/logger';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Errores específicos del dominio agrícola
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class ParcelaNotFoundError extends AppError {
  constructor(parcelaId: string) {
    super(`Parcela with ID ${parcelaId} not found`, 404, 'PARCELA_NOT_FOUND');
    this.name = 'ParcelaNotFoundError';
  }
}

export class SIGPACError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'SIGPAC_ERROR', details);
    this.name = 'SIGPACError';
  }
}

export class OCRError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'OCR_ERROR', details);
    this.name = 'OCRError';
  }
}

export class WeatherError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 502, 'WEATHER_ERROR', details);
    this.name = 'WeatherError';
  }
}

// Middleware de manejo de errores
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log del error
  logger.error('API Error:', {
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.auth?.userId,
    details: error.details,
  });

  // Status code por defecto
  let statusCode = error.statusCode || 500;
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';

  // Manejar errores específicos
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry detected';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token expired';
  }

  // Respuesta de error
  const errorResponse: any = {
    success: false,
    error: code,
    message,
    timestamp: new Date().toISOString(),
  };

  // Incluir detalles en desarrollo
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = error.details;
    errorResponse.stack = error.stack;
  }

  // Incluir request ID si está disponible
  if (req.headers['x-request-id']) {
    errorResponse.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
};

// Middleware para manejar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response) => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );

  logger.warn('Route not found:', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
  });
};

// Wrapper para async handlers
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};