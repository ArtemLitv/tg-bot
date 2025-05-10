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
 * Экранирует специальные символы для формата MarkdownV2
 * @param text Текст для экранирования
 * @returns Экранированный текст
 */
function escapeMarkdownV2(text: string): string {
  // Специальные символы, которые нужно экранировать в MarkdownV2
  const specialChars = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];

  let result = text;
  for (const char of specialChars) {
    // Заменяем каждый специальный символ на экранированный вариант
    result = result.replace(new RegExp('\\' + char, 'g'), '\\' + char);
  }

  return result;
}

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
      await ctx.replyWithMarkdownV2(escapeMarkdownV2(text), options);
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
 * Обрабатывает вложения и отправляет их вместе с текстом в одном сообщении
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
  // Находим первое вложение с изображением, если есть
  const imageAttachment = attachments.find(att => att.type === 'image') as ImageAttachment | undefined;

  // Максимальная длина подписи в Telegram
  const MAX_CAPTION_LENGTH = 1024;

  // Если есть изображение, проверяем длину текста
  if (imageAttachment) {
    const options: any = {};
    let formattedText = text;
    let textTooLong = false;

    // Форматируем текст, если указан формат
    if (text) {
      if (format === 'markdown') {
        formattedText = escapeMarkdownV2(text);
        // Проверяем длину после экранирования
        if (formattedText.length > MAX_CAPTION_LENGTH) {
          textTooLong = true;
        } else {
          options.caption = formattedText;
          options.parse_mode = 'MarkdownV2';
        }
      } else if (format === 'html') {
        // Проверяем длину текста
        if (text.length > MAX_CAPTION_LENGTH) {
          textTooLong = true;
        } else {
          options.caption = text;
          options.parse_mode = 'HTML';
        }
      } else {
        // Проверяем длину текста
        if (text.length > MAX_CAPTION_LENGTH) {
          textTooLong = true;
        } else {
          options.caption = text;
        }
      }
    }

    // Добавляем клавиатуру, если есть
    if (keyboard) {
      options.reply_markup = keyboard;
    }

    // Если текст слишком длинный, отправляем его отдельно
    if (textTooLong) {
      // Сначала отправляем текст
      await sendFormattedText(ctx, text, format, keyboard);

      // Затем отправляем изображение без текста
      await ctx.replyWithPhoto(imageAttachment.url);
    } else {
      // Отправляем изображение с текстом и клавиатурой
      await ctx.replyWithPhoto(imageAttachment.url, options);
    }

    // Отправляем остальные вложения, если они есть
    const otherAttachments = attachments.filter(att => att !== imageAttachment);
    for (const attachment of otherAttachments) {
      await sendAttachment(ctx, attachment);
    }
  } else {
    // Если нет изображения, отправляем текст с клавиатурой
    if (text) {
      await sendFormattedText(ctx, text, format, keyboard);
    } else if (keyboard) {
      await ctx.reply('Выберите действие:', keyboard);
    }

    // Отправляем все вложения
    for (const attachment of attachments) {
      await sendAttachment(ctx, attachment);
    }
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
