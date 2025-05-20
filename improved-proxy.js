import express from 'express';
import cors from 'cors';
import axios from 'axios';
import pg from 'pg';
import dotenv from 'dotenv';
import NodeCache from 'node-cache';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 8080;

// Initialize cache with 5 minutes TTL (time to live)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

// JWT Secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env-file';

// Middleware to parse JSON bodies
app.use(express.json());

// Vercel deployment URL 
const VERCEL_URL = 'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4ZBsLOSgv5ja@ep-lingering-morning-a4y8dqrh-pooler.us-east-1.aws.neon.tech/directory?sslmode=require';

// Create a PostgreSQL connection pool
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('[Database] Connection error:', err);
  } else {
    console.log('[Database] Connected successfully. Current time:', result.rows[0].now);
  }
});

// Enable CORS for all origins
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Health check endpoint
app.get('/api/proxy/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    server: 'proxy',
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'disconnected'
  });
});

// Simplified health check endpoint (for the health check utility)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Add specific CORS headers for pre-flight requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Log all requests and add error handling
app.use((req, res, next) => {
  console.log(`[Proxy] ${req.method} ${req.path}`);
  console.log(`[Proxy] Request headers:`, req.headers);
  console.log(`[Proxy] Request origin:`, req.headers.origin);
  
  // Add response logging
  const originalSend = res.send;
  res.send = function(body) {
    console.log(`[Proxy] Response status: ${res.statusCode}`);
    return originalSend.call(this, body);
  };
  
  next();
});

// Forward POST requests to /api/import_listings
app.post('/api/proxy/api/import_listings', async (req, res) => {
  console.log('[Proxy] Handling POST request to /api/import_listings');
  console.log(`[Proxy] Request body size: ${JSON.stringify(req.body).length} characters`);
  
  try {
    // Forward the request to the actual database
    try {
      // Create a client from the pool
      const client = await pool.connect();
      
      try {
        // Begin transaction
        await client.query('BEGIN');
        
        const results = {
          success: true,
          processed: req.body.length || 0,
          inserted: 0,
          updated: 0,
          failed: 0,
          errors: []
        };
        
        // Process each listing
        for (const listing of req.body) {
          try {
            // Upsert the listing
            const upsertQuery = `
              INSERT INTO listings (
                google_place_id, title, full_address, latitude, longitude, 
                phone, website, average_rating, review_count, primary_category, 
                google_categories_json, created_at, updated_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
              ON CONFLICT (google_place_id) DO UPDATE SET
                title = EXCLUDED.title,
                full_address = EXCLUDED.full_address,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                phone = EXCLUDED.phone,
                website = EXCLUDED.website,
                average_rating = EXCLUDED.average_rating,
                review_count = EXCLUDED.review_count,
                primary_category = EXCLUDED.primary_category,
                google_categories_json = EXCLUDED.google_categories_json,
                updated_at = NOW()
              RETURNING id
            `;
            
            const upsertValues = [
              listing.google_place_id,
              listing.name,
              listing.formatted_address,
              listing.latitude,
              listing.longitude,
              listing.phone_number,
              listing.website,
              listing.rating,
              listing.user_ratings_total,
              listing.main_type,
              JSON.stringify(listing.types || [])
            ];
            
            const upsertResult = await client.query(upsertQuery, upsertValues);
            const listingId = upsertResult.rows[0].id;
            
            // If listing has reviews, insert them
            if (listing.reviews && listing.reviews.length > 0) {
              // First delete existing reviews for this listing
              await client.query('DELETE FROM listing_reviews WHERE listing_id = $1', [listingId]);
              
              // Then insert new reviews
              for (const review of listing.reviews) {
                const reviewQuery = `
                  INSERT INTO listing_reviews (
                    listing_id, reviewer_name, stars, published_at_date, text, reviewer_url
                  ) VALUES ($1, $2, $3, $4, $5, $6)
                `;
                
                const reviewValues = [
                  listingId,
                  review.author_name,
                  review.rating,
                  new Date(review.time),
                  review.text,
                  review.profile_photo_url
                ];
                
                await client.query(reviewQuery, reviewValues);
              }
            }
            
            results.inserted++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              listing: listing.name,
              error: error.message
            });
            console.error(`[Database] Error importing listing ${listing.name}:`, error);
          }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        // Cache the listings for future requests
        cache.set('all_listings', results);
        
        // Return the listings
        res.json(results);
      } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw error;
      } finally {
        // Release client back to pool
        client.release();
      }
    } catch (error) {
      console.error('[Database] Error processing import:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process import',
        message: error.message
      });
    }
    
    /* Uncomment this to actually forward to Vercel
    const response = await axios({
      method: 'post',
      url: `${VERCEL_URL}/api/import_listings`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000 // 30 second timeout
    });
    
    res.status(response.status).json(response.data);
    */
  } catch (error) {
    console.error('[Proxy] Error handling import_listings:', error.message);
    if (error.response) {
      console.error(`[Proxy] Response status: ${error.response.status}`);
      console.error('[Proxy] Response data:', error.response.data);
    }
    res.status(500).json({
      error: 'Failed to process import request',
      message: error.message
    });
  }
});

