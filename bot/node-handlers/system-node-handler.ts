/**
 * Обработчик узлов типа "system"
 */

import { Context } from 'telegraf';
import { Action, BotConfig, GoToAction, Node, SendMessageAction, SystemNode, UserContext } from '../config-types';
import { findNodeById } from '../config-loader';
import { NodeHandler } from './node-handler.interface';

/**
 * Обработчик для узлов типа "system"
 */
export class SystemNodeHandler implements NodeHandler {
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
   * @returns true, если узел имеет тип "system"
   */
  canHandle(node: Node): boolean {
    return node.type === 'system';
  }

  /**
   * Обрабатывает узел типа "system"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу SystemNode
    const systemNode = node as SystemNode;
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = systemNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(systemNode.id)) {
      userContext.history.push(systemNode.id);
    }
    
    // Выполняем действия
    if (systemNode.actions && systemNode.actions.length > 0) {
      for (const action of systemNode.actions) {
        await this.executeAction(ctx, action, userContext);
      }
    }
  }

  /**
   * Выполняет действие
   * @param ctx Контекст Telegraf
   * @param action Действие
   * @param userContext Контекст пользователя
   */
  private async executeAction(ctx: Context, action: Action, userContext: UserContext): Promise<void> {
    switch (action.type) {
      case 'send_message':
        await this.executeSendMessageAction(ctx, action as SendMessageAction, userContext);
        break;
      case 'go_to':
        await this.executeGoToAction(ctx, action as GoToAction, userContext);
        break;
      case 'go_back':
        await this.executeGoBackAction(ctx, userContext);
        break;
      default:
        throw new Error(`Неизвестный тип действия: ${(action as any).type}`);
    }
  }

  /**
   * Выполняет действие отправки сообщения
   * @param ctx Контекст Telegraf
   * @param action Действие отправки сообщения
   * @param userContext Контекст пользователя
   */
  private async executeSendMessageAction(ctx: Context, action: SendMessageAction, userContext: UserContext): Promise<void> {
    const message = action.content[userContext.language] || Object.values(action.content)[0];
    if (message) {
      await ctx.reply(message);
    }
  }

  /**
   * Выполняет действие перехода к узлу
   * @param ctx Контекст Telegraf
   * @param action Действие перехода к узлу
   * @param userContext Контекст пользователя
   */
  private async executeGoToAction(ctx: Context, action: GoToAction, userContext: UserContext): Promise<void> {
    const targetNode = findNodeById(this.config, action.target_node_id);
    if (targetNode) {
      // Находим подходящий обработчик для целевого узла
      const handler = this.nodeHandlers.find(h => h.canHandle(targetNode));
      if (handler) {
        await handler.handle(ctx, targetNode, userContext);
      } else {
        throw new Error(`Не найден обработчик для узла типа ${targetNode.type}`);
      }
    } else {
      await ctx.reply('Неизвестная команда');
    }
  }

  /**
   * Выполняет действие возврата
   * @param ctx Контекст Telegraf
   * @param userContext Контекст пользователя
   */
  private async executeGoBackAction(ctx: Context, userContext: UserContext): Promise<void> {
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
        await ctx.reply('Неизвестная команда');
      }
    } else {
      // Если истории нет, переходим к начальному узлу
      const startNode = findNodeById(this.config, this.config.start_node_id);
      if (startNode) {
        // Находим подходящий обработчик для начального узла
        const handler = this.nodeHandlers.find(h => h.canHandle(startNode));
        if (handler) {
          await handler.handle(ctx, startNode, userContext);
        } else {
          throw new Error(`Не найден обработчик для узла типа ${startNode.type}`);
        }
      } else {
        await ctx.reply('Неизвестная команда');
      }
    }
  }
}