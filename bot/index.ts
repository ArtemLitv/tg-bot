import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';
import { menu } from './menu';
import { setupRoutes } from './route';
import { loadConfig, convertConfigToMenu } from './config-loader';
import { BotConfig } from './config-types';

// Load environment variables
dotenv.config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;
const configPath = process.env.BOT_CONFIG_PATH || path.join(__dirname, '../config/bot-config.json');

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user's current menu state and language preferences
const userMenuState: Record<number, string[]> = {};
const userLanguages: Record<number, string> = {};

// Try to load JSON configuration
let botConfig: BotConfig | null = null;
let menuItems = menu; // Default to static menu

try {
  // Attempt to load JSON configuration
  botConfig = loadConfig(configPath);
  console.log(`Конфигурация успешно загружена из ${configPath}`);

  // Convert JSON configuration to menu format
  menuItems = convertConfigToMenu(botConfig);
  console.log('JSON-конфигурация успешно преобразована в формат меню');
} catch (error) {
  console.warn(`Не удалось загрузить JSON-конфигурацию: ${error}`);
  console.warn('Используется статическое меню из файла menu.ts');
}

// Setup all routes
setupRoutes(bot, menuItems, userMenuState, botConfig);

console.log('Bot started successfully! 🤖');
