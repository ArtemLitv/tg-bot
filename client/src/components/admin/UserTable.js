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
  Card,
  CardContent,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ruRU } from '@mui/x-data-grid/locales';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

/**
 * Компонент для отображения таблицы пользователей
 */
const UserTable = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalUsers, setTotalUsers] = useState(0);
  const [sortModel, setSortModel] = useState([
    {
      field: 'lastActivityAt',
      sort: 'desc',
    },
  ]);
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeToday: 0,
    activeThisWeek: 0,
    activeThisMonth: 0,
  });

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

  // Получение статистики по пользователям
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const token = getAuthToken();
        const response = await axios.get('/api/users/statistics', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setStatistics(response.data);
      } catch (error) {
        console.error('Ошибка при получении статистики:', error);
      }
    };

    fetchStatistics();
  }, []);

  // Получение списка пользователей
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();

        // Формируем параметры запроса
        const params = {
          page: paginationModel.page + 1, // API использует нумерацию с 1
          limit: paginationModel.pageSize,
        };

        // Добавляем параметры сортировки
        if (sortModel.length > 0) {
          params.sort = sortModel[0].field;
          params.order = sortModel[0].sort;
        }

        // Добавляем параметры поиска
        if (searchTerm) {
          params.filter = 'username'; // Можно настроить поиск по разным полям
          params.value = searchTerm;
        }

        const response = await axios.get('/api/users', {
          params,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(response.data.users);
        setTotalUsers(response.data.pagination.total);
      } catch (error) {
        console.error('Ошибка при получении списка пользователей:', error);

        if (error.response && error.response.status === 401) {
          // Если ошибка авторизации, перенаправляем на страницу входа
          navigate('/login');
        } else {
          setError('Ошибка при загрузке данных. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate, paginationModel, sortModel, searchTerm]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setPaginationModel({ ...paginationModel, page: 0 }); // Сбрасываем страницу при изменении поиска
  };

  // Обработчик клика по строке таблицы
  const handleRowClick = (params) => {
    navigate(`/admin/users/${params.row.id}`);
  };

  // Определение колонок таблицы
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'telegramId', headerName: 'Telegram ID', width: 120 },
    { field: 'username', headerName: 'Имя пользователя', width: 150 },
    { field: 'firstName', headerName: 'Имя', width: 120 },
    { field: 'lastName', headerName: 'Фамилия', width: 120 },
    { field: 'languageCode', headerName: 'Язык', width: 80 },
    { 
      field: 'currentNodeId', 
      headerName: 'Текущий узел', 
      width: 150,
      valueGetter: (params) => params.row.currentNodeId || 'Не определен'
    },
    { 
      field: 'lastActivityAt', 
      headerName: 'Последняя активность', 
      width: 200,
      valueGetter: (params) => {
        const date = new Date(params.row.lastActivityAt);
        return date.toLocaleString('ru-RU');
      }
    },
    { 
      field: 'createdAt', 
      headerName: 'Дата регистрации', 
      width: 200,
      valueGetter: (params) => {
        const date = new Date(params.row.createdAt);
        return date.toLocaleString('ru-RU');
      }
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Пользователи
      </Typography>

      {/* Статистика */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h5">{statistics.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">Всего пользователей</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TodayIcon sx={{ fontSize: 40, mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h5">{statistics.activeToday}</Typography>
                  <Typography variant="body2" color="text.secondary">Активны сегодня</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DateRangeIcon sx={{ fontSize: 40, mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h5">{statistics.activeThisWeek}</Typography>
                  <Typography variant="body2" color="text.secondary">Активны на этой неделе</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonthIcon sx={{ fontSize: 40, mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h5">{statistics.activeThisMonth}</Typography>
                  <Typography variant="body2" color="text.secondary">Активны в этом месяце</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Поиск */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Поиск пользователей..."
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
      </Box>

      {/* Таблица пользователей */}
      <Paper sx={{ height: 600, width: '100%' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[5, 10, 25, 50]}
          pagination
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          rowCount={totalUsers}
          onRowClick={handleRowClick}
          localeText={ruRU.components.MuiDataGrid.defaultProps.localeText}
          sx={{
            '& .MuiDataGrid-row:hover': {
              cursor: 'pointer',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default UserTable;
