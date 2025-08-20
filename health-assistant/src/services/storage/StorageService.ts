import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { 
  HealthMetrics, 
  LabResults, 
  UserPreferences, 
  WearableConnection, 
  AIInsight,
  FoodSuggestion,
  BenefitsRecommendation,
  AuditLogEntry 
} from '../../types';

export class StorageService {
  private static instance: StorageService;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  // Cache TTL in milliseconds
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HEALTH_DATA_TTL = 15 * 60 * 1000; // 15 minutes
  private readonly USER_PREFS_TTL = 24 * 60 * 60 * 1000; // 24 hours

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Generic storage methods
  async setItem<T>(key: string, value: T, secure: boolean = false): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (secure) {
        await SecureStore.setItemAsync(key, serialized);
      } else {
        await AsyncStorage.setItem(key, serialized);
      }
      
      // Update cache
      this.cache.set(key, {
        data: value,
        timestamp: Date.now(),
        ttl: this.DEFAULT_TTL
      });
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  async getItem<T>(key: string, secure: boolean = false): Promise<T | null> {
    try {
      // Check cache first
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T;
      }

      // Fetch from storage
      let serialized: string | null;
      if (secure) {
        serialized = await SecureStore.getItemAsync(key);
      } else {
        serialized = await AsyncStorage.getItem(key);
      }

      if (serialized) {
        const data = JSON.parse(serialized) as T;
        // Update cache
        this.cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl: this.DEFAULT_TTL
        });
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string, secure: boolean = false): Promise<void> {
    try {
      if (secure) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      this.cache.delete(key);
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  // Health data methods
  async storeHealthMetrics(metrics: HealthMetrics[]): Promise<void> {
    const key = 'health_metrics';
    await this.setItem(key, metrics);
    this.cache.set(key, {
      data: metrics,
      timestamp: Date.now(),
      ttl: this.HEALTH_DATA_TTL
    });
  }

  async getHealthMetrics(): Promise<HealthMetrics[]> {
    return await this.getItem<HealthMetrics[]>('health_metrics') || [];
  }

  async storeLabResults(results: LabResults[]): Promise<void> {
    await this.setItem('lab_results', results);
  }

  async getLabResults(): Promise<LabResults[]> {
    return await this.getItem<LabResults[]>('lab_results') || [];
  }

  // User preferences
  async storeUserPreferences(preferences: UserPreferences): Promise<void> {
    const key = 'user_preferences';
    await this.setItem(key, preferences);
    this.cache.set(key, {
      data: preferences,
      timestamp: Date.now(),
      ttl: this.USER_PREFS_TTL
    });
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    return await this.getItem<UserPreferences>('user_preferences');
  }

  // Wearable connections (secure storage)
  async storeWearableConnections(connections: WearableConnection[]): Promise<void> {
    await this.setItem('wearable_connections', connections, true);
  }

  async getWearableConnections(): Promise<WearableConnection[]> {
    return await this.getItem<WearableConnection[]>('wearable_connections', true) || [];
  }

  // AI insights
  async storeAIInsights(insights: AIInsight[]): Promise<void> {
    await this.setItem('ai_insights', insights);
  }

  async getAIInsights(): Promise<AIInsight[]> {
    return await this.getItem<AIInsight[]>('ai_insights') || [];
  }

  // Food suggestions
  async storeFoodSuggestions(suggestions: FoodSuggestion[]): Promise<void> {
    await this.setItem('food_suggestions', suggestions);
  }

  async getFoodSuggestions(): Promise<FoodSuggestion[]> {
    return await this.getItem<FoodSuggestion[]>('food_suggestions') || [];
  }

  // Benefits recommendations
  async storeBenefitsRecommendations(recommendations: BenefitsRecommendation[]): Promise<void> {
    await this.setItem('benefits_recommendations', recommendations);
  }

  async getBenefitsRecommendations(): Promise<BenefitsRecommendation[]> {
    return await this.getItem<BenefitsRecommendation[]>('benefits_recommendations') || [];
  }

  // Audit log
  async storeAuditLogEntry(entry: AuditLogEntry): Promise<void> {
    const existingLogs = await this.getAuditLogs();
    const updatedLogs = [entry, ...existingLogs].slice(0, 1000); // Keep only last 1000 entries
    await this.setItem('audit_logs', updatedLogs);
  }

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return await this.getItem<AuditLogEntry[]>('audit_logs') || [];
  }

  // Demo mode flag
  async setDemoMode(enabled: boolean): Promise<void> {
    await this.setItem('demo_mode', enabled);
  }

  async isDemoMode(): Promise<boolean> {
    return await this.getItem<boolean>('demo_mode') || false;
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  // Batch operations for offline sync
  async batchStore(operations: Array<{ key: string; value: any; secure?: boolean }>): Promise<void> {
    const promises = operations.map(op => this.setItem(op.key, op.value, op.secure));
    await Promise.all(promises);
  }

  // Clear all data (for logout/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      this.clearCache();
      // Note: SecureStore items need to be cleared individually
      const secureKeys = ['wearable_connections'];
      for (const key of secureKeys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          // Key might not exist, continue
        }
      }
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Data export for backup
  async exportData(): Promise<Record<string, any>> {
    const keys = [
      'health_metrics',
      'lab_results',
      'user_preferences',
      'ai_insights',
      'food_suggestions',
      'benefits_recommendations',
      'audit_logs'
    ];

    const exportData: Record<string, any> = {};
    for (const key of keys) {
      exportData[key] = await this.getItem(key);
    }

    return exportData;
  }

  // Data import from backup
  async importData(data: Record<string, any>): Promise<void> {
    const operations = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      secure: false
    }));

    await this.batchStore(operations);
  }
}