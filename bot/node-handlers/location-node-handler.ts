/**
 * Обработчик узлов типа "location"
 */

import { Context } from 'telegraf';
import { LocationNode, Node, UserContext } from '../config-types';
import { NodeHandler } from './node-handler.interface';
import { sendContent } from './utils';

/**
 * Обработчик для узлов типа "location"
 */
export class LocationNodeHandler implements NodeHandler {
  /**
   * Проверяет, может ли обработчик обработать данный узел
   * @param node Узел для проверки
   * @returns true, если узел имеет тип "location"
   */
  canHandle(node: Node): boolean {
    return node.type === 'location';
  }

  /**
   * Обрабатывает узел типа "location"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу LocationNode
    const locationNode = node as LocationNode;
    
    // Отправляем содержимое с местоположением
    await sendContent(
      ctx,
      locationNode.content,
      userContext.language,
      locationNode.buttons
    );
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = locationNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(locationNode.id)) {
      userContext.history.push(locationNode.id);
    }
  }
}