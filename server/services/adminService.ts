/**
 * Сервис для работы с администраторами
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logInfo, logError } from '../logger';

/**
 * Создает администратора по умолчанию, если он не существует
 */
export async function createDefaultAdmin(prisma: PrismaClient): Promise<void> {
  try {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';

    // Проверяем, существует ли администратор с таким именем пользователя
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (!existingAdmin) {
      // Хешируем пароль
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Создаем администратора
      await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          email,
        },
      });

      logInfo(`Создан администратор по умолчанию с именем пользователя: ${username}`);
    } else {
      logInfo('Администратор по умолчанию уже существует');
    }
  } catch (error) {
    logError('Ошибка при создании администратора по умолчанию', error);
    throw error;
  }
}

/**
 * Создает нового администратора
 */
export async function createAdmin(
  prisma: PrismaClient,
  username: string,
  password: string,
  email?: string,
  googleId?: string
): Promise<any> {
  try {
    // Проверяем, существует ли администратор с таким именем пользователя
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      throw new Error('Администратор с таким именем пользователя уже существует');
    }

    // Проверяем, существует ли администратор с таким email
    if (email) {
      const existingAdminByEmail = await prisma.admin.findUnique({
        where: { email },
      });

      if (existingAdminByEmail) {
        throw new Error('Администратор с таким email уже существует');
      }
    }

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Создаем администратора
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        email,
        googleId,
      },
    });

    logInfo(`Создан новый администратор с именем пользователя: ${username}`);

    // Возвращаем администратора без пароля
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  } catch (error) {
    logError('Ошибка при создании администратора', error);
    throw error;
  }
}

/**
 * Обновляет данные администратора
 */
export async function updateAdmin(
  prisma: PrismaClient,
  id: number,
  data: {
    username?: string;
    password?: string;
    email?: string;
    googleId?: string;
  }
): Promise<any> {
  try {
    // Проверяем, существует ли администратор
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new Error('Администратор не найден');
    }

    // Если меняем имя пользователя, проверяем, что оно уникально
    if (data.username && data.username !== existingAdmin.username) {
      const existingAdminByUsername = await prisma.admin.findUnique({
        where: { username: data.username },
      });

      if (existingAdminByUsername) {
        throw new Error('Администратор с таким именем пользователя уже существует');
      }
    }

    // Если меняем email, проверяем, что он уникален
    if (data.email && data.email !== existingAdmin.email) {
      const existingAdminByEmail = await prisma.admin.findUnique({
        where: { email: data.email },
      });

      if (existingAdminByEmail) {
        throw new Error('Администратор с таким email уже существует');
      }
    }

    // Если меняем пароль, хешируем его
    let hashedPassword;
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(data.password, salt);
    }

    // Обновляем администратора
    const admin = await prisma.admin.update({
      where: { id },
      data: {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        googleId: data.googleId,
      },
    });

    logInfo(`Обновлен администратор с ID: ${id}`);

    // Возвращаем администратора без пароля
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  } catch (error) {
    logError('Ошибка при обновлении администратора', error);
    throw error;
  }
}

/**
 * Удаляет администратора
 */
export async function deleteAdmin(prisma: PrismaClient, id: number): Promise<void> {
  try {
    // Проверяем, существует ли администратор
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new Error('Администратор не найден');
    }

    // Удаляем администратора
    await prisma.admin.delete({
      where: { id },
    });

    logInfo(`Удален администратор с ID: ${id}`);
  } catch (error) {
    logError('Ошибка при удалении администратора', error);
    throw error;
  }
}

/**
 * Получает список всех администраторов
 */
export async function getAllAdmins(prisma: PrismaClient): Promise<any[]> {
  try {
    const admins = await prisma.admin.findMany();

    // Возвращаем администраторов без паролей
    return admins.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });
  } catch (error) {
    logError('Ошибка при получении списка администраторов', error);
    throw error;
  }
}

/**
 * Получает администратора по ID
 */
export async function getAdminById(prisma: PrismaClient, id: number): Promise<any> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new Error('Администратор не найден');
    }

    // Возвращаем администратора без пароля
    const { password, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  } catch (error) {
    logError('Ошибка при получении администратора', error);
    throw error;
  }
}