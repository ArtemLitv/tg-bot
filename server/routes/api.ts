/**
 * Маршруты API для админ-панели
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { logInfo, logError } from '../logger';
import {
  getAllUsers,
  getUserById,
  getUserNodeHistory,
  getUserInputs,
  getUsersStatistics,
} from '../services/userService';
import {
  getActiveConfig,
  getConfigById,
  getAllConfigs,
  createConfig,
  updateConfig,
  activateConfig,
  deleteConfig,
  loadConfigFromFile,
} from '../services/configService';

export function setupApiRoutes(app: Express, prisma: PrismaClient, authenticateJWT: any) {
  // Маршруты для работы с пользователями

  // Получение списка пользователей с пагинацией, фильтрацией и сортировкой
  app.get('/api/users', authenticateJWT, async (req, res) => {
    try {
      const { page = '1', limit = '10', sort, order, filter, value } = req.query;

      const options = {
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
        orderBy: sort && order ? {
          field: sort as string,
          direction: (order as string).toLowerCase() === 'desc' ? 'desc' : 'asc',
        } : undefined,
        filter: filter && value ? {
          field: filter as string,
          value: value as string,
        } : undefined,
      };

      const { users, total } = await getAllUsers(prisma, options);

      res.json({
        users,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      logError('Ошибка при получении списка пользователей', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение статистики по пользователям
  app.get('/api/users/statistics', authenticateJWT, async (req, res) => {
    try {
      const statistics = await getUsersStatistics(prisma);
      res.json(statistics);
    } catch (error) {
      logError('Ошибка при получении статистики по пользователям', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение пользователя по ID
  app.get('/api/users/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await getUserById(prisma, id);

      if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }

      res.json(user);
    } catch (error) {
      logError('Ошибка при получении пользователя', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение истории переходов пользователя
  app.get('/api/users/:id/history', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { page = '1', limit = '10' } = req.query;

      const options = {
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      };

      const { history, total } = await getUserNodeHistory(prisma, id, options);

      res.json({
        history,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      logError('Ошибка при получении истории переходов пользователя', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение вводимых пользователем данных
  app.get('/api/users/:id/inputs', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { page = '1', limit = '10' } = req.query;

      const options = {
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      };

      const { inputs, total } = await getUserInputs(prisma, id, options);

      res.json({
        inputs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      logError('Ошибка при получении вводимых пользователем данных', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршруты для работы с конфигурацией бота

  // Получение активной конфигурации
  app.get('/api/config/active', authenticateJWT, async (req, res) => {
    try {
      const config = await getActiveConfig(prisma);

      if (!config) {
        return res.status(404).json({ error: 'Активная конфигурация не найдена' });
      }

      res.json(config);
    } catch (error) {
      logError('Ошибка при получении активной конфигурации', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение списка всех конфигураций
  app.get('/api/config', authenticateJWT, async (req, res) => {
    try {
      const { page = '1', limit = '10' } = req.query;

      const options = {
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        take: parseInt(limit as string),
      };

      const { configs, total } = await getAllConfigs(prisma, options);

      res.json({
        configs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      logError('Ошибка при получении списка конфигураций', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Получение конфигурации по ID
  app.get('/api/config/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const config = await getConfigById(prisma, id);

      if (!config) {
        return res.status(404).json({ error: 'Конфигурация не найдена' });
      }

      res.json(config);
    } catch (error) {
      logError('Ошибка при получении конфигурации', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Создание новой конфигурации
  app.post('/api/config', authenticateJWT, async (req, res) => {
    try {
      const { config, activate } = req.body;

      if (!config) {
        return res.status(400).json({ error: 'Конфигурация обязательна' });
      }

      const newConfig = await createConfig(prisma, config, activate);
      res.status(201).json(newConfig);
    } catch (error) {
      logError('Ошибка при создании конфигурации', error);

      if (error instanceof Error) {
        if (error.message === 'Невалидный JSON') {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Обновление конфигурации
  app.put('/api/config/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { config, activate } = req.body;

      if (!config) {
        return res.status(400).json({ error: 'Конфигурация обязательна' });
      }

      const updatedConfig = await updateConfig(prisma, id, config, activate);
      res.json(updatedConfig);
    } catch (error) {
      logError('Ошибка при обновлении конфигурации', error);

      if (error instanceof Error) {
        if (error.message === 'Конфигурация не найдена') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Невалидный JSON') {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Активация конфигурации
  app.post('/api/config/:id/activate', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const activatedConfig = await activateConfig(prisma, id);
      res.json(activatedConfig);
    } catch (error) {
      logError('Ошибка при активации конфигурации', error);

      if (error instanceof Error) {
        if (error.message === 'Конфигурация не найдена') {
          return res.status(404).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Удаление конфигурации
  app.delete('/api/config/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await deleteConfig(prisma, id);
      res.json({ message: 'Конфигурация успешно удалена' });
    } catch (error) {
      logError('Ошибка при удалении конфигурации', error);

      if (error instanceof Error) {
        if (error.message === 'Конфигурация не найдена') {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Нельзя удалить активную конфигурацию') {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Загрузка конфигурации из файла
  app.post('/api/config/load-from-file', authenticateJWT, async (req, res) => {
    try {
      const { filePath, activate } = req.body;

      if (!filePath) {
        return res.status(400).json({ error: 'Путь к файлу обязателен' });
      }

      const newConfig = await loadConfigFromFile(prisma, filePath, activate);
      res.status(201).json(newConfig);
    } catch (error) {
      logError('Ошибка при загрузке конфигурации из файла', error);

      if (error instanceof Error) {
        if (error.message.includes('Файл не найден')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message === 'Невалидный JSON') {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для получения логов
  app.get('/api/logs', authenticateJWT, async (req, res) => {
    try {
      const { page = '1', limit = '100', level } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Формируем условия для фильтрации по уровню логирования
      let where = {};
      if (level) {
        where = {
          level: level as string,
        };
      }

      // Получаем логи
      const logs = await prisma.log.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take,
      });

      // Получаем общее количество логов
      const total = await prisma.log.count({
        where,
      });

      res.json({
        logs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
        },
      });
    } catch (error) {
      logError('Ошибка при получении логов', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });
}
