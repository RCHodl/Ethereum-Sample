import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BenefitsRecommendation } from '../../types';

interface Props {
  benefit: BenefitsRecommendation;
  onPress: () => void;
}

export default function BenefitCard({ benefit, onPress }: Props) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'wellness': return 'heart';
      case 'fitness': return 'fitness';
      case 'nutrition': return 'restaurant';
      case 'preventive': return 'shield-checkmark';
      case 'mental_health': return 'happy';
      default: return 'gift';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'wellness': return '#FF3B30';
      case 'fitness': return '#32D74B';
      case 'nutrition': return '#FF9500';
      case 'preventive': return '#007AFF';
      case 'mental_health': return '#5856D6';
      default: return '#999';
    }
  };

  const getEligibilityColor = (score: number) => {
    if (score >= 90) return '#34C759';
    if (score >= 75) return '#32D74B';
    if (score >= 60) return '#FF9500';
    return '#FF3B30';
  };

  const getEligibilityLabel = (score: number) => {
    if (score >= 90) return 'Highly Eligible';
    if (score >= 75) return 'Eligible';
    if (score >= 60) return 'Moderately Eligible';
    return 'Low Eligibility';
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.typeIcon, { backgroundColor: getTypeColor(benefit.type) }]}>
            <Ionicons name={getTypeIcon(benefit.type)} size={20} color="white" />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.title}>{benefit.title}</Text>
            <Text style={styles.provider}>{benefit.provider}</Text>
          </View>
          <View style={styles.eligibilityBadge}>
            <View 
              style={[
                styles.eligibilityDot, 
                { backgroundColor: getEligibilityColor(benefit.eligibilityScore) }
              ]} 
            />
            <Text style={styles.eligibilityScore}>{benefit.eligibilityScore}%</Text>
          </View>
        </View>
        <Text style={styles.program}>{benefit.program}</Text>
      </View>

      <Text style={styles.description}>{benefit.description}</Text>

      {benefit.estimatedSavings && (
        <View style={styles.savingsContainer}>
          <Ionicons name="cash" size={16} color="#34C759" />
          <Text style={styles.savingsText}>
            Estimated Annual Savings: ${benefit.estimatedSavings.toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.eligibilityContainer}>
        <Text style={styles.eligibilityLabel}>
          {getEligibilityLabel(benefit.eligibilityScore)}
        </Text>
        <View style={styles.eligibilityBar}>
          <View 
            style={[
              styles.eligibilityFill,
              { 
                width: `${benefit.eligibilityScore}%`,
                backgroundColor: getEligibilityColor(benefit.eligibilityScore)
              }
            ]}
          />
        </View>
      </View>

      {benefit.benefits && benefit.benefits.length > 0 && (
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>Key Benefits:</Text>
          <View style={styles.benefitsList}>
            {benefit.benefits.slice(0, 3).map((benefitItem, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitBullet}>•</Text>
                <Text style={styles.benefitText}>{benefitItem}</Text>
              </View>
            ))}
            {benefit.benefits.length > 3 && (
              <Text style={styles.moreBenefits}>
                +{benefit.benefits.length - 3} more benefits
              </Text>
            )}
          </View>
        </View>
      )}

      {benefit.requirements && benefit.requirements.length > 0 && (
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Requirements:</Text>
          <View style={styles.requirementsList}>
            {benefit.requirements.slice(0, 2).map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <Ionicons name="checkmark-circle" size={12} color="#007AFF" />
                <Text style={styles.requirementText}>{requirement}</Text>
              </View>
            ))}
            {benefit.requirements.length > 2 && (
              <Text style={styles.moreRequirements}>
                +{benefit.requirements.length - 2} more requirements
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.contactInfo}>
          {benefit.contactInfo.phone && (
            <View style={styles.contactItem}>
              <Ionicons name="call" size={12} color="#666" />
              <Text style={styles.contactText}>{benefit.contactInfo.phone}</Text>
            </View>
          )}
          {benefit.contactInfo.email && (
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={12} color="#666" />
              <Text style={styles.contactText}>{benefit.contactInfo.email}</Text>
            </View>
          )}
          {benefit.contactInfo.website && (
            <View style={styles.contactItem}>
              <Ionicons name="globe" size={12} color="#666" />
              <Text style={styles.contactText}>Website</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  provider: {
    fontSize: 14,
    color: '#666',
  },
  eligibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eligibilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  eligibilityScore: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  program: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 52,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
    marginLeft: 4,
  },
  eligibilityContainer: {
    marginBottom: 12,
  },
  eligibilityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  eligibilityBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  eligibilityFill: {
    height: '100%',
    borderRadius: 2,
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
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  benefitBullet: {
    color: '#34C759',
    marginRight: 6,
    fontSize: 14,
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    lineHeight: 16,
  },
  moreBenefits: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  requirementsContainer: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  requirementsList: {
    marginLeft: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  requirementText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  moreRequirements: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
});