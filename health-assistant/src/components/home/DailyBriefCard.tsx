import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AIInsight } from '../../types';

interface Props {
  insight: AIInsight;
}

export default function DailyBriefCard({ insight }: Props) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#007AFF';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return 'alert-circle';
      case 'medium': return 'information-circle';
      case 'low': return 'checkmark-circle';
      default: return 'information-circle';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{insight.title}</Text>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(insight.priority) }]}>
            <Ionicons 
              name={getPriorityIcon(insight.priority)} 
              size={14} 
              color="white" 
            />
          </View>
        </View>
        <Text style={styles.timestamp}>Generated {formatTimestamp(insight.timestamp)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.summary}>{insight.summary}</Text>
        
        <View style={styles.suggestionContainer}>
          <View style={styles.suggestionHeader}>
            <Ionicons name="bulb-outline" size={18} color="#007AFF" />
            <Text style={styles.suggestionTitle}>Today's Recommendation</Text>
          </View>
          <Text style={styles.suggestion}>{insight.suggestion}</Text>
        </View>

        {insight.evidence && insight.evidence.length > 0 && (
          <View style={styles.evidenceContainer}>
            <Text style={styles.evidenceTitle}>Supporting Evidence:</Text>
            {insight.evidence.map((evidence, index) => (
              <View key={index} style={styles.evidenceItem}>
                <Text style={styles.evidenceBullet}>•</Text>
                <Text style={styles.evidenceText}>{evidence}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceLabel}>Confidence:</Text>
            <View style={styles.confidenceBar}>
              <View 
                style={[
                  styles.confidenceFill, 
                  { width: `${insight.confidence * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.confidenceValue}>
              {Math.round(insight.confidence * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  priorityBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 10,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
  },
  content: {
    padding: 15,
  },
  summary: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 15,
  },
  suggestionContainer: {
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  suggestion: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  evidenceContainer: {
    marginBottom: 15,
  },
  evidenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  evidenceItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  evidenceBullet: {
    color: '#007AFF',
    marginRight: 8,
    fontSize: 16,
  },
  evidenceText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginRight: 8,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  confidenceValue: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
});