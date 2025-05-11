/**
 * Сервис для работы с конфигурацией бота
 */

import { PrismaClient, BotConfig } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { logInfo, logError, logWarn } from '../logger';

/**
 * Получает активную конфигурацию бота
 */
export async function getActiveConfig(prisma: PrismaClient): Promise<BotConfig | null> {
  try {
    const activeConfig = await prisma.botConfig.findFirst({
      where: { isActive: true },
    });

    return activeConfig;
  } catch (error) {
    logError('Ошибка при получении активной конфигурации бота', error);
    throw error;
  }
}

/**
 * Получает конфигурацию бота по ID
 */
export async function getConfigById(prisma: PrismaClient, id: number): Promise<BotConfig | null> {
  try {
    const config = await prisma.botConfig.findUnique({
      where: { id },
    });

    return config;
  } catch (error) {
    logError('Ошибка при получении конфигурации бота по ID', error);
    throw error;
  }
}

/**
 * Получает список всех конфигураций бота
 */
export async function getAllConfigs(
  prisma: PrismaClient,
  options?: {
    skip?: number;
    take?: number;
  }
): Promise<{ configs: BotConfig[]; total: number }> {
  try {
    const { skip = 0, take = 10 } = options || {};

    // Получаем конфигурации
    const configs = await prisma.botConfig.findMany({
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    });

    // Получаем общее количество конфигураций
    const total = await prisma.botConfig.count();

    return { configs, total };
  } catch (error) {
    logError('Ошибка при получении списка конфигураций бота', error);
    throw error;
  }
}

/**
 * Создает новую конфигурацию бота
 */
export async function createConfig(
  prisma: PrismaClient,
  config: string,
  activate: boolean = false
): Promise<BotConfig> {
  try {
    // Проверяем валидность JSON
    try {
      JSON.parse(config);
    } catch (e) {
      throw new Error('Невалидный JSON');
    }

    // Если нужно активировать новую конфигурацию, деактивируем текущую активную
    if (activate) {
      await prisma.botConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Создаем новую конфигурацию
    const newConfig = await prisma.botConfig.create({
      data: {
        config,
        isActive: activate,
      },
    });

    // Если нужно активировать, сохраняем конфигурацию в файл
    if (activate) {
      await saveConfigToFile(config);
    }

    logInfo(`Создана новая конфигурация бота с ID: ${newConfig.id}`);
    return newConfig;
  } catch (error) {
    logError('Ошибка при создании новой конфигурации бота', error);
    throw error;
  }
}

/**
 * Обновляет конфигурацию бота
 */
export async function updateConfig(
  prisma: PrismaClient,
  id: number,
  config: string,
  activate: boolean = false
): Promise<BotConfig> {
  try {
    // Проверяем, существует ли конфигурация
    const existingConfig = await prisma.botConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error('Конфигурация не найдена');
    }

    // Проверяем валидность JSON
    try {
      JSON.parse(config);
    } catch (e) {
      throw new Error('Невалидный JSON');
    }

    // Если нужно активировать конфигурацию, деактивируем текущую активную
    if (activate) {
      await prisma.botConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Обновляем конфигурацию
    const updatedConfig = await prisma.botConfig.update({
      where: { id },
      data: {
        config,
        isActive: activate,
        updatedAt: new Date(),
      },
    });

    // Если нужно активировать, сохраняем конфигурацию в файл
    if (activate) {
      await saveConfigToFile(config);
    }

    logInfo(`Обновлена конфигурация бота с ID: ${id}`);
    return updatedConfig;
  } catch (error) {
    logError('Ошибка при обновлении конфигурации бота', error);
    throw error;
  }
}

/**
 * Активирует конфигурацию бота
 */
export async function activateConfig(prisma: PrismaClient, id: number): Promise<BotConfig> {
  try {
    // Проверяем, существует ли конфигурация
    const existingConfig = await prisma.botConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error('Конфигурация не найдена');
    }

    // Деактивируем текущую активную конфигурацию
    await prisma.botConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Активируем выбранную конфигурацию
    const activatedConfig = await prisma.botConfig.update({
      where: { id },
      data: {
        isActive: true,
        updatedAt: new Date(),
      },
    });

    // Сохраняем конфигурацию в файл
    await saveConfigToFile(existingConfig.config);

    logInfo(`Активирована конфигурация бота с ID: ${id}`);
    return activatedConfig;
  } catch (error) {
    logError('Ошибка при активации конфигурации бота', error);
    throw error;
  }
}

