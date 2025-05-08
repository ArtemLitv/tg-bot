/**
 * Обработчик узлов типа "message"
 */

import { Context } from 'telegraf';
import { MessageNode, Node, UserContext } from '../config-types';
import { NodeHandler } from './node-handler.interface';
import { sendContent } from './utils';

/**
 * Обработчик для узлов типа "message"
 */
export class MessageNodeHandler implements NodeHandler {
  /**
   * Проверяет, может ли обработчик обработать данный узел
   * @param node Узел для проверки
   * @returns true, если узел имеет тип "message"
   */
  canHandle(node: Node): boolean {
    return node.type === 'message';
  }

  /**
   * Обрабатывает узел типа "message"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу MessageNode
    const messageNode = node as MessageNode;
    
    // Отправляем содержимое сообщения
    await sendContent(
      ctx,
      messageNode.content,
      userContext.language,
      messageNode.buttons
    );
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = messageNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(messageNode.id)) {
      userContext.history.push(messageNode.id);
    }
  }
}