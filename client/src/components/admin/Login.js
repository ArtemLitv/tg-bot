import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

/**
 * Компонент для авторизации в админ-панели
 */
const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Проверяем, есть ли токен в URL (для авторизации через Google)
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    
    if (token) {
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', token);
      
      // Перенаправляем на главную страницу админ-панели
      navigate('/admin', { replace: true });
      
      // Вызываем функцию onLogin, если она передана
      if (onLogin) {
        onLogin();
      }
    }
  }, [location, navigate, onLogin]);

  // Обработчик отправки формы
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      
      // Отправляем запрос на авторизацию
      const response = await axios.post('/api/auth/login', {
        username: data.username,
        password: data.password
      });
      
      // Сохраняем токен в localStorage
      localStorage.setItem('authToken', response.data.token);
      
      // Перенаправляем на главную страницу админ-панели
      navigate('/admin', { replace: true });
      
      // Вызываем функцию onLogin, если она передана
      if (onLogin) {
        onLogin();
      }
    } catch (error) {
      console.error('Ошибка при авторизации:', error);
      
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error);
      } else {
        setError('Произошла ошибка при авторизации. Пожалуйста, попробуйте снова.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик авторизации через Google
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5">
            Вход в админ-панель
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Имя пользователя"
              name="username"
              autoComplete="username"
              autoFocus
              {...register('username', { required: 'Имя пользователя обязательно' })}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', { required: 'Пароль обязателен' })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Войти'}
            </Button>
            
            <Divider sx={{ my: 2 }}>или</Divider>
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              sx={{ mt: 1, mb: 2 }}
            >
              Войти через Google
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;