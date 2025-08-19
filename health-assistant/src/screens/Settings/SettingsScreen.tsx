import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MainTabScreenProps } from '../../types';
import { StorageService } from '../../services/storage';
import { AuditService } from '../../services/storage';
import { OAuthService } from '../../services/auth';
import { DemoService } from '../../services/DemoService';
import { DataIngestionService } from '../../services/data';
import { UserPreferences, WearableConnection } from '../../types';
import DemoModeIndicator from '../../components/common/DemoModeIndicator';
import ConnectionCard from '../../components/settings/ConnectionCard';
import ConsentScopeModal from '../../components/settings/ConsentScopeModal';

type Props = MainTabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [connections, setConnections] = useState<WearableConnection[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const storage = StorageService.getInstance();
  const audit = AuditService.getInstance();
  const oauth = OAuthService.getInstance();
  const demoService = DemoService.getInstance();
  const dataService = DataIngestionService.getInstance();

  const loadSettings = useCallback(async () => {
    try {
      const [userPrefs, userConnections, demoMode] = await Promise.all([
        storage.getUserPreferences(),
        oauth.getConnections(),
        demoService.isDemoMode(),
      ]);

      setPreferences(userPrefs);
      setConnections(userConnections);
      setIsDemoMode(demoMode);

      await audit.logUserAction('demo_user', 'view_settings_screen', 'SettingsScreen');
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    }
  }, []);

  const updatePreferences = async (updatedPrefs: UserPreferences) => {
    try {
      await storage.storeUserPreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      
      await audit.logUserAction(
        'demo_user', 
        'update_preferences', 
        'SettingsScreen',
        { updatedFields: Object.keys(updatedPrefs) }
      );
    } catch (error) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', 'Failed to update preferences. Please try again.');
    }
  };

  const handleConsentScopeChange = async (newScope: 'wellness_only' | 'underwriting_allowed') => {
    if (!preferences) return;

    const previousScope = preferences.consentScope;
    const updatedPrefs = { ...preferences, consentScope: newScope };
    
    await updatePreferences(updatedPrefs);
    await audit.logConsentChange('demo_user', previousScope, newScope);
    
    setShowConsentModal(false);
    
    Alert.alert(
      'Consent Updated',
      `Your data consent scope has been updated to: ${newScope.replace('_', ' ')}`
    );
  };

  const handleNotificationToggle = async (key: keyof UserPreferences['notifications'], value: boolean) => {
    if (!preferences) return;

    const updatedPrefs = {
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    };
    
    await updatePreferences(updatedPrefs);
  };

  const handlePrivacyToggle = async (key: keyof UserPreferences['privacySettings'], value: boolean) => {
    if (!preferences) return;

    const updatedPrefs = {
      ...preferences,
      privacySettings: {
        ...preferences.privacySettings,
        [key]: value,
      },
    };
    
    await updatePreferences(updatedPrefs);
  };

  const handleConnectProvider = async (provider: string) => {
    try {
      setIsLoading(true);
      
      if (isDemoMode) {
        Alert.alert(
          'Demo Mode',
          'In demo mode, connections are simulated. In the real app, this would initiate OAuth flow.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Simulate Connection', 
              onPress: async () => {
                // Simulate connection in demo mode
                const mockConnection: WearableConnection = {
                  id: `${provider}_demo_${Date.now()}`,
                  provider: provider as any,
                  isConnected: true,
                  lastSync: new Date().toISOString(),
                  permissions: ['read:all'],
                };
                
                const updatedConnections = [...connections, mockConnection];
                await storage.storeWearableConnections(updatedConnections);
                setConnections(updatedConnections);
                
                Alert.alert('Success', `${provider} connected successfully!`);
              }
            }
          ]
        );
      } else {
        const connection = await oauth.connectProvider(provider as any, 'demo_user');
        const updatedConnections = [...connections, connection];
        setConnections(updatedConnections);
        
        Alert.alert('Success', `${provider} connected successfully!`);
      }
    } catch (error) {
      console.error('Error connecting provider:', error);
      Alert.alert('Error', `Failed to connect ${provider}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectProvider = async (provider: string) => {
    Alert.alert(
      'Disconnect Provider',
      `Are you sure you want to disconnect ${provider}? This will stop syncing data from this source.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await oauth.disconnectProvider(provider, 'demo_user');
              const updatedConnections = connections.filter(conn => conn.provider !== provider);
              setConnections(updatedConnections);
              
              Alert.alert('Success', `${provider} disconnected successfully.`);
            } catch (error) {
              console.error('Error disconnecting provider:', error);
              Alert.alert('Error', `Failed to disconnect ${provider}. Please try again.`);
            }
          }
        }
      ]
    );
  };

  const handleSyncData = async () => {
    try {
      setIsLoading(true);
      const results = await dataService.syncAllProviders('demo_user');
      
      const totalSynced = results.reduce((sum, result) => sum + result.syncedRecords, 0);
      Alert.alert('Sync Complete', `Synced ${totalSynced} records from ${results.length} providers.`);
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Error', 'Failed to sync data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleDemoMode = async () => {
    try {
      if (isDemoMode) {
        await demoService.disableDemoMode();
        setIsDemoMode(false);
        Alert.alert('Demo Mode Disabled', 'Real data connections are now active.');
      } else {
        await demoService.enableDemoMode();
        setIsDemoMode(true);
        Alert.alert('Demo Mode Enabled', 'Sample data loaded for demonstration.');
      }
    } catch (error) {
      console.error('Error toggling demo mode:', error);
      Alert.alert('Error', 'Failed to toggle demo mode.');
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = await storage.exportData();
      await audit.logDataExport('demo_user', 'json', Object.keys(exportData));
      
      // In a real app, this would save to device or share
      Alert.alert(
        'Data Export',
        'Your health data has been exported. In a real app, this would save to your device or allow sharing.',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data.');
    }
  };

  const handleClearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your health data from this device. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAllData();
              await loadSettings(); // Reload to reflect changes
              Alert.alert('Data Cleared', 'All health data has been deleted from this device.');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data.');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const defaultPreferences: UserPreferences = {
    consentScope: 'wellness_only',
    dataRetention: 365,
    notifications: {
      dailyBrief: true,
      foodSuggestions: true,
      benefitsUpdates: true,
      healthAlerts: true,
    },
    privacySettings: {
      shareWithProviders: false,
      anonymousAnalytics: true,
      marketingCommunications: false,
    },
    goals: {
      steps: 10000,
      sleep: 8,
      calories: 2000,
    },
  };

  const currentPrefs = preferences || defaultPreferences;

  return (
    <SafeAreaView style={styles.container}>
      {isDemoMode && <DemoModeIndicator />}
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your health data and privacy preferences</Text>
        </View>

        {/* Data Connections Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Data Connections</Text>
            <TouchableOpacity onPress={handleSyncData} disabled={isLoading}>
              <Ionicons name="sync" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ConnectionCard
            provider="WHOOP"
            icon="fitness"
            isConnected={connections.some(c => c.provider === 'whoop')}
            onConnect={() => handleConnectProvider('whoop')}
            onDisconnect={() => handleDisconnectProvider('whoop')}
          />
          
          <ConnectionCard
            provider="Apple Health"
            icon="heart"
            isConnected={connections.some(c => c.provider === 'apple_health')}
            onConnect={() => handleConnectProvider('apple_health')}
            onDisconnect={() => handleDisconnectProvider('apple_health')}
          />
          
          <ConnectionCard
            provider="Strava"
            icon="bicycle"
            isConnected={connections.some(c => c.provider === 'strava')}
            onConnect={() => handleConnectProvider('strava')}
            onDisconnect={() => handleDisconnectProvider('strava')}
          />
          
          <ConnectionCard
            provider="Cronometer"
            icon="restaurant"
            isConnected={connections.some(c => c.provider === 'cronometer')}
            onConnect={() => handleConnectProvider('cronometer')}
            onDisconnect={() => handleDisconnectProvider('cronometer')}
          />
        </View>

        {/* Privacy & Consent Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Consent</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={() => setShowConsentModal(true)}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>Data Usage Consent</Text>
              <Text style={styles.settingValue}>
                {currentPrefs.consentScope === 'wellness_only' ? 'Wellness Only' : 'Including Underwriting'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Share with Healthcare Providers</Text>
            <Switch
              value={currentPrefs.privacySettings.shareWithProviders}
              onValueChange={(value) => handlePrivacyToggle('shareWithProviders', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Anonymous Analytics</Text>
            <Switch
              value={currentPrefs.privacySettings.anonymousAnalytics}
              onValueChange={(value) => handlePrivacyToggle('anonymousAnalytics', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Marketing Communications</Text>
            <Switch
              value={currentPrefs.privacySettings.marketingCommunications}
              onValueChange={(value) => handlePrivacyToggle('marketingCommunications', value)}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Daily Health Brief</Text>
            <Switch
              value={currentPrefs.notifications.dailyBrief}
              onValueChange={(value) => handleNotificationToggle('dailyBrief', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Food Suggestions</Text>
            <Switch
              value={currentPrefs.notifications.foodSuggestions}
              onValueChange={(value) => handleNotificationToggle('foodSuggestions', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Benefits Updates</Text>
            <Switch
              value={currentPrefs.notifications.benefitsUpdates}
              onValueChange={(value) => handleNotificationToggle('benefitsUpdates', value)}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Health Alerts</Text>
            <Switch
              value={currentPrefs.notifications.healthAlerts}
              onValueChange={(value) => handleNotificationToggle('healthAlerts', value)}
            />
          </View>
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleExportData}>
            <View style={styles.settingContent}>
              <Ionicons name="download" size={20} color="#007AFF" />
              <Text style={[styles.settingLabel, { marginLeft: 10 }]}>Export My Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleToggleDemoMode}>
            <View style={styles.settingContent}>
              <Ionicons name="flask" size={20} color="#FF9500" />
              <Text style={[styles.settingLabel, { marginLeft: 10 }]}>
                {isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
              </Text>
            </View>
            <Switch
              value={isDemoMode}
              onValueChange={handleToggleDemoMode}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={handleClearAllData}>
            <View style={styles.settingContent}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
              <Text style={[styles.settingLabel, { marginLeft: 10, color: '#FF3B30' }]}>
                Clear All Data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>App Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConsentScopeModal
        visible={showConsentModal}
        currentScope={currentPrefs.consentScope}
        onClose={() => setShowConsentModal(false)}
        onScopeChange={handleConsentScopeChange}
      />
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
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 15,
    borderRadius: 12,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
});