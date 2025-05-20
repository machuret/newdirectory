import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Database Initialization API Called =====');
  
  try {
    // Get database connection
    const pool = getPool();
    
    // Create homepage_content table if it doesn't exist
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
    
    // Check if we have any default content
    const countResult = await pool.query('SELECT COUNT(*) FROM homepage_content');
    const count = parseInt(countResult.rows[0].count);
    
    // Add default content if the table is empty
    if (count === 0) {
      const defaultContent = [
        // Header Section
        { section_id: 'header', content_key: 'title', content: 'Find Your Perfect Local Business' },
        { section_id: 'header', content_key: 'subtitle', content: 'Discover and connect with the best local businesses in your area' },
        { section_id: 'header', content_key: 'buttonText', content: 'Explore Now' },
        
        // Feature Listings Section
        { section_id: 'featureListings', content_key: 'title', content: 'Featured Listings' },
        { section_id: 'featureListings', content_key: 'subtitle', content: 'Explore our top-rated local businesses' },
        
        // Directory Section
        { section_id: 'directory', content_key: 'title', content: 'Browse Our Directory' },
        { section_id: 'directory', content_key: 'subtitle', content: 'Find businesses by category' },
        
        // Blog Section
        { section_id: 'blog', content_key: 'title', content: 'Latest Updates' },
        { section_id: 'blog', content_key: 'subtitle', content: 'From our blog' },
        { section_id: 'blog', content_key: 'description', content: 'Stay updated with the latest news and tips from local businesses' },
        { section_id: 'blog', content_key: 'buttonText', content: 'View All Articles' },
        
        // Get Started Section
        { section_id: 'getStarted', content_key: 'title', content: 'Try Our Platform' },
        { section_id: 'getStarted', content_key: 'description', content: 'Join thousands of happy users discovering local businesses with our platform' },
        { section_id: 'getStarted', content_key: 'primaryButtonText', content: 'Get Started' },
        { section_id: 'getStarted', content_key: 'secondaryButtonText', content: 'Learn More' },
        
        // Footer
        { section_id: 'footer', content_key: 'copyright', content: '© 2025 Local Business Directory. All rights reserved.' }
      ];
      
      // Insert default content
      for (const item of defaultContent) {
        await pool.query(`
          INSERT INTO homepage_content (section_id, content_key, content)
          VALUES ($1, $2, $3)
          ON CONFLICT (section_id, content_key) DO NOTHING
        `, [item.section_id, item.content_key, item.content]);
      }
    }
    
    // Define defaultContent reference for the response
    const contentCount = count > 0 ? count : (count === 0 ? 16 : 0); // 16 is the number of default items we inserted
    
    return res.status(200).json({
      message: 'Database initialized successfully',
      tables_created: ['homepage_content'],
      content_items: contentCount
    });
  } catch (error: any) {
    console.error('Error initializing database:', error);
    return res.status(500).json({
      message: 'Failed to initialize database',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
