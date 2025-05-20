import { Listing } from '@/types/listing';
import { API_CONFIG } from '@/config/api.config';

// Get API base URL from centralized configuration

// Interface for pagination parameters
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// Interface for search parameters
export interface SearchParams {
  search?: string;
  category?: string;
  type?: string;
}

// Interface for pagination response
export interface PaginationResponse {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Interface for listings response
export interface ListingsResponse {
  data: Listing[];
  pagination: PaginationResponse;
}

/**
 * Fetch listings with optional pagination and search parameters
 */
export async function fetchListings(
  paginationParams: PaginationParams = {},
  searchParams: SearchParams = {}
): Promise<ListingsResponse> {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    // Add pagination parameters
    if (paginationParams.page !== undefined) {
      params.append('page', paginationParams.page.toString());
    }
    
    if (paginationParams.pageSize !== undefined) {
      params.append('pageSize', paginationParams.pageSize.toString());
    }
    
    // Add search parameters
    if (searchParams.search) {
      params.append('search', searchParams.search);
    }
    
    if (searchParams.category) {
      params.append('category', searchParams.category);
    }
    
    if (searchParams.type) {
      params.append('type', searchParams.type);
    }
    
    // Add timestamp to prevent caching issues
    params.append('_t', new Date().getTime().toString());
    
    // Build the URL
    let url = `${API_CONFIG.getBaseUrl()}/listings`;
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('Fetching listings from:', url);
    
    // Make the API request
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error status: ${response.status} ${response.statusText}`);
      console.error(`HTTP error body: ${errorBody}`);
      throw new Error(`Error fetching listings: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched listings data:', data);
    
    // Handle different response formats
    let listings: Listing[] = [];
    let pagination: PaginationResponse;
    
    if (Array.isArray(data)) {
      // Case 1: API returns an array of listings directly
      listings = data;
      
      // Create a simple pagination object
      pagination = {
        page: paginationParams.page || 1,
        pageSize: paginationParams.pageSize || data.length,
        totalItems: data.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      };
    } else if (data.data && Array.isArray(data.data)) {
      // Case 2: API returns { data: Listing[], pagination?: {...} }
      listings = data.data;
      
      if (data.pagination) {
        pagination = data.pagination;
      } else {
        // Create a pagination object if not provided
        pagination = {
          page: paginationParams.page || 1,
          pageSize: paginationParams.pageSize || listings.length,
          totalItems: listings.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }
    } else {
      // Unexpected format
      console.error('Unexpected data format:', data);
      throw new Error('Received data in unexpected format');
    }
    
    return {
      data: listings,
      pagination
    };
  } catch (err) {
    console.error('Error fetching listings:', err);
    throw err;
  }
}

/**
 * Fetch a single listing by ID
 */
export async function fetchListingById(id: number): Promise<Listing> {
  try {
    const url = `${API_CONFIG.getBaseUrl()}/listings/${id}`;
    console.log('Fetching listing by ID from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error status: ${response.status} ${response.statusText}`);
      console.error(`HTTP error body: ${errorBody}`);
      throw new Error(`Error fetching listing: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully fetched listing:', data);
    
    return data;
  } catch (err) {
    console.error(`Error fetching listing with ID ${id}:`, err);
    throw err;
  }
}

/**
 * Generate AI description for a listing
 */
export async function generateListingDescription(id: number): Promise<{ description: string }> {
  try {
    // The API endpoint includes '/api/proxy' in the path
    const url = `${API_CONFIG.getBaseUrl()}/listings/${id}/generate-description`;
    console.log('Generating description for listing ID:', id, 'URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error status: ${response.status} ${response.statusText}`);
      console.error(`HTTP error body: ${errorBody}`);
      throw new Error(`Error generating description: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully generated description:', data);
    
    return data;
  } catch (err) {
    console.error(`Error generating description for listing ID ${id}:`, err);
    throw err;
  }
}

/**
 * Generate AI FAQs for a listing
 */
export async function generateListingFAQs(id: number): Promise<{ faqs: Array<{ question: string, answer: string }> }> {
  try {
    // The API endpoint includes '/api/proxy' in the path
    const url = `${API_CONFIG.getBaseUrl()}/listings/${id}/generate-faq`;
    console.log('Generating FAQs for listing ID:', id, 'URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error status: ${response.status} ${response.statusText}`);
      console.error(`HTTP error body: ${errorBody}`);
      throw new Error(`Error generating FAQs: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Successfully generated FAQs:', data);
    
    return data;
  } catch (err) {
    console.error(`Error generating FAQs for listing ID ${id}:`, err);
    throw err;
  }
}

/**
 * Update a listing with new data
 */
export async function updateListing(id: number, data: Partial<Listing>): Promise<Listing> {
  try {
    const url = `${API_CONFIG.getBaseUrl()}/listings/${id}`;
    console.log('Updating listing ID:', id, 'URL:', url, 'Data:', data);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`HTTP error status: ${response.status} ${response.statusText}`);
      console.error(`HTTP error body: ${errorBody}`);
      throw new Error(`Error updating listing: ${response.status} ${response.statusText}`);
    }
    
    const responseData = await response.json();
    console.log('Successfully updated listing:', responseData);
    
    return responseData;
  } catch (err) {
    console.error(`Error updating listing ID ${id}:`, err);
    throw err;
  }
}
