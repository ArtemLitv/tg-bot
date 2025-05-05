import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  NodeTypes,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, Paper, Typography, Button } from '@mui/material';

// Интерфейсы для структуры меню
interface MessageContent {
  text?: string;
  photo?: string;
  link?: {
    url: string;
    text: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface MenuItem {
  title: string;
  message?: string | MessageContent;
  subMenu?: MenuItem[];
  action?: 'back';
}

// Кастомный компонент для узла
const CustomNode = ({ data }: { data: any }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        padding: 2,
        minWidth: 200,
        maxWidth: 300,
        borderRadius: 2,
        backgroundColor: data.isBack ? '#ffebee' : '#f5f5f5',
        border: data.isBack ? '1px solid #f44336' : '1px solid #e0e0e0'
      }}
    >
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {data.title}
      </Typography>

      {data.messageText && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {data.messageText.length > 100 
            ? `${data.messageText.substring(0, 100)}...` 
            : data.messageText}
        </Typography>
      )}

      {data.buttons && data.buttons.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Кнопки:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
            {data.buttons.map((button: string, index: number) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                sx={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px',
                  minWidth: 'auto',
                  textTransform: 'none'
                }}
              >
                {button}
              </Button>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
};

// Основной компонент для визуализации меню
const MenuFlowViewer: React.FC<{ menu: MenuItem[] }> = ({ menu }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeTypes] = useState<NodeTypes>({ custom: CustomNode });

  // Функция для преобразования структуры меню в формат для reactflow
  const processMenu = useCallback((menuItems: MenuItem[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Хранение идентификаторов нод по уровням для создания последовательных связей
    const nodesByLevel: Record<number, string[]> = {};

    // Рекурсивная функция для обработки элементов меню
    const processMenuItem = (
      item: MenuItem, 
      parentId: string | null = null, 
      level: number = 0, 
      position = { x: 0, y: 0 },
      index: number = 0
    ) => {
      // Создаем уникальный ID для узла
      const nodeId = parentId ? `${parentId}-${index}` : `root-${index}`;

      // Инициализируем массив для текущего уровня, если его еще нет
      if (!nodesByLevel[level]) {
        nodesByLevel[level] = [];
      }

      // Добавляем текущий nodeId в массив для его уровня
      nodesByLevel[level].push(nodeId);

      // Определяем текст сообщения
      let messageText = '';

      if (item.message) {
        if (typeof item.message === 'string') {
          messageText = item.message;
        } else {
          if (item.message.text) messageText = item.message.text;
          if (item.message.link) messageText = `${item.message.link.text}: ${item.message.link.url}`;
          if (item.message.photo) messageText = item.message.photo + (item.message.text ? `\n${item.message.text}` : '');
          if (item.message.location) messageText = `Локация: ${item.message.location.latitude}, ${item.message.location.longitude}`;
        }
      }

      // Добавляем узел
      newNodes.push({
        id: nodeId,
        type: 'custom',
        position,
        data: {
          title: item.title,
          messageText,
          isBack: item.action === 'back',
          buttons: item.subMenu ? item.subMenu.map(subItem => subItem.title) : []
        }
      });

      // Добавляем ребро, если есть родительский узел
      if (parentId) {
        newEdges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          markerEnd: {
            type: MarkerType.ArrowClosed
          },
          style: { stroke: '#888' },
          label: item.title
        });
      }

      // Обрабатываем подменю, если оно есть
      if (item.subMenu && item.subMenu.length > 0) {
        const childSpacing = 300; // Расстояние между дочерними узлами
        const startX = position.x - ((item.subMenu.length - 1) * childSpacing) / 2;

        item.subMenu.forEach((subItem, subIndex) => {
          const childPosition = {
            x: startX + subIndex * childSpacing,
            y: position.y + 200 // Расстояние по вертикали между уровнями
          };

          processMenuItem(subItem, nodeId, level + 1, childPosition, subIndex);
        });
      }
    };

    // Обрабатываем корневые элементы меню
    const rootSpacing = 400; // Расстояние между корневыми узлами
    const startX = -((menu.length - 1) * rootSpacing) / 2;

    menu.forEach((item, index) => {
      const position = { x: startX + index * rootSpacing, y: 0 };
      processMenuItem(item, null, 0, position, index);
    });

    // Создаем последовательные связи между нодами одного уровня
    Object.keys(nodesByLevel).forEach(levelStr => {
      const level = parseInt(levelStr);
      const nodesInLevel = nodesByLevel[level];

      // Если на уровне больше одной ноды, создаем последовательные связи
      if (nodesInLevel.length > 1) {
        for (let i = 0; i < nodesInLevel.length - 1; i++) {
          const sourceId = nodesInLevel[i];
          const targetId = nodesInLevel[i + 1];

          // Создаем ребро от текущей ноды к следующей
          newEdges.push({
            id: `seq-${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            markerEnd: {
              type: MarkerType.ArrowClosed
            },
            style: { 
              stroke: '#2196f3',
              strokeWidth: 2,
              strokeDasharray: '5 5'
            },
            animated: true,
            label: 'Следующий'
          });
        }
      }
    });

    return { nodes: newNodes, edges: newEdges };
  }, [menu]);

  // Обновляем граф при изменении меню
  useEffect(() => {
    if (menu && menu.length > 0) {
      const { nodes: newNodes, edges: newEdges } = processMenu(menu);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [menu, processMenu, setNodes, setEdges]);

  // Функция для центрирования графа
  const fitView = useCallback(() => {
    // Используем type assertion для обхода ошибки TypeScript
    const reactFlowElement = document.querySelector('.react-flow');
    // @ts-ignore - Игнорируем ошибку TypeScript для доступа к внутреннему API ReactFlow
    const reactFlowInstance = reactFlowElement ? reactFlowElement['__reactFlowInstance'] : null;
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  }, []);

  return (
    <Box sx={{ width: '100%', height: 600, border: '1px solid #ddd', borderRadius: 1 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-right">
          <Button variant="outlined" size="small" onClick={fitView}>
            Центрировать
          </Button>
        </Panel>
      </ReactFlow>
    </Box>
  );
};

export default MenuFlowViewer;
