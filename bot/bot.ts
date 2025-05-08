import { Context, Telegraf } from 'telegraf';
import { BotConfig, Node, UserContext } from './config-types';
import { findNodeById, loadConfig } from './config-loader';
import { 
  DelayNodeHandler, 
  InputNodeHandler, 
  LocationNodeHandler, 
  MenuNodeHandler, 
  MessageNodeHandler, 
  NodeHandler, 
  SystemNodeHandler 
} from './node-handlers';
import { getChatId, getUserId } from './node-handlers/utils';
import { logDebug, logError, logInfo, logWarn } from './logger';


export class Bot {
  private bot: Telegraf;
  private config: BotConfig;
  private nodeHandlers: NodeHandler[] = [];
  private userContexts: Map<number, UserContext> = new Map();
  private inputHandler!: InputNodeHandler;

  /**
   * Конструктор
   * @param token Токен бота
   * @param configPath Путь к файлу конфигурации
   */
  constructor(token: string, configPath: string) {
    // Инициализируем бота
    this.bot = new Telegraf(token);

    // Загружаем конфигурацию
    this.config = loadConfig(configPath);
    logInfo('Конфигурация загружена', { startNodeId: this.config.start_node_id });

    // Инициализируем обработчики узлов
    this.initNodeHandlers();

    // Настраиваем обработчики команд и сообщений
    this.setupHandlers();
  }

  /**
   * Инициализирует обработчики узлов
   */
  private initNodeHandlers(): void {
    // Создаем обработчики узлов
    const messageHandler = new MessageNodeHandler();
    const menuHandler = new MenuNodeHandler();
    const locationHandler = new LocationNodeHandler();

    // Создаем обработчики, которым нужна конфигурация и другие обработчики
    this.inputHandler = new InputNodeHandler(this.config, []);
    const systemHandler = new SystemNodeHandler(this.config, []);
    const delayHandler = new DelayNodeHandler(this.config, []);

    // Добавляем обработчики в массив
    this.nodeHandlers = [
      messageHandler,
      menuHandler,
      systemHandler,
      this.inputHandler,
      locationHandler,
      delayHandler
    ];

    // Обновляем ссылки на массив обработчиков
    (systemHandler as any).nodeHandlers = this.nodeHandlers;
    (this.inputHandler as any).nodeHandlers = this.nodeHandlers;
    (delayHandler as any).nodeHandlers = this.nodeHandlers;

    logInfo('Обработчики узлов инициализированы');
  }

  /**
   * Настраивает обработчики команд и сообщений
   */
  private setupHandlers(): void {
    // Обработчик команды /start
    this.bot.start(async (ctx) => {
      await this.handleStart(ctx);
    });

    // Обработчик команды /help
    this.bot.help(async (ctx) => {
      await ctx.reply('Используйте команду /start для начала работы с ботом.');
    });

    // Обработчик команды /reset
    this.bot.command('reset', async (ctx) => {
      const userId = getUserId(ctx);
      this.userContexts.delete(userId);
      await ctx.reply('Ваша сессия сброшена. Используйте /start для начала работы с ботом.');
    });

    // Обработчик текстовых сообщений
    this.bot.on('text', async (ctx) => {
      await this.handleMessage(ctx, ctx.message.text);
    });

    // Обработчик местоположений
    this.bot.on('location', async (ctx) => {
      await this.handleMessage(ctx, ctx.message.location);
    });

    // Обработчик колбэков от кнопок
    this.bot.on('callback_query', async (ctx) => {
      if (!('data' in ctx.callbackQuery) || !ctx.callbackQuery.data) {
        return;
      }

      const data = ctx.callbackQuery.data;

      // Если это переход к узлу
      if (data.startsWith('node:')) {
        const nodeId = data.substring(5);
        await this.handleNodeTransition(ctx, nodeId);
      }

      // Отвечаем на колбэк, чтобы убрать "часики" на кнопке
      await ctx.answerCbQuery();
    });

    // Обработчик ошибок
    this.bot.catch((err, ctx) => {
      logError('Ошибка при обработке обновления', { error: err, update: ctx.update });
    });

    logInfo('Обработчики команд и сообщений настроены');
  }

