import TelegramBot from 'node-telegram-bot-api';
import { MenuItem } from './menu';
import { generateKeyboard, getCurrentMenu, sendMessage, findMenuItemRecursive } from './helpers';

// Store users who have received the welcome message
const welcomedUsers = new Set<number>();

export function setupRoutes(bot: TelegramBot, menu: MenuItem[], userMenuState: Record<number, string[]>): void {
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

    const currentMenu = getCurrentMenu(userId, userMenuState, menu);

    // Log received message and available menu items for debugging
    console.log(`Received message: "${msg.text}"`);
    console.log(`Available menu items: ${currentMenu.map(item => `"${item.title}"`).join(', ')}`);

    // Helper function to normalize text for comparison
    const normalizeText = (text: string): string => {
      return text
        .trim()
        .normalize('NFD')  // Normalize Unicode characters
        .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
        .replace(/\s+/g, ' ');  // Normalize whitespace
    };

    // Normalize and prepare user text for comparison
    const userText = msg.text.trim();
    const normalizedUserText = normalizeText(userText);

    const selectedItem = currentMenu.find(item => {
      const itemTitle = item.title.trim();
      const normalizedItemTitle = normalizeText(itemTitle);

      // Exact match (case-sensitive)
      if (itemTitle === userText) {
        console.log(`Exact match found: "${itemTitle}" === "${userText}"`);
        return true;
      }

      // Normalized match
      if (normalizedItemTitle === normalizedUserText) {
        console.log(`Normalized match found: "${normalizedItemTitle}" === "${normalizedUserText}"`);
        return true;
      }

      // Case-insensitive match
      if (itemTitle.toLowerCase() === userText.toLowerCase()) {
        console.log(`Case-insensitive match found: "${itemTitle.toLowerCase()}" === "${userText.toLowerCase()}"`);
        return true;
      }

      // Check for keyboard button text that might have emoji or other characters
      // This helps with buttons that might have decorative elements
      if (itemTitle.includes(userText) || userText.includes(itemTitle)) {
        console.log(`Partial match found: "${itemTitle}" contains or is contained in "${userText}"`);
        return true;
      }

      return false;
    });

    if (!selectedItem) {
      // If not found in current menu, try to find it recursively in all menus
      const recursiveItem = findMenuItemRecursive(userText, menu);

      if (recursiveItem) {
        console.log(`Found item recursively: "${recursiveItem.title}"`);

        // Handle submenu
        if (recursiveItem.subMenu) {
          // Find the path to this item
          const findPath = (items: MenuItem[], target: MenuItem, currentPath: string[] = []): string[] | null => {
            for (const item of items) {
              if (item === target) {
                return [...currentPath, item.title];
              }

              if (item.subMenu) {
                const result = findPath(item.subMenu, target, [...currentPath, item.title]);
                if (result) return result;
              }
            }
            return null;
          };

          const path = findPath(menu, recursiveItem);
          if (path) {
            // Set user's menu state to the parent of the found item
            userMenuState[userId] = path.slice(0, -1);

            // Send submenu
            let message = '';
            if (recursiveItem.title === 'Выставки') {
              message = 'Выбери выставку, которая тебя интересует 👇';
            } else {
              message = `${recursiveItem.title}:`;
            }

            bot.sendMessage(chatId, message, {
              reply_markup: {
                keyboard: generateKeyboard(recursiveItem.subMenu),
                resize_keyboard: true
              }
            });
            return;
          }
        }

        // Handle message content
        if (recursiveItem.message) {
          await sendMessage(bot, chatId, recursiveItem.message);
          return;
        }

        // Handle "back" action for recursively found items
        if (recursiveItem.action === 'back') {
          if (userMenuState[userId].length > 0) {
            // If the title is "В главное меню", reset to main menu
            if (recursiveItem.title === 'В главное меню') {
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
              const newMenu = getCurrentMenu(userId, userMenuState, menu);
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
      }

      // Unknown command
      console.log('Неизвестная опция. Пожалуйста, выберите из меню')
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
          const newMenu = getCurrentMenu(userId, userMenuState, menu);
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
      await sendMessage(bot, chatId, selectedItem.message);
    }
  });
}
