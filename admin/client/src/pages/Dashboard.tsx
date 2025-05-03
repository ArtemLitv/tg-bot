import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Chip
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Article as LogIcon
} from '@mui/icons-material';
import { getBotStatus } from '../services/api';
import { getSocket } from '../services/socket';

const Dashboard: React.FC = () => {
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize socket
    const socket = getSocket();

    // Listen for bot status updates
    socket.on('botStatus', (data: { running: boolean }) => {
      setBotRunning(data.running);
    });

    // Get initial bot status
    const fetchBotStatus = async () => {
      try {
        const response = await getBotStatus();
        setBotRunning(response.data.running);
      } catch (error) {
        console.error('Failed to get bot status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBotStatus();

    // Cleanup
    return () => {
      socket.off('botStatus');
    };
  }, []);

  const features = [
    {
      title: 'Bot Control',
      description: 'Start and stop the Telegram bot',
      icon: <PlayIcon color="primary" />,
      path: '/bot'
    },
    {
      title: 'Environment Configuration',
      description: 'Manage TELEGRAM_BOT_TOKEN and other environment variables',
      icon: <SettingsIcon color="primary" />,
      path: '/env'
    },
    {
      title: 'Menu Editor',
      description: 'View and edit the bot menu configuration',
      icon: <MenuIcon color="primary" />,
      path: '/menu'
    },
    {
      title: 'Log Viewer',
      description: 'View bot logs in real-time',
      icon: <LogIcon color="primary" />,
      path: '/logs'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Telegram Bot Admin Dashboard
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Bot Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Status:
          </Typography>
          {loading ? (
            <Chip label="Loading..." />
          ) : botRunning ? (
            <Chip label="Running" color="success" />
          ) : (
            <Chip label="Stopped" color="error" />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            component={RouterLink}
            to="/bot"
            startIcon={botRunning ? <StopIcon /> : <PlayIcon />}
          >
            {botRunning ? 'Stop Bot' : 'Start Bot'}
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/logs"
            startIcon={<LogIcon />}
          >
            View Logs
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Admin Features
      </Typography>

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} key={feature.title}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {feature.icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  {feature.title}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {feature.description}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                component={RouterLink}
                to={feature.path}
              >
                Go to {feature.title}
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
