// Menu configuration for the Telegram bot
// This file defines the structure of the bot's menu and submenu items

export interface MenuItem {
  title: string;
  message?: string | MessageContent;
  subMenu?: MenuItem[];
  action?: 'back';
}

export interface MessageContent {
  text?: string;
  photo?: string; // URL or file path to the image
  link?: {
    url: string;
    text: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Main menu configuration
export const menu: MenuItem[] = [
  {
    title: 'Текстовое сообщение',
    message: 'Привет'
  },
  {
    title: 'Подменю',
    subMenu: [
      {
        title: 'Элемент 1',
        message: 'Это сообщение из подменю'
      },
      {
        title: 'Назад',
        action: 'back'
      }
    ]
  },
  {
    title: 'Картинка с текстом',
    message: {
      text: 'Описание картинки',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/1280px-Pleiades_large.jpg'
    }
  },
  {
    title: 'Пример со ссылкой',
    message: {
      text: 'Может хочешь перейти сюда -',
      link: {
        url: 'https://google.com',
        text: 'google'
      }
    }
  },
  {
    title: 'Пример с гео',
    message: {
      text: 'Локация:',
      location: {
        latitude: 55.751244,
        longitude: 37.618423
      }
    }
  },
  {
    title: 'Пример с разным типом контента',
    message: {
      text: 'Текстовое сообщение',
      photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Pleiades_large.jpg/1280px-Pleiades_large.jpg',
      link: {
        url: 'https://telegram.org',
        text: 'Telegram Website'
      }
    }
  }
];
