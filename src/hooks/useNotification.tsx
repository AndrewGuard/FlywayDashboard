import { useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';

interface NotificationState {
  open: boolean;
  message: string;
  severity: AlertColor;
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showNotification = useCallback((message: string, severity: AlertColor = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error');
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const NotificationComponent = () => (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={hideNotification}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={hideNotification} severity={notification.severity} variant="filled">
        {notification.message}
      </Alert>
    </Snackbar>
  );

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    NotificationComponent
  };
};
