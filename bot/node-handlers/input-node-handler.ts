/**
 * Обработчик узлов типа "input"
 */

import { Context } from 'telegraf';
import { Action, BotConfig, InputNode, Node, UserContext } from '../config-types';
import { findNodeById } from '../config-loader';
import { NodeHandler } from './node-handler.interface';
import { sendContent } from './utils';

/**
 * Обработчик для узлов типа "input"
 */
export class InputNodeHandler implements NodeHandler {
  private config: BotConfig;
  private nodeHandlers: NodeHandler[];

  /**
   * Конструктор
   * @param config Конфигурация бота
   * @param nodeHandlers Массив обработчиков узлов
   */
  constructor(config: BotConfig, nodeHandlers: NodeHandler[]) {
    this.config = config;
    this.nodeHandlers = nodeHandlers;
  }

  /**
   * Проверяет, может ли обработчик обработать данный узел
   * @param node Узел для проверки
   * @returns true, если узел имеет тип "input"
   */
  canHandle(node: Node): boolean {
    return node.type === 'input';
  }

  /**
   * Обрабатывает узел типа "input"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу InputNode
    const inputNode = node as InputNode;
    
    // Отправляем содержимое с запросом ввода
    await sendContent(
      ctx,
      inputNode.content,
      userContext.language,
      inputNode.buttons
    );
    
    // Отправляем подсказку для ввода
    const prompt = inputNode.input_handler.prompt[userContext.language] || 
                  Object.values(inputNode.input_handler.prompt)[0];
    
    if (prompt) {
      await ctx.reply(prompt);
    }
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = inputNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(inputNode.id)) {
      userContext.history.push(inputNode.id);
    }
    
    // Устанавливаем состояние ввода
    userContext.inputState = {
      expectedType: inputNode.input_handler.type,
      handlerId: inputNode.id
    };
  }

  /**
   * Обрабатывает полученный ввод
   * @param ctx Контекст Telegraf
   * @param userContext Контекст пользователя
   * @param input Полученный ввод
   */
  async handleInput(ctx: Context, userContext: UserContext, input: any): Promise<void> {
    if (!userContext.inputState) {
      return;
    }
    
    // Находим узел ввода
    const inputNode = findNodeById(this.config, userContext.inputState.handlerId) as InputNode;
    if (!inputNode || inputNode.type !== 'input') {
      return;
    }
    
    // Проверяем тип ввода
    if (userContext.inputState.expectedType === 'text' && typeof input === 'string') {
      // Обрабатываем текстовый ввод
      await this.processInputAction(ctx, userContext, inputNode.input_handler.on_receive, input);
    } else if (userContext.inputState.expectedType === 'location' && 
              input && typeof input === 'object' && 'latitude' in input && 'longitude' in input) {
      // Обрабатываем ввод местоположения
      await this.processInputAction(ctx, userContext, inputNode.input_handler.on_receive, input);
    } else {
      // Неверный тип ввода, отправляем подсказку снова
      const prompt = inputNode.input_handler.prompt[userContext.language] || 
                    Object.values(inputNode.input_handler.prompt)[0];
      
      if (prompt) {
        await ctx.reply(`Неверный формат ввода. ${prompt}`);
      }
    }
  }

  /**
   * Обрабатывает действие после получения ввода
   * @param ctx Контекст Telegraf
   * @param userContext Контекст пользователя
   * @param action Действие
   * @param input Полученный ввод
   */
  private async processInputAction(ctx: Context, userContext: UserContext, action: Action, input: any): Promise<void> {
    // Сбрасываем состояние ввода
    userContext.inputState = undefined;
    
    // Обрабатываем действие в зависимости от его типа
    switch (action.type) {
      case 'go_to':
        const targetNodeId = action.target_node_id;
        const targetNode = findNodeById(this.config, targetNodeId);
        
        if (targetNode) {
          // Находим подходящий обработчик для целевого узла
          const handler = this.nodeHandlers.find(h => h.canHandle(targetNode));
          if (handler) {
            await handler.handle(ctx, targetNode, userContext);
          } else {
            throw new Error(`Не найден обработчик для узла типа ${targetNode.type}`);
          }
        } else {
          await ctx.reply('Неизвестная команда. Пожалуйста выберете другую или нажмите \start');
        }
        break;
        
      case 'send_message':
        const message = action.content[userContext.language] || Object.values(action.content)[0];
        if (message) {
          await ctx.reply(message);
        }
        break;
        
      case 'go_back':
        // Если в истории есть предыдущий узел, переходим к нему
        if (userContext.history.length > 1) {
          const previousNodeId = userContext.history[userContext.history.length - 2];
          const previousNode = findNodeById(this.config, previousNodeId);
          
          if (previousNode) {
            // Удаляем текущий узел из истории
            userContext.history.pop();
            
            // Находим подходящий обработчик для предыдущего узла
            const handler = this.nodeHandlers.find(h => h.canHandle(previousNode));
            if (handler) {
              await handler.handle(ctx, previousNode, userContext);
            } else {
              throw new Error(`Не найден обработчик для узла типа ${previousNode.type}`);
            }
          } else {
            await ctx.reply('Неизвестная команда. Пожалуйста выберете другую или нажмите \start');
          }
        }
        break;
        
      default:
        throw new Error(`Неизвестный тип действия: ${(action as any).type}`);
    }
  }
}