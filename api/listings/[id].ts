import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

// Database connection setup
const DATABASE_URL = process.env.DATABASE_URL;
console.log('[LISTING_BY_ID] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[LISTING_BY_ID] CRITICAL: DATABASE_URL environment variable is not defined.');
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

  console.log(`[LISTING_BY_ID] Function start. Method: ${requestMethod}, Origin: ${requestOrigin}, ID: ${req.query.id}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[LISTING_BY_ID] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.status(204).end();
    } else {
      console.warn(`[LISTING_BY_ID] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
    console.warn(`[LISTING_BY_ID] ${requestMethod}: Origin ${requestOrigin} is NOT ALLOWED. Denying request.`);
    const duration = Date.now() - startTime;
    console.log(`[LISTING_BY_ID] ${requestMethod} request denied (CORS) in ${duration}ms.`);
    res.status(403).json({ message: 'CORS: Origin not allowed' });
    return;
  }

  // Check database configuration
  if (!DATABASE_URL || !pool) {
    console.error('[LISTING_BY_ID] Error: Database not configured. DATABASE_URL or pool missing.');
    const duration = Date.now() - startTime;
    console.log(`[LISTING_BY_ID] ${requestMethod} request failed (DB config error) in ${duration}ms.`);
    return res.status(500).json({ message: 'Server configuration error regarding database.' });
  }

  // Check if id is provided
  const id = req.query.id as string;
  if (!id) {
    return res.status(400).json({ message: 'Listing ID is required' });
  }

  // GET listing by ID
  if (requestMethod === 'GET') {
    let client;
    try {
      client = await pool.connect();
      console.log(`[LISTING_BY_ID] Database client connected. Getting listing ID: ${id}`);
      
      // Get the listing details
      const listingQuery = `
        SELECT 
          l.id, 
          l.google_place_id,
          l.name, 
          l.formatted_address, 
          l.latitude, 
          l.longitude, 
          l.phone_number, 
          l.website,
          l.rating, 
          l.user_ratings_total,
          l.main_type,
          l.types,
          l.created_at,
          l.updated_at
        FROM listings l
        WHERE l.id = $1
      `;
      
      const listingResult = await client.query(listingQuery, [id]);
      
      if (listingResult.rows.length === 0) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      const listing = listingResult.rows[0];
      
      // Get reviews for this listing
      const reviewsQuery = `
        SELECT 
          id, 
          author_name, 
          rating, 
          relative_time_description, 
          text, 
          time, 
          profile_photo_url, 
          author_url
        FROM listing_reviews
        WHERE listing_google_place_id = $1
      `;
      
      const reviewsResult = await client.query(reviewsQuery, [listing.google_place_id]);
      listing.reviews = reviewsResult.rows;
      
      // Get photos for this listing
      const photosQuery = `
        SELECT 
          id, 
          photo_reference, 
          height, 
          width, 
          html_attributions,
          photo_url
        FROM listing_photos
        WHERE listing_google_place_id = $1
      `;
      
      const photosResult = await client.query(photosQuery, [listing.google_place_id]);
      listing.photos = photosResult.rows;
      
      // Get opening hours for this listing
      const hoursQuery = `
        SELECT 
          id, 
          open_day, 
          open_time, 
          close_day, 
          close_time
        FROM listing_opening_hours
        WHERE listing_google_place_id = $1
      `;
      
      const hoursResult = await client.query(hoursQuery, [listing.google_place_id]);
      listing.opening_hours = { periods: hoursResult.rows };
      
      res.status(200).json(listing);
      
      const duration = Date.now() - startTime;
      console.log(`[LISTING_BY_ID] GET listing completed in ${duration}ms.`);
    } catch (error) {
      console.error('[LISTING_BY_ID] Error fetching listing:', error);
      res.status(500).json({ message: 'Failed to fetch listing', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      if (client) {
        client.release();
      }
    }
  } 
  // PUT/UPDATE listing by ID
  else if (requestMethod === 'PUT') {
    let client;
    try {
      client = await pool.connect();
      await client.query('BEGIN');
      console.log(`[LISTING_BY_ID] Database client connected. Updating listing ID: ${id}`);
      
      const updatedListing = req.body;
      
      // Basic validation
      if (!updatedListing || !updatedListing.name || !updatedListing.formatted_address) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid listing data. Name and address are required.' });
      }
      
      // Update the main listing record
      const updateQuery = `
        UPDATE listings
        SET 
          name = $1,
          formatted_address = $2,
          phone_number = $3,
          website = $4,
          updated_at = NOW()
        WHERE id = $5
        RETURNING *
      `;
      
      const values = [
        updatedListing.name,
        updatedListing.formatted_address,
        updatedListing.phone_number || null,
        updatedListing.website || null,
        id
      ];
      
      const updateResult = await client.query(updateQuery, values);
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      res.status(200).json(updateResult.rows[0]);
      
      const duration = Date.now() - startTime;
      console.log(`[LISTING_BY_ID] PUT/UPDATE listing completed in ${duration}ms.`);
    } catch (error) {
      if (client) {
        await client.query('ROLLBACK');
      }
      console.error('[LISTING_BY_ID] Error updating listing:', error);
      res.status(500).json({ message: 'Failed to update listing', details: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      if (client) {
        client.release();
      }
    }
  } else {
    res.setHeader('Allow', 'GET, PUT, OPTIONS');
    res.status(405).json({ message: `Method ${requestMethod} Not Allowed` });
  }
}
