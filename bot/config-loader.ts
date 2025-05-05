/**
 * Загрузчик JSON-конфигурации для Telegram-бота
 * Этот файл содержит функции для загрузки и парсинга JSON-конфигурации
 */

import fs from 'fs';
import path from 'path';
import { BotConfig, Node, MultiLangContent, Button, Action, InputHandler } from './config-types';
import { MenuItem, MessageContent } from './menu';

/**
 * Загружает JSON-конфигурацию из файла
 * @param filePath Путь к файлу конфигурации
 * @returns Объект конфигурации
 */
export function loadConfig(filePath: string): BotConfig {
  try {
    const configPath = path.resolve(filePath);
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData) as BotConfig;

    // Валидация конфигурации
    validateConfig(config);

    return config;
  } catch (error) {
    console.error('Ошибка при загрузке конфигурации:', error);
    throw new Error(`Не удалось загрузить конфигурацию: ${error}`);
  }
}

/**
 * Валидирует структуру конфигурации
 * @param config Объект конфигурации
 */
function validateConfig(config: BotConfig): void {
  // Проверка наличия обязательных полей
  if (!config.start_node_id) {
    throw new Error('В конфигурации отсутствует обязательное поле start_node_id');
  }

  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    throw new Error('В конфигурации отсутствует или неверно задано поле languages');
  }

  if (!Array.isArray(config.nodes) || config.nodes.length === 0) {
    throw new Error('В конфигурации отсутствуют узлы (nodes)');
  }

  // Проверка наличия стартового узла
  const startNode = config.nodes.find(node => node.id === config.start_node_id);
  if (!startNode) {
    throw new Error(`Стартовый узел с id ${config.start_node_id} не найден`);
  }

  // Проверка уникальности ID узлов
  const nodeIds = new Set<string>();
  for (const node of config.nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`Дублирующийся ID узла: ${node.id}`);
    }
    nodeIds.add(node.id);
  }

  // Проверка корректности ссылок на узлы в кнопках
  for (const node of config.nodes) {
    if (node.buttons) {
      for (const button of node.buttons) {
        if (!nodeIds.has(button.target_node_id)) {
          throw new Error(`Кнопка в узле ${node.id} ссылается на несуществующий узел ${button.target_node_id}`);
        }
      }
    }
  }
}

/**
 * Преобразует JSON-конфигурацию в формат меню, используемый в существующем коде
 * @param config Объект конфигурации
 * @param language Язык для отображения (по умолчанию первый язык из списка)
 * @returns Массив элементов меню
 */
export function convertConfigToMenu(config: BotConfig, language?: string): MenuItem[] {
  // Используем первый язык из списка, если язык не указан
  const lang = language || config.languages[0];

  // Находим стартовый узел
  const startNode = config.nodes.find(node => node.id === config.start_node_id);
  if (!startNode) {
    throw new Error(`Стартовый узел с id ${config.start_node_id} не найден`);
  }

  // Преобразуем узлы в элементы меню
  return convertNodesToMenuItems(config.nodes, startNode, lang, []);
}

/**
 * Преобразует узлы в элементы меню
 * @param nodes Массив всех узлов
 * @param currentNode Текущий узел
 * @param language Язык для отображения
 * @param processedNodeIds Массив ID уже обработанных узлов (для предотвращения циклической рекурсии)
 * @returns Массив элементов меню
 */
function convertNodesToMenuItems(
  nodes: Node[], 
  currentNode: Node, 
  language: string, 
  processedNodeIds: string[] = []
): MenuItem[] {
  // Если у текущего узла нет кнопок, возвращаем пустой массив
  if (!currentNode.buttons || currentNode.buttons.length === 0) {
    return [];
  }

  // Добавляем текущий узел в список обработанных
  const updatedProcessedNodeIds = [...processedNodeIds, currentNode.id];

  // Преобразуем кнопки в элементы меню
  return currentNode.buttons.map(button => {
    // Находим целевой узел
    const targetNode = nodes.find(node => node.id === button.target_node_id);
    if (!targetNode) {
      throw new Error(`Узел с id ${button.target_node_id} не найден`);
    }

    // Создаем элемент меню
    const menuItem: MenuItem = {
      title: button.label[language] || Object.values(button.label)[0], // Используем перевод или первый доступный текст
    };

    // Добавляем сообщение, если у целевого узла есть содержимое
    if (targetNode.content) {
      menuItem.message = convertContentToMessageContent(targetNode.content, language);
    }

    // Если целевой узел имеет кнопки и еще не был обработан (для предотвращения циклической рекурсии)
    if (targetNode.buttons && targetNode.buttons.length > 0 && !updatedProcessedNodeIds.includes(targetNode.id)) {
      menuItem.subMenu = convertNodesToMenuItems(nodes, targetNode, language, updatedProcessedNodeIds);
    }

    // Если кнопка ведет на узел с типом "back", добавляем действие "back"
    if (targetNode.type === 'system' && targetNode.actions?.some(action => action.type === 'go_back')) {
      menuItem.action = 'back';
    }

    return menuItem;
  });
}

/**
 * Преобразует мультиязычное содержимое в формат сообщения
 * @param content Мультиязычное содержимое
 * @param language Язык для отображения
 * @returns Содержимое сообщения
 */
function convertContentToMessageContent(content: MultiLangContent, language: string): MessageContent {
  // Получаем содержимое для указанного языка или первого доступного
  const langContent = content[language] || Object.values(content)[0];

  const messageContent: MessageContent = {};

  // Добавляем текст, если он есть
  if (langContent.text) {
    messageContent.text = langContent.text;
  }

  // Обрабатываем вложения
  if (langContent.attachments && langContent.attachments.length > 0) {
    for (const attachment of langContent.attachments) {
      switch (attachment.type) {
        case 'image':
          messageContent.photo = attachment.url;
          break;
        case 'link':
          messageContent.link = {
            url: attachment.url,
            text: attachment.text
          };
          break;
        case 'location':
          messageContent.location = {
            latitude: attachment.lat,
            longitude: attachment.lon
          };
          break;
      }
    }
  }

  return messageContent;
}

/**
 * Находит узел по его ID
 * @param nodes Массив всех узлов
 * @param nodeId ID узла
 * @returns Узел или undefined, если узел не найден
 */
export function findNodeById(nodes: Node[], nodeId: string): Node | undefined {
  return nodes.find(node => node.id === nodeId);
}

/**
 * Получает язык пользователя на основе настроек Telegram
 * @param userLanguageCode Код языка пользователя из Telegram
 * @param supportedLanguages Поддерживаемые языки
 * @returns Код языка из списка поддерживаемых или первый язык из списка
 */
export function getUserLanguage(userLanguageCode: string | undefined, supportedLanguages: string[]): string {
  if (!userLanguageCode) {
    return supportedLanguages[0];
  }

  // Проверяем, поддерживается ли язык пользователя
  const exactMatch = supportedLanguages.find(lang => lang === userLanguageCode);
  if (exactMatch) {
    return exactMatch;
  }

  // Проверяем, поддерживается ли основной язык (например, 'en' для 'en-US')
  const mainLanguage = userLanguageCode.split('-')[0];
  const mainMatch = supportedLanguages.find(lang => lang === mainLanguage);
  if (mainMatch) {
    return mainMatch;
  }

  // Возвращаем первый поддерживаемый язык
  return supportedLanguages[0];
}
