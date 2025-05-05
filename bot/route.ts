import TelegramBot from 'node-telegram-bot-api';
import {MenuItem} from './menu';
import {generateKeyboard, getCurrentMenu, sendMessage, findMenuItemRecursive} from './helpers';
import {BotConfig, Node} from './config-types';
import {getUserLanguage, findNodeById, convertConfigToMenu} from './config-loader';

/**
 * Интерфейс для хранения состояния бота
 */
interface BotState {
  // Пользователи, которые уже получили приветственное сообщение
  welcomedUsers: Set<number>;
  // Языковые предпочтения пользователей
  userLanguages: Record<number, string>;
  // Текущее состояние меню пользователей
  userMenuState: Record<number, string[]>;
}

/**
 * Получает текст из конфигурации по идентификатору узла
 * @param nodeId Идентификатор узла
 * @param userLang Язык пользователя
 * @param botConfig Конфигурация бота
 * @param defaultText Текст по умолчанию
 * @returns Текст из конфигурации или текст по умолчанию
 */
function getTextFromConfig(
  nodeId: string,
  userLang: string,
  botConfig: BotConfig | null,
  defaultText: string
): string {
  if (!botConfig) return defaultText;

  const node = findNodeById(botConfig.nodes, nodeId);
  if (node && node.content && node.content[userLang]) {
    return node.content[userLang].text || defaultText;
  }

  return defaultText;
}

/**
 * Настраивает маршруты и обработчики сообщений для Telegram-бота
 * @param bot Экземпляр Telegram-бота
 * @param menu Структура меню
 * @param userMenuState Состояние меню пользователей
 * @param botConfig Конфигурация бота (опционально)
 */
