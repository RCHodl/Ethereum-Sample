import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../types';
import { AIService } from '../../services/ai';
import { StorageService } from '../../services/storage';
import { AuditService } from '../../services/storage';
import { DemoService } from '../../services/DemoService';
import { BenefitsRecommendation } from '../../types';
import BenefitCard from '../../components/benefits/BenefitCard';
import DemoModeIndicator from '../../components/common/DemoModeIndicator';

type Props = MainTabScreenProps<'Benefits'>;

export default function BenefitsScreen({ navigation }: Props) {
  const [benefits, setBenefits] = useState<BenefitsRecommendation[]>([]);
  const [filteredBenefits, setFilteredBenefits] = useState<BenefitsRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'wellness' | 'fitness' | 'nutrition' | 'preventive' | 'mental_health'>('all');

  const aiService = AIService.getInstance();
  const storage = StorageService.getInstance();
  const audit = AuditService.getInstance();
  const demoService = DemoService.getInstance();

  const loadBenefits = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if demo mode is active
      const demoMode = await demoService.isDemoMode();
      setIsDemoMode(demoMode);

      // Load existing benefits
      const existingBenefits = await storage.getBenefitsRecommendations();
      setBenefits(existingBenefits);
      setFilteredBenefits(existingBenefits);

      await audit.logUserAction('demo_user', 'view_benefits_screen', 'BenefitsScreen');
    } catch (error) {
      console.error('Error loading benefits:', error);
      Alert.alert('Error', 'Failed to load benefits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateNewRecommendations = async () => {
    try {
      setIsLoading(true);
      const newRecommendations = await aiService.generateBenefitsRecommendations('demo_user');
      setBenefits(newRecommendations);
      applyFilters(newRecommendations, searchQuery, selectedFilter);
      
      Alert.alert('Success', 'New benefit recommendations have been generated!');
    } catch (error) {
      console.error('Error generating benefits:', error);
      Alert.alert('Error', 'Failed to generate benefit recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback((
    benefitsList: BenefitsRecommendation[],
    query: string,
    filter: typeof selectedFilter
  ) => {
    let filtered = benefitsList;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(benefit => benefit.type === filter);
    }

    // Apply search query
    if (query.trim()) {
      const searchLower = query.toLowerCase();
      filtered = filtered.filter(benefit =>
        benefit.title.toLowerCase().includes(searchLower) ||
        benefit.description.toLowerCase().includes(searchLower) ||
        benefit.program.toLowerCase().includes(searchLower) ||
        benefit.provider.toLowerCase().includes(searchLower)
      );
    }

    setFilteredBenefits(filtered);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBenefits();
    setRefreshing(false);
  }, [loadBenefits]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(benefits, query, selectedFilter);
  };

  const handleFilterChange = (filter: typeof selectedFilter) => {
    setSelectedFilter(filter);
    applyFilters(benefits, searchQuery, filter);
  };

  const handleBenefitPress = async (benefit: BenefitsRecommendation) => {
    await audit.logUserAction(
      'demo_user', 
      'view_benefit_detail', 
      'BenefitsScreen', 
      { benefitId: benefit.id, program: benefit.program }
    );
    
    Alert.alert(
      benefit.title,
      `${benefit.description}\n\nEstimated Annual Savings: $${benefit.estimatedSavings}\n\nContact: ${benefit.contactInfo.phone || benefit.contactInfo.email || 'See website'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Learn More', 
          onPress: () => {
            // In a real app, this would open a web browser or detailed view
            Alert.alert('Info', 'This would open the provider\'s website or contact information.');
          }
        }
      ]
    );
  };

  const calculateTotalSavings = () => {
    return filteredBenefits.reduce((total, benefit) => total + (benefit.estimatedSavings || 0), 0);
  };

  useEffect(() => {
    loadBenefits();
  }, [loadBenefits]);

  const filterButtons = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'wellness', label: 'Wellness', icon: 'heart' },
    { key: 'fitness', label: 'Fitness', icon: 'fitness' },
    { key: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
    { key: 'preventive', label: 'Preventive', icon: 'shield-checkmark' },
    { key: 'mental_health', label: 'Mental Health', icon: 'happy' },
  ] as const;

  return (
    <SafeAreaView style={styles.container}>
      {isDemoMode && <DemoModeIndicator />}
      
      <View style={styles.header}>
        <Text style={styles.title}>Benefits & Programs</Text>
        <Text style={styles.subtitle}>Personalized recommendations based on your health data</Text>
        
        {filteredBenefits.length > 0 && (
          <View style={styles.savingsContainer}>
            <Ionicons name="cash" size={20} color="#34C759" />
            <Text style={styles.savingsText}>
              Potential Annual Savings: ${calculateTotalSavings().toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search benefits and programs..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {filterButtons.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterButtonActive
            ]}
            onPress={() => handleFilterChange(filter.key)}
          >
            <Ionicons 
              name={filter.icon} 
              size={16} 
              color={selectedFilter === filter.key ? 'white' : '#007AFF'} 
            />
            <Text style={[
              styles.filterButtonText,
              selectedFilter === filter.key && styles.filterButtonTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredBenefits.length > 0 ? (
          <View style={styles.benefitsList}>
            {filteredBenefits.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                onPress={() => handleBenefitPress(benefit)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={64} color="#999" />
            <Text style={styles.emptyTitle}>
              {benefits.length === 0 ? 'No Benefits Available' : 'No Results Found'}
            </Text>
            <Text style={styles.emptyText}>
              {benefits.length === 0 
                ? 'Generate personalized benefit recommendations based on your health data.'
                : 'Try adjusting your search or filter criteria.'
              }
            </Text>
            {benefits.length === 0 && (
              <TouchableOpacity
                onPress={generateNewRecommendations}
                disabled={isLoading}
                style={styles.generateButton}
              >
                <Text style={styles.generateButtonText}>
                  {isLoading ? 'Generating...' : 'Generate Recommendations'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={generateNewRecommendations}
        disabled={isLoading}
      >
        <Ionicons name="refresh" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  filterScrollView: {
    maxHeight: 50,
  },
  filterContainer: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  filterButtonTextActive: {
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  benefitsList: {
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});