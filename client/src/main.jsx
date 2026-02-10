import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App.jsx';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';

const theme = createTheme({
  primaryColor: 'indigo',
  colors: {
    indigo: ['#EBF1FF', '#D6E2FF', '#ADC6FF', '#85A5FF', '#597EFF', '#2F54EB', '#1C2C5B', '#16234D', '#101A3E', '#060D26'],
    teal: ['#E6FFFA', '#B2F5EA', '#81E6D9', '#4FD1C5', '#38B2AC', '#319795', '#1ABC9C', '#234E52', '#1D4044', '#173335'],
  },
  primaryShade: 6,
  fontFamily: 'Inter, sans-serif',
  headings: { fontFamily: 'Inter, sans-serif', fontWeight: 600 },
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'md',
        padding: 'lg',
      }
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" zIndex={1000} />
      <App />
    </MantineProvider>
  </React.StrictMode>,
);
