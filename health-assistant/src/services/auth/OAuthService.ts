import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { OAuthConfig, WearableConnection } from '../../types';
import { StorageService } from '../storage';
import { AuditService } from '../storage';

export class OAuthService {
  private static instance: OAuthService;
  private storage: StorageService;
  private audit: AuditService;

  // OAuth configurations for different providers
  private readonly oauthConfigs: Record<string, OAuthConfig> = {
    whoop: {
      clientId: process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID || 'demo_whoop_client',
      clientSecret: process.env.EXPO_PUBLIC_WHOOP_CLIENT_SECRET || 'demo_secret',
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      scopes: ['read:recovery', 'read:sleep', 'read:workout', 'read:profile'],
      authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
      tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token'
    },
    strava: {
      clientId: process.env.EXPO_PUBLIC_STRAVA_CLIENT_ID || 'demo_strava_client',
      clientSecret: process.env.EXPO_PUBLIC_STRAVA_CLIENT_SECRET || 'demo_secret',
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      scopes: ['read', 'activity:read'],
      authUrl: 'https://www.strava.com/oauth/authorize',
      tokenUrl: 'https://www.strava.com/oauth/token'
    },
    cronometer: {
      clientId: process.env.EXPO_PUBLIC_CRONOMETER_CLIENT_ID || 'demo_cronometer_client',
      clientSecret: process.env.EXPO_PUBLIC_CRONOMETER_CLIENT_SECRET || 'demo_secret',
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
      scopes: ['read:nutrition', 'read:biometrics'],
      authUrl: 'https://cronometer.com/oauth/authorize',
      tokenUrl: 'https://cronometer.com/oauth/token'
    }
  };

  private constructor() {
    this.storage = StorageService.getInstance();
    this.audit = AuditService.getInstance();
  }

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  async connectProvider(provider: keyof typeof this.oauthConfigs, userId: string): Promise<WearableConnection> {
    try {
      const config = this.oauthConfigs[provider];
      if (!config) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      await this.audit.logAuthEvent(userId, provider, 'connect');

      // Generate PKCE parameters for security
      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(36),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: config.clientId,
        scopes: config.scopes,
        redirectUri: config.redirectUri,
        responseType: AuthSession.ResponseType.Code,
        codeChallenge,
        codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        extraParams: {
          access_type: 'offline', // Request refresh token
        },
      });

      // Perform authentication
      const result = await request.promptAsync({
        authorizationEndpoint: config.authUrl,
      });

      if (result.type !== 'success') {
        throw new Error(`Authentication failed: ${result.type}`);
      }

      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(
        provider,
        result.params.code,
        codeChallenge
      );

      // Create connection object
      const connection: WearableConnection = {
        id: `${provider}_${Date.now()}`,
        provider: provider as any,
        isConnected: true,
        lastSync: new Date().toISOString(),
        permissions: config.scopes,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
      };

      // Store connection
      await this.storeConnection(connection);
      
      await this.audit.logAuthEvent(userId, provider, 'connect');
      
      return connection;
    } catch (error) {
      await this.audit.logError(userId, `Failed to connect ${provider}: ${error}`);
      throw error;
    }
  }

  async disconnectProvider(provider: string, userId: string): Promise<void> {
    try {
      const connections = await this.storage.getWearableConnections();
      const updatedConnections = connections.filter(conn => conn.provider !== provider);
      
      await this.storage.storeWearableConnections(updatedConnections);
      await this.audit.logAuthEvent(userId, provider, 'disconnect');
    } catch (error) {
      await this.audit.logError(userId, `Failed to disconnect ${provider}: ${error}`);
      throw error;
    }
  }

  async getConnections(): Promise<WearableConnection[]> {
    return await this.storage.getWearableConnections();
  }

  async getConnection(provider: string): Promise<WearableConnection | null> {
    const connections = await this.getConnections();
    return connections.find(conn => conn.provider === provider) || null;
  }

  async refreshAccessToken(provider: string, userId: string): Promise<string> {
    try {
      const connection = await this.getConnection(provider);
      if (!connection || !connection.refreshToken) {
        throw new Error('No refresh token available');
      }

      const config = this.oauthConfigs[provider];
      if (!config) {
        throw new Error(`Unsupported provider: ${provider}`);
      }

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: connection.refreshToken,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      
      // Update connection with new tokens
      connection.accessToken = tokenData.access_token;
      if (tokenData.refresh_token) {
        connection.refreshToken = tokenData.refresh_token;
      }
      connection.lastSync = new Date().toISOString();

      await this.storeConnection(connection);
      
      return tokenData.access_token;
    } catch (error) {
      await this.audit.logError(userId, `Failed to refresh token for ${provider}: ${error}`);
      throw error;
    }
  }

  async isProviderConnected(provider: string): Promise<boolean> {
    const connection = await this.getConnection(provider);
    return connection?.isConnected || false;
  }

  // Apple Health Kit integration (iOS only)
  async connectAppleHealth(userId: string): Promise<WearableConnection> {
    try {
      // Note: This would require expo-health-kit or similar package
      // For now, we'll simulate the connection
      const connection: WearableConnection = {
        id: `apple_health_${Date.now()}`,
        provider: 'apple_health',
        isConnected: true,
        lastSync: new Date().toISOString(),
        permissions: ['read:steps', 'read:heart_rate', 'read:sleep', 'read:workouts'],
      };

      await this.storeConnection(connection);
      await this.audit.logAuthEvent(userId, 'apple_health', 'connect');
      
      return connection;
    } catch (error) {
      await this.audit.logError(userId, `Failed to connect Apple Health: ${error}`);
      throw error;
    }
  }

  private async exchangeCodeForTokens(
    provider: string,
    code: string,
    codeVerifier: string
  ): Promise<any> {
    const config = this.oauthConfigs[provider];
    
    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async storeConnection(connection: WearableConnection): Promise<void> {
    const connections = await this.storage.getWearableConnections();
    const existingIndex = connections.findIndex(conn => 
      conn.provider === connection.provider
    );

    if (existingIndex >= 0) {
      connections[existingIndex] = connection;
    } else {
      connections.push(connection);
    }

    await this.storage.storeWearableConnections(connections);
  }

  // Validate token and check if refresh is needed
  async validateAndRefreshToken(provider: string, userId: string): Promise<string> {
    const connection = await this.getConnection(provider);
    if (!connection || !connection.accessToken) {
      throw new Error('No access token available');
    }

    // Simple token validation - in real implementation, you'd check expiry
    try {
      // Test the token with a simple API call
      const testResponse = await this.makeAuthenticatedRequest(provider, '/test');
      if (testResponse.ok) {
        return connection.accessToken;
      }
    } catch (error) {
      // Token might be expired, try to refresh
    }

    // Try to refresh the token
    return await this.refreshAccessToken(provider, userId);
  }

  async makeAuthenticatedRequest(provider: string, endpoint: string, options: RequestInit = {}): Promise<Response> {
    const connection = await this.getConnection(provider);
    if (!connection || !connection.accessToken) {
      throw new Error('No access token available');
    }

    const baseUrls = {
      whoop: 'https://api.prod.whoop.com/developer/v1',
      strava: 'https://www.strava.com/api/v3',
      cronometer: 'https://cronometer.com/api/v1',
    };

    const baseUrl = baseUrls[provider as keyof typeof baseUrls];
    if (!baseUrl) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    return fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
}