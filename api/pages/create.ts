import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

interface NewPageData {
  title: string;
  slug: string;
  content: string;
  featured_photo_url?: string;
  meta_title?: string;
  meta_description?: string;
  status?: 'draft' | 'published' | 'archived';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { 
    title,
    slug,
    content,
    featured_photo_url,
    meta_title,
    meta_description,
    status = 'draft' // Default to 'draft' if not provided
  }: NewPageData = req.body;

  // Basic validation
  if (!title || !slug || !content) {
    return res.status(400).json({ message: 'Missing required fields: title, slug, content' });
  }

  let client;
  try {
    client = await pool.connect();
    console.log('[api/pages/create] Attempting to insert page into database...');

    const query = `
      INSERT INTO pages (title, slug, content, featured_photo_url, meta_title, meta_description, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, title, slug, content, featured_photo_url, meta_title, meta_description, status, created_at, updated_at;
    `;
    const values = [
      title,
      slug,
      content,
      featured_photo_url,
      meta_title,
      meta_description,
      status
    ];

    const result = await client.query(query, values);
    const newPage = result.rows[0];

    console.log('[api/pages/create] Successfully inserted page:', newPage);
    
    // Convert numeric ID to string for consistency with frontend Page type if necessary
    // If id is number: newPage.id = String(newPage.id);

    res.status(201).json(newPage);
  } catch (error: any) {
    console.error('[api/pages/create] Error inserting page:', error.message || error);
    // Check for unique constraint violation (e.g., slug already exists)
    if (error.code === '23505') { // PostgreSQL unique_violation error code
        res.status(409).json({ message: `Error: A page with slug '${slug}' already exists.`, error: error.message, code: error.code });
    } else {
        res.status(500).json({ message: 'Error inserting page into database', error: error.message });
    }
  } finally {
    if (client) {
      client.release();
      console.log('[api/pages/create] Database client released.');
    }
  }
}
