import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAppStore from './store/appStore';
import { theme as createCustomTheme } from './theme/theme';
import AppRoutes from './routes/AppRoutes';

const queryClient = new QueryClient();

function App() {
  const { mode } = useAppStore();
  const theme = createCustomTheme(mode);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
