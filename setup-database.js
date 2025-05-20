import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

// Get database connection string
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_4ZBsLOSgv5ja@ep-lingering-morning-a4y8dqrh-pooler.us-east-1.aws.neon.tech/directory?sslmode=require';

// Read SQL file
const sql = fs.readFileSync('./db-schema.sql', 'utf8');

// Create a client
const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  try {
    // Connect to the database
    await client.connect();
    console.log('Connected to database');
    
    // Execute SQL commands
    await client.query(sql);
    console.log('Database schema updated successfully');
    
    // Create an admin user if none exists
    const adminResult = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);
    
    if (adminResult.rows.length === 0) {
      // Hash the password 'admin123'
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      
      // Create an admin user with password 'admin123'
      await client.query(
        'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['Admin User', 'admin@example.com', passwordHash, 'admin']
      );
      console.log('Created default admin user (email: admin@example.com, password: admin123)');
    } else {
      console.log('Admin user already exists');
    }
    
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    // Close the client
    await client.end();
    console.log('Database connection closed');
  }
}

setupDatabase();
