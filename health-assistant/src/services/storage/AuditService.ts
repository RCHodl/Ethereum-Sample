import { AuditLogEntry } from '../../types';
import { StorageService } from './StorageService';

export class AuditService {
  private static instance: AuditService;
  private storage: StorageService;

  private constructor() {
    this.storage = StorageService.getInstance();
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  async logEvent(
    userId: string,
    action: string,
    category: AuditLogEntry['category'],
    details: Record<string, any> = {},
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      userId,
      action,
      category,
      details,
      success,
      errorMessage,
    };

    try {
      await this.storage.storeAuditLogEntry(entry);
    } catch (error) {
      console.error('Failed to store audit log entry:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Convenience methods for common audit events
  async logDataAccess(userId: string, dataType: string, provider?: string): Promise<void> {
    await this.logEvent(
      userId,
      'data_access',
      'data_access',
      { dataType, provider }
    );
  }

  async logUserAction(userId: string, action: string, screenName: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent(
      userId,
      action,
      'user_action',
      { screenName, ...details }
    );
  }

  async logSystemEvent(userId: string, event: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent(
      userId,
      event,
      'system_event',
      details
    );
  }

  async logError(userId: string, error: string, details?: Record<string, any>): Promise<void> {
    await this.logEvent(
      userId,
      'error_occurred',
      'error',
      details,
      false,
      error
    );
  }

  async logAuthEvent(userId: string, provider: string, action: 'connect' | 'disconnect' | 'sync'): Promise<void> {
    await this.logEvent(
      userId,
      `${provider}_${action}`,
      'data_access',
      { provider, action }
    );
  }

  async logAIRequest(userId: string, requestType: string, responseTime?: number): Promise<void> {
    await this.logEvent(
      userId,
      'ai_request',
      'system_event',
      { requestType, responseTime }
    );
  }

  async logConsentChange(userId: string, previousScope: string, newScope: string): Promise<void> {
    await this.logEvent(
      userId,
      'consent_updated',
      'user_action',
      { previousScope, newScope }
    );
  }

  async logDataExport(userId: string, format: string, dataTypes: string[]): Promise<void> {
    await this.logEvent(
      userId,
      'data_exported',
      'data_access',
      { format, dataTypes }
    );
  }

  async logFileUpload(userId: string, fileType: string, fileName: string, success: boolean): Promise<void> {
    await this.logEvent(
      userId,
      'file_uploaded',
      'data_access',
      { fileType, fileName },
      success
    );
  }

  // Retrieve audit logs with filtering
  async getAuditLogs(
    filters?: {
      userId?: string;
      category?: AuditLogEntry['category'];
      startDate?: string;
      endDate?: string;
      action?: string;
    }
  ): Promise<AuditLogEntry[]> {
    const allLogs = await this.storage.getAuditLogs();
    
    if (!filters) {
      return allLogs;
    }

    return allLogs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.category && log.category !== filters.category) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.startDate && log.timestamp < filters.startDate) return false;
      if (filters.endDate && log.timestamp > filters.endDate) return false;
      return true;
    });
  }

  // Generate audit report
  async generateAuditReport(userId: string, days: number = 30): Promise<{
    summary: Record<string, number>;
    recentActivity: AuditLogEntry[];
    errorCount: number;
    dataAccessCount: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await this.getAuditLogs({
      userId,
      startDate: startDate.toISOString()
    });

    const summary: Record<string, number> = {};
    let errorCount = 0;
    let dataAccessCount = 0;

    logs.forEach(log => {
      // Count by category
      summary[log.category] = (summary[log.category] || 0) + 1;
      
      // Count errors
      if (!log.success) {
        errorCount++;
      }
      
      // Count data access events
      if (log.category === 'data_access') {
        dataAccessCount++;
      }
    });

    return {
      summary,
      recentActivity: logs.slice(0, 50), // Last 50 activities
      errorCount,
      dataAccessCount
    };
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}