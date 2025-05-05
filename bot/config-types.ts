/**
 * Типы для JSON-конфигурации Telegram-бота
 * Этот файл содержит интерфейсы для всех элементов конфигурации
 */

// Поддерживаемые языки
export type Language = string;

// Мультиязычный текст
export type MultiLangText = Record<Language, string>;

// Типы узлов
export type NodeType = 'message' | 'menu' | 'system' | 'location' | 'input' | 'delay';

// Типы вложений
export type AttachmentType = 'image' | 'link' | 'location';

// Интерфейс для изображения
export interface ImageAttachment {
  type: 'image';
  url: string;
}

// Интерфейс для ссылки
export interface LinkAttachment {
  type: 'link';
  text: string;
  url: string;
}

// Интерфейс для местоположения
export interface LocationAttachment {
  type: 'location';
  lat: number;
  lon: number;
}

// Объединенный тип для всех вложений
export type Attachment = ImageAttachment | LinkAttachment | LocationAttachment;

// Интерфейс для содержимого сообщения на одном языке
export interface ContentForLanguage {
  text?: string;
  format?: 'plain' | 'markdown' | 'html';
  attachments?: Attachment[];
}

// Мультиязычное содержимое
export type MultiLangContent = Record<Language, ContentForLanguage>;

// Интерфейс для кнопки
export interface Button {
  label: MultiLangText;
  target_node_id: string;
}

// Интерфейс для действия
export interface Action {
  type: string;
  [key: string]: any;
}

// Интерфейс для обработчика ввода
export interface InputHandler {
  type: 'text' | 'location';
  prompt: MultiLangText;
  on_receive: {
    type: string;
    [key: string]: any;
  };
}

// Интерфейс для узла
export interface Node {
  id: string;
  type: NodeType;
  description?: string;
  content?: MultiLangContent;
  buttons?: Button[];
  actions?: Action[];
  input_handler?: InputHandler;
  duration?: number; // для узла типа 'delay'
  next?: string; // для узла типа 'delay'
}

// Интерфейс для корневой конфигурации
export interface BotConfig {
  start_node_id: string;
  languages: Language[];
  nodes: Node[];
}