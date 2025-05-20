import { Pool } from 'pg';
import { Listing } from '../../src/types/listing';

// Initialize PostgreSQL pool connection
let pool: Pool;

// Get or create the database connection pool
export const getPool = () => {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured in environment variables');
    }
    
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    
    // Log successful connection
    pool.on('connect', () => {
      console.log('Connected to PostgreSQL database');
    });
    
    // Log errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
};

// Get a single listing by ID
export const getListingById = async (id: string | number): Promise<Listing | null> => {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0] as Listing;
  } catch (error) {
    console.error('Error fetching listing by ID:', error);
    throw error;
  }
};

// Update a listing
export const updateListing = async (id: string | number, data: Partial<Listing>): Promise<Listing | null> => {
  try {
    const pool = getPool();
    
    // Get the current listing to merge with updates
    const currentListing = await getListingById(id);
    
    if (!currentListing) {
      throw new Error(`Listing with ID ${id} not found`);
    }
    
    // Create SET clause and values for update query
    const keys = Object.keys(data).filter(key => data[key as keyof Partial<Listing>] !== undefined);
    
    if (keys.length === 0) {
      return currentListing; // No changes to update
    }
    
    const setClause = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = keys.map(key => data[key as keyof Partial<Listing>]);
    
    // Build and execute the update query
    const query = `UPDATE listings SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [id, ...values]);
    
    return result.rows[0] as Listing;
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
};
