/**
 * Точка входа для бота
 */

import dotenv from 'dotenv';
import path from 'path';
import { Bot } from './bot';
import { logError, logInfo } from './logger';
import fs from 'fs';

// Загружаем переменные окружения из .env файла
dotenv.config();

// Проверяем наличие необходимых переменных окружения
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  logError('Не указан токен бота в переменных окружения (TELEGRAM_BOT_TOKEN)');
  process.exit(1);
}

// Получаем путь к файлу конфигурации
const configPath = process.env.BOT_CONFIG_PATH || path.resolve(__dirname, '../config/bot-config.json');

// Проверяем существование файла конфигурации
if (!fs.existsSync(configPath)) {
  logError(`Файл конфигурации не найден: ${configPath}`);
  process.exit(1);
}

// Создаем директорию для логов, если она не существует
const logsDir = path.resolve(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Инициализируем и запускаем бота
async function startBot() {
  try {
    logInfo('Инициализация бота...');
    const bot = new Bot(telegramBotToken as string, configPath);
    
    logInfo('Запуск бота...');
    await bot.start();
    
    logInfo(`Бот успешно запущен. Конфигурация загружена из: ${configPath}`);
  } catch (error) {
    logError('Ошибка при запуске бота', error);
    process.exit(1);
  }
}

// Запускаем бота
startBot();