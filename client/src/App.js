import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'reactflow/dist/style.css';

// Импорт компонентов админ-панели
import Login from './components/admin/Login';
import AdminLayout from './components/admin/AdminLayout';
import UserTable from './components/admin/UserTable';
import UserHistory from './components/admin/UserHistory';
import ConfigEditor from './components/admin/ConfigEditor';
import LogViewer from './components/admin/LogViewer';
import BotControl from './components/admin/BotControl';
import { FlowChart } from "./components/FlowChart";



// Компонент для проверки авторизации
function RequireAuth({children}) {
    const isAuthenticated = localStorage.getItem('authToken') !== null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }

    return children;
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem('authToken') !== null
    );

    // Обработчик успешной авторизации
    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    // Создаем роутер с future flags для React Router v7
    const router = createBrowserRouter([
        // Маршрут для авторизации
        {
            path: "/login",
            element: <Login onLogin={handleLogin}/>
        },
        // Маршруты для админ-панели
        {
            path: "/admin",
            element: <RequireAuth><AdminLayout/></RequireAuth>,
            children: [
                {
                    index: true,
                    element: <Navigate to="/admin/users" replace/>
                },
                {
                    path: "users",
                    element: <UserTable/>
                },
                {
                    path: "users/:userId",
                    element: <UserHistory/>
                },
                {
                    path: "config",
                    element: <ConfigEditor/>
                },
                {
                    path: "logs",
                    element: <LogViewer/>
                },
                {
                    path: "bot",
                    element: <BotControl/>
                },
                {
                    path: "graph",
                    element: <FlowChart/>
                }
            ]
        },
        // Перенаправление с корневого маршрута на админ-панель
        {
            path: "/",
            element: <Navigate to="/admin/graph" replace/>
        },
        // Перенаправление для неизвестных маршрутов
        {
            path: "*",
            element: <Navigate to="/" replace/>
        }
    ], {
        // Добавляем future flags для React Router v7
        future: {
            v7_startTransition: true,
            v7_relativeSplatPath: true
        }
    });

    return <RouterProvider router={router} />;
}

export default App;
