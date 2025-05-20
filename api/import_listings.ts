import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { Listing } from '../src/types/listing'; // Review type is used by Listing

console.log('[IMPORT_LISTINGS] Top-level: Script loaded.');

const DATABASE_URL = process.env.DATABASE_URL;
console.log('[IMPORT_LISTINGS] Top-level: DATABASE_URL available:', !!DATABASE_URL);

if (!DATABASE_URL) {
  console.error('[IMPORT_LISTINGS] CRITICAL: DATABASE_URL environment variable is not defined.');
}

// For Vercel deployments, Neon an other providers often require SSL
const pool = DATABASE_URL ? new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } }) : null;

if (pool) {
  pool.on('error', (err: Error) => {
    console.error('[IMPORT_LISTINGS] Unexpected error on idle client', err);
  });
  console.log('[IMPORT_LISTINGS] Top-level: Database pool configured.');
} else {
  console.warn('[IMPORT_LISTINGS] Top-level: Database pool not configured due to missing DATABASE_URL.');
}

const allowedOrigins = [
  'http://localhost:5176', // For local development Vite server
  'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app', // Your Vercel frontend URL
  // Add any other Vercel preview deployment URLs if needed, or use a regex / dynamic check
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  const requestMethod = req.method;
  const requestOrigin = req.headers.origin; // This can be undefined

  console.log(`[IMPORT_LISTINGS] Function start. Method: ${requestMethod}, Origin: ${requestOrigin}`);

  // Handle PREFLIGHT (OPTIONS) request first
  if (requestMethod === 'OPTIONS') {
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      console.log(`[IMPORT_LISTINGS] OPTIONS: Origin ${requestOrigin} is ALLOWED.`);
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With'); // Ensure this matches actual request headers
      res.setHeader('Access-Control-Allow-Credentials', 'true'); // If your frontend sends credentials (e.g., cookies, Authorization header for authenticated requests)
      res.setHeader('Access-Control-Max-Age', '86400'); // Optional: caches preflight response for 1 day
      res.status(204).end();
    } else {
      console.warn(`[IMPORT_LISTINGS] OPTIONS: Origin ${requestOrigin || 'Unknown'} is NOT ALLOWED or not provided.`);
      // Respond to OPTIONS, but without Access-Control-Allow-Origin, the browser will block the actual request.
      // Still good to indicate allowed methods/headers generally for diagnostic purposes.
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      // DO NOT set Access-Control-Allow-Origin here if origin is not in allowedOrigins or not present.
      res.status(204).end(); // Or you could send a 403 Forbidden, but 204 is common.
    }
    return; // IMPORTANT: End execution here for OPTIONS requests
  }

  // For actual requests (e.g., POST), set CORS headers if origin is allowed
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true'); // Match if set for OPTIONS
    // Any other headers for the actual response can be set here or within the POST logic below.
  } else if (requestOrigin) {
    // Origin was provided, but it's not in the allowed list for non-OPTIONS requests.
    console.warn(`[IMPORT_LISTINGS] ${requestMethod}: Origin ${requestOrigin} is NOT ALLOWED. Denying request.`);
    const duration = Date.now() - startTime;
    console.log(`[IMPORT_LISTINGS] ${requestMethod} request denied (CORS) in ${duration}ms.`);
    res.status(403).json({ message: 'CORS: Origin not allowed' });
    return;
  } else {
    // No origin header present. This might be a server-to-server request or a misconfigured client.
    // Depending on your security policy, you might allow or deny this.
    // For browser-initiated requests, 'origin' is typically present.
    console.log(`[IMPORT_LISTINGS] ${requestMethod}: No origin header. If this is a browser request, it might be blocked by the browser or indicate an issue.`);
    // If you require origin for all API calls:
    // const duration = Date.now() - startTime;
    // console.log(`[IMPORT_LISTINGS] ${requestMethod} request denied (missing origin) in ${duration}ms.`);
    // res.status(403).json({ message: 'CORS: Origin header required' });
    // return;
  }

  // Proceed with POST request handling
  if (requestMethod === 'POST') {
    console.log('[IMPORT_LISTINGS] POST request received. Validating configuration and data...');

    if (!DATABASE_URL || !pool) {
      console.error('[IMPORT_LISTINGS] Error: Database not configured. DATABASE_URL or pool missing.');
      const duration = Date.now() - startTime;
      console.log(`[IMPORT_LISTINGS] POST request failed (DB config error) in ${duration}ms.`);
      return res.status(500).json({ message: 'Server configuration error regarding database.' });
    }

    const listingsData = req.body as Listing[];
    if (!Array.isArray(listingsData) || listingsData.length === 0) {
      console.log('[IMPORT_LISTINGS] Error: No listings data provided or data is not an array.');
      const duration = Date.now() - startTime;
      console.log(`[IMPORT_LISTINGS] POST request failed (invalid data) in ${duration}ms.`);
      return res.status(400).json({ message: 'No listings data or invalid format.' });
    }
    console.log(`[IMPORT_LISTINGS] Received ${listingsData.length} listings for import.`);

    let client;
    try {
      client = await pool.connect();
      console.log('[IMPORT_LISTINGS] Database client connected.');
      await client.query('BEGIN');
      console.log('[IMPORT_LISTINGS] Transaction started.');

      let insertedCount = 0;
      let updatedCount = 0;
      const errors: { google_place_id?: string, error: string }[] = [];

      for (const listing of listingsData) {
        const { 
          google_place_id, 
          name, 
          formatted_address, 
          geometry, 
          formatted_phone_number, 
          website, 
          photos, 
          reviews, 
          opening_hours, 
          rating, 
          user_ratings_total, 
          types, 
          editorial_summary, 
          place_id 
        } = listing;

        const latitude = geometry?.location?.lat;
        const longitude = geometry?.location?.lng;
        const main_type = types && types.length > 0 ? types[0] : undefined; 

        const upsertListingQuery = `
          INSERT INTO listings (
            google_place_id, name, formatted_address, latitude, longitude, phone_number, website, 
            rating, user_ratings_total, main_type, types, editorial_summary, place_id, 
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          ON CONFLICT (google_place_id) DO UPDATE SET
            name = EXCLUDED.name,
            formatted_address = EXCLUDED.formatted_address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            phone_number = EXCLUDED.phone_number,
            website = EXCLUDED.website,
            rating = EXCLUDED.rating,
            user_ratings_total = EXCLUDED.user_ratings_total,
            main_type = EXCLUDED.main_type,
            types = EXCLUDED.types,
            editorial_summary = EXCLUDED.editorial_summary,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted;`; 

        const listingValues = [
            google_place_id, 
            name, 
            formatted_address, 
            latitude, 
            longitude, 
            formatted_phone_number, 
            website, 
            rating, 
            user_ratings_total, 
            main_type, 
            types, 
            editorial_summary?.overview, 
            place_id
        ];
        
        try {
            const result = await client.query(upsertListingQuery, listingValues);
            if (result.rows.length > 0) {
                if (result.rows[0].inserted) {
                    insertedCount++;
                } else {
                    updatedCount++;
                }
            }

            // Handle reviews (delete old, insert new)
            if (reviews && Array.isArray(reviews) && reviews.length > 0) {
                await client.query('DELETE FROM listing_reviews WHERE listing_google_place_id = $1', [google_place_id]);
                for (const review of reviews) {
                    const reviewQuery = `
                        INSERT INTO listing_reviews (
                            listing_google_place_id, author_name, rating, relative_time_description, 
                            text, time, profile_photo_url, author_url
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
                    await client.query(reviewQuery, [
                        google_place_id,
                        review.author_name,
                        review.rating,
                        review.relative_time_description,
                        review.text,
                        review.time,
                        review.profile_photo_url,
                        review.author_url
                    ]);
                }
            }

            // Handle photos (delete old, insert new)
            if (photos && Array.isArray(photos) && photos.length > 0) {
              await client.query('DELETE FROM listing_photos WHERE listing_google_place_id = $1', [google_place_id]);
              for (const photo of photos) {
                const photoQuery = `
                  INSERT INTO listing_photos (listing_google_place_id, photo_reference, height, width, html_attributions)
                  VALUES ($1, $2, $3, $4, $5);`;
                await client.query(photoQuery, [
                  google_place_id, photo.photo_reference, photo.height, photo.width, JSON.stringify(photo.html_attributions)
                ]);
              }
            }

            // Handle opening hours (delete old, insert new)
            if (opening_hours && opening_hours.periods && Array.isArray(opening_hours.periods)) {
              await client.query('DELETE FROM listing_opening_hours WHERE listing_google_place_id = $1', [google_place_id]);
              for (const period of opening_hours.periods) {
                // Ensure open and close objects exist and have day and time properties
                const openDay = period.open?.day;
                const openTime = period.open?.time;
                const closeDay = period.close?.day;
                const closeTime = period.close?.time;

                const openingHoursQuery = `
                  INSERT INTO listing_opening_hours (listing_google_place_id, open_day, open_time, close_day, close_time)
                  VALUES ($1, $2, $3, $4, $5);`;
                await client.query(openingHoursQuery, [
                  google_place_id, openDay, openTime, closeDay, closeTime
                ]);
              }
            }

        } catch (loopError: any) {
            console.error(`[IMPORT_LISTINGS] Error processing listing ${google_place_id}:`, loopError.message);
            errors.push({ google_place_id: google_place_id, error: loopError.message });
        }
      }

      await client.query('COMMIT');
      console.log('[IMPORT_LISTINGS] Transaction committed.');
      const durationSuccess = Date.now() - startTime;
      const responsePayload = {
        message: 'Listings import process completed.',
        processed: listingsData.length,
        inserted: insertedCount,
        updated: updatedCount,
        failed: errors.length,
        errors: errors
      };
      console.log('[IMPORT_LISTINGS] Payload Preview (Success):', responsePayload);
      console.log(`[IMPORT_LISTINGS] Function end (Success). Duration: ${durationSuccess}ms.`);
      return res.status(200).json(responsePayload);

    } catch (error: any) {
      if (client) {
        try {
          await client.query('ROLLBACK');
          console.log('[IMPORT_LISTINGS] Transaction rolled back due to error.');
        } catch (rollbackError: any) {
          console.error('[IMPORT_LISTINGS] Error during ROLLBACK:', rollbackError.message);
        }
      }
      console.error('[IMPORT_LISTINGS] Critical error during import transaction:', error.message, error.stack);
      const durationError = Date.now() - startTime;
      const errorPayload = { message: 'Failed to import listings due to a server error.', error: error.message };
      console.log('[IMPORT_LISTINGS] Payload Preview (Error):', errorPayload);
      console.log(`[IMPORT_LISTINGS] Function end (Critical Error). Duration: ${durationError}ms.`);
      return res.status(500).json(errorPayload);
    } finally {
      if (client) {
        client.release();
        console.log('[IMPORT_LISTINGS] Database client released.');
      }
    }
  }

  // Fallback for any other unhandled methods
  console.log(`[IMPORT_LISTINGS] Method ${requestMethod} not allowed. Sending 405.`);
  res.setHeader('Allow', 'POST, OPTIONS'); // Explicitly state allowed methods
  const durationFallback = Date.now() - startTime;
  console.log(`[IMPORT_LISTINGS] Fallback: Method ${requestMethod} rejected in ${durationFallback}ms.`);
  return res.status(405).json({ message: `Method ${requestMethod} Not Allowed on this endpoint.` });
}
