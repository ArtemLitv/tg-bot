/**
 * Обработчик узлов типа "menu"
 */

import { Context } from 'telegraf';
import { MenuNode, Node, UserContext } from '../config-types';
import { NodeHandler } from './node-handler.interface';
import { sendContent } from './utils';

/**
 * Обработчик для узлов типа "menu"
 */
export class MenuNodeHandler implements NodeHandler {
  /**
   * Проверяет, может ли обработчик обработать данный узел
   * @param node Узел для проверки
   * @returns true, если узел имеет тип "menu"
   */
  canHandle(node: Node): boolean {
    return node.type === 'menu';
  }

  /**
   * Обрабатывает узел типа "menu"
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   */
  async handle(ctx: Context, node: Node, userContext: UserContext): Promise<void> {
    // Приводим узел к типу MenuNode
    const menuNode = node as MenuNode;
    
    // Отправляем содержимое меню с кнопками
    await sendContent(
      ctx,
      menuNode.content,
      userContext.language,
      menuNode.buttons
    );
    
    // Обновляем текущий узел в контексте пользователя
    userContext.currentNodeId = menuNode.id;
    
    // Добавляем узел в историю
    if (!userContext.history.includes(menuNode.id)) {
      userContext.history.push(menuNode.id);
    }
    
    // Сбрасываем состояние ввода, если оно было
    if (userContext.inputState) {
      userContext.inputState = undefined;
    }
  }
}