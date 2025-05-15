import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Send web vitals data to Firebase Analytics
reportWebVitals(({ id, name, value }) => {
  // Only log if analytics is initialized
  if (analytics) {
    // Log web vitals data to Firebase Analytics
    logEvent(analytics, 'web_vitals', {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value), // CLS needs special handling
      metric_id: id,
      metric_name: name,
      metric_value: value,
    });
  }
});
