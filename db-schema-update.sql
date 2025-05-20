-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  parent_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- SEO fields
  seo_title VARCHAR(255),
  seo_description TEXT,
  content_description TEXT
);

-- Create listing_categories junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id, category_id)
);

-- Add index to improve query performance
CREATE INDEX IF NOT EXISTS idx_listing_categories_listing_id ON listing_categories(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_category_id ON listing_categories(category_id);
