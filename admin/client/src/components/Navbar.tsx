import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Article as LogIcon
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/bot', label: 'Bot Control', icon: <PlayIcon /> },
    { path: '/env', label: 'Environment', icon: <SettingsIcon /> },
    { path: '/menu', label: 'Menu Editor', icon: <MenuIcon /> },
    { path: '/logs', label: 'Logs', icon: <LogIcon /> }
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          TG Bot Admin
        </Typography>
        <Box sx={{ display: 'flex', flexGrow: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              component={RouterLink}
              to={item.path}
              color="inherit"
              sx={{
                mx: 1,
                borderBottom: isActive(item.path) ? `2px solid ${theme.palette.secondary.main}` : 'none',
                borderRadius: 0,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              startIcon={item.icon}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;