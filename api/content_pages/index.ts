import { VercelRequest, VercelResponse } from '@vercel/node';
import pkg from 'pg';
const { Pool } = pkg;

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[CONTENT_PAGES] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[CONTENT_PAGES] CRITICAL: DATABASE_URL environment variable is not defined.');
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

// Create the content_pages table if it doesn't exist
async function ensureTableExists() {
  if (!pool) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content_pages (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        featured_photo_url TEXT,
        meta_title VARCHAR(255),
        meta_description TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[CONTENT_PAGES] Table check/creation completed successfully');
  } catch (error) {
    console.error('[CONTENT_PAGES] Error ensuring table exists:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestMethod = req.method;
  const requestOrigin = req.headers.origin;

  console.log(`[CONTENT_PAGES] Function start. Method: ${requestMethod}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[CONTENT_PAGES] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[CONTENT_PAGES] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
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
    console.error('[CONTENT_PAGES] ERROR: Database connection not available');
    res.status(500).json({ error: 'Database connection not available' });
    return;
  }

  // Create table if it doesn't exist
  await ensureTableExists();

  try {
    // Handle GET request to fetch all content pages
    if (requestMethod === 'GET') {
      console.log('[CONTENT_PAGES] Processing GET request to fetch all content pages');
      
      const result = await pool.query('SELECT * FROM content_pages ORDER BY updated_at DESC');
      console.log(`[CONTENT_PAGES] Successfully fetched ${result.rows.length} content pages`);
      
      res.status(200).json(result.rows);
    }
    // Handle POST request to create a new content page
    else if (requestMethod === 'POST') {
      console.log('[CONTENT_PAGES] Processing POST request to create a new content page');
      
      const { title, slug, content, featured_photo_url, meta_title, meta_description, status } = req.body;
      
      // Validate required fields
      if (!title || !slug || !content) {
        console.warn('[CONTENT_PAGES] Missing required fields');
        res.status(400).json({ error: 'Title, slug, and content are required' });
        return;
      }
      
      // Check if slug already exists
      const existingSlug = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
      if (existingSlug.rows.length > 0) {
        console.warn(`[CONTENT_PAGES] Slug "${slug}" already exists`);
        res.status(400).json({ error: 'A page with this slug already exists' });
        return;
      }
      
      const now = new Date();
      const result = await pool.query(
        `INSERT INTO content_pages 
         (title, slug, content, featured_photo_url, meta_title, meta_description, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING *`,
        [title, slug, content, featured_photo_url, meta_title, meta_description, status || 'draft', now, now]
      );
      
      console.log(`[CONTENT_PAGES] Content page created successfully with ID: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } 
    else {
      console.warn(`[CONTENT_PAGES] Unsupported method: ${requestMethod}`);
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('[CONTENT_PAGES] Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: 'Internal server error', message: errorMessage });
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[CONTENT_PAGES] Request completed in ${duration}ms`);
  }
}
