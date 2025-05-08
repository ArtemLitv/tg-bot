import fs from 'fs';
import path from 'path';
import { BotConfig } from './config-types';

/**
 * Загружает конфигурацию бота из JSON-файла
 * @param configPath Путь к файлу конфигурации
 * @returns Объект конфигурации бота
 */
export function loadConfig(configPath: string): BotConfig {
  try {
    // Получаем абсолютный путь к файлу конфигурации
    const absolutePath = path.isAbsolute(configPath)
      ? configPath
      : path.resolve(process.cwd(), configPath);

    // Проверяем существование файла
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Файл конфигурации не найден: ${absolutePath}`);
    }

    // Читаем и парсим JSON-файл
    const configData = fs.readFileSync(absolutePath, 'utf-8');
    const config = JSON.parse(configData) as BotConfig;

    // Проверяем наличие обязательных полей
    if (!config.start_node_id) {
      throw new Error('В конфигурации отсутствует обязательное поле start_node_id');
    }

    if (!Array.isArray(config.languages) || config.languages.length === 0) {
      throw new Error('В конфигурации отсутствует или некорректно указано поле languages');
    }

    if (!Array.isArray(config.nodes) || config.nodes.length === 0) {
      throw new Error('В конфигурации отсутствуют узлы (nodes)');
    }

    // Проверяем наличие начального узла
    const startNodeExists = config.nodes.some(node => node.id === config.start_node_id);
    if (!startNodeExists) {
      throw new Error(`Начальный узел с ID ${config.start_node_id} не найден в списке узлов`);
    }

    return config;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Ошибка загрузки конфигурации: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при загрузке конфигурации');
  }
}

/**
 * Находит узел по его ID
 * @param config Конфигурация бота
 * @param nodeId ID узла
 * @returns Узел или undefined, если узел не найден
 */
export function findNodeById(config: BotConfig, nodeId: string) {
  return config.nodes.find(node => node.id === nodeId);
}