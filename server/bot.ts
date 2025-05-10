/**
 * Расширение класса Bot для сохранения информации о пользователях в базе данных
 */

import { Bot as OriginalBot } from '../bot/bot';
import { PrismaClient } from '@prisma/client';
import { Context } from 'telegraf';
import { logInfo, logError } from './logger';
import { createOrUpdateUser, addNodeHistory, saveUserInput, getUserByTelegramId } from './services/userService';
import { getUserId, getChatId } from '../bot/node-handlers/utils';

export class Bot extends OriginalBot {
  private prisma: PrismaClient;

  constructor(token: string, configPath: string, prisma: PrismaClient) {
    super(token, configPath);
    this.prisma = prisma;
  }

  /**
   * Переопределяем метод setupHandlers для добавления сохранения информации о пользователях
   */
  protected setupHandlers(): void {
    // Вызываем оригинальный метод
    super.setupHandlers();

    // Добавляем обработчик для сохранения информации о пользователях при каждом сообщении
    this.bot.use(async (ctx, next) => {
      try {
        await this.saveUserInfo(ctx);
      } catch (error) {
        logError('Ошибка при сохранении информации о пользователе', error);
      }
      return next();
    });
  }

  /**
   * Переопределяем метод handleStart для сохранения информации о начале диалога
   */
  protected async handleStart(ctx: Context): Promise<void> {
    try {
      // Получаем информацию о пользователе
      const userId = getUserId(ctx);
      const chatId = getChatId(ctx);
      const user = ctx.from;

      if (user) {
        // Сохраняем информацию о пользователе
        const dbUser = await createOrUpdateUser(this.prisma, {
          telegramId: userId,
          username: user.username,
          firstName: user.first_name,
          lastName: user.last_name,
          languageCode: user.language_code,
          currentNodeId: this.config.start_node_id,
        });

        // Добавляем запись в историю переходов
        await addNodeHistory(this.prisma, dbUser.id, this.config.start_node_id);

        logInfo(`Пользователь ${userId} начал диалог`);
      }
    } catch (error) {
      logError('Ошибка при обработке команды /start', error);
    }

    // Вызываем оригинальный метод
    await super.handleStart(ctx);
  }

  /**
   * Переопределяем метод handleNodeTransition для сохранения информации о переходах между узлами
   */
  protected async handleNodeTransition(ctx: Context, nodeId: string): Promise<void> {
    try {
      // Получаем информацию о пользователе
      const userId = getUserId(ctx);
      const dbUser = await getUserByTelegramId(this.prisma, userId);

      if (dbUser) {
        // Обновляем текущий узел пользователя
        await createOrUpdateUser(this.prisma, {
          telegramId: userId,
          currentNodeId: nodeId,
        });

        // Добавляем запись в историю переходов
        await addNodeHistory(this.prisma, dbUser.id, nodeId);

        logInfo(`Пользователь ${userId} перешел к узлу ${nodeId}`);
      }
    } catch (error) {
      logError('Ошибка при обработке перехода между узлами', error);
    }

    // Вызываем оригинальный метод
    await super.handleNodeTransition(ctx, nodeId);
  }

  /**
   * Переопределяем метод handleMessage для сохранения вводимых пользователем данных
   */
  protected async handleMessage(ctx: Context, message: any): Promise<void> {
    try {
      // Получаем информацию о пользователе
      const userId = getUserId(ctx);
      const dbUser = await getUserByTelegramId(this.prisma, userId);

      if (dbUser && dbUser.currentNodeId) {
        // Определяем тип вводимых данных
        let inputType = 'text';
        let inputValue = '';

        if (message.text) {
          inputType = 'text';
          inputValue = message.text;
        } else if (message.location) {
          inputType = 'location';
          inputValue = JSON.stringify(message.location);
        } else if (message.photo) {
          inputType = 'photo';
          inputValue = JSON.stringify(message.photo);
        } else if (message.document) {
          inputType = 'document';
          inputValue = JSON.stringify(message.document);
        } else if (message.voice) {
          inputType = 'voice';
          inputValue = JSON.stringify(message.voice);
        } else if (message.video) {
          inputType = 'video';
          inputValue = JSON.stringify(message.video);
        } else if (message.audio) {
          inputType = 'audio';
          inputValue = JSON.stringify(message.audio);
        } else if (message.sticker) {
          inputType = 'sticker';
          inputValue = JSON.stringify(message.sticker);
        } else if (message.contact) {
          inputType = 'contact';
          inputValue = JSON.stringify(message.contact);
        } else {
          inputType = 'other';
          inputValue = JSON.stringify(message);
        }

        // Сохраняем вводимые данные
        await saveUserInput(this.prisma, dbUser.id, dbUser.currentNodeId, inputType, inputValue);

        logInfo(`Пользователь ${userId} ввел данные типа ${inputType}`);
      }
    } catch (error) {
      logError('Ошибка при сохранении вводимых пользователем данных', error);
    }

    // Вызываем оригинальный метод
    await super.handleMessage(ctx, message);
  }

  /**
   * Сохраняет информацию о пользователе
   */
  private async saveUserInfo(ctx: Context): Promise<void> {
    try {
      const userId = getUserId(ctx);
      const user = ctx.from;

      if (user) {
        // Получаем текущего пользователя из базы данных
        const dbUser = await getUserByTelegramId(this.prisma, userId);

        // Если пользователь существует, обновляем время последней активности
        if (dbUser) {
          await createOrUpdateUser(this.prisma, {
            telegramId: userId,
            lastActivityAt: new Date(),
            currentNodeId: dbUser.currentNodeId,
          });
        }
        // Если пользователя нет, создаем его
        else {
          await createOrUpdateUser(this.prisma, {
            telegramId: userId,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            languageCode: user.language_code,
            currentNodeId: this.config.start_node_id,
          });

          logInfo(`Создан новый пользователь ${userId}`);
        }
      }
    } catch (error) {
      logError('Ошибка при сохранении информации о пользователе', error);
    }
  }
}