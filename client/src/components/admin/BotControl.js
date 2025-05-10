import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  Snackbar
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Компонент для управления ботом
 */
const BotControl = () => {
  const navigate = useNavigate();
  const [botStatus, setBotStatus] = useState('unknown');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Получение токена авторизации
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Проверка авторизации
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Получение статуса бота
  const fetchBotStatus = async () => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      const response = await axios.get('/api/bot/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBotStatus(response.data.status);
    } catch (error) {
      console.error('Ошибка при получении статуса бота:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else {
        setError('Ошибка при получении статуса бота. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Получение статуса бота при загрузке компонента
  useEffect(() => {
    fetchBotStatus();
  }, [navigate]);

  // Обработчик запуска бота
  const handleStartBot = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      await axios.post('/api/bot/start', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBotStatus('running');
      setSuccess('Бот успешно запущен');
    } catch (error) {
      console.error('Ошибка при запуске бота:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при запуске бота. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик остановки бота
  const handleStopBot = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      await axios.post('/api/bot/stop', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBotStatus('stopped');
      setSuccess('Бот успешно остановлен');
    } catch (error) {
      console.error('Ошибка при остановке бота:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при остановке бота. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Обработчик перезапуска бота
  const handleRestartBot = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      await axios.post('/api/bot/restart', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setBotStatus('running');
      setSuccess('Бот успешно перезапущен');
    } catch (error) {
      console.error('Ошибка при перезапуске бота:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при перезапуске бота. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Получение текста статуса бота
  const getBotStatusText = () => {
    switch (botStatus) {
      case 'running':
        return 'Запущен';
      case 'stopped':
        return 'Остановлен';
      case 'unknown':
      default:
        return 'Неизвестно';
    }
  };

  // Получение цвета статуса бота
  const getBotStatusColor = () => {
    switch (botStatus) {
      case 'running':
        return 'success.main';
      case 'stopped':
        return 'error.main';
      case 'unknown':
      default:
        return 'text.secondary';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Управление ботом
      </Typography>
      
      {/* Сообщения об ошибках */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Карточка статуса бота */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Текущий статус
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography>Получение статуса...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {botStatus === 'running' ? (
                <CheckCircleIcon sx={{ color: 'success.main', mr: 1 }} />
              ) : (
                <ErrorIcon sx={{ color: 'error.main', mr: 1 }} />
              )}
              <Typography sx={{ color: getBotStatusColor() }}>
                {getBotStatusText()}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Кнопки управления */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Управление
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartBot}
              disabled={loading || actionLoading || botStatus === 'running'}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Запустить'}
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<StopIcon />}
              onClick={handleStopBot}
              disabled={loading || actionLoading || botStatus === 'stopped'}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Остановить'}
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<RestartAltIcon />}
              onClick={handleRestartBot}
              disabled={loading || actionLoading}
            >
              {actionLoading ? <CircularProgress size={24} /> : 'Перезапустить'}
            </Button>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="body2" color="text.secondary">
          <strong>Запустить</strong> - запускает бота, если он остановлен.<br />
          <strong>Остановить</strong> - останавливает работу бота.<br />
          <strong>Перезапустить</strong> - перезапускает бота (останавливает и запускает снова).
        </Typography>
      </Paper>
      
      {/* Информация о боте */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Информация
        </Typography>
        
        <Typography variant="body2" paragraph>
          Telegram-бот использует конфигурацию, которая определяет его поведение и структуру диалогов.
          Вы можете изменить конфигурацию в разделе "Конфигурация бота".
        </Typography>
        
        <Typography variant="body2">
          При перезапуске бота применяются все изменения в конфигурации.
          Логи работы бота доступны в разделе "Логи".
        </Typography>
      </Paper>
      
      {/* Уведомление об успешной операции */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        message={success}
      />
    </Box>
  );
};

export default BotControl;