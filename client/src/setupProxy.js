const path = require('path');
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Функция для обслуживания файла конфигурации
  const serveConfigFile = (req, res) => {
    const configPath = path.resolve(__dirname, '../../config/bot-config.json');
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      res.setHeader('Content-Type', 'application/json');
      res.send(configContent);
    } catch (error) {
      console.error('Ошибка при чтении файла конфигурации:', error);
      res.status(500).json({ error: 'Не удалось прочитать файл конфигурации' });
    }
  };

  // Обслуживание файла по обоим путям
  app.get('/bot-config.json', serveConfigFile);
  app.get('/config/bot-config.json', serveConfigFile);

  // Настройка прокси для API запросов
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001',
      changeOrigin: true,
      timeout: 60000, // Увеличиваем таймаут до 60 секунд
      proxyTimeout: 60000, // Увеличиваем таймаут прокси до 60 секунд
      // Добавляем обработку ошибок
      onError: (err, req, res) => {
        console.error('Ошибка прокси-сервера:', err);

        if (err.code === 'ECONNREFUSED') {
          res.status(503).json({
            error: 'Сервер недоступен. Убедитесь, что сервер запущен на порту 3001.',
            details: 'Запустите сервер командой: npm run dev или npm run dev:all (рекомендуется)'
          });
        } else if (err instanceof AggregateError && err.errors) {
          // Обработка AggregateError (множественные ошибки подключения)
          const errorMessages = err.errors.map(e => `${e.code}: ${e.message}`).join('; ');
          res.status(503).json({
            error: 'Проблема с подключением к серверу.',
            details: `Убедитесь, что сервер запущен на порту 3001. Детали ошибки: ${errorMessages}`
          });
        } else {
          res.status(500).json({
            error: 'Ошибка при подключении к серверу',
            details: err.message
          });
        }
      }
    })
  );
};
