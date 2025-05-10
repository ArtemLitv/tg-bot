import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import BugReportIcon from '@mui/icons-material/BugReport';

/**
 * Компонент для просмотра логов
 */
const LogViewer = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [logLevel, setLogLevel] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(100);

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

  // Получение логов
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        
        // Формируем параметры запроса
        const params = {
          page,
          limit,
        };
        
        // Добавляем параметр уровня логирования, если он выбран
        if (logLevel) {
          params.level = logLevel;
        }
        
        const response = await axios.get('/api/logs', {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setLogs(response.data.logs);
        setTotalPages(Math.ceil(response.data.pagination.total / limit));
      } catch (error) {
        console.error('Ошибка при получении логов:', error);
        
        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else {
          setError('Ошибка при загрузке логов. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [navigate, page, limit, logLevel]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  // Обработчик изменения уровня логирования
  const handleLogLevelChange = (event) => {
    setLogLevel(event.target.value);
    setPage(1); // Сбрасываем страницу при изменении фильтра
  };

  // Обработчик изменения страницы
  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Фильтрация логов по поисковому запросу
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      log.message.toLowerCase().includes(searchTermLower) ||
      (log.meta && log.meta.toLowerCase().includes(searchTermLower))
    );
  });

  // Получение иконки для уровня логирования
  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warn':
        return <WarningIcon color="warning" />;
      case 'info':
        return <InfoIcon color="info" />;
      case 'debug':
        return <BugReportIcon color="action" />;
      default:
        return null;
    }
  };

  // Получение цвета для уровня логирования
  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'error';
      case 'warn':
        return 'warning';
      case 'info':
        return 'info';
      case 'debug':
        return 'default';
      default:
        return 'default';
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Логи
      </Typography>
      
      {/* Фильтры */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          sx={{ flexGrow: 1, minWidth: '200px' }}
          variant="outlined"
          placeholder="Поиск в логах..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl sx={{ minWidth: '150px' }}>
          <InputLabel id="log-level-label">Уровень</InputLabel>
          <Select
            labelId="log-level-label"
            id="log-level"
            value={logLevel}
            label="Уровень"
            onChange={handleLogLevelChange}
          >
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="error">Ошибка</MenuItem>
            <MenuItem value="warn">Предупреждение</MenuItem>
            <MenuItem value="info">Информация</MenuItem>
            <MenuItem value="debug">Отладка</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {/* Сообщения об ошибках */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Список логов */}
      <Paper sx={{ width: '100%', mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <List>
              {filteredLogs.length === 0 ? (
                <ListItem>
                  <ListItemText primary="Нет логов для отображения" />
                </ListItem>
              ) : (
                filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <ListItem alignItems="flex-start">
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {getLevelIcon(log.level)}
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {formatDate(log.timestamp)}
                          </Typography>
                          <Chip
                            label={log.level.toUpperCase()}
                            size="small"
                            color={getLevelColor(log.level)}
                            sx={{ ml: 2 }}
                          />
                        </Box>
                        <Typography variant="body1" gutterBottom>
                          {log.message}
                        </Typography>
                        {log.meta && (
                          <Box
                            sx={{
                              backgroundColor: 'background.default',
                              p: 1,
                              borderRadius: 1,
                              mt: 1,
                              overflowX: 'auto',
                            }}
                          >
                            <Typography variant="body2" component="pre" sx={{ m: 0 }}>
                              {log.meta}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
            
            {/* Пагинация */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LogViewer;