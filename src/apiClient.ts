/**
 * API client utility for making requests to Flyway Dashboard Server
 */

import { getApiUrl } from './config';

/**
 * Wrapper around fetch that automatically uses the configured API base URL
 * @param endpoint API endpoint path (e.g., '/api/flyway/history/all')
 * @param options Standard fetch options
 * @returns Promise with fetch response
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  
  // Add default headers
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error(`API request failed: ${url}`, error);
    throw error;
  }
}

/**
 * Helper for GET requests that returns JSON
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiFetch(endpoint);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Helper for POST requests with JSON body
 */
export async function apiPost<T = any>(endpoint: string, body: any): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
