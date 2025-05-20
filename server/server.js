import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import aiPromptRoutes from './routes/aiPromptRoutes.js';
import apiKeyRoutes from './routes/apiKeyRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import pool from './db.js';
import setupDatabase from './setup-database.js';
import slugify from 'slugify';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // To parse JSON request bodies

// Basic route
app.get('/', (req, res) => {
  res.send('Hello from Express Server!');
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbClient = await pool.connect();
    const dbResult = await dbClient.query('SELECT NOW()');
    dbClient.release();
    
    res.status(200).json({
      status: 'ok',
      server: 'express',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now
    });
  } catch (err) {
    res.status(200).json({
      status: 'ok',
      server: 'express',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

// Simplified health check endpoint (for the health check utility)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Database test route
app.get('/api/db-test', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    res.json(result.rows[0]);
    client.release(); // Release the client back to the pool
  } catch (err) {
    console.error('Error connecting to DB or running query', err.stack);
    res.status(500).json({ error: 'Failed to connect to database' });
  }
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiPromptRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/leads', leadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', message: 'The requested resource does not exist' });
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api`);
  
  // Set up database tables and initial data
  try {
    await setupDatabase();
  } catch (err) {
    console.error('Database setup failed:', err);
  }
});
