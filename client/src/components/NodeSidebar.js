import React, { useEffect, useRef, useState } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Link, 
  Button, 
  Box, 
  Paper, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon 
} from '@mui/material';
import { 
  Image as ImageIcon, 
  Link as LinkIcon, 
  LocationOn as LocationIcon, 
  ArrowForward as ArrowForwardIcon 
} from '@mui/icons-material';

// Компонент для отображения информации о ноде в сайдбаре
const NodeSidebar = ({ node, onClose }) => {
  const { data } = node;
  const nodeData = data.nodeData;
  const sidebarRef = useRef(null);

  // Функция для форматирования JSON
  const formatJson = (obj) => {
    return JSON.stringify(obj, null, 2);
  };

  // Обработчик клавиши Esc для закрытия сайдбара
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    // Добавляем обработчик события
    document.addEventListener('keydown', handleKeyDown);

    // Удаляем обработчик при размонтировании компонента
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Функция для отображения вложений
  const renderAttachments = (attachments, lang) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Вложения
        </Typography>
        {attachments.map((attachment, index) => {
          if (attachment.type === 'image') {
            return (
              <Card key={index} sx={{ mb: 2, maxWidth: '100%', boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  image={attachment.url}
                  alt="Изображение"
                  sx={{ 
                    maxHeight: 300, 
                    objectFit: 'contain',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.9
                    }
                  }}
                  onClick={() => window.open(attachment.url, '_blank')}
                />
                <CardContent sx={{ bgcolor: '#f9f9f9' }}>
                  <Typography variant="body2" color="text.secondary">
                    <Link 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      <LinkIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                      {attachment.url}
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            );
          } else if (attachment.type === 'link') {
            return (
              <Card key={index} sx={{ mb: 2, boxShadow: 2 }}>
                <CardContent sx={{ bgcolor: '#f5f5f5' }}>
                  <Typography variant="body1" display="flex" alignItems="center">
                    <LinkIcon sx={{ mr: 1, color: '#1976d2' }} />
                    <Link 
                      href={attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      sx={{ '&:hover': { textDecoration: 'underline' } }}
                    >
                      {attachment.text || attachment.url}
                    </Link>
                  </Typography>
                </CardContent>
              </Card>
            );
          } else if (attachment.type === 'location') {
            return (
              <Card key={index} sx={{ mb: 2, boxShadow: 2 }}>
                <CardContent sx={{ bgcolor: '#e8f4fd' }}>
                  <Typography variant="body1" display="flex" alignItems="center">
                    <LocationIcon sx={{ mr: 1, color: '#d32f2f' }} />
                    Координаты: {attachment.lat}, {attachment.lon}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => window.open(`https://www.google.com/maps?q=${attachment.lat},${attachment.lon}`, '_blank')}
                  >
                    Открыть на карте
                  </Button>
                </CardContent>
              </Card>
            );
          }
          return (
            <Card key={index} sx={{ mb: 2, boxShadow: 2 }}>
              <CardContent sx={{ bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Вложение типа: {attachment.type || 'неизвестный тип'}
                </Typography>
                <Typography variant="body2" component="div" sx={{ 
                  p: 1, 
                  bgcolor: '#ffffff', 
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0 }}>{formatJson(attachment)}</pre>
                </Typography>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    );
  };

  // Функция для отображения кнопок
  const renderButtons = (buttons) => {
    if (!buttons || buttons.length === 0) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Кнопки
        </Typography>
        <List>
          {buttons.map((button, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                mb: 1, 
                bgcolor: 'white', 
                borderRadius: 1,
                boxShadow: 1
              }}
            >
              <ListItemText 
                primary={button.label?.ru || 'Нет текста'} 
                secondary={`Целевая нода: ${button.target_node_id}`} 
              />
              <ListItemIcon sx={{ minWidth: 'auto' }}>
                <ArrowForwardIcon />
              </ListItemIcon>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  // Функция для отображения содержимого для конкретного языка
  const renderContent = (content, lang) => {
    if (!content || !content[lang]) return null;

    const langContent = content[lang];

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Содержимое ({lang})
        </Typography>

        <Box sx={{ mb: 2 }}>
          <TextField
            label="Текст"
            multiline
            rows={6}
            fullWidth
            value={langContent.text || ''}
            InputProps={{ readOnly: true }}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id={`format-label-${lang}`}>Формат</InputLabel>
            <Select
              labelId={`format-label-${lang}`}
              value={langContent.format || 'plain'}
              label="Формат"
              disabled
            >
              <MenuItem value="plain">Обычный текст</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
            </Select>
          </FormControl>

          {renderAttachments(langContent.attachments, lang)}
        </Box>
      </Box>
    );
  };

  return (
    <Paper 
      className="sidebar resizable" 
      ref={sidebarRef} 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%', 
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          {nodeData.description || 'Информация о ноде'}
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={onClose}
        >
          Закрыть
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Основная информация
        </Typography>
        <Typography variant="body1">
          <strong>ID:</strong> {nodeData.id}
        </Typography>
        <Typography variant="body1">
          <strong>Тип:</strong> {nodeData.type}
        </Typography>
        <Typography variant="body1">
          <strong>Описание:</strong> {nodeData.description}
        </Typography>
      </Box>

      {nodeData.content && (
        <>
          {renderContent(nodeData.content, 'ru')}
          {renderContent(nodeData.content, 'en')}
        </>
      )}

      {renderButtons(nodeData.buttons)}

      {nodeData.actions && nodeData.actions.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Действия
          </Typography>
          <pre>{formatJson(nodeData.actions)}</pre>
        </Box>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Полные данные
        </Typography>
        <pre style={{ overflow: 'auto', maxHeight: '300px' }}>{formatJson(nodeData)}</pre>
      </Box>
    </Paper>
  );
};

export default NodeSidebar;
