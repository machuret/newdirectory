import pool from '../db.js';

// Get all listings
export const getAllListings = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // Get total count for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM listings WHERE is_approved = TRUE');
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get listings with pagination, prioritizing featured listings
    const result = await pool.query(
      'SELECT * FROM listings WHERE is_approved = TRUE ORDER BY is_featured DESC, name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    res.json({
      listings: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Get featured listings
export const getFeaturedListings = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // Get total count of featured listings for pagination
    const countResult = await pool.query('SELECT COUNT(*) FROM listings WHERE is_approved = TRUE AND is_featured = TRUE');
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get featured listings with pagination
    const result = await pool.query(
      'SELECT * FROM listings WHERE is_approved = TRUE AND is_featured = TRUE ORDER BY name LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    res.json({
      listings: result.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching featured listings:', error);
    res.status(500).json({ error: 'Failed to fetch featured listings' });
  }
};

// Get a single listing by ID
export const getListingById = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the listing
    const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = result.rows[0];
    
    // Get categories for this listing
    const categoriesResult = await pool.query(
      `SELECT c.*, lc.is_primary 
       FROM categories c
       JOIN listing_categories lc ON c.id = lc.category_id
       WHERE lc.listing_id = $1
       ORDER BY lc.is_primary DESC, c.name`,
      [id]
    );
    
    // Add categories to the listing
    listing.categories = categoriesResult.rows;
    
    // Set primary category
    const primaryCategory = categoriesResult.rows.find(c => c.is_primary);
    if (primaryCategory) {
      listing.primary_category = primaryCategory;
    }
    
    res.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
};

// Get listings by business type
export const getListingsByBusinessType = async (req, res) => {
  const { type } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  // Convert URL-friendly format (with-dashes) to database format (with_underscores)
  const businessType = type.replace(/-/g, '_');
  
  try {
    // First check if the column 'types' exists
    let typesColumnExists = false;
    try {
      const checkColumn = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'types'"
      );
      typesColumnExists = checkColumn.rows.length > 0;
    } catch (err) {
      console.log('Error checking for types column:', err);
      // Continue with default assumption that it doesn't exist
    }
    
    // Check if google_categories_json column exists (alternative to types)
    let googleCategoriesColumnExists = false;
    try {
      const checkColumn = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'google_categories_json'"
      );
      googleCategoriesColumnExists = checkColumn.rows.length > 0;
    } catch (err) {
      console.log('Error checking for google_categories_json column:', err);
      // Continue with default assumption that it doesn't exist
    }
    
    // Construct the query based on available columns
    let countQuery, listingsQuery;
    let queryParams = [businessType];
    
    if (typesColumnExists) {
      countQuery = 'SELECT COUNT(*) FROM listings WHERE (main_type = $1 OR $1 = ANY(types))'
      listingsQuery = 'SELECT * FROM listings WHERE (main_type = $1 OR $1 = ANY(types))'
    } else if (googleCategoriesColumnExists) {
      countQuery = 'SELECT COUNT(*) FROM listings WHERE (main_type = $1 OR $1 = ANY(google_categories_json))'
      listingsQuery = 'SELECT * FROM listings WHERE (main_type = $1 OR $1 = ANY(google_categories_json))'
    } else {
      // Fallback to just main_type
      countQuery = 'SELECT COUNT(*) FROM listings WHERE main_type = $1'
      listingsQuery = 'SELECT * FROM listings WHERE main_type = $1'
    }
    
    // Check if is_approved column exists
    try {
      const checkColumn = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'listings' AND column_name = 'is_approved'"
      );
      if (checkColumn.rows.length > 0) {
        countQuery += ' AND is_approved = TRUE';
        listingsQuery += ' AND is_approved = TRUE';
      }
    } catch (err) {
      console.log('Error checking for is_approved column:', err);
      // Continue without adding is_approved condition
    }
    
    // Add ordering and pagination
    listingsQuery += ' ORDER BY name LIMIT $2 OFFSET $3';
    queryParams.push(limit, offset);
    
    // Get total count for pagination
    const countResult = await pool.query(countQuery, [businessType]);
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get listings with pagination
    const result = await pool.query(listingsQuery, queryParams);
    
    // For each listing, get its categories if the categories table exists
    let listings = result.rows;
    
    try {
      // Check if categories table exists
      const checkCategoriesTable = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_name = 'categories'"
      );
      
      if (checkCategoriesTable.rows.length > 0) {
        // Check if listing_categories table exists
        const checkJunctionTable = await pool.query(
          "SELECT table_name FROM information_schema.tables WHERE table_name = 'listing_categories'"
        );
        
        if (checkJunctionTable.rows.length > 0) {
          // Fetch categories for each listing
          listings = await Promise.all(result.rows.map(async (listing) => {
            try {
              const categoriesResult = await pool.query(
                `SELECT c.*, lc.is_primary 
                 FROM categories c
                 JOIN listing_categories lc ON c.id = lc.category_id
                 WHERE lc.listing_id = $1
                 ORDER BY lc.is_primary DESC, c.name`,
                [listing.id]
              );
              
              listing.categories = categoriesResult.rows;
              
              // Set primary category
              const primaryCategory = categoriesResult.rows.find(c => c.is_primary);
              if (primaryCategory) {
                listing.primary_category = primaryCategory;
              }
            } catch (err) {
              console.log(`Error fetching categories for listing ${listing.id}:`, err);
              listing.categories = [];
            }
            
            return listing;
          }));
        }
      }
    } catch (err) {
      console.log('Error checking for categories tables:', err);
      // Continue without categories
    }
    
    res.json({
      business_type: businessType,
      listings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching listings by business type:', error);
    res.status(500).json({ error: 'Failed to fetch listings by business type' });
  }
};

