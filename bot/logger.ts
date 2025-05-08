/**
 * Настройка логгирования с использованием winston
 */

import winston from 'winston';

// Получаем уровень логирования из переменных окружения или используем 'info' по умолчанию
const logLevel = process.env.LOG_LEVEL || 'info';

// Создаем форматтер для логов
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

// Создаем логгер
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // Вывод в консоль
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    // Вывод в файл
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Логирование необработанных исключений
process.on('uncaughtException', (error) => {
  logger.error('Необработанное исключение:', error);
  process.exit(1);
});

// Логирование необработанных отклонений промисов
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Необработанное отклонение промиса:', { reason, promise });
});

// Экспортируем функции для удобного логирования
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);