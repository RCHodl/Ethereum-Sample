import { HealthMetrics, LabResults, SyncRequest, SyncResponse, CSVUploadRequest } from '../../types';
import { OAuthService } from '../auth';
import { StorageService } from '../storage';
import { AuditService } from '../storage';
import * as FileSystem from 'expo-file-system';

export class DataIngestionService {
  private static instance: DataIngestionService;
  private oauthService: OAuthService;
  private storage: StorageService;
  private audit: AuditService;

  private constructor() {
    this.oauthService = OAuthService.getInstance();
    this.storage = StorageService.getInstance();
    this.audit = AuditService.getInstance();
  }

  public static getInstance(): DataIngestionService {
    if (!DataIngestionService.instance) {
      DataIngestionService.instance = new DataIngestionService();
    }
    return DataIngestionService.instance;
  }

  async syncAllProviders(userId: string): Promise<SyncResponse[]> {
    const connections = await this.oauthService.getConnections();
    const results: SyncResponse[] = [];

    for (const connection of connections) {
      if (!connection.isConnected) continue;

      try {
        const result = await this.syncProvider(userId, connection.provider);
        results.push(result);
      } catch (error) {
        await this.audit.logError(userId, `Sync failed for ${connection.provider}: ${error}`);
        results.push({
          provider: connection.provider,
          syncedRecords: 0,
          lastSyncTimestamp: new Date().toISOString(),
          errors: [error instanceof Error ? error.message : String(error)]
        });
      }
    }

    return results;
  }

