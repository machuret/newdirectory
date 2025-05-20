// Simple test script to check proxy routing
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 8081;

// Enable CORS
app.use(cors());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[TEST-PROXY] ${req.method} ${req.path}`);
  next();
});

// Test endpoint
app.get('/api/proxy/api/content_pages', (req, res) => {
  console.log('[TEST-PROXY] Content pages endpoint hit');
  res.json([
    {
      id: '1',
      title: 'Test Page',
      slug: 'test-page',
      content: 'This is a test page from the test proxy',
      meta_title: 'Test Page',
      meta_description: 'Test Description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
});

// Catch-all route to check for mismatched routes
app.use('*', (req, res) => {
  console.log(`[TEST-PROXY] Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Endpoint not found',
    requestedPath: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`Test proxy server running on http://localhost:${PORT}`);
  console.log(`Try accessing: http://localhost:${PORT}/api/proxy/api/content_pages`);
});
