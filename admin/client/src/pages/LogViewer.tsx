import React, { useEffect, useState, useRef } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getLogs, clearLogs } from '../services/api';
import { getSocket } from '../services/socket';

interface Log {
  timestamp: string;
  type: string;
  message: string;
}

const LogViewer: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize socket
    const socket = getSocket();
    
    // Listen for new logs
    socket.on('newLog', (log: Log) => {
      setLogs(prevLogs => [...prevLogs, log]);
    });
    
    // Listen for logs cleared
    socket.on('logsCleared', () => {
      setLogs([]);
      setSuccess('Logs cleared successfully');
    });
    
    // Get initial logs
    fetchLogs();
    
    // Cleanup
    return () => {
      socket.off('newLog');
      socket.off('logsCleared');
    };
  }, []);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getLogs();
      setLogs(response.data.logs);
    } catch (error) {
      console.error('Failed to get logs:', error);
      setError('Failed to load logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await clearLogs();
      setSuccess('Logs cleared successfully');
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
      setError('Failed to clear logs. Please try again.');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'stderr':
        return 'error.main';
      case 'stdout':
      default:
        return 'text.primary';
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Log Viewer
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Bot Logs
          </Typography>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-scroll"
              sx={{ mr: 2 }}
            />
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchLogs}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleClearLogs}
              disabled={loading || logs.length === 0}
            >
              Clear Logs
            </Button>
          </Box>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Alert severity="info">
            No logs available. Start the bot to generate logs.
          </Alert>
        ) : (
          <Paper
            variant="outlined"
            sx={{
              maxHeight: '500px',
              overflow: 'auto',
              bgcolor: 'background.paper',
              fontFamily: 'monospace',
              p: 1
            }}
          >
            <List dense>
              {logs.map((log, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box component="span" sx={{ display: 'flex' }}>
                        <Box component="span" sx={{ color: 'text.secondary', minWidth: '180px' }}>
                          {formatTimestamp(log.timestamp)}
                        </Box>
                        <Box component="span" sx={{ color: getLogColor(log.type), wordBreak: 'break-all' }}>
                          {log.message}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
              <div ref={logEndRef} />
            </List>
          </Paper>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About Log Viewer
        </Typography>
        <Typography variant="body1">
          This page displays logs from the Telegram bot in real-time. Logs include standard output (stdout) and error output (stderr) from the bot process.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          Use the auto-scroll feature to automatically scroll to the newest logs as they arrive.
        </Typography>
      </Paper>
    </Box>
  );
};

export default LogViewer;