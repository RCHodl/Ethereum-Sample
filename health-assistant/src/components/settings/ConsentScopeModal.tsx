import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  currentScope: 'wellness_only' | 'underwriting_allowed';
  onClose: () => void;
  onScopeChange: (scope: 'wellness_only' | 'underwriting_allowed') => void;
}

export default function ConsentScopeModal({ visible, currentScope, onClose, onScopeChange }: Props) {
  const handleScopeSelect = (scope: 'wellness_only' | 'underwriting_allowed') => {
    if (scope !== currentScope) {
      onScopeChange(scope);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Data Usage Consent</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.description}>
            Choose how your health data can be used. You can change this setting at any time.
          </Text>

          {/* Wellness Only Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              currentScope === 'wellness_only' && styles.optionCardSelected
            ]}
            onPress={() => handleScopeSelect('wellness_only')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <Ionicons 
                  name="heart" 
                  size={24} 
                  color={currentScope === 'wellness_only' ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.optionTitle,
                  currentScope === 'wellness_only' && styles.optionTitleSelected
                ]}>
                  Wellness Only
                </Text>
                {currentScope === 'wellness_only' && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </View>
            </View>
            
            <Text style={styles.optionDescription}>
              Your health data will only be used for wellness insights, recommendations, and health program eligibility.
            </Text>
            
            <View style={styles.optionFeatures}>
              <Text style={styles.featuresTitle}>Includes:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Daily health briefs and insights</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Personalized food recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Wellness program recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Health trend analysis</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Underwriting Allowed Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              currentScope === 'underwriting_allowed' && styles.optionCardSelected
            ]}
            onPress={() => handleScopeSelect('underwriting_allowed')}
          >
            <View style={styles.optionHeader}>
              <View style={styles.optionTitleRow}>
                <Ionicons 
                  name="shield-checkmark" 
                  size={24} 
                  color={currentScope === 'underwriting_allowed' ? '#007AFF' : '#666'} 
                />
                <Text style={[
                  styles.optionTitle,
                  currentScope === 'underwriting_allowed' && styles.optionTitleSelected
                ]}>
                  Including Underwriting
                </Text>
                {currentScope === 'underwriting_allowed' && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </View>
            </View>
            
            <Text style={styles.optionDescription}>
              Your health data may also be used for insurance underwriting, risk assessment, and premium calculations.
            </Text>
            
            <View style={styles.optionFeatures}>
              <Text style={styles.featuresTitle}>Everything in Wellness Only, plus:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Insurance premium discounts</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Enhanced coverage options</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark" size={16} color="#34C759" />
                <Text style={styles.featureText}>Risk-based benefit recommendations</Text>
              </View>
            </View>

            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                This option allows your health data to be used for insurance decisions.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.legalText}>
            <Text style={styles.legalTitle}>Important Information:</Text>
            <Text style={styles.legalContent}>
              • You can change your consent scope at any time{'\n'}
              • Your data is encrypted and securely stored{'\n'}
              • We comply with HIPAA and other privacy regulations{'\n'}
              • You can request data deletion at any time{'\n'}
              • For questions, contact our privacy team
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34, // Same width as close button for centering
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginVertical: 20,
    textAlign: 'center',
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  optionCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionHeader: {
    marginBottom: 12,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginLeft: 12,
  },
  optionTitleSelected: {
    color: '#007AFF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  optionFeatures: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  legalText: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 40,
  },
  legalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  legalContent: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});