-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(255),
  parent_id INTEGER REFERENCES categories(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Listing categories relationship (many-to-many)
CREATE TABLE IF NOT EXISTS listing_categories (
  listing_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT FALSE, -- Indicates if this is the primary category for the listing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id, category_id)
);

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_listing_categories_category_id ON listing_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_listing_categories_listing_id ON listing_categories(listing_id);

-- Add initial categories based on common business types
INSERT INTO categories (name, slug, description, icon)
VALUES 
  ('Restaurants', 'restaurants', 'Restaurants, cafes, and dining establishments', 'utensils'),
  ('Shopping', 'shopping', 'Retail stores and shopping centers', 'shopping-bag'),
  ('Hotels', 'hotels', 'Hotels, motels, and accommodations', 'hotel'),
  ('Health & Medical', 'health-medical', 'Healthcare providers and medical facilities', 'heart-pulse'),
  ('Services', 'services', 'Professional and personal services', 'briefcase'),
  ('Beauty & Spa', 'beauty-spa', 'Beauty salons, spas, and wellness centers', 'scissors'),
  ('Automotive', 'automotive', 'Auto repair, dealerships, and services', 'car'),
  ('Education', 'education', 'Schools, universities, and educational institutions', 'graduation-cap'),
  ('Entertainment', 'entertainment', 'Entertainment venues and activities', 'film'),
  ('Real Estate', 'real-estate', 'Real estate agencies and property services', 'home'),
  ('Financial Services', 'financial-services', 'Banks, insurance, and financial institutions', 'bank'),
  ('Mortgage Lender', 'mortgage-lender', 'Mortgage and loan providers', 'dollar-sign')
ON CONFLICT (slug) DO NOTHING;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for categories table
DROP TRIGGER IF EXISTS set_timestamp_categories ON categories;
CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();