  /**
   * Обрабатывает команду /start
   * @param ctx Контекст Telegraf
   */
  private async handleStart(ctx: Context): Promise<void> {
    const userId = getUserId(ctx);
    const chatId = getChatId(ctx);

    // Создаем новый контекст пользователя
    const userContext: UserContext = {
      userId,
      chatId,
      currentNodeId: '',
      language: this.config.languages[0], // Используем первый язык по умолчанию
      history: []
    };

    // Сохраняем контекст пользователя
    this.userContexts.set(userId, userContext);

    // Находим начальный узел
    const startNode = findNodeById(this.config, this.config.start_node_id);
    if (!startNode) {
      logError('Начальный узел не найден', { startNodeId: this.config.start_node_id });
      await ctx.reply('Ошибка конфигурации бота. Начальный узел не найден.');
      return;
    }

    // Обрабатываем начальный узел
    await this.processNode(ctx, startNode, userContext);

    logInfo('Пользователь начал работу с ботом', { userId, chatId });
  }

  /**
   * Обрабатывает сообщение пользователя
   * @param ctx Контекст Telegraf
   * @param message Сообщение пользователя
   */
  private async handleMessage(ctx: Context, message: any): Promise<void> {
    const userId = getUserId(ctx);

    // Получаем контекст пользователя
    const userContext = this.userContexts.get(userId);
    if (!userContext) {
      await ctx.reply('Пожалуйста, используйте команду /start для начала работы с ботом.');
      return;
    }

    // Если пользователь находится в режиме ввода
    if (userContext.inputState) {
      await this.inputHandler.handleInput(ctx, userContext, message);
      return;
    }

    // Если это текстовое сообщение, проверяем, есть ли узел с таким ID
    if (typeof message === 'string') {
      const targetNode = findNodeById(this.config, message);
      if (targetNode) {
        await this.processNode(ctx, targetNode, userContext);
        return;
      }

      // Проверяем, есть ли кнопка с таким текстом в текущем узле
      const currentNode = findNodeById(this.config, userContext.currentNodeId);
      if (currentNode && 'buttons' in currentNode && currentNode.buttons) {
        const button = currentNode.buttons.find(b => 
          b.label[userContext.language] === message || 
          Object.values(b.label).includes(message)
        );

        if (button) {
          await this.handleNodeTransition(ctx, button.target_node_id);
          return;
        }
      }
    }

    // Если не нашли подходящий узел или кнопку
    await ctx.reply('Неизвестная команда');
  }

  /**
   * Обрабатывает переход к узлу
   * @param ctx Контекст Telegraf
   * @param nodeId ID узла
   */
  private async handleNodeTransition(ctx: Context, nodeId: string): Promise<void> {
    const userId = getUserId(ctx);

    // Получаем контекст пользователя
    const userContext = this.userContexts.get(userId);
    if (!userContext) {
      await ctx.reply('Пожалуйста, используйте команду /start для начала работы с ботом.');
      return;
    }

    // Находим узел
    const targetNode = findNodeById(this.config, nodeId);
    if (!targetNode) {
      await ctx.reply('Неизвестная команда');
      return;
    }

    // Обрабатываем узел
    await this.processNode(ctx, targetNode, userContext);
  }

  /**
   * Обрабатывает узел
   * @param ctx Контекст Telegraf
   * @param node Узел
   * @param userContext Контекст пользователя
   */
  private async processNode(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Находим подходящий обработчик для узла
    const handler = this.nodeHandlers.find(h => h.canHandle(node));
    if (!handler) {
      logError('Не найден обработчик для узла', { nodeType: node.type, nodeId: node.id });
      await ctx.reply(`Ошибка: не найден обработчик для узла типа ${node.type}`);
      return;
    }

    try {
      // Обрабатываем узел
      await handler.handle(ctx, node, userContext);
      logDebug('Узел обработан', { nodeId: node.id, nodeType: node.type, userId: userContext.userId });
    } catch (error) {
      logError('Ошибка при обработке узла', { error, nodeId: node.id, nodeType: node.type });
      await ctx.reply('Произошла ошибка при обработке запроса. Пожалуйста, попробуйте позже.');
    }
  }

  /**
   * Запускает бота
   */
  public async start(): Promise<void> {
    try {
      // Запускаем бота
      await this.bot.launch();
      logInfo('Бот запущен');

      // Обрабатываем остановку бота
      process.once('SIGINT', () => this.stop());
      process.once('SIGTERM', () => this.stop());
    } catch (error) {
      logError('Ошибка при запуске бота', error);
      throw error;
    }
  }

  /**
   * Останавливает бота
   */
  public stop(): void {
    this.bot.stop();
    logInfo('Бот остановлен');
  }
}
