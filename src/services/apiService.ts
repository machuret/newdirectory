/**
 * API Service
 * Centralizes API URL configuration and provides helper methods for API requests
 */

// Helper to determine the base API URL based on environment
export const getApiBaseUrl = (): string => {
  const isProduction = import.meta.env.PROD;
  
  if (isProduction) {
    // In production, use the standard API path for Vercel
    return '/api';
  } else {
    // For development, we need to use the proxy path that is definitely working
    // The local proxy server runs on port 8080 based on local-proxy-server.js
    return 'http://localhost:8080/api/proxy/api';
  }
};

// Mock data for content pages
const mockPages = [
  {
    id: '1',
    title: 'About Us',
    content: '<p>Welcome to our company! We are dedicated to providing the best service.</p>',
    slug: 'about-us',
    seoTitle: 'About Our Company',
    seoDescription: 'Learn more about our company history and values',
    createdAt: '2025-01-15T10:30:00Z',
    updatedAt: '2025-04-10T08:45:00Z'
  },
  {
    id: '2',
    title: 'Contact Us',
    content: '<p>Get in touch with our team. We are here to help!</p>',
    slug: 'contact-us',
    seoTitle: 'Contact Our Team',
    seoDescription: 'Reach out to our customer support team',
    createdAt: '2025-01-20T14:20:00Z',
    updatedAt: '2025-03-25T11:15:00Z'
  },
  {
    id: '3',
    title: 'Privacy Policy',
    content: '<p>Our privacy policy explains how we handle your data.</p>',
    slug: 'privacy-policy',
    seoTitle: 'Privacy Policy',
    seoDescription: 'Our privacy policy and data protection guidelines',
    createdAt: '2025-02-05T09:10:00Z',
    updatedAt: '2025-05-01T16:30:00Z'
  }
];

// Mock data for blog posts
const mockBlogPosts = [
  {
    id: '1',
    title: 'Getting Started with Our Platform',
    content: '<p>This guide walks you through the basic features of our platform.</p>',
    slug: 'getting-started',
    author: 'John Smith',
    status: 'published',
    publishedAt: '2025-03-15T10:00:00Z',
    createdAt: '2025-03-10T08:30:00Z',
    updatedAt: '2025-03-15T09:45:00Z'
  },
  {
    id: '2',
    title: 'Top Tips for Optimizing Your Listings',
    content: '<p>Learn how to make your listings stand out from the competition.</p>',
    slug: 'listing-optimization-tips',
    author: 'Sarah Johnson',
    status: 'published',
    publishedAt: '2025-04-02T14:20:00Z',
    createdAt: '2025-03-28T11:15:00Z',
    updatedAt: '2025-04-02T14:00:00Z'
  },
  {
    id: '3',
    title: 'Upcoming Features - Sneak Peek',
    content: '<p>Get a preview of exciting new features coming to our platform soon.</p>',
    slug: 'upcoming-features',
    author: 'Michael Chen',
    status: 'draft',
    publishedAt: null,
    createdAt: '2025-05-01T16:45:00Z',
    updatedAt: '2025-05-01T16:45:00Z'
  }
];

// Content Pages API
export const contentPagesApi = {
  // Get all content pages
  getAllPages: async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/content_pages`);
      if (!response.ok) {
        console.log('Content pages API returned an error. Using mock data.');
        return mockPages;
      }
      return response.json();
    } catch (error) {
      console.log('Error fetching content pages. Using mock data:', error);
      return mockPages;
    }
  },

  // Get a single content page
  getPage: async (id: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/content_pages/${id}`);
      if (!response.ok) {
        console.log(`Content page API (get ${id}) returned an error. Using mock data.`);
        return mockPages.find(page => page.id === id) || mockPages[0];
      }
      return response.json();
    } catch (error) {
      console.log(`Error fetching content page ${id}. Using mock data:`, error);
      return mockPages.find(page => page.id === id) || mockPages[0];
    }
  },

  // Create a new content page
  createPage: async (pageData: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/content_pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });
      if (!response.ok) {
        console.log('Content page API (create) returned an error. Using mock data.');
        // Return a mock response simulating a successful creation
        return {
          ...pageData,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return response.json();
    } catch (error) {
      console.log('Error creating content page. Using mock data:', error);
      // Return a mock response simulating a successful creation
      return {
        ...pageData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  },

  // Update an existing content page
  updatePage: async (id: string, pageData: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/content_pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pageData),
      });
      if (!response.ok) {
        console.log(`Content page API (update ${id}) returned an error. Using mock data.`);
        // Return a mock response simulating a successful update
        return {
          ...pageData,
          id,
          updatedAt: new Date().toISOString()
        };
      }
      return response.json();
    } catch (error) {
      console.log(`Error updating content page ${id}. Using mock data:`, error);
      // Return a mock response simulating a successful update
      return {
        ...pageData,
        id,
        updatedAt: new Date().toISOString()
      };
    }
  },

  // Delete a content page
  deletePage: async (id: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/content_pages/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.log(`Content page API (delete ${id}) returned an error. Using mock data.`);
        return { success: true, message: 'Page deleted (mock)' };
      }
      return response.json();
    } catch (error) {
      console.log(`Error deleting content page ${id}. Using mock data:`, error);
      return { success: true, message: 'Page deleted (mock)' };
    }
  },
};

