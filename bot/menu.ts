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
    title: 'Выставки',
    subMenu: [
      {
        title: 'CTT Expo',
        subMenu: [
          {
            title: 'Получить билет',
            message: {
              link: {
                url: 'https://ctt-expo.ru/registration?payed_promocode=TGCTT',
                text: 'Получить билет'
              }
            }
          },
          {
            title: 'Список участников',
            message: {
              link: {
                url: 'https://catalog.ctt-expo.ru/expositions/exposition/5427',
                text: 'Список участников'
              }
            }
          },
          {
            title: 'Деловая программа',
            message: {
              link: {
                url: 'https://ctt-expo.ru/ctt-forum-2024',
                text: 'Деловая программа'
              }
            }
          },
          {
            title: 'Юбилейные стикеры выставки',
            message: {
              link: {
                url: 'https://t.me/addstickers/CTT_Expo',
                text: 'Юбилейные стикеры выставки'
              }
            }
          },
          {
            title: 'Сайт',
            message: {
              link: {
                url: 'https://ctt-expo.ru/',
                text: 'Сайт'
              }
            }
          },
          {
            title: 'В главное меню',
            action: 'back'
          }
        ]
      },
      {
        title: 'COMvex',
        subMenu: [
          {
            title: 'Получить билет',
            message: {
              link: {
                url: 'https://comvex.ru/registration?payed_promocode=TGCMX',
                text: 'Получить билет'
              }
            }
          },
          {
            title: 'Список участников',
            message: {
              link: {
                url: 'https://catalog.comvex.ru/expositions/exposition/5876',
                text: 'Список участников'
              }
            }
          },
          {
            title: 'Деловая программа',
            message: {
              link: {
                url: 'https://comvex.ru/business_program',
                text: 'Деловая программа'
              }
            }
          },
          {
            title: 'Сайт',
            message: {
              link: {
                url: 'https://comvex.ru/',
                text: 'Сайт'
              }
            }
          },
          {
            title: 'В главное меню',
            action: 'back'
          }
        ]
      },
      {
        title: 'CTO Expo',
        subMenu: [
          {
            title: 'Получить билет',
            message: {
              link: {
                url: 'https://cto-expo.ru/registration?payed_promocode=TGCTE',
                text: 'Получить билет'
              }
            }
          },
          {
            title: 'Список участников',
            message: {
              link: {
                url: 'https://catalog.cto-expo.ru/expositions/exposition/5873',
                text: 'Список участников'
              }
            }
          },
          {
            title: 'Деловая программа',
            message: {
              link: {
                url: 'https://cto-expo.ru/',
                text: 'Деловая программа'
              }
            }
          },
          {
            title: 'Сайт',
            message: {
              link: {
                url: 'https://cto-expo.ru/',
                text: 'Сайт'
              }
            }
          },
          {
            title: 'В главное меню',
            action: 'back'
          }
        ]
      },
      {
        title: 'Logistika Expo',
        subMenu: [
          {
            title: 'Получить билет',
            message: {
              link: {
                url: 'https://logistika-expo.ru/registration?payed_promocode=TGLG',
                text: 'Получить билет'
              }
            }
          },
          {
            title: 'Список участников',
            message: {
              link: {
                url: 'https://catalog.logistika-expo.ru/expositions/exposition/5870',
                text: 'Список участников'
              }
            }
          },
          {
            title: 'Деловая программа',
            message: {
              link: {
                url: 'https://www.logistika-expo.ru/business-program',
                text: 'Деловая программа'
              }
            }
          },
          {
            title: 'Сайт',
            message: {
              link: {
                url: 'https://logistika-expo.ru/',
                text: 'Сайт'
              }
            }
          },
          {
            title: 'В главное меню',
            action: 'back'
          }
        ]
      },
      {
        title: 'В главное меню',
        action: 'back'
      }
    ]
  },
  {
    title: 'Карта экспозиции 2025',
    message: {
      text: 'Ознакомьтесь с планом синергии EXPO ⬆️',
      photo: 'https://disk.yandex.ru/i/SlXJbutQuJqUlg'
    }
  },
  {
    title: 'Маршрут проезда',
    message: 'Адрес\nМВЦ «Крокус Экспо». [Московская область, Красногорский район, г. Красногорск, ул. Международная, д. 16.](https://yandex.ru/maps/org/krokus_ekspo/217018167012/)\n\nПарковка для автомобиля\nОбращаем внимание, что на территории МВЦ "Крокус Экспо" и прилегающих к нему территориях будет ограниченное количество мест для парковок.\nДля сохранения вашего времени и комфортного посещения выставок настоятельно РЕКОМЕНДУЕМ пользоваться метро, такси и перехватывающими парковками.\n\nНа метро\nМетро «Мякинино» (Арбатско-Покровская «синяя» линия).\nВыход №2, первый вагон из центра в сторону Павильона 2.\n\nИз аэропорта\nДо города можно добраться из любого аэропорта на Аэроэкспрессе. Подробнее: [aeroexpress.ru.](https://aeroexpress.ru/)'
  },
  {
    title: 'Промокод для билета',
    message: '📌Ваш промокод для бесплатного билета на любую из выставок: tgEXPO. Его можно использовать неограниченное количество раз, делитесь с коллегами! Ссылка на регистрацию: [sigma-expo.ru/expo](http://sigma-expo.ru/expo)'
  },
  {
    title: 'Отраслевые конкурсы',
    subMenu: [
      {
        title: 'Конкурс «Лучший коммерческий автомобиль года в России»',
        message: {
          link: {
            url: 'https://www.best-comvehicle.ru/',
            text: 'Конкурс «Лучший коммерческий автомобиль года в России»'
          }
        }
      },
      {
        title: 'Конкурс «Инновации в строительной технике в России»',
        message: {
          link: {
            url: 'https://construction-innovation.ru/',
            text: 'Конкурс «Инновации в строительной технике в России»'
          }
        }
      },
      {
        title: 'Конкурс «Автопарк года»',
        message: {
          link: {
            url: 'https://autopark-goda.ru/',
            text: 'Конкурс «Автопарк года»'
          }
        }
      },
      {
        title: 'В главное меню',
        action: 'back'
      }
    ]
  },
  {
    title: 'Отраслевые журналы',
    subMenu: [
      {
        title: 'CTT Digest',
        message: {
          link: {
            url: 'https://www.ctt-digest.ru/',
            text: 'CTT Digest'
          }
        }
      },
      {
        title: 'Журнал «COMVEX ревю»',
        message: {
          link: {
            url: 'https://comvex-review.ru/',
            text: 'Журнал «COMVEX ревю»'
          }
        }
      },
      {
        title: 'В главное меню',
        action: 'back'
      }
    ]
  }
];