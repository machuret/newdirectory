/**
 * Server Health Check Utility
 * 
 * This utility provides functions to check if the API servers are running
 * and automatically switch to a fallback if the primary server is down.
 */

import { API_CONFIG } from '@/config/api.config';

// Cache the health check results to avoid excessive requests
const healthCache: Record<string, { healthy: boolean; timestamp: number }> = {};
const CACHE_TTL = 60000; // 1 minute

/**
 * Check if a server is healthy by making a lightweight request
 */
export const checkServerHealth = async (serverUrl: string): Promise<boolean> => {
  // Check cache first
  const now = Date.now();
  const cachedResult = healthCache[serverUrl];
  if (cachedResult && now - cachedResult.timestamp < CACHE_TTL) {
    return cachedResult.healthy;
  }
  
  try {
    // Make a lightweight request to check server health
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${serverUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const healthy = response.ok;
    // Update cache
    healthCache[serverUrl] = { healthy, timestamp: now };
    return healthy;
  } catch (error) {
    console.error(`Health check failed for ${serverUrl}:`, error);
    // Update cache with unhealthy status
    healthCache[serverUrl] = { healthy: false, timestamp: now };
    return false;
  }
};

/**
 * Get the best available API server URL
 * Checks primary server first, falls back to secondary if needed
 */
export const getBestAvailableServer = async (): Promise<string> => {
  // Try proxy server first if it's configured as primary
  if (API_CONFIG.USE_PROXY_SERVER) {
    const proxyServerHealthy = await checkServerHealth(API_CONFIG.PROXY_SERVER_URL);
    if (proxyServerHealthy) {
      return API_CONFIG.PROXY_SERVER_URL;
    }
    
    // Fallback to express server
    const expressServerHealthy = await checkServerHealth(API_CONFIG.EXPRESS_SERVER_URL);
    if (expressServerHealthy) {
      console.warn('Proxy server is down, falling back to Express server');
      return API_CONFIG.EXPRESS_SERVER_URL;
    }
  } else {
    // Express server is primary
    const expressServerHealthy = await checkServerHealth(API_CONFIG.EXPRESS_SERVER_URL);
    if (expressServerHealthy) {
      return API_CONFIG.EXPRESS_SERVER_URL;
    }
    
    // Fallback to proxy server
    const proxyServerHealthy = await checkServerHealth(API_CONFIG.PROXY_SERVER_URL);
    if (proxyServerHealthy) {
      console.warn('Express server is down, falling back to Proxy server');
      return API_CONFIG.PROXY_SERVER_URL;
    }
  }
  
  // If both servers are down, return the configured primary server
  // (the application will handle the error when it tries to make a request)
  console.error('All API servers are down');
  return API_CONFIG.USE_PROXY_SERVER ? API_CONFIG.PROXY_SERVER_URL : API_CONFIG.EXPRESS_SERVER_URL;
};

/**
 * Initialize health checks and server monitoring
 * Call this during application startup
 */
export const initializeServerHealthMonitoring = () => {
  // Perform initial health check
  getBestAvailableServer().then(server => {
    console.log(`Using API server: ${server}`);
  });
  
  // Set up periodic health checks (every 5 minutes)
  setInterval(() => {
    getBestAvailableServer().then(server => {
      console.log(`[Health Check] Using API server: ${server}`);
    });
  }, 5 * 60 * 1000);
};
