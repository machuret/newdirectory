/**
 * API Configuration
 * 
 * This file centralizes all API endpoint configuration to prevent inconsistencies
 * across different components.
 */

// API URL configuration
export const API_CONFIG = {
  // Get the appropriate base URL based on environment
  getBaseUrl: () => {
    // In production, use relative path which will be resolved to the deployed domain
    // In development, use the current origin which will be the dev server
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/api`
      : '/api';
  },
  
  // Helper to build full endpoint URLs
  endpoint: (path: string) => {
    const baseUrl = API_CONFIG.getBaseUrl();
    // Ensure path doesn't start with a slash when concatenating
    const formattedPath = path.startsWith('/') ? path.substring(1) : path;
    return `${baseUrl}/${formattedPath}`;
  }
};

// Specific API endpoints
export const ENDPOINTS = {
  LISTINGS: {
    ALL: () => API_CONFIG.endpoint('listings'),
    BY_ID: (id: number | string) => API_CONFIG.endpoint(`listings/${id}`),
    FEATURED: () => API_CONFIG.endpoint('listings/featured'),
    BY_TYPE: (type: string) => API_CONFIG.endpoint(`listings/by-type/${type}`),
    GENERATE_DESCRIPTION: (id: number | string) => API_CONFIG.endpoint(`listings/${id}/generate-description`),
    GENERATE_FAQS: (id: number | string) => API_CONFIG.endpoint(`listings/${id}/generate-faqs`),
  },
  LEADS: {
    ALL: () => API_CONFIG.endpoint('leads'),
    BY_ID: (id: number | string) => API_CONFIG.endpoint(`leads/${id}`),
    STATS: () => API_CONFIG.endpoint('leads/stats'),
    UPDATE_STATUS: (id: number | string) => API_CONFIG.endpoint(`leads/${id}/status`),
    BULK_UPDATE: () => API_CONFIG.endpoint('leads/bulk/status'),
  },
  API_KEYS: {
    ALL: () => API_CONFIG.endpoint('api-keys'),
    BY_ID: (id: number | string) => API_CONFIG.endpoint(`api-keys/${id}`),
  },
  CATEGORIES: {
    ALL: () => API_CONFIG.endpoint('categories'),
    BY_ID: (id: number | string) => API_CONFIG.endpoint(`categories/${id}`),
  },
  IMPORT: {
    LISTINGS: () => API_CONFIG.endpoint('import_listings'),
  },
  AUTH: {
    LOGIN: () => API_CONFIG.endpoint('auth/login'),
    REGISTER: () => API_CONFIG.endpoint('auth/register'),
    PROFILE: () => API_CONFIG.endpoint('auth/me'),
  }
};
