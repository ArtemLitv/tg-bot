import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { menu, MenuItem, MessageContent } from './menu';

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

// Function to generate keyboard markup from menu items
function generateKeyboard(items: MenuItem[]): TelegramBot.KeyboardButton[][] {
  return [
    ...items.map(item => [{ text: item.title }])
  ];
}

// Function to find a menu item by its title
function findMenuItem(path: string[]): MenuItem | null {
  if (path.length === 0) return null;

  let currentMenu = menu;
  let currentItem: MenuItem | null = null;

  for (const title of path) {
    currentItem = currentMenu.find(item => item.title === title) || null;
    if (!currentItem || !currentItem.subMenu) break;
    currentMenu = currentItem.subMenu;
  }

  return currentItem;
}

// Function to get the current menu based on user's state
function getCurrentMenu(userId: number): MenuItem[] {
  const path = userMenuState[userId] || [];

  if (path.length === 0) return menu;

  let currentMenu = menu;

  for (let i = 0; i < path.length - 1; i++) {
    const title = path[i];
    const item = currentMenu.find(item => item.title === title);
    if (!item || !item.subMenu) return menu;
    currentMenu = item.subMenu;
  }

  return currentMenu;
}

// Function to send a message based on its content type
async function sendMessage(chatId: number, content: string | MessageContent): Promise<void> {
  if (typeof content === 'string') {
    await bot.sendMessage(chatId, content);
    return;
  }

  // Handle complex message content - prioritize content types
  if (content.photo) {
    try {
      // If photo is present, send it first without any caption
      await bot.sendPhoto(chatId, content.photo);

      // Then send the text as a separate message
      if (content.text) {
        await bot.sendMessage(chatId, content.text);
      }

      // If there's also a link, send it as a separate message
      if (content.link) {
        const linkMessage = `[${content.link.text}](${content.link.url})`;
        await bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      // Fallback to sending just the text and link
      if (content.text) {
        await bot.sendMessage(chatId, content.text);
      }
      if (content.link) {
        const linkMessage = `[${content.link.text}](${content.link.url})`;
        await bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
      }
    }
  } else if (content.link) {
    // If link is present (and no photo), format with Markdown
    const text = content.text ? `${content.text}\n\n` : '';
    const message = `${text}[${content.link.text}](${content.link.url})`;
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } else if (content.location) {
    // If location is present (and no photo or link)
    await bot.sendLocation(chatId, content.location.latitude, content.location.longitude);
    if (content.text) {
      await bot.sendMessage(chatId, content.text);
    }
  } else if (content.text) {
    // If only text is present
    await bot.sendMessage(chatId, content.text);
  }
}

// Store users who have received the welcome message
const welcomedUsers = new Set<number>();

// Send welcome message when user first interacts with the bot
bot.on('message', async (msg) => {
  // Skip if it's a /start command (handled separately)
  if (msg.text && msg.text.startsWith('/start')) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) return;

  // If user hasn't been welcomed yet
  if (!welcomedUsers.has(userId)) {
    welcomedUsers.add(userId);

    // Send welcome image and text
    await bot.sendPhoto(chatId, 'https://disk.yandex.ru/i/YgqwFEEff79cbA');
    await bot.sendMessage(chatId, 'Приветствуем Вас в боте синергии отраслевых выставок EXPO!\n\nЗдесь организаторы собрали всю самую важную информацию о выставках, которые пройдут 27–30 мая 2025 в Москве, МВЦ «Крокус Экспо».');

    // Prompt to use /start command
    await bot.sendMessage(chatId, 'Нажмите на кнопку /start для начала работы с ботом');
  }
});

// Handle /start command
bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) return;

  // Reset user's menu state
  userMenuState[userId] = [];

  // Send EXPO description
  await bot.sendMessage(chatId, 'EXPO – это самое крупное отраслевое выставочное мероприятие в России и Восточной Европе, которое объединяет людей, идеи и технологии из разных, но смежных отраслей, создавая уникальную среду для обмена знаниями и опытом.\n\nСинергия 4 авторитетных отраслевых B2B выставок под единым брендом формирует беспрецедентный поток потенциальных клиентов, которого нет больше нигде.\n\n@cttexpo\nКирпичи как символ строительства, главным инструментом которого является строительная техника. В этом году выставка отметит 25-летний юбилей вместе с 80 000+ профессионалами своего дела.\n\n@comvex\nПерекрёсток как символ движения и развития коммерческого транспорта, который объединяет ключевых игроков рынка и создаёт условия для принятия прорывных бизнес-решений.\n\n@ctoexpo\nНезаменимый ключ для слаженной и продуктивной работы всех участников послепродажного обслуживания и сервиса автотранспорта: с его помощью можно запускать результативные проекты с инвесторами и единомышленниками.\n\n@logistikaexpo\nТочка на карте логистических потоков, которая определяет маршруты движения товаров и успешное взаимодействие клиентов и партнёров.\n\nПодробнее: [sigma-expo.ru/expo](https://sigma-expo.ru/expo)', {
    parse_mode: 'Markdown'
  });

  // Send main menu
  await bot.sendMessage(chatId, 'Выбери направление, которое тебя интересует 👇', {
    reply_markup: {
      keyboard: generateKeyboard(menu),
      resize_keyboard: true
    }
  });
});

// Handle all messages
bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;

  const chatId = msg.chat.id;
  const userId = msg.from?.id;

  if (!userId) return;

  // Initialize user state if not exists
  if (!userMenuState[userId]) {
    userMenuState[userId] = [];
  }

  const currentMenu = getCurrentMenu(userId);
  const selectedItem = currentMenu.find(item => item.title === msg.text);

  if (!selectedItem) {
    // Unknown command
    bot.sendMessage(chatId, 'Неизвестная опция. Пожалуйста, выберите из меню:', {
      reply_markup: {
        keyboard: generateKeyboard(currentMenu),
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle "back" action
  if (selectedItem.action === 'back') {
    if (userMenuState[userId].length > 0) {
      // If the title is "В главное меню", reset to main menu
      if (selectedItem.title === 'В главное меню') {
        userMenuState[userId] = [];
        bot.sendMessage(chatId, 'Главное меню:', {
          reply_markup: {
            keyboard: generateKeyboard(menu),
            resize_keyboard: true
          }
        });
      } else {
        // Otherwise just go back one level
        userMenuState[userId].pop();
        const newMenu = getCurrentMenu(userId);
        bot.sendMessage(chatId, 'Назад...', {
          reply_markup: {
            keyboard: generateKeyboard(newMenu),
            resize_keyboard: true
          }
        });
      }
    }
    return;
  }

  // Handle submenu
  if (selectedItem.subMenu) {
    userMenuState[userId].push(selectedItem.title);

    // Customize message based on menu type
    let message = '';
    if (selectedItem.title === 'Выставки') {
      message = 'Выбери выставку, которая тебя интересует 👇';
    } else {
      message = `${selectedItem.title}:`;
    }

    bot.sendMessage(chatId, message, {
      reply_markup: {
        keyboard: generateKeyboard(selectedItem.subMenu),
        resize_keyboard: true
      }
    });
    return;
  }

  // Handle message content
  if (selectedItem.message) {
    await sendMessage(chatId, selectedItem.message);
  }
});

console.log('Bot started successfully! 🤖');