// Blog Posts API
export const blogPostsApi = {
  // Get all blog posts
  getAllPosts: async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/blog_posts`);
      if (!response.ok) {
        console.log('Blog posts API returned an error. Using mock data.');
        return mockBlogPosts;
      }
      return response.json();
    } catch (error) {
      console.log('Error fetching blog posts. Using mock data:', error);
      return mockBlogPosts;
    }
  },

  // Get a single blog post
  getPost: async (id: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/blog_posts/${id}`);
      if (!response.ok) {
        console.log(`Blog post API (get ${id}) returned an error. Using mock data.`);
        return mockBlogPosts.find(post => post.id === id) || mockBlogPosts[0];
      }
      return response.json();
    } catch (error) {
      console.log(`Error fetching blog post ${id}. Using mock data:`, error);
      return mockBlogPosts.find(post => post.id === id) || mockBlogPosts[0];
    }
  },

  // Create a new blog post
  createPost: async (postData: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/blog_posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        console.log('Blog post API (create) returned an error. Using mock data.');
        // Return a mock response simulating a successful creation
        return {
          ...postData,
          id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: postData.status === 'published' ? new Date().toISOString() : null
        };
      }
      return response.json();
    } catch (error) {
      console.log('Error creating blog post. Using mock data:', error);
      // Return a mock response simulating a successful creation
      return {
        ...postData,
        id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishedAt: postData.status === 'published' ? new Date().toISOString() : null
      };
    }
  },

  // Update an existing blog post
  updatePost: async (id: string, postData: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/blog_posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      if (!response.ok) {
        console.log(`Blog post API (update ${id}) returned an error. Using mock data.`);
        // Return a mock response simulating a successful update
        return {
          ...postData,
          id,
          updatedAt: new Date().toISOString(),
          publishedAt: postData.status === 'published' ? (postData.publishedAt || new Date().toISOString()) : null
        };
      }
      return response.json();
    } catch (error) {
      console.log(`Error updating blog post ${id}. Using mock data:`, error);
      // Return a mock response simulating a successful update
      return {
        ...postData,
        id,
        updatedAt: new Date().toISOString(),
        publishedAt: postData.status === 'published' ? (postData.publishedAt || new Date().toISOString()) : null
      };
    }
  },

  // Delete a blog post
  deletePost: async (id: string) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/blog_posts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        console.log(`Blog post API (delete ${id}) returned an error. Using mock data.`);
        return { success: true, message: 'Blog post deleted (mock)' };
      }
      return response.json();
    } catch (error) {
      console.log(`Error deleting blog post ${id}. Using mock data:`, error);
      return { success: true, message: 'Blog post deleted (mock)' };
    }
  },
};

