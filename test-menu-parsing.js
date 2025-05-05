// Тестовый скрипт для проверки парсинга меню
const fs = require('fs');
const path = require('path');

// Путь к файлу menu.ts
const menuFilePath = path.join(__dirname, 'bot/menu.ts');

// Чтение содержимого файла menu.ts
const menuContent = fs.readFileSync(menuFilePath, 'utf8');

// Извлечение массива меню с помощью регулярного выражения
const menuMatch = menuContent.match(/export const menu: MenuItem\[\] = (\[[\s\S]*?\]);/);

if (!menuMatch || !menuMatch[1]) {
  console.error('Не удалось извлечь конфигурацию меню');
  process.exit(1);
}

const menuString = menuMatch[1];
console.log('Извлеченная строка меню:');
console.log(menuString.substring(0, 100) + '...');

// Функция для преобразования JavaScript объекта в JSON
const convertJsToJson = (jsString) => {
  try {
    // Используем Function конструктор вместо eval для большей безопасности
    const tempFn = new Function(`
      try {
        const obj = ${jsString};
        return JSON.stringify(obj);
      } catch (e) {
        throw new Error('Invalid JavaScript object: ' + e.message);
      }
    `);
    
    return tempFn();
  } catch (error) {
    console.error('Ошибка при преобразовании JS в JSON:', error);
    
    // Если не удалось использовать Function, пробуем регулярные выражения
    // 1. Заменяем одинарные кавычки на двойные
    let jsonString = jsString.replace(/'/g, '"');
    
    // 2. Добавляем кавычки вокруг ключей объектов
    jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    
    // 3. Обрабатываем возможные проблемы с запятыми и закрывающими скобками
    jsonString = jsonString.replace(/,\s*}/g, '}');
    
    return jsonString;
  }
};

try {
  // Преобразуем строку JavaScript в валидный JSON
  const jsonString = convertJsToJson(menuString);
  console.log('\nПреобразованная JSON строка:');
  console.log(jsonString.substring(0, 100) + '...');
  
  // Парсим JSON
  const menuObj = JSON.parse(jsonString);
  console.log('\nУспешно распарсили JSON!');
  console.log(`Количество элементов меню: ${menuObj.length}`);
  
  // Проверяем структуру первого элемента
  console.log('\nПервый элемент меню:');
  console.log(JSON.stringify(menuObj[0], null, 2).substring(0, 200) + '...');
  
  console.log('\nТест успешно пройден!');
} catch (error) {
  console.error('\nОшибка при парсинге JSON:', error);
  process.exit(1);
}