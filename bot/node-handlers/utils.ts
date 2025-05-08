/**
 * Вспомогательные функции для обработчиков узлов
 */

import { Context, Markup } from 'telegraf';
import { 
  Attachment, 
  Button, 
  ContentItem, 
  ImageAttachment, 
  LinkAttachment, 
  LocationAttachment, 
  UserContext 
} from '../config-types';

/**
 * Создает клавиатуру с кнопками
 * @param buttons Массив кнопок
 * @param language Язык пользователя
 * @returns Объект клавиатуры Telegraf
 */
export function createKeyboard(buttons: Button[], language: string) {
  const keyboard = buttons.map(button => {
    const label = button.label[language] || Object.values(button.label)[0];
    return [Markup.button.callback(label, `node:${button.target_node_id}`)];
  });

  return Markup.keyboard(keyboard).resize();
}

/**
 * Отправляет сообщение с учетом вложений и форматирования
 * @param ctx Контекст Telegraf
 * @param content Содержимое сообщения
 * @param language Язык пользователя
 * @param buttons Кнопки (опционально)
 */
export async function sendContent(
  ctx: Context, 
  content: Record<string, ContentItem>, 
  language: string,
  buttons?: Button[]
) {
  // Получаем содержимое для выбранного языка или первый доступный язык
  const contentItem = content[language] || Object.values(content)[0];
  
  if (!contentItem) {
    throw new Error('Не удалось найти содержимое для отправки');
  }

  // Создаем клавиатуру, если есть кнопки
  const keyboard = buttons ? createKeyboard(buttons, language) : undefined;
  
  // Если есть вложения, обрабатываем их
  if (contentItem.attachments && contentItem.attachments.length > 0) {
    await handleAttachments(ctx, contentItem.attachments, contentItem.text, contentItem.format, keyboard);
  } else {
    // Отправляем только текст
    await sendFormattedText(ctx, contentItem.text, contentItem.format, keyboard);
  }
}

/**
 * Отправляет форматированный текст
 * @param ctx Контекст Telegraf
 * @param text Текст сообщения
 * @param format Формат текста (markdown, html, plain)
 * @param keyboard Клавиатура (опционально)
 */
async function sendFormattedText(
  ctx: Context, 
  text: string, 
  format?: string,
  keyboard?: any
) {
  const options = keyboard ? { ...keyboard } : {};

  switch (format) {
    case 'markdown':
      await ctx.replyWithMarkdown(text, options);
      break;
    case 'html':
      await ctx.replyWithHTML(text, options);
      break;
    default:
      await ctx.reply(text, options);
      break;
  }
}

/**
 * Обрабатывает вложения и отправляет их
 * @param ctx Контекст Telegraf
 * @param attachments Массив вложений
 * @param text Текст сообщения
 * @param format Формат текста
 * @param keyboard Клавиатура (опционально)
 */
async function handleAttachments(
  ctx: Context, 
  attachments: Attachment[], 
  text: string,
  format?: string,
  keyboard?: any
) {
  // Сначала отправляем текст, если он есть
  if (text) {
    await sendFormattedText(ctx, text, format);
  }

  // Затем отправляем каждое вложение
  for (const attachment of attachments) {
    await sendAttachment(ctx, attachment);
  }

  // Если есть клавиатура, отправляем её с последним сообщением
  if (keyboard) {
    await ctx.reply('Выберите действие:', keyboard);
  }
}

/**
 * Отправляет одно вложение
 * @param ctx Контекст Telegraf
 * @param attachment Вложение
 */
async function sendAttachment(ctx: Context, attachment: Attachment) {
  switch (attachment.type) {
    case 'image':
      await sendImageAttachment(ctx, attachment);
      break;
    case 'link':
      await sendLinkAttachment(ctx, attachment);
      break;
    case 'location':
      await sendLocationAttachment(ctx, attachment);
      break;
    default:
      throw new Error(`Неизвестный тип вложения: ${(attachment as any).type}`);
  }
}

/**
 * Отправляет изображение
 * @param ctx Контекст Telegraf
 * @param attachment Вложение с изображением
 */
async function sendImageAttachment(ctx: Context, attachment: ImageAttachment) {
  await ctx.replyWithPhoto(attachment.url);
}

/**
 * Отправляет ссылку
 * @param ctx Контекст Telegraf
 * @param attachment Вложение со ссылкой
 */
async function sendLinkAttachment(ctx: Context, attachment: LinkAttachment) {
  await ctx.reply(`${attachment.text}: ${attachment.url}`);
}

/**
 * Отправляет местоположение
 * @param ctx Контекст Telegraf
 * @param attachment Вложение с местоположением
 */
async function sendLocationAttachment(ctx: Context, attachment: LocationAttachment) {
  await ctx.replyWithLocation(attachment.lat, attachment.lon);
}

/**
 * Получает ID пользователя из контекста
 * @param ctx Контекст Telegraf
 * @returns ID пользователя
 */
export function getUserId(ctx: Context): number {
  if (!ctx.from) {
    throw new Error('Не удалось получить ID пользователя');
  }
  return ctx.from.id;
}

/**
 * Получает ID чата из контекста
 * @param ctx Контекст Telegraf
 * @returns ID чата
 */
export function getChatId(ctx: Context): number {
  if (!ctx.chat) {
    throw new Error('Не удалось получить ID чата');
  }
  return ctx.chat.id;
}