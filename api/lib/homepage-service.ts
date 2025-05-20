import { Pool } from 'pg';
import { getPool } from './database';

// Define the HomepageContent interface
export interface HomepageSection {
  id: number;
  section_id: string;  // A unique identifier for the section (e.g., 'header', 'features')
  content_key: string; // Specific key within the section (e.g., 'title', 'subtitle')
  content: string;     // The actual content text
  created_at: string;
  updated_at: string;
}

// Group sections by section_id for easier consumption
export interface HomepageContent {
  [sectionId: string]: {
    [contentKey: string]: string;
  };
}

// Functions to manage homepage content
export const homepageService = {
  // Get all homepage content
  async getAllContent(): Promise<HomepageSection[]> {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM homepage_content
      ORDER BY section_id, content_key
    `);
    return result.rows;
  },

  // Get content grouped by sections
  async getGroupedContent(): Promise<HomepageContent> {
    const sections = await this.getAllContent();
    const grouped: HomepageContent = {};

    sections.forEach(section => {
      if (!grouped[section.section_id]) {
        grouped[section.section_id] = {};
      }
      grouped[section.section_id][section.content_key] = section.content;
    });

    return grouped;
  },

  // Get content for a specific section
  async getSectionContent(sectionId: string): Promise<{[key: string]: string}> {
    const pool = getPool();
    const result = await pool.query(`
      SELECT content_key, content 
      FROM homepage_content
      WHERE section_id = $1
    `, [sectionId]);
    
    const sectionContent: {[key: string]: string} = {};
    result.rows.forEach(row => {
      sectionContent[row.content_key] = row.content;
    });
    
    return sectionContent;
  },

  // Update content
  async updateContent(sectionId: string, contentKey: string, content: string): Promise<HomepageSection | null> {
    const pool = getPool();
    
    // Check if the content exists
    const existingResult = await pool.query(`
      SELECT * FROM homepage_content
      WHERE section_id = $1 AND content_key = $2
    `, [sectionId, contentKey]);
    
    if (existingResult.rows.length > 0) {
      // Update existing content
      const result = await pool.query(`
        UPDATE homepage_content
        SET content = $1, updated_at = NOW()
        WHERE section_id = $2 AND content_key = $3
        RETURNING *
      `, [content, sectionId, contentKey]);
      return result.rows[0];
    } else {
      // Insert new content
      const result = await pool.query(`
        INSERT INTO homepage_content (section_id, content_key, content)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [sectionId, contentKey, content]);
      return result.rows[0];
    }
  },

  // Update multiple content items in a batch
  async updateMultipleContent(updates: Array<{sectionId: string, contentKey: string, content: string}>): Promise<boolean> {
    const pool = getPool();
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      for (const update of updates) {
        const { sectionId, contentKey, content } = update;
        
        // Check if the content exists
        const existingResult = await client.query(`
          SELECT id FROM homepage_content
          WHERE section_id = $1 AND content_key = $2
        `, [sectionId, contentKey]);
        
        if (existingResult.rows.length > 0) {
          // Update existing content
          await client.query(`
            UPDATE homepage_content
            SET content = $1, updated_at = NOW()
            WHERE section_id = $2 AND content_key = $3
          `, [content, sectionId, contentKey]);
        } else {
          // Insert new content
          await client.query(`
            INSERT INTO homepage_content (section_id, content_key, content)
            VALUES ($1, $2, $3)
          `, [sectionId, contentKey, content]);
        }
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      return true;
    } catch (err) {
      // Roll back the transaction in case of error
      await client.query('ROLLBACK');
      console.error('Error updating multiple content items:', err);
      return false;
    } finally {
      // Release the client
      client.release();
    }
  },

  // Ensure the homepage_content table exists
  async initializeTable(): Promise<void> {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS homepage_content (
        id SERIAL PRIMARY KEY,
        section_id VARCHAR(50) NOT NULL,
        content_key VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section_id, content_key)
      )
    `);
    
    // Create default content if none exists
    const result = await pool.query('SELECT COUNT(*) FROM homepage_content');
    if (parseInt(result.rows[0].count) === 0) {
      await this.createDefaultContent();
    }
  },

  // Create default homepage content
  async createDefaultContent(): Promise<void> {
    const defaultContent = [
      // Header Section
      { sectionId: 'header', contentKey: 'title', content: 'Find Your Perfect Local Business' },
      { sectionId: 'header', contentKey: 'subtitle', content: 'Discover and connect with the best local businesses in your area' },
      { sectionId: 'header', contentKey: 'buttonText', content: 'Explore Now' },
      
      // Feature Listings Section
      { sectionId: 'featureListings', contentKey: 'title', content: 'Featured Listings' },
      { sectionId: 'featureListings', contentKey: 'subtitle', content: 'Explore our top-rated local businesses' },
      
      // Directory Section
      { sectionId: 'directory', contentKey: 'title', content: 'Browse Our Directory' },
      { sectionId: 'directory', contentKey: 'subtitle', content: 'Find businesses by category' },
      
      // Blog Section
      { sectionId: 'blog', contentKey: 'title', content: 'Latest Updates' },
      { sectionId: 'blog', contentKey: 'subtitle', content: 'From our blog' },
      { sectionId: 'blog', contentKey: 'description', content: 'Stay updated with the latest news and tips from local businesses' },
      { sectionId: 'blog', contentKey: 'buttonText', content: 'View All Articles' },
      
      // Get Started Section
      { sectionId: 'getStarted', contentKey: 'title', content: 'Try Our Platform' },
      { sectionId: 'getStarted', contentKey: 'description', content: 'Join thousands of happy users discovering local businesses with our platform' },
      { sectionId: 'getStarted', contentKey: 'primaryButtonText', content: 'Get Started' },
      { sectionId: 'getStarted', contentKey: 'secondaryButtonText', content: 'Learn More' },
      
      // Footer
      { sectionId: 'footer', contentKey: 'copyright', content: '© 2025 Local Business Directory. All rights reserved.' }
    ];

    await this.updateMultipleContent(defaultContent);
  }
};

// Don't initialize automatically - we'll do it explicitly before operations
// This prevents concurrency issues and ensures we can handle failures gracefully
