// Определение интерфейсов для структуры меню Telegram-бота
// Эти интерфейсы используются для типизации данных, полученных из bot-config.json

export interface MenuItem {
  title: string;
  message?: string | MessageContent;
  subMenu?: MenuItem[];
  action?: 'back';
}

export interface MessageContent {
  text?: string;
  photo?: string; // URL или путь к файлу изображения
  link?: {
    url: string;
    text: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  format?: 'plain' | 'markdown' | 'html';
}
