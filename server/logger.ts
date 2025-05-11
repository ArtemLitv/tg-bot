/**
 * Настройка логирования с использованием winston
 */

import winston from 'winston';
import Transport from 'winston-transport';
import { PrismaClient } from '@prisma/client';

// Инициализируем Prisma
const prisma = new PrismaClient();

// Создаем кастомный транспорт для сохранения логов в базу данных
class PrismaTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
  }

  async log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      // Сохраняем лог в базу данных
      await prisma.log.create({
        data: {
          level: info.level,
          message: info.message,
          meta: info[Symbol.for('splat')] ? JSON.stringify(info[Symbol.for('splat')]) : null,
        },
      });
    } catch (error) {
      console.error('Ошибка при сохранении лога в базу данных:', error);
    }

    callback();
  }
}

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
    }),
    // Вывод в базу данных
    new PrismaTransport()
  ]
});

// Настройка логгера
export function setupLogger() {
  // Логирование необработанных исключений
  process.on('uncaughtException', (error) => {
    logger.error('Необработанное исключение:', error);
    process.exit(1);
  });

  // Логирование необработанных отклонений промисов
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Необработанное отклонение промиса:', { reason, promise });
  });

  logger.info('Логгер успешно настроен');
}

// Экспортируем функции для удобного логирования
export const logInfo = (message: string, meta?: any) => logger.info(message, meta);
export const logError = (message: string, error?: any) => logger.error(message, error);
export const logWarn = (message: string, meta?: any) => logger.warn(message, meta);
export const logDebug = (message: string, meta?: any) => logger.debug(message, meta);