export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SyncRequest {
  provider: string;
  lastSyncTimestamp?: string;
  dataTypes: string[];
}

export interface SyncResponse {
  provider: string;
  syncedRecords: number;
  lastSyncTimestamp: string;
  errors?: string[];
}

export interface AIRequest {
  userId: string;
  healthData: Record<string, any>;
  preferences: Record<string, any>;
  requestType: 'daily_brief' | 'food_suggestions' | 'health_analysis';
  context?: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface CSVUploadRequest {
  fileName: string;
  fileContent: string;
  dataType: 'lab_results' | 'health_metrics' | 'nutrition';
  mapping: Record<string, string>;
}