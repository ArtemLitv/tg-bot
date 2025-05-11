// Компонент для отображения графа узлов
import ReactFlow, { addEdge, Background, Controls, MiniMap, useEdgesState, useNodesState } from "reactflow";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import NodeSidebar from "../components/NodeSidebar";
import dagre from 'dagre';
import CustomNode from "../components/CustomNode";
import SettingsBar from "../components/SettingsBar";
import './FlowChartSettings.css';

export function FlowChart() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [, setBotConfig] = useState(null); // Неиспользуемая переменная botConfig удалена
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [moveChildrenWithParent, setMoveChildrenWithParent] = useState(true); // Состояние для настройки перемещения дочерних нод
    const location = useLocation(); // Получаем текущий путь

    // Кастомный обработчик изменения нод, который перемещает дочерние ноды вместе с родительской
    // Этот обработчик перехватывает события перетаскивания нод и, если нода перетаскивается и включена соответствующая настройка,
    // также перемещает все её дочерние ноды (включая потомков потомков) на то же расстояние
    const handleNodesChange = useCallback((changes) => {
        // Применяем стандартный обработчик изменений
        onNodesChange(changes);

        // Если настройка перемещения дочерних нод выключена, не выполняем дополнительную логику
        if (!moveChildrenWithParent) return;

        // Обрабатываем только изменения позиции (перетаскивание)
        const positionChanges = changes.filter(change => 
            change.type === 'position' && change.position && change.dragging
        );

        if (positionChanges.length > 0) {
            positionChanges.forEach(change => {
                const nodeId = change.id;
                const position = change.position;

                // Получаем текущую ноду для определения смещения
                const parentNode = nodes.find(node => node.id === nodeId);
                if (!parentNode) return;

                // Вычисляем смещение от предыдущей позиции
                const deltaX = position.x - parentNode.position.x;
                const deltaY = position.y - parentNode.position.y;

                // Функция для рекурсивного поиска всех дочерних нод
                const findAllChildNodes = (nodeId, visited = new Set()) => {
                    // Предотвращаем бесконечную рекурсию при циклических связях
                    if (visited.has(nodeId)) return [];
                    visited.add(nodeId);

                    // Находим непосредственных потомков
                    const directChildren = edges
                        .filter(edge => edge.source === nodeId)
                        .map(edge => edge.target);

                    // Рекурсивно находим потомков потомков
                    const allChildren = [...directChildren];
                    directChildren.forEach(childId => {
                        const childrenOfChild = findAllChildNodes(childId, visited);
                        allChildren.push(...childrenOfChild);
                    });

                    return allChildren;
                };

                // Получаем все дочерние ноды, включая потомков потомков
                const allChildNodeIds = findAllChildNodes(nodeId);

                if (allChildNodeIds.length > 0) {
                    // Обновляем позиции всех дочерних нод
                    setNodes(nds => 
                        nds.map(node => {
                            if (allChildNodeIds.includes(node.id)) {
                                return {
                                    ...node,
                                    position: {
                                        x: node.position.x + deltaX,
                                        y: node.position.y + deltaY
                                    }
                                };
                            }
                            return node;
                        })
                    );
                }
            });
        }
    }, [nodes, edges, onNodesChange, setNodes, moveChildrenWithParent]);

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
                        position: {x: 0, y: 0},
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
                const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
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

        // Обновляем ноды, чтобы выделить выбранную ноду
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                selected: n.id === node.id,
            }))
        );
    }, [setNodes]);

    // Обработчик соединения нод
    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge(params, eds));
    }, [setEdges]);

    // Обработчик клика на пустое место графа
    const onPaneClick = useCallback(() => {
        setSelectedNode(null);

        // Снимаем выделение со всех нод
        setNodes((nds) =>
            nds.map((n) => ({
                ...n,
                selected: false,
            }))
        );
    }, [setNodes]);


    if (isLoading) {
        return <div>Загрузка конфигурации...</div>;
    }

    if (error) {
        return <div>Ошибка: {error}</div>;
    }

    // Определяем класс контейнера в зависимости от текущего пути
    const containerClass = location.pathname.startsWith('/admin/')
        ? 'admin-flow-container'
        : 'flow-container';


    return (
        <div className={containerClass}>
            {/* Отображаем полосу с настройками только на странице /admin/graph */}
            {location.pathname === '/admin/graph' && 
                <SettingsBar 
                    className={'header'} 
                    moveChildrenWithParent={moveChildrenWithParent}
                    setMoveChildrenWithParent={setMoveChildrenWithParent}
                />
            }
            <ReactFlow
                className={'flow'}
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls/>
                <MiniMap/>
                <Background variant="dots" gap={12} size={1}/>
            </ReactFlow>
            {selectedNode && (
                <NodeSidebar className={'sidebar'} node={selectedNode} onClose={() => setSelectedNode(null)}/>
            )}
        </div>
    );
}


// Функция для автоматической компоновки графа с использованием Dagre
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Настройка направления графа (TB - сверху вниз, LR - слева направо)
    dagreGraph.setGraph({rankdir: direction});

    // Добавление узлов в граф Dagre
    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {width: 400, height: 80});
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

    return {nodes: layoutedNodes, edges};
};

// Регистрация пользовательских типов нод
const nodeTypes = {
    custom: CustomNode,
};
