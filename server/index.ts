/**
 * Точка входа для сервера Express и Telegram-бота
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import session from 'express-session';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { Bot } from './bot';
import { setupLogger, logInfo, logError } from './logger';
import { setupAuthRoutes } from './routes/auth';
import { setupApiRoutes } from './routes/api';
import { setupBotRoutes } from './routes/bot';
import { setupPassport } from './auth/passport';
import { createDefaultAdmin } from './services/adminService';
import { initializeConfig } from './services/configService';

// Загружаем переменные окружения
dotenv.config();

// Инициализируем Prisma
const prisma = new PrismaClient();

// Настраиваем логгер
setupLogger();

// Создаем экземпляр Express
const app = express();
const PORT = process.env.PORT || 3001;

// Настраиваем middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настраиваем сессии
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  })
);

// Настраиваем Passport
app.use(passport.initialize());
app.use(passport.session());
setupPassport(passport, prisma);

// Настраиваем статические файлы для клиентской части
app.use(express.static(path.join(__dirname, '../../client/build')));

// Настраиваем маршруты
setupAuthRoutes(app, passport, prisma);
setupApiRoutes(app, prisma);
const botRoutes = setupBotRoutes(app, prisma);

// Маршрут для всех остальных запросов - отдаем React приложение
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/build', 'index.html'));
});

// Глобальный обработчик ошибок
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logError('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Инициализируем и запускаем бота
let bot: Bot | null = null;

async function startBot() {
  try {
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const configPath = process.env.BOT_CONFIG_PATH || path.resolve(__dirname, '../config/bot-config.json');

    if (!telegramBotToken) {
      logError('Не указан токен бота в переменных окружения (TELEGRAM_BOT_TOKEN)');
      return;
    }

    logInfo('Инициализация бота...');
    bot = new Bot(telegramBotToken, configPath, prisma);

    logInfo('Запуск бота...');
    await bot.start();

    // Устанавливаем экземпляр бота для маршрутов
    botRoutes.setBotInstance(bot);

    logInfo(`Бот успешно запущен. Конфигурация загружена из: ${configPath}`);
  } catch (error) {
    logError('Ошибка при запуске бота', error);
  }
}

// Запускаем сервер
async function startServer() {
  try {
    // Создаем администратора по умолчанию
    await createDefaultAdmin(prisma);

    // Инициализируем конфигурацию бота
    await initializeConfig(prisma);

    // Запускаем сервер
    app.listen(PORT, () => {
      logInfo(`Сервер запущен на порту ${PORT}`);

      // Запускаем бота
      startBot();
    });
  } catch (error) {
    logError('Ошибка при запуске сервера', error);
    process.exit(1);
  } finally {
    // Обработчик завершения работы
    process.on('SIGINT', async () => {
      logInfo('Завершение работы сервера...');

      if (bot) {
        await bot.stop();
      }

      await prisma.$disconnect();
      process.exit(0);
    });
  }
}

// Запускаем сервер
startServer();