export function setupRoutes(
  bot: TelegramBot,
  menu: MenuItem[],
  userMenuState: Record<number, string[]>,
  botConfig: BotConfig | null = null
): void {
  // Инициализация состояния бота
  const botState: BotState = {
    welcomedUsers: new Set<number>(),
    userLanguages: {},
    userMenuState
  };

  // Обработчик для первого взаимодействия пользователя с ботом
  bot.on('message', async (msg: TelegramBot.Message) => {
    // Пропускаем команду /start (обрабатывается отдельно)
    if (msg.text && msg.text.startsWith('/start')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    // Если пользователь еще не получил приветственное сообщение
    if (!botState.welcomedUsers.has(userId)) {
      botState.welcomedUsers.add(userId);

      // Находим узел с приветственным сообщением в конфигурации
      if (botConfig) {
        const initNode = findNodeById(botConfig.nodes, 'init');
        if (initNode && initNode.content) {
          // Определяем язык пользователя
          const userLang = msg.from?.language_code 
            ? getUserLanguage(msg.from.language_code, botConfig.languages) 
            : botConfig.languages[0];

          // Сохраняем язык пользователя
          botState.userLanguages[userId] = userLang;

          // Отправляем содержимое из конфигурации
          if (initNode.content[userLang]) {
            const content = initNode.content[userLang];

            // Отправляем текст
            if (content.text) {
              await bot.sendMessage(chatId, content.text, {
                parse_mode: content.format === 'markdown' ? 'Markdown' :
                  content.format === 'html' ? 'HTML' : undefined
              });
              console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
            }

            // Отправляем вложения
            if (content.attachments && content.attachments.length > 0) {
              for (const attachment of content.attachments) {
                switch (attachment.type) {
                  case 'image':
                    await bot.sendPhoto(chatId, attachment.url);
                    console.log(`Отправлено фото пользователю ${chatId}: ${attachment.url}`);
                    break;
                  case 'link':
                    await bot.sendMessage(chatId, `[${attachment.text}](${attachment.url})`, {
                      parse_mode: 'Markdown'
                    });
                    console.log(`Отправлена ссылка пользователю ${chatId}: ${attachment.text} (${attachment.url})`);
                    break;
                  case 'location':
                    await bot.sendLocation(chatId, attachment.lat, attachment.lon);
                    console.log(`Отправлена геолокация пользователю ${chatId}: ${attachment.lat}, ${attachment.lon}`);
                    break;
                }
              }
            }
          }
        }
      } else {
        // Если конфигурация не загружена, используем значения по умолчанию
        await bot.sendMessage(chatId, 'Добро пожаловать! Нажмите на кнопку /start для начала работы с ботом');
        console.log(`Отправлено приветственное сообщение пользователю ${chatId}: "Добро пожаловать! Нажмите на кнопку /start для начала работы с ботом"`);
      }
    }
  });

  /**
   * Обработчик команды /start
   * Сбрасывает состояние меню пользователя и отправляет приветственное сообщение
   */
  bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    // Сбрасываем состояние меню пользователя
    botState.userMenuState[userId] = [];

    // Устанавливаем язык пользователя на основе кода языка Telegram
    if (botConfig && msg.from?.language_code) {
      botState.userLanguages[userId] = getUserLanguage(msg.from?.language_code, botConfig.languages);
    }

    // Если используется JSON-конфигурация и есть стартовый узел
    if (botConfig) {
      const startNodeId = botConfig.start_node_id;
      const startNode = findNodeById(botConfig.nodes, startNodeId);

      if (startNode) {
        // Получаем язык пользователя
        const userLang = botState.userLanguages[userId] || botConfig.languages[0];

        // Если у стартового узла есть содержимое, отправляем его
        if (startNode.content && startNode.content[userLang]) {
          const content = startNode.content[userLang];

          // Отправляем текст, если он доступен
          if (content.text) {
            await bot.sendMessage(chatId, content.text, {
              parse_mode: content.format === 'markdown' ? 'Markdown' :
                content.format === 'html' ? 'HTML' : undefined
            });
            console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
          }

          // Отправляем вложения, если они доступны
          if (content.attachments && content.attachments.length > 0) {
            for (const attachment of content.attachments) {
              switch (attachment.type) {
                case 'image':
                  await bot.sendPhoto(chatId, attachment.url);
                  console.log(`Отправлено фото пользователю ${chatId}: ${attachment.url}`);
                  break;
                case 'link':
                  await bot.sendMessage(chatId, `[${attachment.text}](${attachment.url})`, {
                    parse_mode: 'Markdown'
                  });
                  console.log(`Отправлена ссылка пользователю ${chatId}: ${attachment.text} (${attachment.url})`);
                  break;
                case 'location':
                  await bot.sendLocation(chatId, attachment.lat, attachment.lon);
                  console.log(`Отправлена геолокация пользователю ${chatId}: ${attachment.lat}, ${attachment.lon}`);
                  break;
              }
            }
          }
        }

        // Получаем кнопки из стартового узла
        if (startNode.buttons && startNode.buttons.length > 0) {
          // Создаем элементы меню из кнопок
          const menuItems = convertConfigToMenu(botConfig, userLang);

          // Получаем текст для главного меню из конфигурации
          const mainMenuText = getTextFromConfig(
            startNodeId,
            userLang,
            botConfig,
            'Выберите опцию:'
          );

          // Отправляем меню
          await bot.sendMessage(chatId, mainMenuText, {
            reply_markup: {
              keyboard: generateKeyboard(menuItems),
              resize_keyboard: true
            }
          });
          console.log(`Отправлено меню пользователю ${chatId}: "${mainMenuText}"`);
          return;
        }
      }
    }

    // Если конфигурация не загружена или что-то пошло не так, используем статическое меню
    await bot.sendMessage(chatId, 'Выберите опцию:', {
      reply_markup: {
        keyboard: generateKeyboard(menu),
        resize_keyboard: true
      }
    });
    console.log(`Отправлено меню по умолчанию пользователю ${chatId}: "Выберите опцию:"`);
  });

  /**
   * Обработчик всех сообщений
   * Обрабатывает навигацию по меню и выполнение действий
   */
  bot.on('message', async (msg: TelegramBot.Message) => {
    // Пропускаем команды и пустые сообщения
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id;

    if (!userId) return;

    // Инициализируем состояние пользователя, если оно не существует
    if (!botState.userMenuState[userId]) {
      botState.userMenuState[userId] = [];
    }

    // Устанавливаем язык пользователя на основе кода языка Telegram, если он еще не установлен
    if (botConfig && msg.from?.language_code && !botState.userLanguages[userId]) {
      botState.userLanguages[userId] = getUserLanguage(msg.from?.language_code, botConfig.languages);
    }

    // Получаем текущее меню на основе состояния пользователя
    const currentMenu = getCurrentMenu(userId, botState.userMenuState, menu);

    // Логируем полученное сообщение и доступные пункты меню для отладки
    console.log(`Получено сообщение: "${msg.text}"`);
    console.log(`Доступные пункты меню: ${currentMenu.map(item => `"${item.title}"`).join(', ')}`);

    /**
     * Вспомогательная функция для нормализации текста при сравнении
     * Удаляет диакритические знаки, нормализует пробелы и т.д.
     */
    const normalizeText = (text: string): string => {
      return text
        .trim()
        .normalize('NFD')  // Нормализация Unicode-символов
        .replace(/[\u0300-\u036f]/g, '')  // Удаление диакритических знаков
        .replace(/\s+/g, ' ');  // Нормализация пробелов
    };

    // Нормализуем и подготавливаем текст пользователя для сравнения
    const userText = msg.text.trim();
    const normalizedUserText = normalizeText(userText);

    // Ищем соответствующий пункт меню
    const selectedItem = currentMenu.find(item => {
      const itemTitle = item.title.trim();
      const normalizedItemTitle = normalizeText(itemTitle);

      // Точное совпадение (с учетом регистра)
      if (itemTitle === userText) {
        console.log(`Найдено точное совпадение: "${itemTitle}" === "${userText}"`);
        return true;
      }

      // Нормализованное совпадение
      if (normalizedItemTitle === normalizedUserText) {
        console.log(`Найдено нормализованное совпадение: "${normalizedItemTitle}" === "${normalizedUserText}"`);
        return true;
      }

      // Совпадение без учета регистра
      if (itemTitle.toLowerCase() === userText.toLowerCase()) {
        console.log(`Найдено совпадение без учета регистра: "${itemTitle.toLowerCase()}" === "${userText.toLowerCase()}"`);
        return true;
      }

      // Проверка на частичное совпадение (для кнопок с эмодзи или другими декоративными элементами)
      if (itemTitle.includes(userText) || userText.includes(itemTitle)) {
        console.log(`Найдено частичное совпадение: "${itemTitle}" содержит или содержится в "${userText}"`);
        return true;
      }

      return false;
    });

    if (!selectedItem) {
      // Если используется JSON-конфигурация, пытаемся найти узел по тексту в кнопках
      if (botConfig) {
        const userLang = botState.userLanguages[userId] || botConfig.languages[0];

        // Ищем кнопку с совпадающим текстом в любом узле
        for (const node of botConfig.nodes) {
          if (node.buttons) {
            for (const button of node.buttons) {
              const buttonText = button.label[userLang] || Object.values(button.label)[0];

              // Проверяем, совпадает ли текст кнопки с текстом пользователя
              if (buttonText === userText ||
                buttonText.toLowerCase() === userText.toLowerCase() ||
                buttonText.includes(userText) ||
                userText.includes(buttonText)) {

                // Находим целевой узел
                const targetNode = findNodeById(botConfig.nodes, button.target_node_id);
                if (targetNode) {
                  console.log(`Найден узел по тексту кнопки: "${buttonText}" -> "${targetNode.id}"`);

                  // Обрабатываем различные типы узлов
                  switch (targetNode.type) {
                    case 'message':
                    case 'menu':
                      // Получаем текст для меню с опциями
                      const optionsText = targetNode.buttons && targetNode.buttons.length > 0 
                        ? getTextFromConfig(
                            targetNode.id,
                            userLang,
                            botConfig,
                            'Выберите опцию:'
                          )
                        : '';

                      // Проверяем, есть ли содержимое
                      if (targetNode.content && targetNode.content[userLang]) {
                        const content = targetNode.content[userLang];

                        // Отправляем текст, только если он отличается от текста меню с опциями
                        // или если нет кнопок
                        if (content.text && (content.text !== optionsText || !targetNode.buttons || targetNode.buttons.length === 0)) {
                          await bot.sendMessage(chatId, content.text, {
                            parse_mode: content.format === 'markdown' ? 'Markdown' :
                              content.format === 'html' ? 'HTML' : undefined
                          });
                          console.log(`Отправлено текстовое сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
                        }

                        // Отправляем вложения
                        if (content.attachments && content.attachments.length > 0) {
                          for (const attachment of content.attachments) {
                            switch (attachment.type) {
                              case 'image':
                                await bot.sendPhoto(chatId, attachment.url);
                                console.log(`Отправлено фото пользователю ${chatId}: ${attachment.url}`);
                                break;
                              case 'link':
                                await bot.sendMessage(chatId, `[${attachment.text}](${attachment.url})`, {
                                  parse_mode: 'Markdown'
                                });
                                console.log(`Отправлена ссылка пользователю ${chatId}: ${attachment.text} (${attachment.url})`);
                                break;
                              case 'location':
                                await bot.sendLocation(chatId, attachment.lat, attachment.lon);
                                console.log(`Отправлена геолокация пользователю ${chatId}: ${attachment.lat}, ${attachment.lon}`);
                                break;
                            }
                          }
                        }
                      }

                      // Отправляем кнопки, если они доступны
                      if (targetNode.buttons && targetNode.buttons.length > 0) {
                        const keyboard = targetNode.buttons.map(btn => [{
                          text: btn.label[userLang] || Object.values(btn.label)[0]
                        }]);

                        await bot.sendMessage(chatId, optionsText, {
                          reply_markup: {
                            keyboard,
                            resize_keyboard: true
                          }
                        });
                        console.log(`Отправлено меню с опциями пользователю ${chatId}: "${optionsText}"`);
                      }
                      return;

                    case 'system':
                      // Обрабатываем системные действия
                      if (targetNode.actions) {
                        for (const action of targetNode.actions) {
                          if (action.type === 'go_back' || action.type === 'back') {
                            // Сбрасываем в главное меню
                            botState.userMenuState[userId] = [];
                            const backToMainText = getTextFromConfig(
                              'back_to_main',
                              userLang,
                              botConfig,
                              'Возврат в главное меню'
                            );

                            await bot.sendMessage(chatId, backToMainText, {
                              reply_markup: {
                                keyboard: generateKeyboard(menu),
                                resize_keyboard: true
                              }
                            });
                            console.log(`Отправлено сообщение о возврате в главное меню пользователю ${chatId}: "${backToMainText}"`);
                            return;
                          }
                        }
                      }
                      return;

                    case 'input':
                      // Обрабатываем узел ввода
                      if (targetNode.input_handler) {
                        const prompt = targetNode.input_handler.prompt[userLang] ||
                          Object.values(targetNode.input_handler.prompt)[0];

                        await bot.sendMessage(chatId, prompt);
                        console.log(`Отправлено приглашение для ввода пользователю ${chatId}: "${prompt}"`);
                        // Примечание: фактическая обработка ввода потребует дополнительного отслеживания состояния
                        return;
                      }
                      return;

                    case 'delay':
                      // Обрабатываем узел задержки
                      if (targetNode.duration && targetNode.next) {
                        setTimeout(async () => {
                          const nextNode = findNodeById(botConfig.nodes, targetNode.next!);
                          if (nextNode && nextNode.content && nextNode.content[userLang]) {
                            const content = nextNode.content[userLang];
                            if (content.text) {
                              await bot.sendMessage(chatId, content.text);
                              console.log(`Отправлено отложенное сообщение пользователю ${chatId}: "${content.text.substring(0, 50)}${content.text.length > 50 ? '...' : ''}"`);
                            }
                          }
                        }, targetNode.duration);
                        return;
                      }
                      return;
                  }
                }
              }
            }
          }
        }
      }

      // Если не найдено в JSON-конфигурации или если JSON-конфигурация не используется, 
      // пытаемся найти рекурсивно во всех меню
      const recursiveItem = findMenuItemRecursive(userText, menu);

      if (recursiveItem) {
        console.log(`Найден элемент рекурсивно: "${recursiveItem.title}"`);

        // Обрабатываем содержимое сообщения
        if (recursiveItem.message) {
          await sendMessage(bot, chatId, recursiveItem.message);

          // Если после отправки сообщения нужно также отправить подменю, не делаем return
          if (!recursiveItem.subMenu) {
            return;
          }
        }

        // Обрабатываем подменю
        if (recursiveItem.subMenu) {
          // Находим путь к этому элементу
          const findPath = (items: MenuItem[], target: MenuItem, currentPath: string[] = []): string[] | null => {
            for (const item of items) {
              if (item === target) {
                return [...currentPath, item.title];
              }

              if (item.subMenu) {
                const result = findPath(item.subMenu, target, [...currentPath, item.title]);
                if (result) return result;
              }
            }
            return null;
          };

          const path = findPath(menu, recursiveItem);
          if (path) {
            // Устанавливаем состояние меню пользователя на родителя найденного элемента
            botState.userMenuState[userId] = path.slice(0, -1);

            // Отправляем подменю
            // Получаем текст для подменю из конфигурации или используем заголовок элемента
            let message = `${recursiveItem.title}:`;

            // Если есть конфигурация, пытаемся найти текст для этого узла
            if (botConfig) {
              const userLang = botState.userLanguages[userId] || botConfig.languages[0];
              // Пытаемся найти узел с таким же ID, как заголовок элемента (в нижнем регистре)
              const nodeId = recursiveItem.title.toLowerCase().replace(/\s+/g, '_');
              const configText = getTextFromConfig(nodeId, userLang, botConfig, '');
              if (configText) {
                message = configText;
              }
            }

            bot.sendMessage(chatId, message, {
              reply_markup: {
                keyboard: generateKeyboard(recursiveItem.subMenu),
                resize_keyboard: true
              }
            });
            console.log(`Отправлено подменю пользователю ${chatId}: "${message}"`);
            return;
          }
        }

        // Обрабатываем действие "назад" для рекурсивно найденных элементов
        if (recursiveItem.action === 'back') {
          if (botState.userMenuState[userId].length > 0) {
            // Если заголовок содержит "главное меню" (регистронезависимо), сбрасываем в главное меню
            if (recursiveItem.title.toLowerCase().includes('главное меню')) {
              botState.userMenuState[userId] = [];

              // Получаем текст для главного меню из конфигурации
              const mainMenuText = botConfig 
                ? getTextFromConfig('welcome', botState.userLanguages[userId] || botConfig.languages[0], botConfig, 'Главное меню:')
                : 'Главное меню:';

              bot.sendMessage(chatId, mainMenuText, {
                reply_markup: {
                  keyboard: generateKeyboard(menu),
                  resize_keyboard: true
                }
              });
              console.log(`Отправлено главное меню пользователю ${chatId}: "${mainMenuText}"`);
            } else {
              // Иначе просто возвращаемся на один уровень назад
              botState.userMenuState[userId].pop();
              const newMenu = getCurrentMenu(userId, botState.userMenuState, menu);

              // Получаем текст для кнопки "Назад" из конфигурации
              const backText = botConfig 
                ? getTextFromConfig('back', botState.userLanguages[userId] || botConfig.languages[0], botConfig, 'Назад...')
                : 'Назад...';

              bot.sendMessage(chatId, backText, {
                reply_markup: {
                  keyboard: generateKeyboard(newMenu),
                  resize_keyboard: true
                }
              });
              console.log(`Отправлено сообщение при возврате назад пользователю ${chatId}: "${backText}"`);
            }
          }
          return;
        }
      }

      // Неизвестная команда
      console.log('Неизвестная опция. Пожалуйста, выберите из меню')

      // Получаем текст из конфигурации для неизвестной опции
      const unknownOptionText = botConfig 
        ? getTextFromConfig('unknown_option', botState.userLanguages[userId] || botConfig.languages[0], botConfig, 'Неизвестная опция. Пожалуйста, выберите из меню:')
        : 'Неизвестная опция. Пожалуйста, выберите из меню:';

      bot.sendMessage(chatId, unknownOptionText, {
        reply_markup: {
          keyboard: generateKeyboard(currentMenu),
          resize_keyboard: true
        }
      });
      console.log(`Отправлено сообщение о неизвестной опции пользователю ${chatId}: "${unknownOptionText}"`);
      return;
    }

    // Обрабатываем действие "назад"
    if (selectedItem.action === 'back') {
      if (botState.userMenuState[userId].length > 0) {
        // Если заголовок содержит "главное меню" (регистронезависимо), сбрасываем в главное меню
        if (selectedItem.title.toLowerCase().includes('главное меню')) {
          botState.userMenuState[userId] = [];

          // Получаем текст для главного меню из конфигурации
          const mainMenuText = botConfig 
            ? getTextFromConfig('welcome', botState.userLanguages[userId] || botConfig.languages[0], botConfig, 'Главное меню:')
            : 'Главное меню:';

          bot.sendMessage(chatId, mainMenuText, {
            reply_markup: {
              keyboard: generateKeyboard(menu),
              resize_keyboard: true
            }
          });
          console.log(`Отправлено главное меню пользователю ${chatId}: "${mainMenuText}"`);
        } else {
          // Иначе просто возвращаемся на один уровень назад
          botState.userMenuState[userId].pop();
          const newMenu = getCurrentMenu(userId, botState.userMenuState, menu);

          // Получаем текст для кнопки "Назад" из конфигурации
          const backText = botConfig 
            ? getTextFromConfig('back', botState.userLanguages[userId] || botConfig.languages[0], botConfig, 'Назад...')
            : 'Назад...';

          bot.sendMessage(chatId, backText, {
            reply_markup: {
              keyboard: generateKeyboard(newMenu),
              resize_keyboard: true
            }
          });
          console.log(`Отправлено сообщение при возврате назад пользователю ${chatId}: "${backText}"`);
        }
      }
      return;
    }

    // Обрабатываем содержимое сообщения
    if (selectedItem.message) {
      await sendMessage(bot, chatId, selectedItem.message);

      // Если после отправки сообщения нужно также отправить подменю, не делаем return
      if (!selectedItem.subMenu) {
        return;
      }
    }

    // Обрабатываем подменю
    if (selectedItem.subMenu) {
      botState.userMenuState[userId].push(selectedItem.title);

      // Получаем текст для подменю из конфигурации или используем заголовок элемента
      let message = `${selectedItem.title}:`;

      // Если есть конфигурация, пытаемся найти текст для этого узла
      if (botConfig) {
        const userLang = botState.userLanguages[userId] || botConfig.languages[0];
        // Пытаемся найти узел с таким же ID, как заголовок элемента (в нижнем регистре)
        const nodeId = selectedItem.title.toLowerCase().replace(/\s+/g, '_');
        const configText = getTextFromConfig(nodeId, userLang, botConfig, '');
        if (configText) {
          message = configText;
        }
      }

      bot.sendMessage(chatId, message, {
        reply_markup: {
          keyboard: generateKeyboard(selectedItem.subMenu),
          resize_keyboard: true
        }
      });
      console.log(`Отправлено подменю пользователю ${chatId}: "${message}"`);
      return;
    }
  });
}
