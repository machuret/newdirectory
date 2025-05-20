import { Listing } from '@/types/listing';
import { Lead, LeadStats } from '@/types/lead';
import { API_CONFIG, ENDPOINTS } from '@/config/api.config';

// Use the centralized API configuration
export const getApiUrl = (endpoint: string): string => {
  // Ensure endpoint starts with a slash for proper concatenation
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_CONFIG.getBaseUrl()}${formattedEndpoint}`;
};

// Generic API request function with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    // Try to parse error response
    let errorMessage: string;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || `API error: ${response.status} ${response.statusText}`;
    } catch (e) {
      errorMessage = `API error: ${response.status} ${response.statusText}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
}

// Listings API
export interface ListingsResponse {
  listings: Listing[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export interface ListingResponse {
  listing: Listing;
}

export const listingsApi = {
  getAll(page = 1, limit = 20) {
    const url = `${ENDPOINTS.LISTINGS.ALL()}?page=${page}&limit=${limit}`;
    return apiRequest<ListingsResponse>(url);
  },
  
  getFeatured(page = 1, limit = 12) {
    const url = `${ENDPOINTS.LISTINGS.FEATURED()}?page=${page}&limit=${limit}`;
    return apiRequest<ListingsResponse>(url);
  },
  
  getById(id: number | string) {
    return apiRequest<ListingResponse>(ENDPOINTS.LISTINGS.BY_ID(id));
  },
  
  create(listing: Partial<Listing>) {
    return apiRequest<Listing>(ENDPOINTS.LISTINGS.ALL(), {
      method: 'POST',
      body: JSON.stringify(listing)
    });
  },
  
  update(id: number | string, listing: Partial<Listing>) {
    return apiRequest<Listing>(ENDPOINTS.LISTINGS.BY_ID(id), {
      method: 'PUT',
      body: JSON.stringify(listing)
    });
  },
  
  delete(id: number | string) {
    return apiRequest<void>(ENDPOINTS.LISTINGS.BY_ID(id), {
      method: 'DELETE'
    });
  },
  
  generateDescription(id: number | string) {
    return apiRequest<{ description: string }>(ENDPOINTS.LISTINGS.GENERATE_DESCRIPTION(id), {
      method: 'POST'
    });
  },
  
  generateFAQs(id: number | string) {
    return apiRequest<{ faqs: Array<{question: string, answer: string}> }>(ENDPOINTS.LISTINGS.GENERATE_FAQS(id), {
      method: 'POST'
    });
  }
};

// Leads API
export interface LeadsResponse {
  leads: Lead[];
  pagination?: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

export const leadsApi = {
  getAll: (page = 1, limit = 20, status?: string, listingId?: number) => {
    let url = `/api/leads?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (listingId) url += `&listingId=${listingId}`;
    return apiRequest<LeadsResponse>(url);
  },
  
  getById: (id: number | string) => 
    apiRequest<{ lead: Lead }>(`/api/leads/${id}`),
    
  create: (lead: { listingId: number; name: string; email: string; message: string }) => 
    apiRequest<{ success: boolean; lead: { id: number; created_at: string } }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    }),
    
  updateStatus: (id: number | string, status: 'new' | 'read' | 'replied' | 'archived') => 
    apiRequest<{ success: boolean; lead: Lead }>(`/api/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
    
  delete: (id: number | string) => 
    apiRequest<{ success: boolean }>(`/api/leads/${id}`, {
      method: 'DELETE',
    }),
    
  bulkUpdateStatus: (ids: number[], status: 'new' | 'read' | 'replied' | 'archived') => 
    apiRequest<{ success: boolean; updatedCount: number }>('/api/leads/bulk/status', {
      method: 'PUT',
      body: JSON.stringify({ ids, status }),
    }),
    
  getStats: () => 
    apiRequest<{ success: boolean; stats: LeadStats }>('/api/leads/stats'),
};

// API Keys API
export interface ApiKey {
  id: number;
  service_name: string;
  api_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const apiKeysApi = {
  getAll: () => 
    apiRequest<{ apiKeys: ApiKey[] }>('/api/api-keys'),
    
  create: (serviceName: string, apiKey: string) => 
    apiRequest<{ success: boolean; apiKey: ApiKey }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ serviceName, apiKey }),
    }),
    
  update: (id: number | string, apiKey: string) => 
    apiRequest<{ success: boolean; apiKey: ApiKey }>(`/api/api-keys/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ apiKey }),
    }),
    
  delete: (id: number | string) => 
    apiRequest<{ success: boolean }>(`/api/api-keys/${id}`, {
      method: 'DELETE',
    }),
};

// Categories API
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
}

export const categoriesApi = {
  getAll: () => 
    apiRequest<{ categories: Category[] }>('/api/categories'),
    
  getById: (id: number | string) => 
    apiRequest<{ category: Category }>(`/api/categories/${id}`),
    
  create: (category: Partial<Category>) => 
    apiRequest<{ category: Category }>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
    
  update: (id: number | string, category: Partial<Category>) => 
    apiRequest<{ category: Category }>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
    
  delete: (id: number | string) => 
    apiRequest<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    }),
};
