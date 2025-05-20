import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from './lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Debug API Called =====');
  
  try {
    // Test database connection
    const pool = getPool();
    const result = await pool.query('SELECT NOW() as timestamp');
    
    // Check if homepage_content table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'homepage_content'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    // If table doesn't exist, we'll need to create it
    if (!tableExists) {
      return res.status(200).json({
        message: 'Debug information',
        database: 'connected',
        timestamp: result.rows[0].timestamp,
        tables: {
          homepage_content: 'does not exist'
        },
        action_required: 'The homepage_content table needs to be created'
      });
    }
    
    // Get count of records in the homepage_content table
    const countResult = await pool.query('SELECT COUNT(*) FROM homepage_content');
    
    return res.status(200).json({
      message: 'Debug information',
      database: 'connected',
      timestamp: result.rows[0].timestamp,
      tables: {
        homepage_content: 'exists',
        record_count: parseInt(countResult.rows[0].count)
      }
    });
  } catch (error: any) {
    console.error('Error in debug endpoint:', error);
    return res.status(500).json({
      message: 'Debug information',
      database: 'error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
