import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Fade,
  useTheme
} from '@mui/material';
import { Analytics } from '@mui/icons-material';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const theme = useTheme();

  const switchToRegister = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              p: 3,
              mb: 4
            }}
          >
            <Analytics sx={{ fontSize: 60, color: 'white', mb: 2 }} />
            <Typography
              variant="h3"
              fontWeight="bold"
              sx={{ color: 'white', mb: 1 }}
            >
              Stock Analysis Platform
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Real-time data • AI Predictions • Professional Analysis
            </Typography>
          </Paper>
        </Box>

        {/* Auth Forms */}
        <Fade in={true} timeout={500}>
          <Box>
            {isLogin ? (
              <LoginForm
                onSwitchToRegister={switchToRegister}
              />
            ) : (
              <RegisterForm
                onSuccess={() => {}}
                onSwitchToLogin={switchToLogin}
              />
            )}
          </Box>
        </Fade>

        {/* Features */}
        <Box mt={4}>
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
              p: 3
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ color: 'white', mb: 2, textAlign: 'center' }}
            >
              Why Choose Our Platform?
            </Typography>
            <Box display="flex" justifyContent="space-around" flexWrap="wrap" gap={2}>
              <Box textAlign="center" flex={1} minWidth={150}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  📊 <strong>Real-time Data</strong><br />
                  Live stock prices and market updates
                </Typography>
              </Box>
              <Box textAlign="center" flex={1} minWidth={150}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  🤖 <strong>AI Predictions</strong><br />
                  Advanced auto-regression models
                </Typography>
              </Box>
              <Box textAlign="center" flex={1} minWidth={150}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  💼 <strong>Portfolio Tracking</strong><br />
                  Manage your watchlist and alerts
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthPage;