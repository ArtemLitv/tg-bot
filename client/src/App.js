import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

import NodeSidebar from './components/NodeSidebar';
import CustomNode from './components/CustomNode';

// Функция для автоматической компоновки графа с использованием Dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Настройка направления графа (TB - сверху вниз, LR - слева направо)
  dagreGraph.setGraph({ rankdir: direction });

  // Добавление узлов в граф Dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 400, height: 80 });
  });

  // Добавление связей в граф Dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Расчет компоновки
  dagre.layout(dagreGraph);

  // Применение рассчитанных позиций к узлам
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWithPosition.width / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// Регистрация пользовательских типов нод
const nodeTypes = {
  custom: CustomNode,
};

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [, setBotConfig] = useState(null); // Неиспользуемая переменная botConfig удалена
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка конфигурации бота
  useEffect(() => {
    const fetchBotConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/config/bot-config.json');
        if (!response.ok) {
          throw new Error('Не удалось загрузить конфигурацию бота');
        }
        const data = await response.json();
        setBotConfig(data);

        // Преобразование данных для reactflow
        const flowNodes = [];
        const flowEdges = [];

        // Создание нод
        data.nodes.forEach((node) => {
          flowNodes.push({
            id: node.id,
            type: 'custom',
            // Временная позиция, будет пересчитана с помощью Dagre
            position: { x: 0, y: 0 },
            data: { 
              label: node.description,
              nodeData: node
            },
          });

          // Создание связей на основе кнопок
          if (node.buttons) {
            node.buttons.filter(button => !['В главное меню', 'Назад'].includes(button.label.ru)).forEach((button, index) => {
              if (button.target_node_id) {
                flowEdges.push({
                  id: `${node.id}-${button.target_node_id}`,
                  source: node.id,
                  sourceHandle: `button-${index}`, // Указываем конкретную кнопку как источник связи
                  target: button.target_node_id,
                  animated: false,
                  // label: button.label?.ru || '',
                });
              }
            });
          }

          // Связи через кнопку назад удалены согласно требованиям
        });

        // Применение автоматической компоновки с использованием Dagre
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          flowNodes,
          flowEdges,
          'LR' // Направление графа слева направо
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (err) {
        setError(err.message);
        console.error('Ошибка при загрузке конфигурации:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBotConfig();
  }, [setNodes, setEdges]);

  // Обработчик выбора ноды
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Обработчик соединения нод
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  // Функция для перекомпоновки графа
  const onLayout = useCallback((direction) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      direction
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  if (isLoading) {
    return <div>Загрузка конфигурации...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div className="app-container">
      <div className="layout-buttons">
        <button className="layout-button" onClick={() => onLayout('TB')}>
          Компоновка сверху вниз
        </button>
        <button className="layout-button" onClick={() => onLayout('LR')}>
          Компоновка слева направо
        </button>
      </div>
      <div className="flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
      {selectedNode && (
        <NodeSidebar node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}

export default App;
