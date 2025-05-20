import { API_CONFIG } from '@/config/api.config';

// Define the structure of our homepage content
export interface HomepageContent {
  [sectionId: string]: {
    [contentKey: string]: string;
  };
}

// Content update structure
export interface HomepageContentUpdate {
  section_id: string;
  content_key: string;
  content: string;
}

// Default homepage content
const defaultHomepageContent: HomepageContent = {
  header: {
    title: 'Find Your Perfect Local Business',
    subtitle: 'Discover and connect with the best local businesses in your area',
    buttonText: 'Explore Now'
  },
  featureListings: {
    title: 'Featured Listings',
    subtitle: 'Explore our top-rated local businesses'
  },
  directory: {
    title: 'Browse Our Directory',
    subtitle: 'Find businesses by category'
  },
  blog: {
    title: 'Latest Updates',
    subtitle: 'From our blog',
    description: 'Stay updated with the latest news and tips from local businesses',
    buttonText: 'View All Articles'
  },
  getStarted: {
    title: 'Try Our Platform',
    description: 'Join thousands of happy users discovering local businesses with our platform',
    primaryButtonText: 'Get Started',
    secondaryButtonText: 'Learn More'
  },
  footer: {
    copyright: '© 2025 Local Business Directory. All rights reserved.'
  }
};

// Homepage content service
export const homepageService = {
  // Initialize the database (create required tables)
  async initDb(): Promise<boolean> {
    try {
      // Call the init-db endpoint to ensure homepage_content table exists
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/init-db`);
      return response.ok;
    } catch (error) {
      console.error('Error initializing database:', error);
      return false;
    }
  },

  // Fetch all homepage content, grouped by sections
  async getContent(): Promise<HomepageContent> {
    try {
      // Try to initialize the DB first
      await this.initDb();
      
      // Then fetch content
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/homepage?grouped=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch homepage content: ${response.status}`);
      }
      
      const content = await response.json();
      
      // Save to local storage as a backup
      localStorage.setItem('homepageContent', JSON.stringify(content));
      
      return content;
    } catch (error) {
      console.error('Error fetching homepage content:', error);
      
      // Try to get content from local storage as fallback
      const localContent = localStorage.getItem('homepageContent');
      if (localContent) {
        try {
          return JSON.parse(localContent);
        } catch (e) {
          console.error('Error parsing local storage content:', e);
        }
      }
      
      // If all else fails, return default content
      return defaultHomepageContent;
    }
  },
  
  // Update homepage content
  async saveContent(updates: HomepageContentUpdate[]): Promise<boolean> {
    try {
      // Ensure DB is initialized
      await this.initDb();

      console.log('Saving homepage content updates:', updates);
      
      const response = await fetch(`${API_CONFIG.getBaseUrl()}/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates })
      });
      
      if (!response.ok) {
        console.error('Server response not OK:', await response.text());
        throw new Error(`Failed to update homepage content: ${response.status}`);
      }
      
      // If successful, update the local storage as well
      try {
        // Get existing content from local storage
        const localContentStr = localStorage.getItem('homepageContent');
        let localContent: HomepageContent = localContentStr ? JSON.parse(localContentStr) : defaultHomepageContent;
        
        // Apply updates
        updates.forEach(update => {
          if (!localContent[update.section_id]) {
            localContent[update.section_id] = {};
          }
          localContent[update.section_id][update.content_key] = update.content;
        });
        
        // Save back to local storage
        localStorage.setItem('homepageContent', JSON.stringify(localContent));
      } catch (e) {
        console.error('Error updating local storage:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating homepage content:', error);
      
      // Fallback: Update local storage only if API fails
      try {
        // Get existing content
        const localContentStr = localStorage.getItem('homepageContent');
        let localContent: HomepageContent = localContentStr ? JSON.parse(localContentStr) : defaultHomepageContent;
        
        // Apply updates
        updates.forEach(update => {
          if (!localContent[update.section_id]) {
            localContent[update.section_id] = {};
          }
          localContent[update.section_id][update.content_key] = update.content;
        });
        
        // Save to local storage
        localStorage.setItem('homepageContent', JSON.stringify(localContent));
        
        // Return true since we at least updated local storage successfully
        return true;
      } catch (e) {
        console.error('Error updating local storage fallback:', e);
        return false;
      }
    }
  },
  
  // Get content for a specific section with default fallbacks
  getSection(content: HomepageContent, sectionId: string, defaults: {[key: string]: string} = {}): {[key: string]: string} {
    if (!content || !content[sectionId]) {
      return defaults;
    }
    
    // Merge defaults with actual content to ensure all expected keys exist
    return {
      ...defaults,
      ...content[sectionId]
    };
  },
  
  // Utility to safely get a specific content item with a default fallback
  getContentItem(content: HomepageContent, sectionId: string, contentKey: string, defaultValue: string = ''): string {
    if (!content || !content[sectionId] || !content[sectionId][contentKey]) {
      return defaultValue;
    }
    
    return content[sectionId][contentKey];
  }
};
