import { Pool } from 'pg';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// If you're not using Next.js, the req/res types might be different (e.g., from Express or a Vercel-specific type)
// For a plain Vercel serverless function, you might not use NextApiRequest/Response directly
// but rather a simpler handler structure. Let's start with this and adjust if needed.

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  let pool;

  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set.');
      return res.status(500).json({ error: 'DATABASE_URL environment variable is not set.' });
    }

    console.log('[db-test] Attempting to connect to database...');
    pool = new Pool({
      connectionString,
      // Vercel automatically handles SSL for Neon if connectionString includes sslmode=require
      // For local development, if you have SSL issues, you might need to add:
      // ssl: {
      //   rejectUnauthorized: false, // Only for local dev, NOT for production
      // },
    });

    const client = await pool.connect();
    console.log('[db-test] Successfully connected to the database.');

    const result = await client.query('SELECT NOW();');
    console.log('[db-test] Query result:', result.rows[0]);

    client.release();

    return res.status(200).json({ 
      message: 'Successfully connected to database and queried.', 
      db_time: result.rows[0].now 
    });

  } catch (error: any) {
    console.error('[db-test] Error connecting to database or querying:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to database or query.', 
      details: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  } finally {
    if (pool) {
      await pool.end(); // Close all connections in the pool
      console.log('[db-test] Database pool closed.');
    }
  }
}
