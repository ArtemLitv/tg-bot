/**
 * Маршруты для авторизации
 */

import { Express } from 'express';
import { PassportStatic } from 'passport';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { logInfo, logError } from '../logger';
import { createAdmin, updateAdmin, deleteAdmin, getAllAdmins, getAdminById } from '../services/adminService';

// Middleware для проверки JWT токена
const authenticateJWT = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }

      req.user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Требуется авторизация' });
  }
};

export function setupAuthRoutes(app: Express, passport: PassportStatic, prisma: PrismaClient) {
  // Маршрут для локальной авторизации
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (err) {
        logError('Ошибка при авторизации', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }

      if (!user) {
        return res.status(401).json({ error: info.message || 'Неверное имя пользователя или пароль' });
      }

      // Создаем JWT токен
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      logInfo(`Пользователь ${user.username} успешно авторизован`);
      return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    })(req, res, next);
  });

  // Маршрут для авторизации через Google OAuth
  app.get(
    '/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })
  );

  // Маршрут для обработки ответа от Google OAuth
  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login' }),
    (req, res) => {
      // Создаем JWT токен
      const user = req.user as any;
      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      // Перенаправляем на клиентскую часть с токеном
      res.redirect(`/?token=${token}`);
    }
  );

  // Маршрут для проверки авторизации
  app.get('/api/auth/check', authenticateJWT, (req, res) => {
    res.json({ user: req.user });
  });

  // Маршрут для выхода из системы
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        logError('Ошибка при выходе из системы', err);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
      }
      res.json({ message: 'Выход из системы выполнен успешно' });
    });
  });

  // Маршрут для получения списка администраторов
  app.get('/api/admins', authenticateJWT, async (req, res) => {
    try {
      const admins = await getAllAdmins(prisma);
      res.json(admins);
    } catch (error) {
      logError('Ошибка при получении списка администраторов', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для получения администратора по ID
  app.get('/api/admins/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const admin = await getAdminById(prisma, id);

      if (!admin) {
        return res.status(404).json({ error: 'Администратор не найден' });
      }

      res.json(admin);
    } catch (error) {
      logError('Ошибка при получении администратора', error);
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для создания нового администратора
  app.post('/api/admins', authenticateJWT, async (req, res) => {
    try {
      const { username, password, email, googleId } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
      }

      const admin = await createAdmin(prisma, username, password, email, googleId);
      res.status(201).json(admin);
    } catch (error) {
      logError('Ошибка при создании администратора', error);

      if (error instanceof Error) {
        if (error.message.includes('уже существует')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для обновления администратора
  app.put('/api/admins/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { username, password, email, googleId } = req.body;

      const admin = await updateAdmin(prisma, id, { username, password, email, googleId });
      res.json(admin);
    } catch (error) {
      logError('Ошибка при обновлении администратора', error);

      if (error instanceof Error) {
        if (error.message.includes('не найден')) {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.includes('уже существует')) {
          return res.status(400).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Маршрут для удаления администратора
  app.delete('/api/admins/:id', authenticateJWT, async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      await deleteAdmin(prisma, id);
      res.json({ message: 'Администратор успешно удален' });
    } catch (error) {
      logError('Ошибка при удалении администратора', error);

      if (error instanceof Error) {
        if (error.message.includes('не найден')) {
          return res.status(404).json({ error: error.message });
        }
      }

      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  });

  // Экспортируем middleware для проверки JWT токена
  return { authenticateJWT };
}