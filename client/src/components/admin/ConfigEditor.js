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
  Snackbar,
  Tabs,
  Tab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import JSONInput from 'react-json-editor-ajrm';
import locale from 'react-json-editor-ajrm/locale/ru';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

/**
 * Компонент для просмотра и редактирования JSON-конфигурации бота
 */
const ConfigEditor = () => {
  const navigate = useNavigate();
  const [activeConfig, setActiveConfig] = useState(null);
  const [configHistory, setConfigHistory] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);
  const [jsonContent, setJsonContent] = useState(null);

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

  // Получение активной конфигурации
  useEffect(() => {
    const fetchActiveConfig = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        const response = await axios.get('/api/config/active', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setActiveConfig(response.data);
        
        // Если активная конфигурация загружена и не выбрана другая конфигурация,
        // устанавливаем активную конфигурацию как выбранную
        if (response.data && !selectedConfig) {
          setSelectedConfig(response.data);
          try {
            const jsonData = JSON.parse(response.data.config);
            setJsonContent(jsonData);
          } catch (e) {
            setJsonError('Ошибка при парсинге JSON');
          }
        }
      } catch (error) {
        console.error('Ошибка при получении активной конфигурации:', error);
        
        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else if (error.response && error.response.status === 404) {
          // Если активная конфигурация не найдена, это не ошибка
          setActiveConfig(null);
        } else {
          setError('Ошибка при загрузке активной конфигурации. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchActiveConfig();
  }, [navigate, selectedConfig]);

  // Получение истории конфигураций
  useEffect(() => {
    const fetchConfigHistory = async () => {
      try {
        setLoading(true);
        setError('');

        const token = getAuthToken();
        const response = await axios.get('/api/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setConfigHistory(response.data.configs);
      } catch (error) {
        console.error('Ошибка при получении истории конфигураций:', error);
        
        if (error.response && error.response.status === 401) {
          navigate('/login');
        } else {
          setError('Ошибка при загрузке истории конфигураций. Пожалуйста, попробуйте снова.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (tabValue === 1) {
      fetchConfigHistory();
    }
  }, [navigate, tabValue]);

  // Обработчик изменения вкладки
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Обработчик изменения JSON
  const handleJsonChange = (content) => {
    if (content.error) {
      setJsonError(content.error.reason);
    } else {
      setJsonError(null);
      setJsonContent(content.jsObject);
    }
  };

  // Обработчик сохранения конфигурации
  const handleSaveConfig = async () => {
    if (jsonError) {
      setError('Невозможно сохранить конфигурацию с ошибками JSON');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      const jsonString = JSON.stringify(jsonContent, null, 2);
      
      let response;
      
      // Если выбрана существующая конфигурация, обновляем её
      if (selectedConfig && selectedConfig.id) {
        response = await axios.put(`/api/config/${selectedConfig.id}`, {
          config: jsonString,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setSuccess('Конфигурация успешно обновлена');
      } 
      // Иначе создаем новую конфигурацию
      else {
        response = await axios.post('/api/config', {
          config: jsonString,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setSelectedConfig(response.data);
        setSuccess('Новая конфигурация успешно создана');
      }
      
      // Обновляем историю конфигураций, если открыта соответствующая вкладка
      if (tabValue === 1) {
        const historyResponse = await axios.get('/api/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setConfigHistory(historyResponse.data.configs);
      }
    } catch (error) {
      console.error('Ошибка при сохранении конфигурации:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при сохранении конфигурации. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик активации конфигурации
  const handleActivateConfig = async () => {
    if (!selectedConfig || !selectedConfig.id) {
      setError('Необходимо сначала сохранить конфигурацию');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      await axios.post(`/api/config/${selectedConfig.id}/activate`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setActiveConfig(selectedConfig);
      setSuccess('Конфигурация успешно активирована');
      
      // Обновляем историю конфигураций, если открыта соответствующая вкладка
      if (tabValue === 1) {
        const historyResponse = await axios.get('/api/config', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setConfigHistory(historyResponse.data.configs);
      }
    } catch (error) {
      console.error('Ошибка при активации конфигурации:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при активации конфигурации. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик создания новой конфигурации
  const handleNewConfig = () => {
    setSelectedConfig(null);
    setJsonContent({
      start_node_id: "start",
      languages: ["ru", "en"],
      nodes: []
    });
    setJsonError(null);
  };

  // Обработчик выбора конфигурации из истории
  const handleSelectConfig = async (config) => {
    try {
      setLoading(true);
      setError('');
      setSelectedConfig(config);
      
      try {
        const jsonData = JSON.parse(config.config);
        setJsonContent(jsonData);
        setJsonError(null);
      } catch (e) {
        setJsonError('Ошибка при парсинге JSON');
      }
      
      setTabValue(0); // Переключаемся на вкладку редактора
    } catch (error) {
      console.error('Ошибка при выборе конфигурации:', error);
      setError('Ошибка при выборе конфигурации. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик открытия диалога удаления конфигурации
  const handleOpenDeleteDialog = (config) => {
    setConfigToDelete(config);
    setOpenDeleteDialog(true);
  };

  // Обработчик закрытия диалога удаления конфигурации
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setConfigToDelete(null);
  };

  // Обработчик удаления конфигурации
  const handleDeleteConfig = async () => {
    if (!configToDelete || !configToDelete.id) {
      handleCloseDeleteDialog();
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      await axios.delete(`/api/config/${configToDelete.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      // Если удаляемая конфигурация была выбрана, сбрасываем выбор
      if (selectedConfig && selectedConfig.id === configToDelete.id) {
        setSelectedConfig(null);
        setJsonContent(null);
      }
      
      // Обновляем историю конфигураций
      const historyResponse = await axios.get('/api/config', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setConfigHistory(historyResponse.data.configs);
      setSuccess('Конфигурация успешно удалена');
    } catch (error) {
      console.error('Ошибка при удалении конфигурации:', error);
      
      if (error.response && error.response.status === 401) {
        navigate('/login');
      } else if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Ошибка при удалении конфигурации. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
      handleCloseDeleteDialog();
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
        Конфигурация бота
      </Typography>
      
      {/* Вкладки */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="config tabs">
          <Tab 
            label="Редактор" 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start" 
            label="История" 
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
          <Box>
            {/* Информация о выбранной конфигурации */}
            {selectedConfig ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  {selectedConfig.isActive ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                      Активная конфигурация
                    </Box>
                  ) : (
                    'Неактивная конфигурация'
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedConfig.id}, Последнее обновление: {formatDate(selectedConfig.updatedAt)}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  Новая конфигурация
                </Typography>
              </Box>
            )}
            
            {/* Кнопки управления */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveConfig}
                disabled={loading || jsonError}
              >
                {selectedConfig ? 'Сохранить' : 'Создать'}
              </Button>
              
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrowIcon />}
                onClick={handleActivateConfig}
                disabled={loading || jsonError || !selectedConfig || (selectedConfig && selectedConfig.isActive)}
              >
                Активировать
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleNewConfig}
                disabled={loading}
              >
                Новая конфигурация
              </Button>
            </Box>
            
            {/* Сообщения об ошибках и успешных операциях */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {jsonError && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Ошибка в JSON: {jsonError}
              </Alert>
            )}
            
            {/* Редактор JSON */}
            <Paper sx={{ p: 2, mb: 3 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                jsonContent && (
                  <JSONInput
                    id="json-editor"
                    placeholder={jsonContent}
                    locale={locale}
                    height="500px"
                    width="100%"
                    onChange={handleJsonChange}
                  />
                )
              )}
            </Paper>
          </Box>
        )}
      </div>
      
      <div
        role="tabpanel"
        hidden={tabValue !== 1}
        id="tabpanel-1"
        aria-labelledby="tab-1"
      >
        {tabValue === 1 && (
          <Box>
            {/* Сообщения об ошибках */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* Список конфигураций */}
            <Paper sx={{ width: '100%' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <List>
                  {configHistory.length === 0 ? (
                    <ListItem>
                      <ListItemText primary="Нет сохраненных конфигураций" />
                    </ListItem>
                  ) : (
                    configHistory.map((config) => (
                      <React.Fragment key={config.id}>
                        <ListItem
                          button
                          onClick={() => handleSelectConfig(config)}
                          selected={selectedConfig && selectedConfig.id === config.id}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {config.isActive && (
                                  <Tooltip title="Активная конфигурация">
                                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                                  </Tooltip>
                                )}
                                {`Конфигурация #${config.id}`}
                              </Box>
                            }
                            secondary={`Создана: ${formatDate(config.createdAt)}, Обновлена: ${formatDate(config.updatedAt)}`}
                          />
                          <ListItemSecondaryAction>
                            {!config.isActive && (
                              <Tooltip title="Удалить">
                                <IconButton
                                  edge="end"
                                  aria-label="delete"
                                  onClick={() => handleOpenDeleteDialog(config)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))
                  )}
                </List>
              )}
            </Paper>
          </Box>
        )}
      </div>
      
      {/* Диалог подтверждения удаления */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Вы уверены, что хотите удалить конфигурацию #{configToDelete?.id}?
            Это действие нельзя отменить.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Отмена</Button>
          <Button onClick={handleDeleteConfig} color="error" autoFocus>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default ConfigEditor;