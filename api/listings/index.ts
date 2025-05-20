import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[GET_LISTINGS] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[GET_LISTINGS] CRITICAL: DATABASE_URL environment variable is not defined.');
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

  console.log(`[GET_LISTINGS] Function start. Method: ${requestMethod}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[GET_LISTINGS] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[GET_LISTINGS] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.status(204).end();
    }
    return;
  }

  // For actual requests, set CORS headers if origin is allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (requestOrigin) {
    console.warn(`[GET_LISTINGS] ${requestMethod}: Origin ${requestOrigin} is NOT ALLOWED. Denying request.`);
    const duration = Date.now() - startTime;
    console.log(`[GET_LISTINGS] ${requestMethod} request denied (CORS) in ${duration}ms.`);
    res.status(403).json({ message: 'CORS: Origin not allowed' });
    return;
  }

  // Only handle GET requests
  if (requestMethod === 'GET') {
    if (!DATABASE_URL || !pool) {
      console.error('[GET_LISTINGS] Error: Database not configured. DATABASE_URL or pool missing.');
      const duration = Date.now() - startTime;
      console.log(`[GET_LISTINGS] GET request failed (DB config error) in ${duration}ms.`);
      return res.status(500).json({ message: 'Server configuration error regarding database.' });
    }

    let client;
    try {
      client = await pool.connect();
      console.log('[GET_LISTINGS] Database client connected.');
      
      // Get pagination parameters from query string
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const offset = (page - 1) * pageSize;
      
      // Get search parameters
      const searchTerm = req.query.search as string || '';
      
      // Build SQL query with pagination and optional search
      let queryParams = [];
      let searchCondition = '';
      
      // Check database schema for column names
      const checkColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'listings'
      `);
      
      const columnNames: string[] = checkColumns.rows.map(row => row.column_name);
      
      if (searchTerm) {
        console.log('[GET_LISTINGS] Available columns in listings table:', columnNames);
        
        // Build search condition based on available columns
        const searchableColumns = [];
        if (columnNames.includes('google_place_id')) searchableColumns.push('google_place_id');
        if (columnNames.includes('place_id')) searchableColumns.push('place_id'); 
        if (columnNames.includes('name')) searchableColumns.push('name');
        if (columnNames.includes('formatted_address')) searchableColumns.push('formatted_address');
        if (columnNames.includes('vicinity')) searchableColumns.push('vicinity');
        
        if (searchableColumns.length > 0) {
          searchCondition = 'WHERE ' + searchableColumns.map((col, i) => 
            `${col} ILIKE $1`
          ).join(' OR ');
        } else {
          // Fallback to ID if no searchable text columns are available
          searchCondition = '';
          console.warn('[GET_LISTINGS] No searchable text columns found in listings table');
        }
        
        queryParams.push(`%${searchTerm}%`);
      }
      
      // Query for total count
      const countQuery = `SELECT COUNT(*) FROM listings ${searchCondition}`;
      const countResult = await client.query(countQuery, searchTerm ? queryParams : []);
      const totalItems = parseInt(countResult.rows[0].count);
      
      // Update params for main query with pagination
      if (searchTerm) {
        queryParams.push(pageSize, offset);
      } else {
        queryParams = [pageSize, offset];
      }
      
      // Main query with pagination - build dynamically based on available columns
      let selectColumns = '';
      
      // We already have columnNames from above, log them for debugging
      console.log('[GET_LISTINGS] Available columns in listings table:', columnNames);
      
      // Include only columns that exist in the database
      // First, check for essential columns that should always be included
      const essentialColumns = ['id', 'google_place_id'];
      const availableColumns = [
        'place_id', 'name', 'formatted_address', 'vicinity',
        'latitude', 'longitude', 'phone_number', 'website',
        'rating', 'user_ratings_total', 'main_type', 'types',
        'created_at', 'updated_at', 'description', 'faqs',
        'is_approved', 'is_featured', 'featured'
      ];
      
      // Add essential columns first
      const columnsToSelect: string[] = [];
      essentialColumns.forEach(col => {
        if (columnNames.includes(col)) columnsToSelect.push(col);
      });
      
      // Add other available columns
      availableColumns.forEach(col => {
        if (columnNames.includes(col)) columnsToSelect.push(col);
      });
      
      // If no columns were found (unlikely), use * as fallback
      selectColumns = columnsToSelect.length > 0 ? columnsToSelect.join(', ') : '*';
      
      // Find a column to use for ORDER BY (prefer 'name', fallback to 'id' or first column)
      let orderByColumn = 'id';
      if (columnNames.includes('name')) {
        orderByColumn = 'name';
      } else if (columnNames.includes('google_place_id')) {
        orderByColumn = 'google_place_id';
      } else if (columnsToSelect.length > 0) {
        orderByColumn = columnsToSelect[0];
      }
      
      const mainQuery = `
        SELECT ${selectColumns}
        FROM listings
        ${searchCondition}
        ORDER BY ${orderByColumn} ASC
        LIMIT $${searchTerm ? 2 : 1} OFFSET $${searchTerm ? 3 : 2}
      `;
      
      const result = await client.query(mainQuery, queryParams);
      
      // Calculate pagination info
      const totalPages = Math.ceil(totalItems / pageSize);
      
      const response = {
        data: result.rows,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
      
      res.status(200).json(response);
      const duration = Date.now() - startTime;
      console.log(`[GET_LISTINGS] Retrieved ${result.rows.length} listings in ${duration}ms.`);
    } catch (error) {
      console.error('[GET_LISTINGS] Error fetching listings:', error);
      res.status(500).json({ message: 'Failed to fetch listings', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      if (client) {
        client.release();
      }
    }
  } else {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ message: `Method ${requestMethod} Not Allowed` });
  }
}
