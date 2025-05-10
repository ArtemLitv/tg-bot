import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Button,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
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
          if (error.response && error.response.status === 401) {
            // Если токен недействителен, перенаправляем на страницу входа
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
      icon: <AccountTreeIcon />,
      path: '/',
    },
    {
      text: 'Пользователи',
      icon: <PeopleIcon />,
      path: '/admin/users',
    },
    {
      text: 'Конфигурация',
      icon: <CodeIcon />,
      path: '/admin/config',
    },
    {
      text: 'Логи',
      icon: <ListIcon />,
      path: '/admin/logs',
    },
    {
      text: 'Управление ботом',
      icon: <SettingsIcon />,
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
      <Divider />
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
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Верхняя панель */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Telegram Bot Admin
          </Typography>

          {user && (
            <>
              <Button
                color="inherit"
                onClick={handleMenuOpen}
                startIcon={
                  <Avatar
                    sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
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
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Выйти</ListItemText>
                </MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Боковое меню */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Мобильное меню */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Лучшая производительность на мобильных устройствах
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Десктопное меню */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Основное содержимое */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // Высота AppBar
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
