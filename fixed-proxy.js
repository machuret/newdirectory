import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const PORT = 8080;

// Vercel deployment URL 
const VERCEL_URL = 'https://newdirectory-8xry0lg17-gabriel-machurets-projects.vercel.app';

// Enable CORS for all origins in development
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Incoming ${req.method} ${req.url}`);
  next();
});

// Forward POST requests to /api/import_listings
app.post('/api/proxy/api/import_listings', async (req, res) => {
  console.log(`[Proxy] Matched POST /api/proxy/api/import_listings. Forwarding to Vercel: ${VERCEL_URL}/api/import_listings`);
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
    console.error(`[Proxy] Error in POST /api/proxy/api/import_listings handler:`, error.message);
    handleProxyError(error, res);
  }
});

// Forward GET requests to /api/listings, passing through query parameters
app.get('/api/proxy/api/listings', async (req, res) => {
  console.log(`[Proxy] Matched GET /api/proxy/api/listings. Forwarding to Vercel: ${VERCEL_URL}/api/listings with params:`, req.query);
  try {
    const response = await axios.get(`${VERCEL_URL}/api/listings`, {
      params: req.query, // Forward query parameters
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[Proxy] Error in GET /api/proxy/api/listings handler:`, error.message);
    handleProxyError(error, res);
  }
});

// Forward GET requests to /api/listings/:id
app.get('/api/proxy/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Proxy] Matched GET /api/proxy/api/listings/:id. Forwarding to Vercel: ${VERCEL_URL}/api/listings/${id}`);
  try {
    const response = await axios.get(`${VERCEL_URL}/api/listings/${id}`);
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[Proxy] Error in GET /api/proxy/api/listings/:id handler:`, error.message);
    handleProxyError(error, res);
  }
});

// Forward PUT requests to /api/listings/:id
app.put('/api/proxy/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`[Proxy] Matched PUT /api/proxy/api/listings/:id. Forwarding to Vercel: ${VERCEL_URL}/api/listings/${id}`);
  try {
    const response = await axios.put(`${VERCEL_URL}/api/listings/${id}`, req.body, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`[Proxy] Error in PUT /api/proxy/api/listings/:id handler:`, error.message);
    handleProxyError(error, res);
  }
});

// Generic error handler
function handleProxyError(error, res) {
  console.error('[Proxy] Error in handleProxyError:', error.message);
  let statusCode = 500;
  let responseData = { error: 'Error proxying request', details: error.message };

  if (error.response) { // Error from Axios (Vercel responded with an error)
    statusCode = error.response.status;
    responseData = error.response.data || responseData; // Prefer Vercel's error response
    console.error('[Proxy] Vercel response error details:', {
      status: error.response.status,
      data: error.response.data
    });
  } else if (error.request) { // Error from Axios (no response from Vercel)
    responseData.error = 'No response received from target server (Vercel)';
    console.error('[Proxy] No response from Vercel.');
  } else { // Other errors (e.g., setup issues in Axios request)
    console.error('[Proxy] Non-Axios error:', error);
  }
  res.status(statusCode).json(responseData);
}

// Health check endpoint
app.get('/', (req, res) => {
  console.log(`[Proxy] Matched GET / (Health Check)`);
  res.json({ status: 'Proxy server is running' });
});

// Catch-all for 404s specifically from the proxy
// This MUST be after all other app.get, app.post, etc.
app.use((req, res, next) => {
  console.warn(`[Proxy] Unmatched route: ${req.method} ${req.url}. Responding with 404.`);
  res.status(404).json({ error: 'Proxy route not found', requestedUrl: req.url });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Vercel Target URL: ${VERCEL_URL}`);
  console.log(`Available proxy endpoints:`);
  console.log(`- GET /api/proxy/api/listings`);
  console.log(`- GET /api/proxy/api/listings/:id`);
  console.log(`- PUT /api/proxy/api/listings/:id`);
  console.log(`- POST /api/proxy/api/import_listings`);
  console.log(`- GET / (Health Check)`);
});
