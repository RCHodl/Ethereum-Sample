import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodSuggestion } from '../../types';

interface Props {
  suggestion: FoodSuggestion;
}

export default function FoodSuggestionCard({ suggestion }: Props) {
  const getNutritionScoreColor = (score: number) => {
    if (score >= 90) return '#34C759';
    if (score >= 75) return '#FF9500';
    if (score >= 60) return '#FF6B35';
    return '#FF3B30';
  };

  const getNutritionScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Poor';
  };

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{suggestion.name}</Text>
          <View style={styles.scoreContainer}>
            <View 
              style={[
                styles.scoreBadge, 
                { backgroundColor: getNutritionScoreColor(suggestion.nutritionScore) }
              ]}
            >
              <Text style={styles.scoreText}>{suggestion.nutritionScore}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.description}>{suggestion.description}</Text>
      </View>

      <View style={styles.nutritionInfo}>
        <View style={styles.caloriesContainer}>
          <Ionicons name="flash" size={16} color="#FF6B35" />
          <Text style={styles.calories}>{suggestion.calories} cal</Text>
        </View>
        
        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>P</Text>
            <Text style={styles.macroValue}>{suggestion.macros.protein}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>C</Text>
            <Text style={styles.macroValue}>{suggestion.macros.carbs}g</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>F</Text>
            <Text style={styles.macroValue}>{suggestion.macros.fat}g</Text>
          </View>
        </View>
      </View>

      {suggestion.benefits && suggestion.benefits.length > 0 && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Benefits:</Text>
          <View style={styles.benefitsList}>
            {suggestion.benefits.slice(0, 3).map((benefit, index) => (
              <View key={index} style={styles.benefitTag}>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.reasoningContainer}>
        <Text style={styles.reasoningTitle}>Why this recommendation:</Text>
        <Text style={styles.reasoningText}>{suggestion.reasoning}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.scoreLabel}>
          Nutrition Score: {getNutritionScoreLabel(suggestion.nutritionScore)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 15,
    marginBottom: 10,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  scoreContainer: {
    marginLeft: 10,
  },
  scoreBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  caloriesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 4,
  },
  macrosContainer: {
    flexDirection: 'row',
  },
  macroItem: {
    alignItems: 'center',
    marginLeft: 15,
  },
  macroLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 2,
  },
  benefitsContainer: {
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  benefitTag: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  benefitText: {
    fontSize: 10,
    color: '#34C759',
    fontWeight: '500',
  },
  reasoningContainer: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasoningTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});