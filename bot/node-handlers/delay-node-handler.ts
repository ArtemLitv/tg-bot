/**
 * Обработчик узлов типа "delay" (заглушка)
 */

import { Context } from 'telegraf';
import { BotConfig, DelayNode, Node, UserContext } from '../config-types';
import { findNodeById } from '../config-loader';
import { NodeHandler } from './node-handler.interface';

/**
 * Обработчик для узлов типа "delay" (заглушка)
 * Примечание: полная реализация будет добавлена в будущем
 */
export class DelayNodeHandler implements NodeHandler {
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
   * @returns true, если узел имеет тип "delay"
   */
  canHandle(node: Node): boolean {
    return node.type === 'delay';
  }

  /**
   * Обрабатывает узел типа "delay"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу DelayNode
    const delayNode = node as DelayNode;
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = delayNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(delayNode.id)) {
      userContext.history.push(delayNode.id);
    }
    
    // В текущей реализации мы не делаем задержку, а сразу переходим к следующему узлу
    await ctx.reply('Переход к следующему узлу без задержки (функция задержки будет реализована в будущем)');
    
    // Переходим к следующему узлу
    const nextNode = findNodeById(this.config, delayNode.next);
    if (nextNode) {
      // Находим подходящий обработчик для следующего узла
      const handler = this.nodeHandlers.find(h => h.canHandle(nextNode));
      if (handler) {
        await handler.handle(ctx, nextNode, userContext);
      } else {
        throw new Error(`Не найден обработчик для узла типа ${nextNode.type}`);
      }
    } else {
      await ctx.reply('Неизвестная команда. Пожалуйста выберете другую или нажмите \start');
    }
  }
}