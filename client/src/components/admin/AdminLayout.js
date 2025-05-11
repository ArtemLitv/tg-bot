import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppBar, Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItem, ListItemIcon, ListItemText, Menu, MenuItem, Toolbar, Typography, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import CodeIcon from '@mui/icons-material/Code';
import ListIcon from '@mui/icons-material/List';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

const drawerWidth = 240;

/**
 * Компонент для общего макета админ-панели
 */
const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    // Получение токена авторизации
    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    // Проверка авторизации
    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            navigate('/login');
        } else {
            // Получаем информацию о пользователе
            const fetchUserInfo = async () => {
                try {
                    const response = await axios.get('/api/auth/check', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setUser(response.data.user);
                } catch (error) {
                    console.error('Ошибка при получении информации о пользователе:', error);
                    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                        // Если токен недействителен или доступ запрещен, перенаправляем на страницу входа
                        localStorage.removeItem('authToken');
                        navigate('/login');
                    }
                }
            };

            fetchUserInfo();
        }
    }, [navigate]);

    // Обработчик открытия/закрытия мобильного меню
    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // Обработчик открытия меню пользователя
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Обработчик закрытия меню пользователя
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Обработчик выхода из системы
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        navigate('/login');
    };

    // Проверка активности пункта меню
    const isActive = (path) => {
        return location.pathname === path;
    };

    // Пункты меню
    const menuItems = [
        {
            text: 'Граф узлов',
            icon: <AccountTreeIcon/>,
            path: '/admin/graph',
        },
        {
            text: 'Пользователи',
            icon: <PeopleIcon/>,
            path: '/admin/users',
        },
        {
            text: 'Конфигурация',
            icon: <CodeIcon/>,
            path: '/admin/config',
        },
        {
            text: 'Логи',
            icon: <ListIcon/>,
            path: '/admin/logs',
        },
        {
            text: 'Управление ботом',
            icon: <SettingsIcon/>,
            path: '/admin/bot',
        },
    ];

    // Содержимое бокового меню
    const drawer = (
        <div>
            <Toolbar>
                <Typography variant="h6" noWrap component="div">
                    Админ-панель
                </Typography>
            </Toolbar>
            <Divider/>
            <List>
                {menuItems.map((item) => (
                    <ListItem
                        key={item.text}
                        component={Link}
                        to={item.path}
                        selected={isActive(item.path)}
                        onClick={() => isMobile && setMobileOpen(false)}
                        sx={{
                            '&.Mui-selected': {
                                backgroundColor: 'primary.light',
                                '&:hover': {
                                    backgroundColor: 'primary.light',
                                },
                            },
                        }}
                    >
                        <ListItemIcon>{item.icon}</ListItemIcon>
                        <ListItemText primary={item.text}/>
                    </ListItem>
                ))}
            </List>
        </div>
    );

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                width: '100%',
                height: '100vh',
                overflow: 'hidden'
            }}
        >
            <Box
                component="nav"
                sx={{
                    display: 'flex',
                    maxWidth: { xs: '100%', md: '300px' },
                    minWidth: { xs: '100%', md: '240px' },
                    height: { xs: 'auto', md: '100vh' },
                    zIndex: { xs: 1, md: 'auto' }
                }}
            >
                {/* Боковое меню */}
                {/* Мобильное меню */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true, // Лучшая производительность на мобильных устройствах
                    }}
                    sx={{
                        display: {xs: 'block', md: 'none'},
                        '& .MuiDrawer-paper': {boxSizing: 'border-box', width: drawerWidth},
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Десктопное меню */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: {xs: 'none', md: 'block'},
                        '& .MuiDrawer-paper': {boxSizing: 'border-box', width: drawerWidth},
                    }}
                    open
                >
                    {drawer}
                </Drawer>


            </Box>
            {/* Wrapper */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    width: '100%',
                    height: { xs: 'calc(100vh - 56px)', md: '100vh' }
                }}
            >
                {/* Верхняя панель (header) */}
                <AppBar
                    position="static"
                    component="header"
                    sx={{
                        width: '100%'
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{mr: 2, display: {md: 'none'}}}
                        >
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" noWrap component="div" sx={{flexGrow: 1}}>
                            Telegram Bot Admin
                        </Typography>

                        {user && (
                            <>
                                <Button
                                    color="inherit"
                                    onClick={handleMenuOpen}
                                    startIcon={
                                        <Avatar
                                            sx={{width: 32, height: 32, bgcolor: 'secondary.main'}}
                                        >
                                            {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
                                        </Avatar>
                                    }
                                >
                                    {user.username}
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleLogout}>
                                        <ListItemIcon>
                                            <LogoutIcon fontSize="small"/>
                                        </ListItemIcon>
                                        <ListItemText>Выйти</ListItemText>
                                    </MenuItem>
                                </Menu>
                            </>
                        )}
                    </Toolbar>
                </AppBar>

                {/* Основное содержимое (main) */}
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        p: 3,
                        height: '100%',
                        overflow: 'auto'
                    }}
                >
                    <Outlet/>
                </Box>
            </Box>
        </Box>
    );
};

export default AdminLayout;
