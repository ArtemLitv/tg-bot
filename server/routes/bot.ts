/**
 * Маршруты для управления ботом
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../logger';

// Глобальная переменная для хранения экземпляра бота
let botInstance: any = null;

export function setupBotRoutes(app: Express, prisma: PrismaClient) {
  // Получаем middleware для проверки JWT токена из auth.ts
  const { authenticateJWT } = require('./auth');

  // Маршрут для получения статуса бота
  app.get('/api/bot/status', authenticateJWT, (req, res) => {
    try {
      const status = botInstance ? 'running' : 'stopped';
      res.json({ status });
    } catch (error) {
      logError('Ошибка при получении статуса бота', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для запуска бота
  app.post('/api/bot/start', authenticateJWT, async (req, res) => {
    try {
      if (botInstance) {
        return res.status(400).json({ error: 'Бот уже запущен' });
      }

      // Импортируем Bot динамически, чтобы избежать циклических зависимостей
      const { Bot } = await import('../bot');
      
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const configPath = process.env.BOT_CONFIG_PATH || 'config/bot-config.json';
      
      if (!telegramBotToken) {
        return res.status(400).json({ error: 'Не указан токен бота в переменных окружения (TELEGRAM_BOT_TOKEN)' });
      }
      
      // Создаем и запускаем бота
      botInstance = new Bot(telegramBotToken, configPath, prisma);
      await botInstance.start();
      
      logInfo('Бот успешно запущен через API');
      res.json({ status: 'running', message: 'Бот успешно запущен' });
    } catch (error) {
      logError('Ошибка при запуске бота', error);
      res.status(500).json({ error: 'Ошибка при запуске бота' });
    }
  });

  // Маршрут для остановки бота
  app.post('/api/bot/stop', authenticateJWT, async (req, res) => {
    try {
      if (!botInstance) {
        return res.status(400).json({ error: 'Бот не запущен' });
      }
      
      // Останавливаем бота
      await botInstance.stop();
      botInstance = null;
      
      logInfo('Бот успешно остановлен через API');
      res.json({ status: 'stopped', message: 'Бот успешно остановлен' });
    } catch (error) {
      logError('Ошибка при остановке бота', error);
      res.status(500).json({ error: 'Ошибка при остановке бота' });
    }
  });

  // Маршрут для перезапуска бота
  app.post('/api/bot/restart', authenticateJWT, async (req, res) => {
    try {
      // Если бот запущен, останавливаем его
      if (botInstance) {
        await botInstance.stop();
        botInstance = null;
      }
      
      // Импортируем Bot динамически, чтобы избежать циклических зависимостей
      const { Bot } = await import('../bot');
      
      const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
      const configPath = process.env.BOT_CONFIG_PATH || 'config/bot-config.json';
      
      if (!telegramBotToken) {
        return res.status(400).json({ error: 'Не указан токен бота в переменных окружения (TELEGRAM_BOT_TOKEN)' });
      }
      
      // Создаем и запускаем бота
      botInstance = new Bot(telegramBotToken, configPath, prisma);
      await botInstance.start();
      
      logInfo('Бот успешно перезапущен через API');
      res.json({ status: 'running', message: 'Бот успешно перезапущен' });
    } catch (error) {
      logError('Ошибка при перезапуске бота', error);
      res.status(500).json({ error: 'Ошибка при перезапуске бота' });
    }
  });

  // Экспортируем функцию для установки экземпляра бота
  return {
    setBotInstance: (bot: any) => {
      botInstance = bot;
    }
  };
}