/**
 * Удаляет конфигурацию бота
 */
export async function deleteConfig(prisma: PrismaClient, id: number): Promise<void> {
  try {
    // Проверяем, существует ли конфигурация
    const existingConfig = await prisma.botConfig.findUnique({
      where: { id },
    });

    if (!existingConfig) {
      throw new Error('Конфигурация не найдена');
    }

    // Проверяем, не является ли конфигурация активной
    if (existingConfig.isActive) {
      throw new Error('Нельзя удалить активную конфигурацию');
    }

    // Удаляем конфигурацию
    await prisma.botConfig.delete({
      where: { id },
    });

    logInfo(`Удалена конфигурация бота с ID: ${id}`);
  } catch (error) {
    logError('Ошибка при удалении конфигурации бота', error);
    throw error;
  }
}

/**
 * Загружает конфигурацию из файла и сохраняет в базу данных
 */
export async function loadConfigFromFile(
  prisma: PrismaClient,
  filePath: string,
  activate: boolean = false
): Promise<BotConfig> {
  try {
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      throw new Error(`Файл не найден: ${filePath}`);
    }

    // Читаем файл
    const configContent = fs.readFileSync(filePath, 'utf-8');

    // Проверяем валидность JSON
    try {
      JSON.parse(configContent);
    } catch (e) {
      throw new Error('Невалидный JSON');
    }

    // Если нужно активировать конфигурацию, деактивируем текущую активную
    if (activate) {
      await prisma.botConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    // Создаем новую конфигурацию
    const newConfig = await prisma.botConfig.create({
      data: {
        config: configContent,
        isActive: activate,
      },
    });

    logInfo(`Загружена конфигурация из файла: ${filePath}`);
    return newConfig;
  } catch (error) {
    logError('Ошибка при загрузке конфигурации из файла', error);
    throw error;
  }
}

/**
 * Сохраняет конфигурацию в файл
 */
export async function saveConfigToFile(config: string): Promise<void> {
  try {
    const configPath = process.env.BOT_CONFIG_PATH || path.resolve(__dirname, '../../config/bot-config.json');

    // Создаем директорию, если она не существует
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Записываем конфигурацию в файл
    fs.writeFileSync(configPath, config, 'utf-8');

    logInfo(`Конфигурация сохранена в файл: ${configPath}`);
  } catch (error) {
    logError('Ошибка при сохранении конфигурации в файл', error);
    throw error;
  }
}

/**
 * Инициализирует конфигурацию бота при первом запуске
 */
export async function initializeConfig(prisma: PrismaClient): Promise<void> {
  try {
    // Проверяем, есть ли активная конфигурация
    const activeConfig = await prisma.botConfig.findFirst({
      where: { isActive: true },
    });

    // Если активной конфигурации нет, проверяем наличие файла конфигурации
    if (!activeConfig) {
      const configPath = process.env.BOT_CONFIG_PATH || path.resolve(__dirname, '../../config/bot-config.json');

      if (fs.existsSync(configPath)) {
        // Загружаем конфигурацию из файла
        await loadConfigFromFile(prisma, configPath, true);
        logInfo('Инициализирована конфигурация бота из файла');
      } else {
        logWarn('Файл конфигурации не найден. Необходимо создать конфигурацию вручную.');
      }
    }
  } catch (error) {
    logError('Ошибка при инициализации конфигурации бота', error);
    throw error;
  }
}