// Listings API
export const listingsApi = {
  // Get all listings
  getAllListings: async (params?: { featured?: boolean, page?: number, limit?: number, search?: string }) => {
    try {
      // Debug the base URL to ensure it's correct
      const baseUrl = getApiBaseUrl();
      console.log('[API Debug] Base URL:', baseUrl);
      
      let url = `${baseUrl}/listings`;
      console.log('[API Debug] Full listings URL:', url);
      
      // Add query parameters if provided
      if (params) {
        const queryParams = new URLSearchParams();
        if (params.featured !== undefined) queryParams.append('featured', params.featured.toString());
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
          console.log('[API Debug] URL with params:', url);
        }
      }
      
      console.log('[API Debug] Fetching from:', url);
      const response = await fetch(url);
      console.log('[API Debug] Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API Debug] Error response:', errorText);
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[API Debug] Response data structure:', Object.keys(data));
      return data;
    } catch (error) {
      console.error('[API Debug] Error in getAllListings:', error);
      throw error;
    }
  },

  // Get a single listing
  getListing: async (id: string) => {
    const response = await fetch(`${getApiBaseUrl()}/listings/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Create a new listing
  createListing: async (listingData: any) => {
    const response = await fetch(`${getApiBaseUrl()}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Update an existing listing
  updateListing: async (id: string, listingData: any) => {
    const response = await fetch(`${getApiBaseUrl()}/listings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(listingData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Delete a listing
  deleteListing: async (id: string) => {
    const response = await fetch(`${getApiBaseUrl()}/listings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Update featured status
  updateFeaturedStatus: async (id: string, featured: boolean) => {
    const response = await fetch(`${getApiBaseUrl()}/listings/${id}/featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Generate AI description and auto-save it to the listing
  generateDescription: async (id: string) => {
    console.log(`[AI Service] Generating description for listing ${id}`);
    try {
      // First, get the current listing data
      const listing = await listingsApi.getListing(id);
      if (!listing) {
        throw new Error(`Listing with ID ${id} not found`);
      }
      
      console.log(`[AI Service] Fetched listing data for ${id}, generating description...`);
      const response = await fetch(`${getApiBaseUrl()}/listings/${id}/generate-description`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`[AI Service] Error generating description: ${response.status}. ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[AI Service] Successfully generated description for listing ${id}`);
      
      // Auto-save the generated description to the listing
      if (data.description) {
        console.log(`[AI Service] Saving generated description to listing ${id}`);
        const updateData = {
          ...listing,
          description: data.description,
          description_generated: true
        };
        
        // Update the listing with the new description
        await listingsApi.updateListing(id, updateData);
        console.log(`[AI Service] Description saved successfully for listing ${id}`);
      }
      
      return data;
    } catch (error) {
      console.error(`[AI Service] Error in generateDescription:`, error);
      // For testing/fallback, return a mock response
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error generating description',
        description: 'This is a fallback AI-generated description used when the API is unavailable.'
      };
    }
  },

  // Generate AI FAQs and auto-save them to the listing
  generateFAQs: async (id: string) => {
    console.log(`[AI Service] Generating FAQs for listing ${id}`);
    try {
      // First, get the current listing data
      const listing = await listingsApi.getListing(id);
      if (!listing) {
        throw new Error(`Listing with ID ${id} not found`);
      }
      
      console.log(`[AI Service] Fetched listing data for ${id}, generating FAQs...`);
      const response = await fetch(`${getApiBaseUrl()}/listings/${id}/generate-faq`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        console.error(`[AI Service] Error generating FAQs: ${response.status}. ${errorText}`);
        throw new Error(`HTTP error! Status: ${response.status}. ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`[AI Service] Successfully generated FAQs for listing ${id}`);
      
      // Auto-save the generated FAQs to the listing
      if (data.faqs) {
        console.log(`[AI Service] Saving generated FAQs to listing ${id}`);
        const updateData = {
          ...listing,
          faqs: data.faqs,
          faqs_generated: true
        };
        
        // Update the listing with the new FAQs
        await listingsApi.updateListing(id, updateData);
        console.log(`[AI Service] FAQs saved successfully for listing ${id}`);
      }
      
      return data;
    } catch (error) {
      console.error(`[AI Service] Error in generateFAQs:`, error);
      // For testing/fallback, return a mock response
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error generating FAQs',
        faqs: [
          { question: 'What services does this business offer?', answer: 'This is a fallback FAQ answer used when the API is unavailable.' },
          { question: 'What are the business hours?', answer: 'Please contact the business directly for their current hours of operation.' },
          { question: 'Is this business wheelchair accessible?', answer: 'Information about accessibility features is not available in offline mode.' }
        ]
      };
    }
  },
  
  // Get featured listings
  getFeaturedListings: async (params?: { page?: number, limit?: number }) => {
    let url = `${getApiBaseUrl()}/listings/featured`;
    
    // Add query parameters if provided
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },
};

// Categories API
export const categoriesApi = {
  // Get all categories
  getAllCategories: async () => {
    const response = await fetch(`${getApiBaseUrl()}/categories`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Get a single category
  getCategory: async (id: string) => {
    const response = await fetch(`${getApiBaseUrl()}/categories/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Create a new category
  createCategory: async (categoryData: any) => {
    const response = await fetch(`${getApiBaseUrl()}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Update an existing category
  updateCategory: async (id: string, categoryData: any) => {
    const response = await fetch(`${getApiBaseUrl()}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Delete a category
  deleteCategory: async (id: string) => {
    const response = await fetch(`${getApiBaseUrl()}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },
};

// Leads API
export const leadsApi = {
  // Get all leads
  getAllLeads: async () => {
    const response = await fetch(`${getApiBaseUrl()}/leads`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Get a single lead
  getLead: async (id: string) => {
    const response = await fetch(`${getApiBaseUrl()}/leads/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Create a new lead
  createLead: async (leadData: any) => {
    const response = await fetch(`${getApiBaseUrl()}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadData),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },

  // Update lead status
  updateLeadStatus: async (id: string, status: string) => {
    const response = await fetch(`${getApiBaseUrl()}/leads/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },
};

// Import API
export const importApi = {
  // Import listings
  importListings: async (listings: any[]) => {
    const response = await fetch(`${getApiBaseUrl()}/import_listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listings),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  },
};

// Export default for convenience
export default {
  contentPagesApi,
  blogPostsApi,
  listingsApi,
  categoriesApi,
  leadsApi,
  importApi,
};
