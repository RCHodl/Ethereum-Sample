import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  provider: string;
  icon: keyof typeof Ionicons.glyphMap;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ConnectionCard({ provider, icon, isConnected, onConnect, onDisconnect }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.providerInfo}>
        <View style={[styles.iconContainer, isConnected && styles.iconContainerConnected]}>
          <Ionicons 
            name={icon} 
            size={24} 
            color={isConnected ? 'white' : '#007AFF'} 
          />
        </View>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>{provider}</Text>
          <Text style={[styles.status, { color: isConnected ? '#34C759' : '#666' }]}>
            {isConnected ? 'Connected' : 'Not connected'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={[
          styles.actionButton,
          isConnected ? styles.disconnectButton : styles.connectButton
        ]}
        onPress={isConnected ? onDisconnect : onConnect}
      >
        <Text style={[
          styles.actionButtonText,
          isConnected ? styles.disconnectButtonText : styles.connectButtonText
        ]}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerConnected: {
    backgroundColor: '#007AFF',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  status: {
    fontSize: 14,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  disconnectButton: {
    backgroundColor: 'white',
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  connectButtonText: {
    color: 'white',
  },
  disconnectButtonText: {
    color: '#FF3B30',
  },
});