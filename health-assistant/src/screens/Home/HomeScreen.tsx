import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../types';
import { AIService } from '../../services/ai';
import { DemoService } from '../../services/DemoService';
import { StorageService } from '../../services/storage';
import { AuditService } from '../../services/storage';
import { AIInsight, FoodSuggestion, HealthMetrics } from '../../types';
import DailyBriefCard from '../../components/home/DailyBriefCard';
import FoodSuggestionCard from '../../components/home/FoodSuggestionCard';
import HealthMetricsCard from '../../components/home/HealthMetricsCard';
import DemoModeIndicator from '../../components/common/DemoModeIndicator';

type Props = MainTabScreenProps<'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [dailyBrief, setDailyBrief] = useState<AIInsight | null>(null);
  const [foodSuggestions, setFoodSuggestions] = useState<FoodSuggestion[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const aiService = AIService.getInstance();
  const demoService = DemoService.getInstance();
  const storage = StorageService.getInstance();
  const audit = AuditService.getInstance();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if demo mode is active
      const demoMode = await demoService.isDemoMode();
      setIsDemoMode(demoMode);

      // Load existing data
      const [existingBrief, existingFoodSuggestions, existingHealthMetrics] = await Promise.all([
        storage.getAIInsights(),
        storage.getFoodSuggestions(),
        storage.getHealthMetrics(),
      ]);

      // Get the most recent daily brief
      const recentBrief = existingBrief.find(insight => insight.type === 'daily_brief');
      setDailyBrief(recentBrief || null);
      
      setFoodSuggestions(existingFoodSuggestions.slice(0, 3)); // Show top 3
      setHealthMetrics(existingHealthMetrics.slice(0, 7)); // Last 7 days

      await audit.logUserAction('demo_user', 'view_home_screen', 'HomeScreen');
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load health data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNewBrief = async () => {
    try {
      setIsLoading(true);
      const newBrief = await aiService.generateDailyBrief('demo_user');
      setDailyBrief(newBrief);
      
      Alert.alert('Success', 'Your daily health brief has been updated!');
    } catch (error) {
      console.error('Error generating brief:', error);
      Alert.alert('Error', 'Failed to generate new brief. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewFoodSuggestions = async () => {
    try {
      setIsLoading(true);
      const newSuggestions = await aiService.generateFoodSuggestions('demo_user');
      setFoodSuggestions(newSuggestions.slice(0, 3));
      
      Alert.alert('Success', 'New food suggestions have been generated!');
    } catch (error) {
      console.error('Error generating food suggestions:', error);
      Alert.alert('Error', 'Failed to generate food suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      {isDemoMode && <DemoModeIndicator />}
      
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subtitle}>Here's your health overview</Text>
        </View>

        {/* Daily Brief Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Health Brief</Text>
            <TouchableOpacity
              onPress={generateNewBrief}
              disabled={isLoading}
              style={styles.refreshButton}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          </View>
          
          {dailyBrief ? (
            <DailyBriefCard insight={dailyBrief} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No daily brief available</Text>
              <TouchableOpacity
                onPress={generateNewBrief}
                disabled={isLoading}
                style={styles.generateButton}
              >
                <Text style={styles.generateButtonText}>
                  {isLoading ? 'Generating...' : 'Generate Brief'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Health Metrics Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Health Metrics</Text>
          {healthMetrics.length > 0 ? (
            <HealthMetricsCard metrics={healthMetrics[0]} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="fitness-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No health data available</Text>
              <Text style={styles.emptySubtext}>Connect your wearables to see insights</Text>
            </View>
          )}
        </View>

        {/* Food Suggestions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Food Suggestions</Text>
            <TouchableOpacity
              onPress={generateNewFoodSuggestions}
              disabled={isLoading}
              style={styles.refreshButton}
            >
              <Ionicons 
                name="refresh" 
                size={20} 
                color="#007AFF" 
              />
            </TouchableOpacity>
          </View>
          
          {foodSuggestions.length > 0 ? (
            <View style={styles.foodSuggestionsList}>
              {foodSuggestions.map((suggestion) => (
                <FoodSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No food suggestions available</Text>
              <TouchableOpacity
                onPress={generateNewFoodSuggestions}
                disabled={isLoading}
                style={styles.generateButton}
              >
                <Text style={styles.generateButtonText}>
                  {isLoading ? 'Generating...' : 'Get Suggestions'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Benefits')}
            >
              <Ionicons name="gift-outline" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>View Benefits</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  foodSuggestionsList: {
    gap: 10,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    minWidth: 100,
  },
  actionButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 5,
  },
});