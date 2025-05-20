import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Initialize the connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon
  },
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM pages ORDER BY updated_at DESC, created_at DESC');
      const pages = result.rows;
      return res.status(200).json(pages);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching pages:', error);
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return res.status(500).json({ message: 'Failed to fetch pages', error: errorMessage });
  }
}
