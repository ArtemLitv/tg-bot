import React, { useEffect, useRef } from 'react';

// Компонент для отображения информации о ноде в сайдбаре
const NodeSidebar = ({ node, onClose }) => {
  const { data } = node;
  const nodeData = data.nodeData;
  const sidebarRef = useRef(null);

  // Функция для форматирования JSON
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // Обработчик клавиши Esc для закрытия сайдбара
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Добавляем обработчик события
    document.addEventListener('keydown', handleKeyDown);

    // Удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="sidebar resizable" ref={sidebarRef}>
      <div className="sidebar-header">
        <h2>{nodeData.description || 'Информация о ноде'}</h2>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px' }}>
          ✕
        </button>
      </div>

      <div className="sidebar-content">
        <h3>Основная информация</h3>
        <div>
          <strong>ID:</strong> {nodeData.id}
        </div>
        <div>
          <strong>Тип:</strong> {nodeData.type}
        </div>
        <div>
          <strong>Описание:</strong> {nodeData.description}
        </div>
      </div>

      {nodeData.content && (
        <div className="sidebar-content">
          <h3>Содержимое</h3>
          <pre>{formatJson(nodeData.content)}</pre>
        </div>
      )}

      {nodeData.buttons && nodeData.buttons.length > 0 && (
        <div className="sidebar-content">
          <h3>Кнопки</h3>
          <ul>
            {nodeData.buttons.map((button, index) => (
              <li key={index}>
                <strong>{button.label?.ru || 'Нет текста'}</strong>
                <div>
                  <small>Целевая нода: {button.target_node_id}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nodeData.actions && nodeData.actions.length > 0 && (
        <div className="sidebar-content">
          <h3>Действия</h3>
          <pre>{formatJson(nodeData.actions)}</pre>
        </div>
      )}

      <div className="sidebar-content">
        <h3>Полные данные</h3>
        <pre>{formatJson(nodeData)}</pre>
      </div>
    </div>
  );
};

export default NodeSidebar;
