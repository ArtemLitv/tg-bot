import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';

// Компонент для кастомизации отображения нод
const CustomNode = ({ data, isConnectable }) => {
  const { label, nodeData } = data;
  const nodeType = nodeData.type || 'default';
  const buttons = nodeData.buttons || [];
  // Проверяем, является ли нода первой (обычно это нода с ID "start" или "1")
  const isFirstNode = nodeData.id === 'start' || nodeData.id === '1';

  return (
    <div className={`custom-node react-flow__node-${nodeType}`}>
      {/* Секция с описанием */}
      <div className="node-header">
        <strong>{label}</strong>
        <div className="node-meta">
          <span>ID: {nodeData.id}</span>
          <span>Тип: {nodeType}</span>
        </div>
      </div>

      {/* Разделительная черта */}
      <div className="node-divider"></div>

      <div className="node-content">
        {/* Левая часть с входящим соединением (только для не-первых нод) */}
        {!isFirstNode && (
          <div className="node-input">
            <Handle
              type="target"
              position={Position.Left}
              className="node-input-handle"
              isConnectable={isConnectable}
            />
          </div>
        )}

        {/* Правая часть с кнопками */}
        {buttons.length > 0 && (
          <div className="node-buttons">
            {buttons.map((button, index) => (
              <div key={index} className="node-button">
                <div className="button-label">
                  {button.label?.ru || button.label?.en || 'Кнопка'}
                </div>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`button-${index}`}
                  className="button-handle"
                  isConnectable={isConnectable}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(CustomNode);
