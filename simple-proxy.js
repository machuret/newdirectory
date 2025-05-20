import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 8080;

// Vercel deployment URL 
const VERCEL_URL = 'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app';

// Enable CORS for the frontend origin
app.use(cors({
  origin: 'http://localhost:5175', // Your frontend URL
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Forward POST requests to /api/import_listings
app.post('/api/proxy/api/import_listings', async (req, res) => {
  console.log('[Proxy] Forwarding POST request to /api/import_listings');
  
  try {
    const response = await axios({
      method: 'post',
      url: `${VERCEL_URL}/api/import_listings`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    handleProxyError(error, res);
  }
});

// Mock data for GET /api/listings
app.get('/api/proxy/api/listings', (req, res) => {
  console.log('[Proxy] Handling GET request to /api/listings');
  
  // Create mock listings
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
  
  // Get pagination parameters
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const searchTerm = (req.query.search || '').toLowerCase();
  
  // Filter by search term if provided
  let filteredListings = mockListings;
  if (searchTerm) {
    filteredListings = mockListings.filter(listing => 
      listing.name.toLowerCase().includes(searchTerm) || 
      listing.formatted_address.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply pagination
  const totalItems = filteredListings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedListings = filteredListings.slice(startIndex, endIndex);
  
  // Respond with data and pagination info
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
});

// Mock data for GET /api/listings/:id
app.get('/api/proxy/api/listings/:id', (req, res) => {
  console.log(`[Proxy] Handling GET request to /api/listings/${req.params.id}`);
  
  const id = parseInt(req.params.id);
  
  // Mock a single listing
  const listing = {
    id,
    google_place_id: `mock_place_id_${id}`,
    name: `Mock Business ${id}`,
    formatted_address: `${123 + id} Main St, Mock City, MC ${10000 + id}`,
    latitude: 37.7749 + (Math.random() * 0.1),
    longitude: -122.4194 + (Math.random() * 0.1),
    phone_number: `+1 (555) ${100 + id}-${1000 + id}`,
    website: `https://mockbusiness${id}.example.com`,
    rating: (Math.random() * 4 + 1).toFixed(1),
    user_ratings_total: Math.floor(Math.random() * 500) + 10,
    main_type: ['restaurant', 'cafe', 'store', 'hotel', 'service'][id % 5],
    types: ['business', 'establishment'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // Add reviews
    reviews: Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      author_name: `Mock Reviewer ${i + 1}`,
      rating: Math.floor(Math.random() * 5) + 1,
      relative_time_description: '2 weeks ago',
      text: `This is a mock review for Business ${id}. The service was ${['good', 'excellent', 'amazing', 'fantastic'][i % 4]}!`,
      time: Date.now() - (i * 86400000),
      profile_photo_url: `https://ui-avatars.com/api/?name=Mock+Reviewer+${i + 1}`,
      author_url: `https://example.com/reviewer/${i + 1}`
    })),
    
    // Add photos
    photos: Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      photo_reference: `mock_photo_ref_${id}_${i}`,
      height: 800,
      width: 1200,
      html_attributions: [],
      photo_url: `https://source.unsplash.com/random/800x600?business&sig=${id}_${i}`
    })),
    
    // Add opening hours
    opening_hours: {
      periods: [
        { open: { day: 0, time: '0900' }, close: { day: 0, time: '1700' } }, // Sunday
        { open: { day: 1, time: '0800' }, close: { day: 1, time: '1800' } }, // Monday
        { open: { day: 2, time: '0800' }, close: { day: 2, time: '1800' } }, // Tuesday
        { open: { day: 3, time: '0800' }, close: { day: 3, time: '1800' } }, // Wednesday
        { open: { day: 4, time: '0800' }, close: { day: 4, time: '2000' } }, // Thursday
        { open: { day: 5, time: '0800' }, close: { day: 5, time: '2000' } }, // Friday
        { open: { day: 6, time: '0900' }, close: { day: 6, time: '1700' } }  // Saturday
      ],
      weekday_text: [
        'Sunday: 9:00 AM – 5:00 PM',
        'Monday: 8:00 AM – 6:00 PM',
        'Tuesday: 8:00 AM – 6:00 PM',
        'Wednesday: 8:00 AM – 6:00 PM',
        'Thursday: 8:00 AM – 8:00 PM',
        'Friday: 8:00 AM – 8:00 PM',
        'Saturday: 9:00 AM – 5:00 PM'
      ]
    }
  };
  
  res.status(200).json(listing);
});

// Handle PUT requests to /api/listings/:id
app.put('/api/proxy/api/listings/:id', (req, res) => {
  console.log(`[Proxy] Handling PUT request to /api/listings/${req.params.id}`);
  
  const id = parseInt(req.params.id);
  const updatedData = req.body;
  
  // In a real app, we would update the database
  // For now, just echo back the updated data
  res.status(200).json({
    ...updatedData,
    id,
    updated_at: new Date().toISOString()
  });
});

// Generic error handler
function handleProxyError(error, res) {
  console.error('[Proxy] Error:', error.message);
  
  let statusCode = 500;
  let errorMessage = 'Error proxying request';
  
  if (error.response) {
    statusCode = error.response.status;
    errorMessage = error.response.data || errorMessage;
    console.error('[Proxy] Response error details:', {
      status: error.response.status,
      data: error.response.data
    });
  } else if (error.request) {
    errorMessage = 'No response received from server';
  }
  
  res.status(statusCode).json({
    error: errorMessage,
    details: error.message
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'Proxy server is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple Proxy server running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- http://localhost:${PORT}/api/proxy/api/listings`);
  console.log(`- http://localhost:${PORT}/api/proxy/api/listings/:id`);
  console.log(`- http://localhost:${PORT}/api/proxy/api/import_listings`);
});
