import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { loadConfig } from './config';

// Load configuration before rendering app
loadConfig().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  reportWebVitals();
}).catch(error => {
  console.error('Failed to load configuration:', error);
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Failed to load configuration. Please check config.json</div>';
});
