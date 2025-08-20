import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthMetrics } from '../../types';

interface Props {
  metrics: HealthMetrics;
}

export default function HealthMetricsCard({ metrics }: Props) {
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const getLatestTimestamp = () => {
    const timestamps = [
      metrics.heartRate?.timestamp,
      metrics.sleep?.timestamp,
      metrics.activity?.timestamp,
      metrics.recovery?.timestamp,
      metrics.nutrition?.timestamp,
    ].filter(Boolean) as string[];
    
    if (timestamps.length === 0) return 'N/A';
    
    const latest = timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    return formatTimestamp(latest);
  };

  const getSleepQualityColor = (quality?: string) => {
    switch (quality) {
      case 'excellent': return '#34C759';
      case 'good': return '#32D74B';
      case 'fair': return '#FF9500';
      case 'poor': return '#FF3B30';
      default: return '#999';
    }
  };

  const getRecoveryColor = (score?: number) => {
    if (!score) return '#999';
    if (score >= 80) return '#34C759';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Latest Health Data</Text>
        <Text style={styles.date}>{getLatestTimestamp()}</Text>
      </View>

      <View style={styles.metricsGrid}>
        {/* Heart Rate */}
        {metrics.heartRate && (
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons name="heart" size={20} color="#FF3B30" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Heart Rate</Text>
              <Text style={styles.metricValue}>{metrics.heartRate.resting} BPM</Text>
              <Text style={styles.metricSubtext}>Resting</Text>
            </View>
          </View>
        )}

        {/* Sleep */}
        {metrics.sleep && (
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons name="moon" size={20} color="#5856D6" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Sleep</Text>
              <Text style={styles.metricValue}>{metrics.sleep.duration.toFixed(1)}h</Text>
              <Text style={[
                styles.metricSubtext, 
                { color: getSleepQualityColor(metrics.sleep.quality) }
              ]}>
                {metrics.sleep.quality}
              </Text>
            </View>
          </View>
        )}

        {/* Activity */}
        {metrics.activity && (
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons name="walk" size={20} color="#32D74B" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Steps</Text>
              <Text style={styles.metricValue}>
                {metrics.activity.steps.toLocaleString()}
              </Text>
              <Text style={styles.metricSubtext}>
                {metrics.activity.distance.toFixed(1)} mi
              </Text>
            </View>
          </View>
        )}

        {/* Recovery */}
        {metrics.recovery && (
          <View style={styles.metricItem}>
            <View style={styles.metricIcon}>
              <Ionicons name="fitness" size={20} color="#FF9500" />
            </View>
            <View style={styles.metricContent}>
              <Text style={styles.metricLabel}>Recovery</Text>
              <Text style={[
                styles.metricValue,
                { color: getRecoveryColor(metrics.recovery.score) }
              ]}>
                {metrics.recovery.score}%
              </Text>
              <Text style={styles.metricSubtext}>
                HRV: {metrics.recovery.hrv}ms
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Nutrition Summary */}
      {metrics.nutrition && (
        <View style={styles.nutritionSummary}>
          <Text style={styles.nutritionTitle}>Today's Nutrition</Text>
          <View style={styles.nutritionRow}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{metrics.nutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>Calories</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{metrics.nutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>Protein</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{metrics.nutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>Carbs</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{metrics.nutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>Fat</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#999',
  },
  nutritionSummary: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nutritionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 10,
    color: '#666',
  },
});