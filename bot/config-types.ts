// Основная конфигурация бота
export interface BotConfig {
  start_node_id: string;
  languages: string[];
  nodes: Node[];
}

// Типы узлов
export type NodeType = 'message' | 'menu' | 'system' | 'location' | 'input' | 'delay';

// Базовый интерфейс для всех узлов
export interface BaseNode {
  id: string;
  type: NodeType;
  description?: string;
}

// Интерфейс для узла сообщения
export interface MessageNode extends BaseNode {
  type: 'message';
  content: Record<string, ContentItem>;
  buttons?: Button[];
}

// Интерфейс для узла меню
export interface MenuNode extends BaseNode {
  type: 'menu';
  content: Record<string, ContentItem>;
  buttons: Button[];
}

// Интерфейс для системного узла
export interface SystemNode extends BaseNode {
  type: 'system';
  content?: Record<string, string>;
  actions: Action[];
}

// Интерфейс для узла местоположения
export interface LocationNode extends BaseNode {
  type: 'location';
  content: Record<string, ContentItem>;
  buttons?: Button[];
}

// Интерфейс для узла ввода
export interface InputNode extends BaseNode {
  type: 'input';
  content: Record<string, ContentItem>;
  input_handler: InputHandler;
  buttons?: Button[];
}

// Интерфейс для узла задержки
export interface DelayNode extends BaseNode {
  type: 'delay';
  duration: number;
  next: string;
}

// Объединенный тип для всех узлов
export type Node = MessageNode | MenuNode | SystemNode | LocationNode | InputNode | DelayNode;

// Интерфейс для содержимого узла
export interface ContentItem {
  text: string;
  format?: 'plain' | 'markdown' | 'html';
  attachments?: Attachment[];
}

// Типы вложений
export type AttachmentType = 'image' | 'link' | 'location';

// Интерфейс для вложения изображения
export interface ImageAttachment {
  type: 'image';
  url: string;
}

// Интерфейс для вложения ссылки
export interface LinkAttachment {
  type: 'link';
  text: string;
  url: string;
}

// Интерфейс для вложения местоположения
export interface LocationAttachment {
  type: 'location';
  lat: number;
  lon: number;
}

// Объединенный тип для всех вложений
export type Attachment = ImageAttachment | LinkAttachment | LocationAttachment;

// Интерфейс для кнопки
export interface Button {
  label: Record<string, string>;
  target_node_id: string;
}

// Типы действий
export type ActionType = 'send_message' | 'go_to' | 'go_back';

// Базовый интерфейс для всех действий
export interface BaseAction {
  type: ActionType;
}

// Интерфейс для действия отправки сообщения
export interface SendMessageAction extends BaseAction {
  type: 'send_message';
  content: Record<string, string>;
}

// Интерфейс для действия перехода к узлу
export interface GoToAction extends BaseAction {
  type: 'go_to';
  target_node_id: string;
}

// Интерфейс для действия возврата
export interface GoBackAction extends BaseAction {
  type: 'go_back';
  target_node_id?: string;
}

// Объединенный тип для всех действий
export type Action = SendMessageAction | GoToAction | GoBackAction;

// Типы обработчиков ввода
export type InputHandlerType = 'text' | 'location';

// Интерфейс для обработчика ввода
export interface InputHandler {
  type: InputHandlerType;
  prompt: Record<string, string>;
  on_receive: Action;
}

// Интерфейс для контекста пользователя
export interface UserContext {
  userId: number;
  chatId: number;
  currentNodeId: string;
  language: string;
  inputState?: {
    expectedType: InputHandlerType;
    handlerId: string;
  };
  history: string[];
}