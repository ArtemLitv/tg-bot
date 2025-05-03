import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { getBotStatus, startBot, stopBot } from '../services/api';
import { getSocket } from '../services/socket';

const BotControl: React.FC = () => {
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket
    const socket = getSocket();
    
    // Listen for bot status updates
    socket.on('botStatus', (data: { running: boolean }) => {
      setBotRunning(data.running);
      setActionLoading(false);
    });
    
    // Get initial bot status
    const fetchBotStatus = async () => {
      try {
        const response = await getBotStatus();
        setBotRunning(response.data.running);
      } catch (error) {
        console.error('Failed to get bot status:', error);
        setError('Failed to get bot status. Please try again.');
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

  const handleStartBot = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await startBot();
      setSuccess('Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);
      setError('Failed to start bot. Please check the logs for details.');
      setActionLoading(false);
    }
  };

  const handleStopBot = async () => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await stopBot();
      setSuccess('Bot stopped successfully');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      setError('Failed to stop bot. Please check the logs for details.');
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bot Control
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Bot Status
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Current Status:
              </Typography>
              {botRunning ? (
                <Chip label="Running" color="success" />
              ) : (
                <Chip label="Stopped" color="error" />
              )}
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayIcon />}
                onClick={handleStartBot}
                disabled={botRunning || actionLoading}
              >
                {actionLoading && !botRunning ? <CircularProgress size={24} /> : 'Start Bot'}
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleStopBot}
                disabled={!botRunning || actionLoading}
              >
                {actionLoading && botRunning ? <CircularProgress size={24} /> : 'Stop Bot'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About Bot Control
        </Typography>
        <Typography variant="body1">
          This page allows you to start and stop the Telegram bot. When the bot is running, it will respond to user messages according to the configured menu.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Starting the bot will launch a new process that runs the bot code. Stopping the bot will terminate this process.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Note: Changes to the bot configuration (environment variables, menu) will only take effect after restarting the bot.
        </Typography>
      </Paper>
    </Box>
  );
};

export default BotControl;