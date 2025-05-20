import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { BlogPost } from '../../src/types/blogPost'; // Adjust path as needed

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const {
    title,
    slug,
    content,
    excerpt,
    featured_photo_url,
    meta_title,
    meta_description,
    status,
    published_at,
  } = req.body as Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>;

  // Basic validation
  if (!title || !slug) {
    return res.status(400).json({ message: 'Title and slug are required.' });
  }
  if (status && !['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status value.' });
  }

  // If status is 'published' and published_at is not provided, set it to now
  // If status is 'draft' or 'archived', ensure published_at is null
  let finalPublishedAt = published_at;
  if (status === 'published') {
    if (!published_at) {
      finalPublishedAt = new Date().toISOString();
    }
  } else { // 'draft' or 'archived'
    finalPublishedAt = undefined;
  }

  const query = `
    INSERT INTO blog_posts (title, slug, content, excerpt, featured_photo_url, meta_title, meta_description, status, published_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *;
  `;

  const values = [
    title,
    slug,
    content,
    excerpt,
    featured_photo_url,
    meta_title,
    meta_description,
    status || 'draft', // Default to 'draft' if not provided
    finalPublishedAt,
  ];

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(query, values);
      const newPost = result.rows[0];
      return res.status(201).json(newPost);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating blog post:', error);
    let errorMessage = 'An unknown error occurred';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error && 'code' in error) {
      const pgError = error as any; // Type assertion to access 'code'
      if (pgError.code === '23505') { // Unique violation
        if (pgError.constraint && pgError.constraint === 'blog_posts_slug_key') {
          errorMessage = 'A blog post with this slug already exists. Please use a unique slug.';
          errorCode = 'SLUG_EXISTS';
        } else {
          errorMessage = 'A unique constraint was violated.';
          errorCode = 'UNIQUE_CONSTRAINT_VIOLATION';
        }
        return res.status(409).json({ message: errorMessage, code: errorCode, detail: pgError.detail });
      }
    }
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return res.status(500).json({ message: 'Failed to create blog post', error: errorMessage, code: errorCode });
  }
}
