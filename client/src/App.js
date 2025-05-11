import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
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

    return (
        <Router>
            <Routes>
                {/* Маршрут для авторизации */}
                <Route path="/login" element={<Login onLogin={handleLogin}/>}/>

                {/* Маршруты для админ-панели */}
                <Route path="/admin" element={
                    <RequireAuth>
                        <AdminLayout/>
                    </RequireAuth>
                }>
                    <Route index element={<Navigate to="/admin/users" replace/>}/>
                    <Route path="users" element={<UserTable/>}/>
                    <Route path="users/:userId" element={<UserHistory/>}/>
                    <Route path="config" element={<ConfigEditor/>}/>
                    <Route path="logs" element={<LogViewer/>}/>
                    <Route path="bot" element={<BotControl/>}/>
                    <Route path="graph" element={<FlowChart/>}/>
                </Route>

                {/* Перенаправление с корневого маршрута на админ-панель */}
                <Route path="/" element={<Navigate to="/admin/graph" replace/>}/>

                {/* Перенаправление для неизвестных маршрутов */}
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
        </Router>
    );
}

export default App;
