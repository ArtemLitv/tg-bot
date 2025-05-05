import TelegramBot from 'node-telegram-bot-api';
import {MenuItem, MessageContent} from './menu';

// Function to generate keyboard markup from menu items
export function generateKeyboard(items: MenuItem[]): TelegramBot.KeyboardButton[][] {
  return [
    ...items.map(item => [{ text: item.title }])
  ];
}

// Function to find a menu item by its title
export function findMenuItem(path: string[], menu: MenuItem[]): MenuItem | null {
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

// Function to find a menu item recursively by its title
export function findMenuItemRecursive(title: string, menu: MenuItem[]): MenuItem | null {
  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .trim()
      .normalize('NFD')  // Normalize Unicode characters
      .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
      .replace(/\s+/g, ' ');  // Normalize whitespace
  };

  const normalizedTitle = normalizeText(title);

  // Recursive search function
  const search = (items: MenuItem[]): MenuItem | null => {
    for (const item of items) {
      const itemTitle = item.title.trim();
      const normalizedItemTitle = normalizeText(itemTitle);

      // Check for various matches
      if (
        itemTitle === title || 
        normalizedItemTitle === normalizedTitle || 
        itemTitle.toLowerCase() === title.toLowerCase() ||
        itemTitle.includes(title) || 
        title.includes(itemTitle)
      ) {
        return item;
      }

      // Recursively search in submenu
      if (item.subMenu) {
        const found = search(item.subMenu);
        if (found) return found;
      }
    }
    return null;
  };

  return search(menu);
}

// Function to get the current menu based on user's state
export function getCurrentMenu(userId: number, userMenuState: Record<number, string[]>, menu: MenuItem[]): MenuItem[] {
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
export async function sendMessage(bot: TelegramBot, chatId: number, content: string | MessageContent): Promise<void> {
  if (typeof content === 'string') {
    await bot.sendMessage(chatId, content);
    console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
    return;
  }

  // Handle complex message content - prioritize content types
  if (content.photo) {
    try {
      // If photo is present, send it first without any caption
      await bot.sendPhoto(chatId, content.photo);
      console.log(`Отправлено фото пользователю ${chatId}: ${content.photo.substring(0, 30)}...`);

      // Then send the text as a separate message
      if (content.text) {
        await bot.sendMessage(chatId, content.text);
        console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
      }

      // If there's also a link, send it as a separate message
      if (content.link) {
        const linkMessage = `[${content.link.text}](${content.link.url})`;
        await bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
        console.log(`Отправлена ссылка пользователю ${chatId}: ${content.link.text} (${content.link.url})`);
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      // Fallback to sending just the text and link
      if (content.text) {
        await bot.sendMessage(chatId, content.text);
        console.log(`Отправлено текстовое сообщение (fallback) пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
      }
      if (content.link) {
        const linkMessage = `[${content.link.text}](${content.link.url})`;
        await bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
        console.log(`Отправлена ссылка (fallback) пользователю ${chatId}: ${content.link.text} (${content.link.url})`);
      }
    }
  } else if (content.link) {
    // If link is present (and no photo), format with Markdown
    const text = content.text ? `${content.text}\n\n` : '';
    const message = `${text}[${content.link.text}](${content.link.url})`;
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`Отправлено сообщение со ссылкой пользователю ${chatId}: ${content.link.text} (${content.link.url})`);
    if (content.text) {
      console.log(`Текст сообщения: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
    }
  } else if (content.location) {
    // If location is present (and no photo or link)
    await bot.sendLocation(chatId, content.location.latitude, content.location.longitude);
    console.log(`Отправлена геолокация пользователю ${chatId}: ${content.location.latitude}, ${content.location.longitude}`);
    if (content.text) {
      await bot.sendMessage(chatId, content.text);
      console.log(`Отправлено текстовое сообщение с геолокацией пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
    }
  } else if (content.text) {
    // If only text is present
    await bot.sendMessage(chatId, content.text);
    console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
  }
}
