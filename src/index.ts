import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { menu } from './menu';
import { setupRoutes } from './route';

// Load environment variables
dotenv.config();

// Get bot token from environment variables
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not defined in .env file');
  process.exit(1);
}

// Create a new bot instance
const bot = new TelegramBot(token, { polling: true });

// Store user's current menu state
const userMenuState: Record<number, string[]> = {};

// Setup all routes
setupRoutes(bot, menu, userMenuState);

console.log('Bot started successfully! 🤖');
