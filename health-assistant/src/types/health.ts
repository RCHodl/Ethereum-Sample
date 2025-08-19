export interface HealthMetrics {
  heartRate?: {
    resting: number;
    max: number;
    average: number;
    timestamp: string;
  };
  sleep?: {
    duration: number; // in hours
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    deepSleep: number; // in hours
    remSleep: number; // in hours
    timestamp: string;
  };
  activity?: {
    steps: number;
    distance: number; // in miles
    caloriesBurned: number;
    activeMinutes: number;
    timestamp: string;
  };
  recovery?: {
    score: number; // 0-100
    strain: number; // 0-21 (WHOOP scale)
    hrv: number; // heart rate variability
    timestamp: string;
  };
  nutrition?: {
    calories: number;
    protein: number; // in grams
    carbs: number; // in grams
    fat: number; // in grams
    fiber: number; // in grams
    sugar: number; // in grams
    sodium: number; // in mg
    timestamp: string;
  };
}

export interface LabResults {
  id: string;
  testName: string;
  value: number;
  unit: string;
  referenceRange: {
    min: number;
    max: number;
  };
  status: 'low' | 'normal' | 'high';
  timestamp: string;
  category: 'blood' | 'urine' | 'other';
}

export interface WearableConnection {
  id: string;
  provider: 'whoop' | 'apple_health' | 'strava' | 'cronometer';
  isConnected: boolean;
  lastSync: string;
  permissions: string[];
  accessToken?: string;
  refreshToken?: string;
}

export interface AIInsight {
  id: string;
  type: 'daily_brief' | 'food_suggestion' | 'wellness_tip' | 'alert';
  title: string;
  summary: string;
  suggestion: string;
  evidence: string[];
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  timestamp: string;
  category: 'sleep' | 'nutrition' | 'activity' | 'recovery' | 'general';
}

export interface FoodSuggestion {
  id: string;
  name: string;
  description: string;
  nutritionScore: number; // 0-100
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  benefits: string[];
  reasoning: string;
  imageUrl?: string;
  timestamp: string;
}

export interface BenefitsRecommendation {
  id: string;
  program: string;
  provider: string;
  type: 'wellness' | 'fitness' | 'mental_health' | 'nutrition' | 'preventive';
  title: string;
  description: string;
  estimatedSavings?: number;
  eligibilityScore: number; // 0-100
  requirements: string[];
  benefits: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  timestamp: string;
}

export interface UserPreferences {
  consentScope: 'wellness_only' | 'underwriting_allowed';
  dataRetention: number; // days
  notifications: {
    dailyBrief: boolean;
    foodSuggestions: boolean;
    benefitsUpdates: boolean;
    healthAlerts: boolean;
  };
  privacySettings: {
    shareWithProviders: boolean;
    anonymousAnalytics: boolean;
    marketingCommunications: boolean;
  };
  goals: {
    weight?: number;
    steps?: number;
    sleep?: number;
    calories?: number;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  category: 'data_access' | 'user_action' | 'system_event' | 'error';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export interface DemoData {
  healthMetrics: HealthMetrics[];
  labResults: LabResults[];
  aiInsights: AIInsight[];
  foodSuggestions: FoodSuggestion[];
  benefitsRecommendations: BenefitsRecommendation[];
}