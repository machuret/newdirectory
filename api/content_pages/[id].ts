import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[CONTENT_PAGE_ID] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[CONTENT_PAGE_ID] CRITICAL: DATABASE_URL environment variable is not defined.');
}

// For Vercel deployments, Neon and other providers often require SSL
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

// List of allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5176', // For local development Vite server
  'http://localhost:5175',
  'http://localhost:3000',
  'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app', // Your Vercel frontend URL
  // Add any other origins you need to support
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestMethod = req.method;
  const requestOrigin = req.headers.origin;
  const { id } = req.query;

  console.log(`[CONTENT_PAGE_ID] Function start. Method: ${requestMethod}, ID: ${id}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[CONTENT_PAGE_ID] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[CONTENT_PAGE_ID] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.status(204).end();
    }
    return;
  }

  // For actual requests, set CORS headers if origin is allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Check if database connection is available
  if (!pool) {
    console.error('[CONTENT_PAGE_ID] ERROR: Database connection not available');
    res.status(500).json({ error: 'Database connection not available' });
    return;
  }

  // Validate ID
  if (!id) {
    console.error('[CONTENT_PAGE_ID] ERROR: Missing ID parameter');
    res.status(400).json({ error: 'Missing ID parameter' });
    return;
  }

  try {
    // Handle GET request - get a single page
    if (requestMethod === 'GET') {
      console.log(`[CONTENT_PAGE_ID] Processing GET request for page ID: ${id}`);
      
      const result = await pool.query('SELECT * FROM content_pages WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        console.warn(`[CONTENT_PAGE_ID] Page not found with ID: ${id}`);
        return res.status(404).json({ error: 'Content page not found' });
      }
      
      console.log(`[CONTENT_PAGE_ID] Successfully fetched page with ID: ${id}`);
      return res.status(200).json(result.rows[0]);
    }
    
    // Handle PUT request - update a page
    else if (requestMethod === 'PUT') {
      console.log(`[CONTENT_PAGE_ID] Processing PUT request for page ID: ${id}`);
      
      const { title, slug, content, featured_photo_url, meta_title, meta_description, status } = req.body;
      
      // Validate required fields
      if (!title || !slug || !content) {
        console.warn('[CONTENT_PAGE_ID] Missing required fields');
        return res.status(400).json({ error: 'Title, slug, and content are required' });
      }
      
      // Check if the page exists
      const pageCheck = await pool.query('SELECT id FROM content_pages WHERE id = $1', [id]);
      if (pageCheck.rows.length === 0) {
        console.warn(`[CONTENT_PAGE_ID] Cannot update - Page not found with ID: ${id}`);
        return res.status(404).json({ error: 'Content page not found' });
      }
      
      // Check for duplicate slug (excluding this page)
      const slugCheck = await pool.query('SELECT id FROM content_pages WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugCheck.rows.length > 0) {
        console.warn(`[CONTENT_PAGE_ID] Duplicate slug "${slug}" found`);
        return res.status(400).json({ error: 'A page with this slug already exists' });
      }
      
      const now = new Date();
      const result = await pool.query(
        `UPDATE content_pages SET 
          title = $1, 
          slug = $2, 
          content = $3, 
          featured_photo_url = $4, 
          meta_title = $5,
          meta_description = $6,
          status = $7,
          updated_at = $8
        WHERE id = $9
        RETURNING *`,
        [title, slug, content, featured_photo_url, meta_title, meta_description, status || 'draft', now, id]
      );
      
      console.log(`[CONTENT_PAGE_ID] Successfully updated page with ID: ${id}`);
      return res.status(200).json(result.rows[0]);
    }
    
    // Handle DELETE request - delete a page
    else if (requestMethod === 'DELETE') {
      console.log(`[CONTENT_PAGE_ID] Processing DELETE request for page ID: ${id}`);
      
      // Check if the page exists
      const pageCheck = await pool.query('SELECT id FROM content_pages WHERE id = $1', [id]);
      if (pageCheck.rows.length === 0) {
        console.warn(`[CONTENT_PAGE_ID] Cannot delete - Page not found with ID: ${id}`);
        return res.status(404).json({ error: 'Content page not found' });
      }
      
      await pool.query('DELETE FROM content_pages WHERE id = $1', [id]);
      
      console.log(`[CONTENT_PAGE_ID] Successfully deleted page with ID: ${id}`);
      return res.status(200).json({ message: 'Content page deleted successfully' });
    }
    
    else {
      console.warn(`[CONTENT_PAGE_ID] Unsupported method: ${requestMethod}`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`[CONTENT_PAGE_ID] Error processing ${requestMethod} request:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[CONTENT_PAGE_ID] Request completed in ${duration}ms`);
  }
}
