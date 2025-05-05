const path = require('path');
const fs = require('fs');

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
};
