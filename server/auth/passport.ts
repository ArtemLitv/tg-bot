/**
 * Настройка Passport.js для аутентификации
 */

import { PassportStatic } from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logError, logInfo } from '../logger';

export function setupPassport(passport: PassportStatic, prisma: PrismaClient) {
  // Сериализация пользователя
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Десериализация пользователя
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await prisma.admin.findUnique({
        where: { id },
      });
      done(null, user);
    } catch (error) {
      logError('Ошибка при десериализации пользователя', error);
      done(error, null);
    }
  });

  // Локальная стратегия (логин/пароль)
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
      },
      async (username, password, done) => {
        try {
          // Ищем пользователя в базе данных
          const user = await prisma.admin.findUnique({
            where: { username },
          });

          // Если пользователь не найден
          if (!user) {
            return done(null, false, { message: 'Неверное имя пользователя или пароль' });
          }

          // Проверяем пароль
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: 'Неверное имя пользователя или пароль' });
          }

          // Успешная аутентификация
          logInfo(`Пользователь ${username} успешно аутентифицирован`);
          return done(null, user);
        } catch (error) {
          logError('Ошибка при аутентификации пользователя', error);
          return done(error);
        }
      }
    )
  );

  // Google OAuth стратегия
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL;

  if (googleClientId && googleClientSecret && googleCallbackUrl) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: googleCallbackUrl,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Ищем пользователя в базе данных по Google ID
            let user = await prisma.admin.findUnique({
              where: { googleId: profile.id },
            });

            // Если пользователь не найден, ищем по email
            if (!user && profile.emails && profile.emails.length > 0) {
              const email = profile.emails[0].value;
              user = await prisma.admin.findUnique({
                where: { email },
              });

              // Если пользователь найден по email, обновляем его Google ID
              if (user) {
                user = await prisma.admin.update({
                  where: { id: user.id },
                  data: { googleId: profile.id },
                });
              }
            }

            // Если пользователь не найден, возвращаем ошибку
            // Мы не создаем новых пользователей через Google OAuth, только связываем существующих
            if (!user) {
              return done(null, false, { message: 'Пользователь не найден' });
            }

            // Успешная аутентификация
            logInfo(`Пользователь ${user.username} успешно аутентифицирован через Google`);
            return done(null, user);
          } catch (error) {
            logError('Ошибка при аутентификации через Google', error);
            return done(error);
          }
        }
      )
    );
  } else {
    logInfo('Google OAuth не настроен. Пропускаем настройку Google стратегии.');
  }
}