// Create a new listing
export const createListing = async (req, res) => {
  const { 
    name, 
    google_place_id,
    formatted_address,
    latitude,
    longitude,
    phone_number,
    website,
    main_type,
    types,
    description,
    seo_title,
    seo_description,
    seo_keywords,
    main_image_url,
    user_id
  } = req.body;
  
  // Validate required fields
  if (!name || !google_place_id) {
    return res.status(400).json({ error: 'Name and Google Place ID are required' });
  }
  
  try {
    // Insert the new listing
    const result = await pool.query(
      `INSERT INTO listings (
        name, 
        google_place_id,
        formatted_address,
        latitude,
        longitude,
        phone_number,
        website,
        main_type,
        types,
        description,
        seo_title,
        seo_description,
        seo_keywords,
        main_image_url,
        user_id,
        is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [
        name, 
        google_place_id,
        formatted_address,
        latitude,
        longitude,
        phone_number,
        website,
        main_type,
        types || [],
        description,
        seo_title,
        seo_description,
        seo_keywords,
        main_image_url,
        user_id,
        user_id ? false : true // Auto-approve if no user_id (admin created)
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
};

// Update an existing listing
export const updateListing = async (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    formatted_address,
    latitude,
    longitude,
    phone_number,
    website,
    main_type,
    types,
    description,
    seo_title,
    seo_description,
    seo_keywords,
    main_image_url,
    is_featured
  } = req.body;
  
  try {
    // Check if listing exists
    const checkResult = await pool.query('SELECT id FROM listings WHERE id = $1', [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Update the listing
    const result = await pool.query(
      `UPDATE listings SET 
        name = COALESCE($1, name),
        formatted_address = COALESCE($2, formatted_address),
        latitude = COALESCE($3, latitude),
        longitude = COALESCE($4, longitude),
        phone_number = COALESCE($5, phone_number),
        website = COALESCE($6, website),
        main_type = COALESCE($7, main_type),
        types = COALESCE($8, types),
        description = COALESCE($9, description),
        seo_title = COALESCE($10, seo_title),
        seo_description = COALESCE($11, seo_description),
        seo_keywords = COALESCE($12, seo_keywords),
        main_image_url = COALESCE($13, main_image_url),
        is_featured = COALESCE($14, is_featured),
        updated_at = NOW()
      WHERE id = $15 RETURNING *`,
      [
        name, 
        formatted_address,
        latitude,
        longitude,
        phone_number,
        website,
        main_type,
        types,
        description,
        seo_title,
        seo_description,
        seo_keywords,
        main_image_url,
        is_featured,
        id
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(500).json({ error: 'Failed to update listing' });
  }
};

// Update featured status for multiple listings
export const updateFeaturedStatus = async (req, res) => {
  const { listingIds, isFeatured } = req.body;
  
  // Validate required fields
  if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
    return res.status(400).json({ error: 'Listing IDs are required and must be an array' });
  }
  
  if (typeof isFeatured !== 'boolean') {
    return res.status(400).json({ error: 'isFeatured must be a boolean value' });
  }
  
  try {
    // Update featured status for all specified listings
    const result = await pool.query(
      `UPDATE listings SET is_featured = $1, updated_at = NOW() WHERE id = ANY($2::int[]) RETURNING id, name, is_featured`,
      [isFeatured, listingIds]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No listings found with the provided IDs' });
    }
    
    res.json({
      success: true,
      message: `Featured status updated for ${result.rows.length} listings`,
      listings: result.rows
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
};

// Delete a listing
export const deleteListing = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if listing exists
    const listingCheck = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Delete the listing
    await pool.query('DELETE FROM listings WHERE id = $1', [id]);
    
    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
};
