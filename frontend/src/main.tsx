import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from './App';
import { queryClient } from "./services/queryClient";
import { muiTheme } from "./theme/muiTheme";
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
