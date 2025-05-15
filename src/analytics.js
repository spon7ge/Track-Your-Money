import { analytics } from './firebase';
import { logEvent } from 'firebase/analytics';

// Custom event types
export const ANALYTICS_EVENTS = {
  // Authentication events
  LOGIN: 'login',
  SIGNUP: 'sign_up', 
  LOGOUT: 'logout',
  
  // Transaction events
  ADD_TRANSACTION: 'add_transaction',
  DELETE_TRANSACTION: 'delete_transaction',
  
  // Balance events
  UPDATE_DEBT_BALANCE: 'update_debt_balance',
  UPDATE_SAVINGS_BALANCE: 'update_savings_balance',
  
  // Feature usage events
  VIEW_CHARTS: 'view_charts',
  HIDE_CHARTS: 'hide_charts',
};

// Log custom events with parameters
export const logCustomEvent = (eventName, eventParams = {}) => {
  try {
    // Only log event if analytics is initialized
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
      console.log(`Analytics event logged: ${eventName}`, eventParams);
    } else {
      console.log(`Analytics not available. Would log: ${eventName}`, eventParams);
    }
  } catch (error) {
    console.error('Error logging analytics event:', error);
  }
};

// Specific tracking functions

// Track authentication events
export const trackLogin = (method = 'email') => {
  logCustomEvent(ANALYTICS_EVENTS.LOGIN, { method });
};

export const trackSignUp = (method = 'email') => {
  logCustomEvent(ANALYTICS_EVENTS.SIGNUP, { method });
};

export const trackLogout = () => {
  logCustomEvent(ANALYTICS_EVENTS.LOGOUT);
};

// Track transaction events
export const trackAddTransaction = (transactionType, category, amount) => {
  logCustomEvent(ANALYTICS_EVENTS.ADD_TRANSACTION, {
    transaction_type: transactionType,
    category,
    amount
  });
};

export const trackDeleteTransaction = (transactionType, category, amount) => {
  logCustomEvent(ANALYTICS_EVENTS.DELETE_TRANSACTION, {
    transaction_type: transactionType,
    category,
    amount
  });
};

// Track balance updates
export const trackUpdateDebtBalance = (amount, isManual) => {
  logCustomEvent(ANALYTICS_EVENTS.UPDATE_DEBT_BALANCE, {
    amount,
    is_manual: isManual
  });
};

export const trackUpdateSavingsBalance = (amount, isManual) => {
  logCustomEvent(ANALYTICS_EVENTS.UPDATE_SAVINGS_BALANCE, {
    amount,
    is_manual: isManual
  });
};

// Track feature usage
export const trackViewCharts = () => {
  logCustomEvent(ANALYTICS_EVENTS.VIEW_CHARTS);
};

export const trackHideCharts = () => {
  logCustomEvent(ANALYTICS_EVENTS.HIDE_CHARTS);
};