// Real data for GET /api/listings from PostgreSQL database
app.get('/api/proxy/api/listings', async (req, res) => {
  console.log('[Proxy] Handling GET request to /api/listings');
  
  // Check if we have cached data
  const cacheKey = 'all_listings';
  const cachedData = cache.get(cacheKey);
  
  if (cachedData) {
    console.log('[Proxy] Returning cached listings data');
    return res.json(cachedData);
  }
  
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const searchTerm = req.query.search || '';
    const offset = (page - 1) * pageSize;
    
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      let queryParams = [];
      let searchCondition = '';
      
      // Add search condition if search term is provided
      if (searchTerm) {
        searchCondition = `WHERE title ILIKE $1 OR full_address ILIKE $1`;
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
      
      // Main query with pagination
      const mainQuery = `
        SELECT 
          id, 
          google_place_id,
          title as name, 
          full_address as formatted_address, 
          latitude, 
          longitude, 
          phone as phone_number, 
          website,
          average_rating as rating, 
          review_count as user_ratings_total,
          primary_category as main_type,
          google_categories_json as types,
          created_at,
          updated_at
        FROM listings
        ${searchCondition}
        ORDER BY title ASC
        LIMIT $${searchTerm ? 2 : 1} OFFSET $${searchTerm ? 3 : 2}
      `;
      
      console.log('[Database] Executing query:', mainQuery);
      console.log('[Database] Query params:', queryParams);
      
      const result = await client.query(mainQuery, queryParams);
      const totalPages = Math.ceil(totalItems / pageSize);
      
      console.log(`[Database] Found ${result.rows.length} listings out of ${totalItems} total`);
      
      // Respond with data and pagination info
      res.status(200).json({
        data: result.rows,
        pagination: {
          page,
          pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      });
    } catch (dbError) {
      console.error('[Database] Error executing query:', dbError);
      throw dbError;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('[Proxy] Error fetching listings from database:', error);
    res.status(500).json({
      error: 'Failed to fetch listings from database',
      message: error.message
    });
  }
});

// Real data for GET /api/listings/:id from PostgreSQL database
// Get listings by business type
app.get('/api/proxy/api/listings/by-type/:type', async (req, res) => {
  try {
    console.log(`[Proxy] Handling GET request to /api/listings/by-type/${req.params.type}`);
    
    const businessType = req.params.type.replace(/-/g, '_');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Check if we have this in cache
    const cacheKey = `listings_by_type_${businessType}_${page}_${limit}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[Proxy] Returning cached data for business type: ${businessType}`);
      return res.json(cachedData);
    }
    
    // Get listings from database
    const client = await pool.connect();
    
    try {
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) 
        FROM listings 
        WHERE (main_type = $1 OR $1 = ANY(google_categories_json))
      `;
      const countResult = await client.query(countQuery, [businessType]);
      const totalCount = parseInt(countResult.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      // Get listings with pagination
      const listingsQuery = `
        SELECT * 
        FROM listings 
        WHERE (main_type = $1 OR $1 = ANY(google_categories_json))
        ORDER BY title 
        LIMIT $2 OFFSET $3
      `;
      const listingsResult = await client.query(listingsQuery, [businessType, limit, offset]);
      
      const response = {
        business_type: businessType,
        listings: listingsResult.rows,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      };
      
      // Cache the results
      cache.set(cacheKey, response);
      
      res.json(response);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`[Proxy] Error fetching listings by business type: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch listings by business type' });
  }
});

