import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[BLOG_POSTS] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[BLOG_POSTS] CRITICAL: DATABASE_URL environment variable is not defined.');
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

// Create the blog_posts table if it doesn't exist
async function ensureTableExists() {
  if (!pool) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        featured_image_url TEXT,
        author VARCHAR(100),
        meta_title VARCHAR(255),
        meta_description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[BLOG_POSTS] Table check/creation completed successfully');
  } catch (error) {
    console.error('[BLOG_POSTS] Error ensuring table exists:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestMethod = req.method;
  const requestOrigin = req.headers.origin;

  console.log(`[BLOG_POSTS] Function start. Method: ${requestMethod}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[BLOG_POSTS] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[BLOG_POSTS] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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
    console.error('[BLOG_POSTS] ERROR: Database connection not available');
    res.status(500).json({ error: 'Database connection not available' });
    return;
  }

  // Create table if it doesn't exist
  await ensureTableExists();

  try {
    // Handle GET request to fetch all blog posts
    if (requestMethod === 'GET') {
      console.log('[BLOG_POSTS] Processing GET request to fetch all blog posts');
      
      const result = await pool.query('SELECT * FROM blog_posts ORDER BY updated_at DESC');
      console.log(`[BLOG_POSTS] Successfully fetched ${result.rows.length} blog posts`);
      
      res.status(200).json(result.rows);
    }
    // Handle POST request to create a new blog post
    else if (requestMethod === 'POST') {
      console.log('[BLOG_POSTS] Processing POST request to create a new blog post');
      
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
        console.warn('[BLOG_POSTS] Missing required fields');
        res.status(400).json({ error: 'Title, slug, and content are required' });
        return;
      }
      
      // Check if slug already exists
      const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
      if (existingSlug.rows.length > 0) {
        console.warn(`[BLOG_POSTS] Slug "${slug}" already exists`);
        res.status(400).json({ error: 'A blog post with this slug already exists' });
        return;
      }
      
      const now = new Date();
      let published_at = null;
      if (status === 'published') {
        published_at = now;
      }
      
      const result = await pool.query(
        `INSERT INTO blog_posts 
         (title, slug, content, excerpt, featured_image_url, author, meta_title, meta_description, status, published_at, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING *`,
        [title, slug, content, excerpt, featured_image_url, author, meta_title, meta_description, status || 'draft', published_at, now, now]
      );
      
      console.log(`[BLOG_POSTS] Blog post created successfully with ID: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } 
    else {
      console.warn(`[BLOG_POSTS] Unsupported method: ${requestMethod}`);
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[BLOG_POSTS] Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Internal server error', message: errorMessage });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[BLOG_POSTS] Request completed in ${duration}ms`);
  }
}
