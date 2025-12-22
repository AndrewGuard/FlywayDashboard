/**
 * Configuration loader for Flyway Dashboard
 * Loads API base URL from config.json at runtime
 */

interface AppConfig {
  apiBaseUrl: string;
}

let config: AppConfig | null = null;

/**
 * Load configuration from public/config.json
 * Falls back to environment variable or localhost if config not found
 */
export async function loadConfig(): Promise<AppConfig> {
  if (config) {
    return config;
  }

  try {
    const response = await fetch('/config.json');
    if (response.ok) {
      config = await response.json();
      console.log('✓ Loaded config from config.json:', config);
      return config;
    }
  } catch (error) {
    console.warn('Could not load config.json, using defaults:', error);
  }

  // Fallback to environment variable or localhost
  config = {
    apiBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001'
  };
  
  console.log('✓ Using default config:', config);
  return config;
}

/**
 * Get full API URL for an endpoint
 * @param endpoint API endpoint path (e.g., '/api/flyway/history/all')
 * @returns Full URL (e.g., 'http://server:3001/api/flyway/history/all')
 */
export function getApiUrl(endpoint: string): string {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  
  // Ensure endpoint starts with /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Remove trailing slash from base URL if present
  const baseUrl = config.apiBaseUrl.endsWith('/') 
    ? config.apiBaseUrl.slice(0, -1) 
    : config.apiBaseUrl;
  
  return `${baseUrl}${path}`;
}

/**
 * Get the configured API base URL
 */
export function getApiBaseUrl(): string {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config.apiBaseUrl;
}