  async syncProvider(userId: string, provider: string): Promise<SyncResponse> {
    await this.audit.logAuthEvent(userId, provider, 'sync');
    
    switch (provider) {
      case 'whoop':
        return await this.syncWhoopData(userId);
      case 'strava':
        return await this.syncStravaData(userId);
      case 'cronometer':
        return await this.syncCronometerData(userId);
      case 'apple_health':
        return await this.syncAppleHealthData(userId);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private async syncWhoopData(userId: string): Promise<SyncResponse> {
    try {
      const startTime = Date.now();
      
      // Get recovery data
      const recoveryResponse = await this.oauthService.makeAuthenticatedRequest('whoop', '/recovery');
      const recoveryData = await recoveryResponse.json();

      // Get sleep data
      const sleepResponse = await this.oauthService.makeAuthenticatedRequest('whoop', '/sleep');
      const sleepData = await sleepResponse.json();

      // Get workout data
      const workoutResponse = await this.oauthService.makeAuthenticatedRequest('whoop', '/workout');
      const workoutData = await workoutResponse.json();

      // Transform WHOOP data to our format
      const healthMetrics = this.transformWhoopData(recoveryData, sleepData, workoutData);
      
      // Store the data
      const existingMetrics = await this.storage.getHealthMetrics();
      const mergedMetrics = this.mergeHealthMetrics(existingMetrics, healthMetrics);
      await this.storage.storeHealthMetrics(mergedMetrics);

      const responseTime = Date.now() - startTime;
      await this.audit.logSystemEvent(userId, 'whoop_sync_completed', { 
        recordCount: healthMetrics.length,
        responseTime 
      });

      return {
        provider: 'whoop',
        syncedRecords: healthMetrics.length,
        lastSyncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`WHOOP sync failed: ${error}`);
    }
  }

  private async syncStravaData(userId: string): Promise<SyncResponse> {
    try {
      const startTime = Date.now();
      
      // Get athlete activities
      const activitiesResponse = await this.oauthService.makeAuthenticatedRequest(
        'strava', 
        '/athlete/activities?per_page=30'
      );
      const activities = await activitiesResponse.json();

      // Transform Strava data to our format
      const healthMetrics = this.transformStravaData(activities);
      
      // Store the data
      const existingMetrics = await this.storage.getHealthMetrics();
      const mergedMetrics = this.mergeHealthMetrics(existingMetrics, healthMetrics);
      await this.storage.storeHealthMetrics(mergedMetrics);

      const responseTime = Date.now() - startTime;
      await this.audit.logSystemEvent(userId, 'strava_sync_completed', { 
        recordCount: healthMetrics.length,
        responseTime 
      });

      return {
        provider: 'strava',
        syncedRecords: healthMetrics.length,
        lastSyncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Strava sync failed: ${error}`);
    }
  }

  private async syncCronometerData(userId: string): Promise<SyncResponse> {
    try {
      const startTime = Date.now();
      
      // Get nutrition data
      const nutritionResponse = await this.oauthService.makeAuthenticatedRequest(
        'cronometer', 
        '/nutrition?days=7'
      );
      const nutritionData = await nutritionResponse.json();

      // Transform Cronometer data to our format
      const healthMetrics = this.transformCronometerData(nutritionData);
      
      // Store the data
      const existingMetrics = await this.storage.getHealthMetrics();
      const mergedMetrics = this.mergeHealthMetrics(existingMetrics, healthMetrics);
      await this.storage.storeHealthMetrics(mergedMetrics);

      const responseTime = Date.now() - startTime;
      await this.audit.logSystemEvent(userId, 'cronometer_sync_completed', { 
        recordCount: healthMetrics.length,
        responseTime 
      });

      return {
        provider: 'cronometer',
        syncedRecords: healthMetrics.length,
        lastSyncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Cronometer sync failed: ${error}`);
    }
  }

  private async syncAppleHealthData(userId: string): Promise<SyncResponse> {
    try {
      // Note: In a real implementation, this would use HealthKit
      // For now, we'll simulate Apple Health data
      const healthMetrics: HealthMetrics[] = [
        {
          heartRate: {
            resting: 65,
            max: 180,
            average: 85,
            timestamp: new Date().toISOString(),
          },
          activity: {
            steps: 8500,
            distance: 4.2,
            caloriesBurned: 320,
            activeMinutes: 45,
            timestamp: new Date().toISOString(),
          },
        }
      ];

      const existingMetrics = await this.storage.getHealthMetrics();
      const mergedMetrics = this.mergeHealthMetrics(existingMetrics, healthMetrics);
      await this.storage.storeHealthMetrics(mergedMetrics);

      await this.audit.logSystemEvent(userId, 'apple_health_sync_completed', { 
        recordCount: healthMetrics.length 
      });

      return {
        provider: 'apple_health',
        syncedRecords: healthMetrics.length,
        lastSyncTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Apple Health sync failed: ${error}`);
    }
  }

  // CSV/PDF Upload functionality
  async uploadFile(userId: string, request: CSVUploadRequest): Promise<void> {
    try {
      await this.audit.logFileUpload(userId, request.dataType, request.fileName, true);

      if (request.dataType === 'lab_results') {
        const labResults = this.parseLabResultsCSV(request.fileContent, request.mapping);
        const existingResults = await this.storage.getLabResults();
        const mergedResults = [...existingResults, ...labResults];
        await this.storage.storeLabResults(mergedResults);
      } else if (request.dataType === 'health_metrics') {
        const healthMetrics = this.parseHealthMetricsCSV(request.fileContent, request.mapping);
        const existingMetrics = await this.storage.getHealthMetrics();
        const mergedMetrics = this.mergeHealthMetrics(existingMetrics, healthMetrics);
        await this.storage.storeHealthMetrics(mergedMetrics);
      }

      await this.audit.logSystemEvent(userId, 'file_upload_processed', {
        fileName: request.fileName,
        dataType: request.dataType
      });
    } catch (error) {
      await this.audit.logFileUpload(userId, request.dataType, request.fileName, false);
      throw error;
    }
  }

  // Data transformation methods
  private transformWhoopData(recovery: any, sleep: any, workout: any): HealthMetrics[] {
    const metrics: HealthMetrics[] = [];

    // Transform recovery data
    if (recovery?.records) {
      recovery.records.forEach((record: any) => {
        metrics.push({
          recovery: {
            score: record.score?.recovery_score || 0,
            strain: record.score?.strain || 0,
            hrv: record.score?.hrv_rmssd_milli || 0,
            timestamp: record.created_at,
          },
          heartRate: {
            resting: record.score?.rhr_4_week_avg || 0,
            max: 0,
            average: 0,
            timestamp: record.created_at,
          },
        });
      });
    }

    // Transform sleep data
    if (sleep?.records) {
      sleep.records.forEach((record: any) => {
        const existingMetric = metrics.find(m => 
          m.recovery?.timestamp === record.created_at
        );
        
        const sleepData = {
          duration: (record.score?.total_sleep_time_milli || 0) / (1000 * 60 * 60),
          quality: this.mapSleepQuality(record.score?.sleep_performance_percentage || 0),
          deepSleep: (record.score?.slow_wave_sleep_time_milli || 0) / (1000 * 60 * 60),
          remSleep: (record.score?.rem_sleep_time_milli || 0) / (1000 * 60 * 60),
          timestamp: record.created_at,
        };

        if (existingMetric) {
          existingMetric.sleep = sleepData;
        } else {
          metrics.push({ sleep: sleepData });
        }
      });
    }

    return metrics;
  }

  private transformStravaData(activities: any[]): HealthMetrics[] {
    return activities.map(activity => ({
      activity: {
        steps: 0, // Strava doesn't provide steps directly
        distance: activity.distance ? activity.distance / 1609.34 : 0, // Convert meters to miles
        caloriesBurned: activity.calories || 0,
        activeMinutes: activity.moving_time ? Math.round(activity.moving_time / 60) : 0,
        timestamp: activity.start_date,
      },
    }));
  }

  private transformCronometerData(nutritionData: any): HealthMetrics[] {
    if (!nutritionData?.days) return [];

    return nutritionData.days.map((day: any) => ({
      nutrition: {
        calories: day.energy || 0,
        protein: day.protein || 0,
        carbs: day.carbs || 0,
        fat: day.fat || 0,
        fiber: day.fiber || 0,
        sugar: day.sugars || 0,
        sodium: day.sodium || 0,
        timestamp: day.date,
      },
    }));
  }

  // CSV parsing methods
  private parseLabResultsCSV(csvContent: string, mapping: Record<string, string>): LabResults[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const results: LabResults[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const result: LabResults = {
        id: `lab_${Date.now()}_${i}`,
        testName: values[headers.indexOf(mapping.testName)] || '',
        value: parseFloat(values[headers.indexOf(mapping.value)] || '0'),
        unit: values[headers.indexOf(mapping.unit)] || '',
        referenceRange: {
          min: parseFloat(values[headers.indexOf(mapping.minRange)] || '0'),
          max: parseFloat(values[headers.indexOf(mapping.maxRange)] || '100'),
        },
        status: this.determineLabStatus(
          parseFloat(values[headers.indexOf(mapping.value)] || '0'),
          parseFloat(values[headers.indexOf(mapping.minRange)] || '0'),
          parseFloat(values[headers.indexOf(mapping.maxRange)] || '100')
        ),
        timestamp: values[headers.indexOf(mapping.date)] || new Date().toISOString(),
        category: 'blood',
      };

      results.push(result);
    }

    return results;
  }

  private parseHealthMetricsCSV(csvContent: string, mapping: Record<string, string>): HealthMetrics[] {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    const metrics: HealthMetrics[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const metric: HealthMetrics = {
        heartRate: {
          resting: parseFloat(values[headers.indexOf(mapping.restingHR)] || '0'),
          max: parseFloat(values[headers.indexOf(mapping.maxHR)] || '0'),
          average: parseFloat(values[headers.indexOf(mapping.avgHR)] || '0'),
          timestamp: values[headers.indexOf(mapping.date)] || new Date().toISOString(),
        },
        activity: {
          steps: parseInt(values[headers.indexOf(mapping.steps)] || '0'),
          distance: parseFloat(values[headers.indexOf(mapping.distance)] || '0'),
          caloriesBurned: parseFloat(values[headers.indexOf(mapping.calories)] || '0'),
          activeMinutes: parseInt(values[headers.indexOf(mapping.activeMinutes)] || '0'),
          timestamp: values[headers.indexOf(mapping.date)] || new Date().toISOString(),
        },
      };

      metrics.push(metric);
    }

    return metrics;
  }

  // Helper methods
  private mergeHealthMetrics(existing: HealthMetrics[], newMetrics: HealthMetrics[]): HealthMetrics[] {
    const merged = [...existing];
    
    newMetrics.forEach(newMetric => {
      const existingIndex = merged.findIndex(m => 
        this.isSameTimeframe(m, newMetric)
      );
      
      if (existingIndex >= 0) {
        // Merge with existing metric
        merged[existingIndex] = { ...merged[existingIndex], ...newMetric };
      } else {
        merged.push(newMetric);
      }
    });

    // Sort by timestamp and keep only last 90 days
    return merged
      .sort((a, b) => {
        const aTime = this.getLatestTimestamp(a);
        const bTime = this.getLatestTimestamp(b);
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, 90);
  }

  private isSameTimeframe(metric1: HealthMetrics, metric2: HealthMetrics): boolean {
    const time1 = this.getLatestTimestamp(metric1);
    const time2 = this.getLatestTimestamp(metric2);
    
    const date1 = new Date(time1).toDateString();
    const date2 = new Date(time2).toDateString();
    
    return date1 === date2;
  }

  private getLatestTimestamp(metric: HealthMetrics): string {
    const timestamps = [
      metric.heartRate?.timestamp,
      metric.sleep?.timestamp,
      metric.activity?.timestamp,
      metric.recovery?.timestamp,
      metric.nutrition?.timestamp,
    ].filter(Boolean) as string[];
    
    return timestamps.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date().toISOString();
  }

  private mapSleepQuality(percentage: number): 'poor' | 'fair' | 'good' | 'excellent' {
    if (percentage >= 85) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'fair';
    return 'poor';
  }

  private determineLabStatus(value: number, min: number, max: number): 'low' | 'normal' | 'high' {
    if (value < min) return 'low';
    if (value > max) return 'high';
    return 'normal';
  }
}