app.get('/api/proxy/api/listings/:id', async (req, res) => {
  try {
    console.log(`[Proxy] Handling GET request to /api/listings/${req.params.id}`);
    
    const id = parseInt(req.params.id);
    
    // Check if we have cached data for this listing
    const cacheKey = `listing_${id}`;
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`[Proxy] Returning cached data for listing ${id}`);
      return res.json(cachedData);
    }
    
    // Create a client from the pool
    const client = await pool.connect();
    
    try {
      // Query for the listing
      const listingQuery = `
        SELECT 
          id, 
          google_place_id,
          title as name, 
          full_address as formatted_address, 
          latitude, 
          longitude, 
          phone as phone_number, 
          website,
          average_rating as rating, 
          review_count as user_ratings_total,
          primary_category as main_type,
          google_categories_json as types,
          created_at,
          updated_at,
          description,
          main_image_url,
          google_opening_hours_json,
          google_image_urls_json
        FROM listings
        WHERE id = $1
      `;
      
      const listingResult = await client.query(listingQuery, [id]);
      
      if (listingResult.rows.length === 0) {
        res.status(404).json({ message: 'Listing not found' });
        return;
      }
      
      const listing = listingResult.rows[0];
      
      // Get reviews for this listing
      const reviewsQuery = `
        SELECT 
          id, 
          reviewer_name as author_name, 
          stars as rating, 
          published_at_date as relative_time_description, 
          text, 
          CASE 
            WHEN published_at_date IS NOT NULL THEN 
              EXTRACT(EPOCH FROM published_at_date::timestamp) * 1000 
            ELSE 
              extract(epoch from now()) * 1000
          END as time, 
          reviewer_url as profile_photo_url, 
          reviewer_url as author_url
        FROM listing_reviews
        WHERE listing_id = $1
      `;
      
      const reviewsResult = await client.query(reviewsQuery, [listing.id]);
      const reviews = reviewsResult.rows;
      
      // Combine listing and reviews
      const result = {
        ...listing,
        reviews: reviews
      };

      // Cache the result for future requests
      cache.set(`listing_${id}`, result);

      res.json(result);
    } catch (dbError) {
      console.error('[Database] Error executing query:', dbError);
      throw dbError;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error(`[Proxy] Error fetching listing for ID ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Failed to fetch listing from database',
      message: error.message
    });
  }
});

// This function has been removed to ensure we only use real data from the database

// PUT endpoint to update a listing
app.put('/api/proxy/api/listings/:id', async (req, res) => {
  console.log(`[Proxy] Handling PUT request to /api/listings/${req.params.id}`);
  
  try {
    const { id } = req.params;
    
    // Invalidate cache for this listing and all listings
    cache.del(`listing_${id}`);
    cache.del('all_listings');
    const updateData = req.body;
    
    // Validate required fields
    if (!updateData.name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Construct the update query dynamically based on provided fields
    const updateFields = [];
    const queryParams = [];
    let paramIndex = 1;
    
    // Only update fields that are provided in the request
    if (updateData.name !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      queryParams.push(updateData.name);
      paramIndex++;
    }
    
    if (updateData.formatted_address !== undefined) {
      updateFields.push(`full_address = $${paramIndex}`);
      queryParams.push(updateData.formatted_address);
      paramIndex++;
    }
    
    if (updateData.phone_number !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      queryParams.push(updateData.phone_number);
      paramIndex++;
    }
    
    if (updateData.website !== undefined) {
      updateFields.push(`website = $${paramIndex}`);
      queryParams.push(updateData.website);
      paramIndex++;
    }
    
    if (updateData.rating !== undefined) {
      updateFields.push(`average_rating = $${paramIndex}`);
      queryParams.push(parseFloat(updateData.rating));
      paramIndex++;
    }
    
    if (updateData.user_ratings_total !== undefined) {
      updateFields.push(`review_count = $${paramIndex}`);
      queryParams.push(parseInt(updateData.user_ratings_total));
      paramIndex++;
    }
    
    if (updateData.main_type !== undefined) {
      updateFields.push(`primary_category = $${paramIndex}`);
      queryParams.push(updateData.main_type);
      paramIndex++;
    }
    
    if (updateData.latitude !== undefined) {
      updateFields.push(`latitude = $${paramIndex}`);
      queryParams.push(parseFloat(updateData.latitude));
      paramIndex++;
    }
    
    if (updateData.longitude !== undefined) {
      updateFields.push(`longitude = $${paramIndex}`);
      queryParams.push(parseFloat(updateData.longitude));
      paramIndex++;
    }
    
    // Add updated_at timestamp
    updateFields.push(`updated_at = $${paramIndex}`);
    queryParams.push(new Date());
    paramIndex++;
    
    // Add the ID as the last parameter
    queryParams.push(id);
    
    // Construct and execute the update query
    const updateQuery = `
      UPDATE listings
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, title as name, full_address as formatted_address, phone as phone_number, website, average_rating as rating, review_count as user_ratings_total, primary_category as main_type
    `;
    
    console.log('[Database] Executing update query:', updateQuery);
    console.log('[Database] Query params:', queryParams);
    
    const result = await pool.query(updateQuery, queryParams);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Database] Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing', message: error.message });
  }
});

// DELETE endpoint to delete a listing
app.delete('/api/proxy/api/listings/:id', async (req, res) => {
  console.log(`[Proxy] Handling DELETE request to /api/listings/${req.params.id}`);
  
  try {
    const { id } = req.params;
    
    // Invalidate cache for this listing and all listings
    cache.del(`listing_${id}`);
    cache.del('all_listings');
    
    // First delete associated reviews
    await pool.query('DELETE FROM listing_reviews WHERE listing_id = $1', [id]);
    
    // Then delete the listing
    const result = await pool.query('DELETE FROM listings WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json({ success: true, message: 'Listing deleted successfully', id: result.rows[0].id });
  } catch (error) {
    console.error('[Database] Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing', message: error.message });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

// Catch-all for unhandled routes
app.use((req, res) => {
  console.log(`[Proxy] Unhandled route: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('[Proxy] Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start the server
// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    
    req.user = user;
    next();
  });
};

// User registration endpoint
app.post('/api/proxy/auth/register', async (req, res) => {
  console.log('[Proxy] Handling POST request to /auth/register');
  
  try {
    const { name, email, password } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Insert new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role, created_at',
      [name, email, passwordHash]
    );
    
    // Generate JWT token
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('[Proxy] Error registering user:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// User login endpoint
app.post('/api/proxy/auth/login', async (req, res) => {
  console.log('[Proxy] Handling POST request to /auth/login');
  
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      },
      token
    });
    
  } catch (error) {
    console.error('[Proxy] Error during login:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user profile
app.get('/api/proxy/auth/me', authenticateToken, async (req, res) => {
  console.log('[Proxy] Handling GET request to /auth/me');
  
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('[Proxy] Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
});

// Get all users (admin only)
app.get('/api/proxy/admin/users', authenticateAdmin, async (req, res) => {
  console.log('[Proxy] Handling GET request to /admin/users');
  
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('[Proxy] Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Delete user (admin only)
app.delete('/api/proxy/admin/users/:id', authenticateAdmin, async (req, res) => {
  console.log(`[Proxy] Handling DELETE request to /admin/users/${req.params.id}`);
  
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    
    res.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('[Proxy] Error deleting user:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// Create listing (authenticated users)
app.post('/api/proxy/api/listings', authenticateToken, async (req, res) => {
  console.log('[Proxy] Handling POST request to /api/listings');
  
  try {
    const userId = req.user.id;
    const listingData = req.body;
    
    // Validate required fields
    if (!listingData.name || !listingData.formatted_address) {
      return res.status(400).json({ error: 'Name and address are required' });
    }
    
    // Insert new listing with user_id and is_approved=false
    const result = await pool.query(
      `INSERT INTO listings (
        title, full_address, latitude, longitude, phone, website, description,
        primary_category, main_image_url, seo_title, seo_description, seo_keywords,
        user_id, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        listingData.name,
        listingData.formatted_address,
        listingData.latitude,
        listingData.longitude,
        listingData.phone_number,
        listingData.website,
        listingData.description,
        listingData.main_type,
        listingData.main_image_url,
        listingData.seo_title,
        listingData.seo_description,
        listingData.seo_keywords,
        userId,
        false // not approved by default
      ]
    );
    
    // Clear cache for listings
    cache.del('all_listings');
    
    res.status(201).json({
      message: 'Listing created successfully and awaiting approval',
      listing: result.rows[0]
    });
    
  } catch (error) {
    console.error('[Proxy] Error creating listing:', error);
    res.status(500).json({ error: 'Server error creating listing' });
  }
});

// Get listings submitted by current user
app.get('/api/proxy/api/my-listings', authenticateToken, async (req, res) => {
  console.log('[Proxy] Handling GET request to /api/my-listings');
  
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        id, title as name, full_address as formatted_address, latitude, longitude,
        phone as phone_number, website, description, primary_category as main_type,
        main_image_url, average_rating as rating, review_count as user_ratings_total,
        seo_title, seo_description, seo_keywords, is_approved, created_at, updated_at
      FROM listings 
      WHERE user_id = $1 
      ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('[Proxy] Error fetching user listings:', error);
    res.status(500).json({ error: 'Server error fetching listings' });
  }
});

// Approve listing (admin only)
app.put('/api/proxy/admin/listings/:id/approve', authenticateAdmin, async (req, res) => {
  console.log(`[Proxy] Handling PUT request to /admin/listings/${req.params.id}/approve`);
  
  try {
    const listingId = req.params.id;
    
    // Check if listing exists
    const listingCheck = await pool.query('SELECT * FROM listings WHERE id = $1', [listingId]);
    
    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Update listing approval status
    await pool.query('UPDATE listings SET is_approved = true WHERE id = $1', [listingId]);
    
    // Clear cache
    cache.del(`listing_${listingId}`);
    cache.del('all_listings');
    
    res.json({ message: 'Listing approved successfully' });
    
  } catch (error) {
    console.error('[Proxy] Error approving listing:', error);
    res.status(500).json({ error: 'Server error approving listing' });
  }
});

// Generate AI description for a listing
app.post('/api/proxy/api/listings/:id/generate-description', async (req, res) => {
  try {
    console.log(`[Proxy] Handling POST request to /api/listings/${req.params.id}/generate-description`);
    
    const listingId = parseInt(req.params.id);
    if (isNaN(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    // Get the listing details
    const listing = await pool.query(
      'SELECT * FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listingData = listing.rows[0];
    
    // Generate a description based on the listing data
    const businessType = listingData.main_type || 'business';
    const businessName = listingData.name;
    const location = listingData.formatted_address || listingData.vicinity || '';
    
    // Generate a description using the listing data
    const description = `${businessName} is a premier ${businessType.toLowerCase()} located in ${location}. ` +
      `With excellent service and a strong reputation, ${businessName} provides top-quality solutions for all your ${businessType.toLowerCase()} needs. ` +
      `Contact them today to learn more about their services and how they can help you.`;
    
    // Update the listing with the generated description
    await pool.query(
      'UPDATE listings SET description = $1, description_generated = true WHERE id = $2',
      [description, listingId]
    );
    
    // Clear cache
    cache.del(`listing_${listingId}`);
    cache.del('all_listings');
    
    res.json({ 
      success: true, 
      description: description,
      message: `Description generated for listing ${listingId}` 
    });
    
  } catch (error) {
    console.error('[Proxy] Error generating description:', error);
    res.status(500).json({ error: 'Server error generating description' });
  }
});

// Generate AI FAQs for a listing
app.post('/api/proxy/api/listings/:id/generate-faq', async (req, res) => {
  try {
    console.log(`[Proxy] Handling POST request to /api/listings/${req.params.id}/generate-faq`);
    
    const listingId = parseInt(req.params.id);
    if (isNaN(listingId)) {
      return res.status(400).json({ error: 'Invalid listing ID' });
    }
    
    // Get the listing details
    const listing = await pool.query(
      'SELECT * FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listingData = listing.rows[0];
    
    // Generate FAQs based on the listing data
    const businessType = listingData.main_type || 'business';
    const businessName = listingData.name;
    
    // Generate sample FAQs
    const faqs = [
      {
        question: `What services does ${businessName} offer?`,
        answer: `${businessName} offers a comprehensive range of ${businessType.toLowerCase()} services tailored to meet your specific needs.`
      },
      {
        question: `What are the operating hours for ${businessName}?`,
        answer: `Please contact ${businessName} directly for their current operating hours as they may vary by season or due to special events.`
      },
      {
        question: `Does ${businessName} offer consultations?`,
        answer: `Yes, ${businessName} offers personalized consultations to discuss your specific requirements and how they can best serve you.`
      },
      {
        question: `What makes ${businessName} different from other ${businessType.toLowerCase()} providers?`,
        answer: `${businessName} prides itself on exceptional customer service, attention to detail, and a commitment to excellence in all aspects of their ${businessType.toLowerCase()} services.`
      },
      {
        question: `How can I schedule an appointment with ${businessName}?`,
        answer: `You can schedule an appointment by calling their office directly or visiting their website for online booking options.`
      }
    ];
    
    // Update the listing with the generated FAQs
    await pool.query(
      'UPDATE listings SET faqs = $1, faqs_generated = true WHERE id = $2',
      [JSON.stringify(faqs), listingId]
    );
    
    // Clear cache
    cache.del(`listing_${listingId}`);
    cache.del('all_listings');
    
    res.json({ 
      success: true, 
      faqs: faqs,
      message: `FAQs generated for listing ${listingId}` 
    });
    
  } catch (error) {
    console.error('[Proxy] Error generating FAQs:', error);
    res.status(500).json({ error: 'Server error generating FAQs' });
  }
});

// Content Pages API Endpoints

// Create tables for content pages if they don't exist
pool.query(`
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
`).then(() => {
  console.log('[Database] content_pages table created or already exists');
}).catch(err => {
  console.error('[Database] Error creating content_pages table:', err);
});

// Get all content pages
app.get('/api/proxy/api/content_pages', async (req, res) => {
  try {
    console.log('[Proxy] Handling GET request to /api/content_pages');
    
    const result = await pool.query('SELECT * FROM content_pages ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('[Proxy] Error fetching content pages:', error);
    res.status(500).json({ error: 'Failed to fetch content pages' });
  }
});

// Get a single content page by ID
app.get('/api/proxy/api/content_pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling GET request to /api/content_pages/${id}`);
    
    const result = await pool.query('SELECT * FROM content_pages WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Content page not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`[Proxy] Error fetching content page ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch content page' });
  }
});

// Create a new content page
app.post('/api/proxy/api/content_pages', async (req, res) => {
  try {
    console.log('[Proxy] Handling POST request to /api/content_pages');
    console.log('[Proxy] Request body:', req.body);
    
    const { title, slug, content, featured_photo_url, meta_title, meta_description, status } = req.body;
    
    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }
    
    // Check if slug already exists
    const existingSlug = await pool.query('SELECT id FROM content_pages WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'A page with this slug already exists' });
    }
    
    const now = new Date();
    const result = await pool.query(
      `INSERT INTO content_pages 
       (title, slug, content, featured_photo_url, meta_title, meta_description, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [title, slug, content, featured_photo_url, meta_title, meta_description, status || 'draft', now, now]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Proxy] Error creating content page:', error);
    res.status(500).json({ error: 'Failed to create content page' });
  }
});

// Update a content page
app.put('/api/proxy/api/content_pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling PUT request to /api/content_pages/${id}`);
    console.log('[Proxy] Request body:', req.body);
    
    const { title, slug, content, featured_photo_url, meta_title, meta_description, status } = req.body;
    
    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }
    
    // Check if the page exists
    const existingPage = await pool.query('SELECT id FROM content_pages WHERE id = $1', [id]);
    if (existingPage.rows.length === 0) {
      return res.status(404).json({ error: 'Content page not found' });
    }
    
    // Check if the new slug conflicts with an existing one (excluding this page)
    const existingSlug = await pool.query('SELECT id FROM content_pages WHERE slug = $1 AND id != $2', [slug, id]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'A page with this slug already exists' });
    }
    
    const now = new Date();
    const result = await pool.query(
      `UPDATE content_pages 
       SET title = $1, slug = $2, content = $3, featured_photo_url = $4, 
           meta_title = $5, meta_description = $6, status = $7, updated_at = $8 
       WHERE id = $9 
       RETURNING *`,
      [title, slug, content, featured_photo_url, meta_title, meta_description, status || 'draft', now, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`[Proxy] Error updating content page ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update content page' });
  }
});

// Delete a content page
app.delete('/api/proxy/api/content_pages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling DELETE request to /api/content_pages/${id}`);
    
    // Check if the page exists
    const existingPage = await pool.query('SELECT id FROM content_pages WHERE id = $1', [id]);
    if (existingPage.rows.length === 0) {
      return res.status(404).json({ error: 'Content page not found' });
    }
    
    await pool.query('DELETE FROM content_pages WHERE id = $1', [id]);
    
    res.status(200).json({ message: 'Content page deleted successfully' });
  } catch (error) {
    console.error(`[Proxy] Error deleting content page ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete content page' });
  }
});

// Blog Posts API Endpoints

// Create tables for blog posts if they don't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    featured_photo_url TEXT,
    meta_title VARCHAR(255),
    meta_description TEXT,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).then(() => {
  console.log('[Database] blog_posts table created or already exists');
}).catch(err => {
  console.error('[Database] Error creating blog_posts table:', err);
});

// Get all blog posts
app.get('/api/proxy/api/blog_posts', async (req, res) => {
  try {
    console.log('[Proxy] Handling GET request to /api/blog_posts');
    
    const result = await pool.query('SELECT * FROM blog_posts ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('[Proxy] Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// Get a single blog post by ID
app.get('/api/proxy/api/blog_posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling GET request to /api/blog_posts/${id}`);
    
    const result = await pool.query('SELECT * FROM blog_posts WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`[Proxy] Error fetching blog post ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

// Create a new blog post
app.post('/api/proxy/api/blog_posts', async (req, res) => {
  try {
    console.log('[Proxy] Handling POST request to /api/blog_posts');
    console.log('[Proxy] Request body:', req.body);
    
    const { 
      title, slug, content, excerpt, status, 
      featured_photo_url, meta_title, meta_description 
    } = req.body;
    
    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }
    
    // Check if slug already exists
    const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' });
    }
    
    const now = new Date();
    const published_at = status === 'published' ? now : null;
    
    const result = await pool.query(
      `INSERT INTO blog_posts 
       (title, slug, content, excerpt, status, featured_photo_url, meta_title, meta_description, published_at, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING *`,
      [title, slug, content, excerpt, status || 'draft', featured_photo_url, meta_title, meta_description, published_at, now, now]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Proxy] Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

// Update a blog post
app.put('/api/proxy/api/blog_posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling PUT request to /api/blog_posts/${id}`);
    console.log('[Proxy] Request body:', req.body);
    
    const { 
      title, slug, content, excerpt, status, 
      featured_photo_url, meta_title, meta_description 
    } = req.body;
    
    // Validate required fields
    if (!title || !slug || !content) {
      return res.status(400).json({ error: 'Title, slug, and content are required' });
    }
    
    // Check if the blog post exists
    const existingPost = await pool.query('SELECT id, status FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Check if the new slug conflicts with an existing one (excluding this post)
    const existingSlug = await pool.query('SELECT id FROM blog_posts WHERE slug = $1 AND id != $2', [slug, id]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'A blog post with this slug already exists' });
    }
    
    const now = new Date();
    let published_at = null;
    
    // If status is changing to published, set published_at
    if (status === 'published' && existingPost.rows[0].status !== 'published') {
      published_at = now;
    } 
    // If post was already published, keep the original published_at
    else if (status === 'published') {
      const publishedResult = await pool.query('SELECT published_at FROM blog_posts WHERE id = $1', [id]);
      published_at = publishedResult.rows[0].published_at;
    }
    
    const result = await pool.query(
      `UPDATE blog_posts 
       SET title = $1, slug = $2, content = $3, excerpt = $4, status = $5, 
           featured_photo_url = $6, meta_title = $7, meta_description = $8, 
           published_at = $9, updated_at = $10 
       WHERE id = $11 
       RETURNING *`,
      [title, slug, content, excerpt, status || 'draft', featured_photo_url, 
       meta_title, meta_description, published_at, now, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`[Proxy] Error updating blog post ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// Delete a blog post
app.delete('/api/proxy/api/blog_posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[Proxy] Handling DELETE request to /api/blog_posts/${id}`);
    
    // Check if the blog post exists
    const existingPost = await pool.query('SELECT id FROM blog_posts WHERE id = $1', [id]);
    if (existingPost.rows.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    await pool.query('DELETE FROM blog_posts WHERE id = $1', [id]);
    
    res.status(200).json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error(`[Proxy] Error deleting blog post ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

app.listen(PORT, () => {
  console.log(`Improved Proxy server running on http://localhost:${PORT}`);
  console.log(`To use the proxy API, send requests to: http://localhost:${PORT}/api/proxy/...`);
  console.log(`Available endpoints: /api/proxy/api/listings, /api/proxy/api/listings/:id, /api/proxy/api/import_listings`);
  console.log(`Content management: /api/proxy/api/content_pages, /api/proxy/api/blog_posts`);
  console.log(`User management endpoints: /api/proxy/auth/register, /api/proxy/auth/login, /api/proxy/auth/me`);
  console.log(`Admin endpoints: /api/proxy/admin/users, /api/proxy/admin/users/:id`);
  console.log(`AI content endpoints: /api/proxy/api/listings/:id/generate-description, /api/proxy/api/listings/:id/generate-faq`);
});
