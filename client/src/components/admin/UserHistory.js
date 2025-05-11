import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import InputIcon from '@mui/icons-material/Input';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LanguageIcon from '@mui/icons-material/Language';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

/**
 * Компонент для отображения истории переходов пользователя
 */
const UserHistory = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [historyPagination, setHistoryPagination] = useState({
    page: 0,
    pageSize: 10,
  });
  const [inputsPagination, setInputsPagination] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalHistory, setTotalHistory] = useState(0);
  const [totalInputs, setTotalInputs] = useState(0);

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

  // Получение информации о пользователе
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        const response = await axios.get(`/api/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data);
      } catch (error) {
        console.error('Ошибка при получении информации о пользователе:', error);

        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else if (error.response && error.response.status === 404) {
          setError('Пользователь не найден');
        } else {
          setError('Ошибка при загрузке данных. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, navigate]);

  // Получение истории переходов пользователя
  useEffect(() => {
    const fetchHistory = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        const response = await axios.get(`/api/users/${userId}/history`, {
          params: {
            page: historyPagination.page + 1, // API использует нумерацию с 1
            limit: historyPagination.pageSize,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setHistory(response.data.history);
        setTotalHistory(response.data.pagination.total);
      } catch (error) {
        console.error('Ошибка при получении истории переходов:', error);

        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else {
          setError('Ошибка при загрузке истории. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tabValue === 0) {
      fetchHistory();
    }
  }, [userId, navigate, historyPagination, tabValue]);

  // Получение вводимых пользователем данных
  useEffect(() => {
    const fetchInputs = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        const response = await axios.get(`/api/users/${userId}/inputs`, {
          params: {
            page: inputsPagination.page + 1, // API использует нумерацию с 1
            limit: inputsPagination.pageSize,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setInputs(response.data.inputs);
        setTotalInputs(response.data.pagination.total);
      } catch (error) {
        console.error('Ошибка при получении вводимых данных:', error);

        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else {
          setError('Ошибка при загрузке данных. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tabValue === 1) {
      fetchInputs();
    }
  }, [userId, navigate, inputsPagination, tabValue]);

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Обработчик возврата к списку пользователей
  const handleBackClick = () => {
    navigate('/admin/users');
  };

  // Определение колонок для таблицы истории переходов
  const historyColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nodeId', headerName: 'ID узла', width: 150 },
    { 
      field: 'timestamp', 
      headerName: 'Время перехода', 
      width: 200,
      valueGetter: (params) => {
        if (!params.row || !params.row.timestamp) return 'Не определено';
        const date = new Date(params.row.timestamp);
        return date.toLocaleString('ru-RU');
      }
    },
  ];

  // Определение колонок для таблицы вводимых данных
  const inputsColumns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nodeId', headerName: 'ID узла', width: 150 },
    { field: 'inputType', headerName: 'Тип ввода', width: 120 },
    { 
      field: 'inputValue', 
      headerName: 'Значение', 
      width: 300,
      renderCell: (params) => {
        // Для некоторых типов данных можно добавить специальное отображение
        if (params.row.inputType === 'location') {
          try {
            const location = JSON.parse(params.row.inputValue);
            return `Широта: ${location.latitude}, Долгота: ${location.longitude}`;
          } catch (e) {
            return params.row.inputValue;
          }
        }
        return params.row.inputValue;
      }
    },
    { 
      field: 'timestamp', 
      headerName: 'Время ввода', 
      width: 200,
      valueGetter: (params) => {
        if (!params.row || !params.row.timestamp) return 'Не определено';
        const date = new Date(params.row.timestamp);
        return date.toLocaleString('ru-RU');
      }
    },
  ];

  // Если данные загружаются, показываем индикатор загрузки
  if (loading && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Если произошла ошибка, показываем сообщение об ошибке
  if (error && !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBackClick}
          sx={{ mt: 2 }}
        >
          Вернуться к списку пользователей
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Хлебные крошки */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          onClick={handleBackClick}
          sx={{ cursor: 'pointer' }}
        >
          Пользователи
        </Link>
        <Typography color="text.primary">
          {user?.username || user?.firstName || `Пользователь ${userId}`}
        </Typography>
      </Breadcrumbs>

      {/* Кнопка возврата */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackClick}
        sx={{ mb: 3 }}
      >
        Вернуться к списку пользователей
      </Button>

      {/* Информация о пользователе */}
      {user && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {user.username ? `@${user.username}` : 'Пользователь без имени пользователя'}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="body1">
                    {user.firstName} {user.lastName}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LanguageIcon sx={{ mr: 1, color: 'info.main' }} />
                  <Typography variant="body1">
                    Язык: {user.languageCode || 'Не указан'}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="body1">
                    Последняя активность: {new Date(user.lastActivityAt).toLocaleString('ru-RU')}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccountTreeIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="body1">
                    Текущий узел: {user.currentNodeId}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Вкладки */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user history tabs">
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start" 
            label="История переходов" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<InputIcon />} 
            iconPosition="start" 
            label="Вводимые данные" 
            id="tab-1" 
            aria-controls="tabpanel-1" 
          />
        </Tabs>
      </Box>

      {/* Содержимое вкладок */}
      <div
        role="tabpanel"
        hidden={tabValue !== 0}
        id="tabpanel-0"
        aria-labelledby="tab-0"
      >
        {tabValue === 0 && (
          <Paper sx={{ height: 500, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <DataGrid
              rows={history}
              columns={historyColumns}
              loading={loading && tabValue === 0}
              paginationModel={historyPagination}
              onPaginationModelChange={setHistoryPagination}
              pageSizeOptions={[5, 10, 25, 50]}
              pagination
              paginationMode="server"
              rowCount={totalHistory}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            />
          </Paper>
        )}
      </div>

      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {tabValue === 1 && (
          <Paper sx={{ height: 500, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <DataGrid
              rows={inputs}
              columns={inputsColumns}
              loading={loading && tabValue === 1}
              paginationModel={inputsPagination}
              onPaginationModelChange={setInputsPagination}
              pageSizeOptions={[5, 10, 25, 50]}
              pagination
              paginationMode="server"
              rowCount={totalInputs}
              localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
            />
          </Paper>
        )}
      </div>
    </Box>
  );
};

export default UserHistory;
