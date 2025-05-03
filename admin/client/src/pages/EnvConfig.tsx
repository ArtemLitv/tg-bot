import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { getEnvVars, updateEnvVars } from '../services/api';

const EnvConfig: React.FC = () => {
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showToken, setShowToken] = useState<boolean>(false);

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await getEnvVars();
        setToken(response.data.TELEGRAM_BOT_TOKEN || '');
      } catch (error) {
        console.error('Failed to get environment variables:', error);
        setError('Failed to load environment variables. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnvVars();
  }, []);

  const handleSave = async () => {
    if (!token) {
      setError('TELEGRAM_BOT_TOKEN is required');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await updateEnvVars({ TELEGRAM_BOT_TOKEN: token });
      setSuccess('Environment variables updated successfully');
    } catch (error) {
      console.error('Failed to update environment variables:', error);
      setError('Failed to update environment variables. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowToken = () => {
    setShowToken(!showToken);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Environment Configuration
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
          Bot Token
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TextField
              fullWidth
              label="TELEGRAM_BOT_TOKEN"
              variant="outlined"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              margin="normal"
              type={showToken ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle token visibility"
                      onClick={toggleShowToken}
                      edge="end"
                    >
                      {showToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={saving || !token}
              >
                Save Changes
              </Button>
            </Box>
          </>
        )}
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          About Bot Token
        </Typography>
        <Typography variant="body1">
          The TELEGRAM_BOT_TOKEN is required for your bot to communicate with the Telegram API. You can get a token by talking to @BotFather on Telegram.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          After changing the token, you will need to restart the bot for the changes to take effect.
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, fontWeight: 'bold' }}>
          Important: Keep your token secure and never share it with others.
        </Typography>
      </Paper>
    </Box>
  );
};

export default EnvConfig;