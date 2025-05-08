/**
 * Интерфейс обработчика узла
 */

import { Context } from 'telegraf';
import { Node, UserContext } from '../config-types';

/**
 * Интерфейс для обработчиков узлов
 */
export interface NodeHandler {
  /**
   * Проверяет, может ли обработчик обработать данный узел
   * @param node Узел для проверки
   * @returns true, если обработчик может обработать узел, иначе false
   */
  canHandle(node: Node): boolean;

  /**
   * Обрабатывает узел
   * @param ctx Контекст Telegraf
   * @param node Узел для обработки
   * @param userContext Контекст пользователя
   * @returns Promise<void>
   */
  handle(ctx: Context, node: Node, userContext: UserContext): Promise<void>;
}