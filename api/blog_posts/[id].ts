import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[BLOG_POST_ID] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[BLOG_POST_ID] CRITICAL: DATABASE_URL environment variable is not defined.');
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

  console.log(`[BLOG_POST_ID] Function start. Method: ${requestMethod}, ID: ${id}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[BLOG_POST_ID] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[BLOG_POST_ID] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
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
    console.error('[BLOG_POST_ID] ERROR: Database connection not available');
    res.status(500).json({ error: 'Database connection not available' });
    return;
  }

  // Validate ID
  if (!id) {
    console.error('[BLOG_POST_ID] ERROR: Missing ID parameter');
    res.status(400).json({ error: 'Missing ID parameter' });
    return;
  }

  try {
    // Handle GET request - get a single blog post
    if (requestMethod === 'GET') {
      console.log(`[BLOG_POST_ID] Processing GET request for blog post ID: ${id}`);
      
      const result = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
      
      if (result.rows.length === 0) {
        console.warn(`[BLOG_POST_ID] Blog post not found with ID: ${id}`);
        return res.status(404).json({ error: 'Blog post not found' });
      }
      
      console.log(`[BLOG_POST_ID] Successfully fetched blog post with ID: ${id}`);
      return res.status(200).json(result.rows[0]);
    }
    
    // Handle PUT request - update a blog post
    else if (requestMethod === 'PUT') {
      console.log(`[BLOG_POST_ID] Processing PUT request for blog post ID: ${id}`);
      
      const { 
        title, 
        slug, 
        content,
        excerpt,
        featured_image_url,
        author,
        meta_title,
        meta_description,
        status 
      } = req.body;
      
      // Validate required fields
      if (!title || !slug || !content) {
        console.warn('[BLOG_POST_ID] Missing required fields');
        return res.status(400).json({ error: 'Title, slug, and content are required' });
      }
      
      // Check if the blog post exists
      const postCheck = await pool.query('SELECT id, status FROM blog_posts WHERE id = $1', [id]);
      if (postCheck.rows.length === 0) {
        console.warn(`[BLOG_POST_ID] Cannot update - Blog post not found with ID: ${id}`);
        return res.status(404).json({ error: 'Blog post not found' });
      }
      
      // Check for duplicate slug (excluding this blog post)
      const slugCheck = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugCheck.rows.length > 0) {
        console.warn(`[BLOG_POST_ID] Duplicate slug "${slug}" found`);
        return res.status(400).json({ error: 'A blog post with this slug already exists' });
      }
      
      const now = new Date();
      let published_at = null;
      
      // Handle published_at timestamp based on status changes
      if (status === 'published') {
        // If post is being published for the first time, set published_at to now
        if (postCheck.rows[0].status !== 'published') {
          published_at = now;
        } else {
          // If already published, keep the original published_at timestamp
          const currentPost = await pool.query('SELECT published_at FROM blog_posts WHERE id = $1', [id]);
          published_at = currentPost.rows[0].published_at;
        }
      }
      
      const result = await pool.query(
        `UPDATE blog_posts SET 
          title = $1, 
          slug = $2, 
          content = $3, 
          excerpt = $4,
          featured_image_url = $5,
          author = $6,
          meta_title = $7,
          meta_description = $8,
          status = $9,
          published_at = $10,
          updated_at = $11
        WHERE id = $12
        RETURNING *`,
        [title, slug, content, excerpt, featured_image_url, author, meta_title, meta_description, status || 'draft', published_at, now, id]
      );
      
      console.log(`[BLOG_POST_ID] Successfully updated blog post with ID: ${id}`);
      return res.status(200).json(result.rows[0]);
    }
    
    // Handle DELETE request - delete a blog post
    else if (requestMethod === 'DELETE') {
      console.log(`[BLOG_POST_ID] Processing DELETE request for blog post ID: ${id}`);
      
      // Check if the blog post exists
      const postCheck = await pool.query('SELECT id FROM blog_posts WHERE id = $1', [id]);
      if (postCheck.rows.length === 0) {
        console.warn(`[BLOG_POST_ID] Cannot delete - Blog post not found with ID: ${id}`);
        return res.status(404).json({ error: 'Blog post not found' });
      }
      
      await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
      
      console.log(`[BLOG_POST_ID] Successfully deleted blog post with ID: ${id}`);
      return res.status(200).json({ message: 'Blog post deleted successfully' });
    }
    
    else {
      console.warn(`[BLOG_POST_ID] Unsupported method: ${requestMethod}`);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`[BLOG_POST_ID] Error processing ${requestMethod} request:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return res.status(500).json({ error: 'Internal server error', message: errorMessage });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[BLOG_POST_ID] Request completed in ${duration}ms`);
  }
}
