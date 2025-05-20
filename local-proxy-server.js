import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { Pool } from 'pg';

// Database connection setup (same as in your import_listings.ts)
const DATABASE_URL = process.env.DATABASE_URL;
let pool = null;

// Only try to connect to the database if we have a connection string
if (DATABASE_URL) {
  pool = new Pool({ 
    connectionString: DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  console.log('[Proxy] Database connection initialized');
}

const app = express();
const PORT = 8080;

// Enable CORS for the frontend origin
app.use(cors({
  origin: 'http://localhost:5175', // Your frontend URL
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// General proxy handler for all API endpoints
app.all('/api/proxy/*', async (req, res) => {
  const actualPath = req.path.replace('/api/proxy', '');
  const vercelBaseUrl = 'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app';
  
  console.log(`[Proxy] Received request for ${req.method} ${actualPath}`);
  
  // Special handling for listings endpoints
  if (actualPath.startsWith('/api/listings')) {
    await handleListingsEndpoint(req, res, actualPath);
    return;
  }
  
  try {
    // Forward the request to Vercel
    const response = await axios({
      method: req.method.toLowerCase(),
      url: `${vercelBaseUrl}${actualPath}`,
      data: req.method !== 'GET' ? req.body : undefined,
      params: req.query,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`[Proxy] Successfully forwarded ${req.method} request to ${actualPath}`);
    
    // Return the response from Vercel to the frontend
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[Proxy] Error forwarding ${req.method} request to ${actualPath}:`, error.message);
    
    // Try to extract meaningful error details
    let statusCode = 500;
    let errorMessage = 'Error proxying request to Vercel';
    
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data || errorMessage;
      console.error('[Proxy] Vercel API error details:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
    } else if (error.request) {
      errorMessage = 'No response received from Vercel API';
      console.error('[Proxy] No response received from Vercel');
    }
    
    res.status(statusCode).json({
      error: errorMessage,
      details: error.message
    });
  }
});

// Handle listings endpoints
async function handleListingsEndpoint(req, res, actualPath) {
  console.log(`[Proxy] Handling listings endpoint: ${req.method} ${actualPath}`);
  
  // If we have a pool, try to fetch from the database first
  if (pool) {
    try {
      let client = await pool.connect();
      console.log('[Proxy] Database client connected');

      try {
        if (actualPath === '/api/listings') {
          // Get all listings with pagination
          const page = parseInt(req.query.page) || 1;
          const pageSize = parseInt(req.query.pageSize) || 20;
          const offset = (page - 1) * pageSize;
          const searchTerm = req.query.search || '';
          
          let queryParams = [];
          let searchCondition = '';
          
          if (searchTerm) {
            searchCondition = `WHERE name ILIKE $1 OR formatted_address ILIKE $1`;
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
              name, 
              formatted_address, 
              latitude, 
              longitude, 
              phone_number, 
              website,
              rating, 
              user_ratings_total,
              main_type,
              types,
              created_at,
              updated_at
            FROM listings
            ${searchCondition}
            ORDER BY name ASC
            LIMIT $${searchTerm ? 2 : 1} OFFSET $${searchTerm ? 3 : 2}
          `;
          
          const result = await client.query(mainQuery, queryParams);
          const totalPages = Math.ceil(totalItems / pageSize);
          
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
          
          console.log(`[Proxy] Successfully fetched ${result.rows.length} listings from database`);
          return;
          
        } else if (actualPath.match(/\/api\/listings\/\d+/)) {
          // Get single listing by ID
          const id = actualPath.split('/').pop();
          
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
            res.status(404).json({ message: 'Listing not found' });
            return;
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
          
          res.status(200).json(listing);
          console.log(`[Proxy] Successfully fetched listing #${id} from database`);
          return;
        }
      } catch (dbError) {
        console.error('[Proxy] Database error:', dbError);
      } finally {
        client.release();
      }
    } catch (connectionError) {
      console.error('[Proxy] Could not connect to database:', connectionError.message);
    }
  }
  
  // If we get here, either we don't have a database connection or there was an error
  // Fall back to mock data
  provideMockListingsData(req, res, actualPath);
}

// Provide mock listing data for development
function provideMockListingsData(req, res, actualPath) {
  console.log('[Proxy] Using mock data for listings');
  
  // Create some mock listings
  const mockListings = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    google_place_id: `mock_place_id_${i + 1}`,
    name: `Mock Business ${i + 1}`,
    formatted_address: `${123 + i} Main St, Mock City, MC ${10000 + i}`,
    latitude: 37.7749 + (Math.random() * 0.1),
    longitude: -122.4194 + (Math.random() * 0.1),
    phone_number: `+1 (555) ${100 + i}-${1000 + i}`,
    website: `https://mockbusiness${i + 1}.example.com`,
    rating: (Math.random() * 4 + 1).toFixed(1),
    user_ratings_total: Math.floor(Math.random() * 500) + 10,
    main_type: ['restaurant', 'cafe', 'store', 'hotel', 'service'][i % 5],
    types: ['business', 'establishment'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  if (actualPath === '/api/listings') {
    // Handle pagination
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const searchTerm = (req.query.search || '').toLowerCase();
    
    let filteredListings = mockListings;
    
    // Apply search filter if provided
    if (searchTerm) {
      filteredListings = mockListings.filter(listing => 
        listing.name.toLowerCase().includes(searchTerm) || 
        listing.formatted_address.toLowerCase().includes(searchTerm)
      );
    }
    
    const totalItems = filteredListings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    
    const paginatedListings = filteredListings.slice(startIndex, endIndex);
    
    res.status(200).json({
      data: paginatedListings,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
    
  } else if (actualPath.match(/\/api\/listings\/\d+/)) {
    // Get single listing
    const id = parseInt(actualPath.split('/').pop());
    const listing = mockListings.find(l => l.id === id);
    
    if (!listing) {
      res.status(404).json({ message: 'Listing not found' });
      return;
    }
    
    // Add some mock reviews
    listing.reviews = Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      author_name: `Mock Reviewer ${i + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
      relative_time_description: '2 weeks ago',
      text: `This is a mock review for ${listing.name}. It's quite ${['good', 'excellent', 'amazing', 'fantastic'][i % 4]}!`,
      time: Date.now() - (i * 86400000),
      profile_photo_url: `https://ui-avatars.com/api/?name=Mock+Reviewer+${i + 1}&background=random`,
      author_url: `https://example.com/reviewer/${i + 1}`
    }));
    
    res.status(200).json(listing);
  } else {
    res.status(404).json({ message: 'Endpoint not found' });
  }
}

// Simple health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`To use the proxy API, send requests to: http://localhost:${PORT}/api/proxy/...`);
  console.log(`Available endpoints: /api/proxy/api/listings, /api/proxy/api/listings/:id, /api/proxy/api/import_listings`);
});
