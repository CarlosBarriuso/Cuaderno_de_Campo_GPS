import winston from 'winston';
import path from 'path';

// Crear directorio de logs si no existe
const logDir = path.join(process.cwd(), 'logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'cuaderno-campo-api',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Escribir logs de error a archivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Escribir todos los logs a archivo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// En desarrollo, también mostrar logs en consola
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          
          // Añadir metadata si existe
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          
          return msg;
        })
      ),
    })
  );
}

// Manejar excepciones no capturadas
logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
  })
);

export { logger };