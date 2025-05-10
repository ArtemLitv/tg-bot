/**
 * Сервис для работы с пользователями Telegram-бота
 */

import { PrismaClient, User, NodeHistory, UserInput } from '@prisma/client';
import { logInfo, logError } from '../logger';

/**
 * Создает или обновляет пользователя
 */
export async function createOrUpdateUser(
  prisma: PrismaClient,
  data: {
    telegramId: number;
    username?: string;
    firstName?: string;
    lastName?: string;
    languageCode?: string;
    currentNodeId: string;
  }
): Promise<User> {
  try {
    // Ищем пользователя по Telegram ID
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: data.telegramId },
    });

    if (existingUser) {
      // Обновляем существующего пользователя
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          languageCode: data.languageCode,
          currentNodeId: data.currentNodeId,
          lastActivityAt: new Date(),
        },
      });

      logInfo(`Обновлен пользователь с Telegram ID: ${data.telegramId}`);
      return updatedUser;
    } else {
      // Создаем нового пользователя
      const newUser = await prisma.user.create({
        data: {
          telegramId: data.telegramId,
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          languageCode: data.languageCode,
          currentNodeId: data.currentNodeId,
        },
      });

      logInfo(`Создан новый пользователь с Telegram ID: ${data.telegramId}`);
      return newUser;
    }
  } catch (error) {
    logError('Ошибка при создании или обновлении пользователя', error);
    throw error;
  }
}

/**
 * Добавляет запись в историю переходов пользователя
 */
export async function addNodeHistory(
  prisma: PrismaClient,
  userId: number,
  nodeId: string
): Promise<NodeHistory> {
  try {
    const nodeHistory = await prisma.nodeHistory.create({
      data: {
        userId,
        nodeId,
      },
    });

    logInfo(`Добавлена запись в историю переходов пользователя с ID: ${userId}`);
    return nodeHistory;
  } catch (error) {
    logError('Ошибка при добавлении записи в историю переходов', error);
    throw error;
  }
}

/**
 * Сохраняет вводимые пользователем данные
 */
export async function saveUserInput(
  prisma: PrismaClient,
  userId: number,
  nodeId: string,
  inputType: string,
  inputValue: string
): Promise<UserInput> {
  try {
    const userInput = await prisma.userInput.create({
      data: {
        userId,
        nodeId,
        inputType,
        inputValue,
      },
    });

    logInfo(`Сохранены данные, введенные пользователем с ID: ${userId}`);
    return userInput;
  } catch (error) {
    logError('Ошибка при сохранении вводимых пользователем данных', error);
    throw error;
  }
}

/**
 * Получает пользователя по Telegram ID
 */
export async function getUserByTelegramId(
  prisma: PrismaClient,
  telegramId: number
): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
    });

    return user;
  } catch (error) {
    logError('Ошибка при получении пользователя по Telegram ID', error);
    throw error;
  }
}

/**
 * Получает пользователя по ID
 */
export async function getUserById(
  prisma: PrismaClient,
  id: number
): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user;
  } catch (error) {
    logError('Ошибка при получении пользователя по ID', error);
    throw error;
  }
}

/**
 * Получает список всех пользователей
 */
export async function getAllUsers(
  prisma: PrismaClient,
  options?: {
    skip?: number;
    take?: number;
    orderBy?: {
      field: string;
      direction: 'asc' | 'desc';
    };
    filter?: {
      field: string;
      value: string;
    };
  }
): Promise<{ users: User[]; total: number }> {
  try {
    const { skip = 0, take = 10, orderBy, filter } = options || {};

    // Формируем условия для фильтрации
    let where = {};
    if (filter) {
      where = {
        [filter.field]: {
          contains: filter.value,
        },
      };
    }

    // Формируем условия для сортировки
    let orderByCondition = {};
    if (orderBy) {
      orderByCondition = {
        [orderBy.field]: orderBy.direction,
      };
    } else {
      orderByCondition = {
        lastActivityAt: 'desc',
      };
    }

    // Получаем пользователей
    const users = await prisma.user.findMany({
      where,
      orderBy: orderByCondition,
      skip,
      take,
    });

    // Получаем общее количество пользователей
    const total = await prisma.user.count({
      where,
    });

    return { users, total };
  } catch (error) {
    logError('Ошибка при получении списка пользователей', error);
    throw error;
  }
}

/**
 * Получает историю переходов пользователя
 */
export async function getUserNodeHistory(
  prisma: PrismaClient,
  userId: number,
  options?: {
    skip?: number;
    take?: number;
  }
): Promise<{ history: NodeHistory[]; total: number }> {
  try {
    const { skip = 0, take = 10 } = options || {};

    // Получаем историю переходов
    const history = await prisma.nodeHistory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });

    // Получаем общее количество записей
    const total = await prisma.nodeHistory.count({
      where: { userId },
    });

    return { history, total };
  } catch (error) {
    logError('Ошибка при получении истории переходов пользователя', error);
    throw error;
  }
}

/**
 * Получает вводимые пользователем данные
 */
export async function getUserInputs(
  prisma: PrismaClient,
  userId: number,
  options?: {
    skip?: number;
    take?: number;
  }
): Promise<{ inputs: UserInput[]; total: number }> {
  try {
    const { skip = 0, take = 10 } = options || {};

    // Получаем вводимые данные
    const inputs = await prisma.userInput.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      skip,
      take,
    });

    // Получаем общее количество записей
    const total = await prisma.userInput.count({
      where: { userId },
    });

    return { inputs, total };
  } catch (error) {
    logError('Ошибка при получении вводимых пользователем данных', error);
    throw error;
  }
}

/**
 * Получает статистику по пользователям
 */
export async function getUsersStatistics(
  prisma: PrismaClient
): Promise<{
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  activeThisMonth: number;
}> {
  try {
    // Получаем текущую дату
    const now = new Date();
    
    // Получаем дату начала дня
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    // Получаем дату начала недели (понедельник)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Получаем дату начала месяца
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Получаем общее количество пользователей
    const totalUsers = await prisma.user.count();
    
    // Получаем количество активных пользователей за сегодня
    const activeToday = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: startOfDay,
        },
      },
    });
    
    // Получаем количество активных пользователей за неделю
    const activeThisWeek = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: startOfWeek,
        },
      },
    });
    
    // Получаем количество активных пользователей за месяц
    const activeThisMonth = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: startOfMonth,
        },
      },
    });
    
    return {
      totalUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
    };
  } catch (error) {
    logError('Ошибка при получении статистики по пользователям', error);
    throw error;
  }
}