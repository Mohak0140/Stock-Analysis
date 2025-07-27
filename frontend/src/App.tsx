import React, { useState, useEffect } from 'react';
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  Switch,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  TrendingUp,
  Search,
  Bookmark,
  Analytics,
  Menu as MenuIcon,
  DarkMode,
  LightMode,
  AccountCircle,
  Logout,
  Settings
} from '@mui/icons-material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './components/auth/AuthPage';
import Dashboard from './components/Dashboard';
import StockSearch from './components/StockSearch';
import StockDetail from './components/StockDetail';
import PredictionChart from './components/PredictionChart';
import Watchlist from './components/Watchlist';
import './App.css';

interface AppState {
  darkMode: boolean;
  selectedStock: string | null;
  currentView: 'dashboard' | 'search' | 'stock' | 'watchlist';
  drawerOpen: boolean;
  userMenuAnchor: HTMLElement | null;
}

const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [state, setState] = useState<AppState>({
    darkMode: false,
    selectedStock: null,
    currentView: 'dashboard',
    drawerOpen: false,
    userMenuAnchor: null
  });

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    setState(prev => ({ ...prev, darkMode: prefersDarkMode }));
  }, [prefersDarkMode]);

  const theme = createTheme({
    palette: {
      mode: state.darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: state.darkMode ? '#121212' : '#f5f5f5',
        paper: state.darkMode ? '#1e1e1e' : '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 500,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
    },
  });

  const handleViewChange = (view: AppState['currentView']) => {
    setState(prev => ({ ...prev, currentView: view, drawerOpen: false }));
  };

  const handleStockSelect = (symbol: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedStock: symbol, 
      currentView: 'stock',
      drawerOpen: false 
    }));
  };

  const handleDrawerToggle = () => {
    setState(prev => ({ ...prev, drawerOpen: !prev.drawerOpen }));
  };

  const handleThemeToggle = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setState(prev => ({ ...prev, userMenuAnchor: event.currentTarget }));
  };

  const handleUserMenuClose = () => {
    setState(prev => ({ ...prev, userMenuAnchor: null }));
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          sx={{ 
            background: state.darkMode 
              ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <CircularProgress size={60} sx={{ color: 'white' }} />
        </Box>
      </ThemeProvider>
    );
  }

  // Show authentication page if user is not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage />
      </ThemeProvider>
    );
  }

  const menuItems = [
    { text: 'Dashboard', icon: <TrendingUp />, view: 'dashboard' as const },
    { text: 'Search Stocks', icon: <Search />, view: 'search' as const },
    { text: 'Watchlist', icon: <Bookmark />, view: 'watchlist' as const },
  ];

  const renderContent = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <Dashboard onStockSelect={handleStockSelect} />;
      case 'search':
        return <StockSearch onStockSelect={handleStockSelect} />;
      case 'stock':
        return state.selectedStock ? (
          <Box>
            <StockDetail symbol={state.selectedStock} />
            <Box mt={3}>
              <PredictionChart symbol={state.selectedStock} />
            </Box>
          </Box>
        ) : (
          <Dashboard onStockSelect={handleStockSelect} />
        );
      case 'watchlist':
        return <Watchlist onStockSelect={handleStockSelect} />;
      default:
        return <Dashboard onStockSelect={handleStockSelect} />;
    }
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Stock Analysis
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text}
            onClick={() => handleViewChange(item.view)}
            sx={{ 
              cursor: 'pointer',
              backgroundColor: state.currentView === item.view ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover'
              }
            }}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: theme.zIndex.drawer + 1,
            background: state.darkMode 
              ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Analytics sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Stock Analysis Platform
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                checked={state.darkMode}
                onChange={handleThemeToggle}
                color="default"
              />
              <IconButton color="inherit" onClick={handleThemeToggle}>
                {state.darkMode ? <LightMode /> : <DarkMode />}
              </IconButton>
              
              {/* User Menu */}
              <IconButton
                color="inherit"
                onClick={handleUserMenuOpen}
                sx={{ ml: 1 }}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || <AccountCircle />}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={state.userMenuAnchor}
                open={Boolean(state.userMenuAnchor)}
                onClose={handleUserMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled>
                  <Box>
                    <Typography variant="subtitle2">{user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleUserMenuClose}>
                  <Settings sx={{ mr: 1 }} />
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Logout sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={state.drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: 250,
              position: 'relative',
              height: '100vh',
            },
          }}
          open
        >
          <Toolbar />
          {drawer}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - 250px)` },
            minHeight: '100vh',
            backgroundColor: theme.palette.background.default,
          }}
        >
          <Toolbar />
          <Container maxWidth="xl">
            {renderContent()}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
