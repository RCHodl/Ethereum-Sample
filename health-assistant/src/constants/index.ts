export const APP_CONFIG = {
  name: 'Health Assistant',
  version: '1.0.0',
  description: 'AI-powered health insights and wellness recommendations',
};

export const COLORS = {
  primary: '#007AFF',
  secondary: '#34C759',
  accent: '#FF9500',
  error: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  border: '#E5E5EA',
};

export const PROVIDER_CONFIGS = {
  whoop: {
    name: 'WHOOP',
    icon: 'fitness',
    color: '#FF0000',
  },
  apple_health: {
    name: 'Apple Health',
    icon: 'heart',
    color: '#FF3B30',
  },
  strava: {
    name: 'Strava',
    icon: 'bicycle',
    color: '#FC4C02',
  },
  cronometer: {
    name: 'Cronometer',
    icon: 'restaurant',
    color: '#4CAF50',
  },
};

export const HEALTH_METRICS_RANGES = {
  restingHeartRate: { min: 50, max: 100, optimal: { min: 60, max: 70 } },
  sleepHours: { min: 6, max: 10, optimal: { min: 7, max: 9 } },
  steps: { min: 5000, max: 20000, optimal: { min: 8000, max: 12000 } },
  recoveryScore: { min: 0, max: 100, optimal: { min: 70, max: 100 } },
};