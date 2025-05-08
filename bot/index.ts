import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import { setupRoutes } from './route';
import { loadConfig, convertConfigToMenu } from './config-loader';
import { BotConfig } from './config-types';
import { MenuItem } from './menu';

// Загрузка переменных окружения
dotenv.config();

// Получение токена бота из переменных окружения
const token = process.env.TELEGRAM_BOT_TOKEN;
const configPath = process.env.BOT_CONFIG_PATH || path.join(__dirname, '../config/bot-config.json');

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN не определен в файле .env');
  process.exit(1);
}

// Создание нового экземпляра бота
const bot = new TelegramBot(token, { polling: true });

// Хранение состояния меню пользователя и языковых предпочтений
const userMenuState: Record<number, string[]> = {};
const userLanguages: Record<number, string> = {};

// Загрузка JSON-конфигурации
let botConfig: BotConfig;
let menuItems: MenuItem[];

try {
  // Загрузка JSON-конфигурации
  botConfig = loadConfig(configPath);
  console.log(`Конфигурация успешно загружена из ${configPath}`);

  // Преобразование JSON-конфигурации в формат меню
  menuItems = convertConfigToMenu(botConfig);
  console.log('JSON-конфигурация успешно преобразована в формат меню');

  // Настройка всех маршрутов
  setupRoutes(bot, menuItems, userMenuState, botConfig);

  console.log('Бот успешно запущен! 🤖');
} catch (error) {
  console.error(`Критическая ошибка: не удалось загрузить JSON-конфигурацию: ${error}`);
  process.exit(1);
}
