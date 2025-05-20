import pool from '../db.js';
import slugify from 'slugify';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categories ORDER BY name'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Get a single category by ID
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// Get a category by slug
export const getCategoryBySlug = async (req, res) => {
  const { slug } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
};

// Create a new category
export const createCategory = async (req, res) => {
  const { name, description, icon, parent_id, is_active = true } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  
  try {
    // Generate slug from name if not provided
    let { slug } = req.body;
    if (!slug) {
      slug = slugify(name, { lower: true, strict: true });
    }
    
    // Check if slug already exists
    const slugCheck = await pool.query('SELECT * FROM categories WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Category slug already exists' });
    }
    
    // Insert the new category
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, icon, parent_id, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, slug, description, icon, parent_id, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// Update an existing category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description, icon, parent_id, is_active } = req.body;
  
  try {
    // Check if category exists
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Generate slug from name if provided
    let { slug } = req.body;
    if (name && !slug) {
      slug = slugify(name, { lower: true, strict: true });
    }
    
    // Check if slug already exists for another category
    if (slug) {
      const slugCheck = await pool.query('SELECT * FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
      if (slugCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Category slug already exists' });
      }
    }
    
    // Start building the query
    let query = 'UPDATE categories SET ';
    const values = [];
    const updates = [];
    let paramCount = 1;
    
    // Add fields to update if they are provided
    if (name) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }
    
    if (slug) {
      updates.push(`slug = $${paramCount}`);
      values.push(slug);
      paramCount++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    
    if (icon !== undefined) {
      updates.push(`icon = $${paramCount}`);
      values.push(icon);
      paramCount++;
    }
    
    if (parent_id !== undefined) {
      updates.push(`parent_id = $${paramCount}`);
      values.push(parent_id);
      paramCount++;
    }
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    // Add updated_at timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // If no fields to update, return the current category
    if (updates.length === 0) {
      return res.json(categoryCheck.rows[0]);
    }
    
    // Complete the query
    query += updates.join(', ');
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(id);
    
    // Execute the update
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// Delete a category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if category exists
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Check if category has children
    const childrenCheck = await pool.query('SELECT * FROM categories WHERE parent_id = $1', [id]);
    if (childrenCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' });
    }
    
    // Check if category is used by any listings
    const listingsCheck = await pool.query('SELECT * FROM listing_categories WHERE category_id = $1 LIMIT 1', [id]);
    if (listingsCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Cannot delete category that is used by listings. Please remove the category from all listings first.' });
    }
    
    // Delete the category
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// Get listings by category
export const getListingsByCategory = async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  
  try {
    // First, get the category to make sure it exists
    const categoryResult = await pool.query(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );
    
    if (categoryResult.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const category = categoryResult.rows[0];
    
    // Get all listings in this category
    const listingsResult = await pool.query(
      `SELECT l.* 
       FROM listings l
       JOIN listing_categories lc ON l.id = lc.listing_id
       WHERE lc.category_id = $1 AND l.is_approved = TRUE
       ORDER BY l.name
       LIMIT $2 OFFSET $3`,
      [category.id, limit, offset]
    );
    
    // Get total count for pagination
    const countResult = await pool.query(
      `SELECT COUNT(*) 
       FROM listings l
       JOIN listing_categories lc ON l.id = lc.listing_id
       WHERE lc.category_id = $1 AND l.is_approved = TRUE`,
      [category.id]
    );
    
    const totalCount = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      category,
      listings: listingsResult.rows,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching listings by category:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
};

// Get categories with listing counts
export const getCategoriesWithCounts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(lc.listing_id) as listing_count
       FROM categories c
       LEFT JOIN listing_categories lc ON c.id = lc.category_id
       LEFT JOIN listings l ON lc.listing_id = l.id AND l.is_approved = TRUE
       GROUP BY c.id
       ORDER BY c.name`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories with counts:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// Associate a category with a listing
export const associateCategory = async (req, res) => {
  const { listing_id, category_id, is_primary = false } = req.body;
  
  // Validate required fields
  if (!listing_id || !category_id) {
    return res.status(400).json({ error: 'Listing ID and Category ID are required' });
  }
  
  try {
    // Check if listing exists
    const listingCheck = await pool.query('SELECT * FROM listings WHERE id = $1', [listing_id]);
    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check if category exists
    const categoryCheck = await pool.query('SELECT * FROM categories WHERE id = $1', [category_id]);
    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // If this is the primary category, unset any existing primary category
    if (is_primary) {
      await pool.query(
        'UPDATE listing_categories SET is_primary = FALSE WHERE listing_id = $1',
        [listing_id]
      );
    }
    
    // Check if association already exists
    const associationCheck = await pool.query(
      'SELECT * FROM listing_categories WHERE listing_id = $1 AND category_id = $2',
      [listing_id, category_id]
    );
    
    if (associationCheck.rows.length > 0) {
      // Update existing association
      await pool.query(
        'UPDATE listing_categories SET is_primary = $3 WHERE listing_id = $1 AND category_id = $2',
        [listing_id, category_id, is_primary]
      );
    } else {
      // Create new association
      await pool.query(
        'INSERT INTO listing_categories (listing_id, category_id, is_primary) VALUES ($1, $2, $3)',
        [listing_id, category_id, is_primary]
      );
    }
    
    res.status(200).json({ message: 'Category associated with listing successfully' });
  } catch (error) {
    console.error('Error associating category with listing:', error);
    res.status(500).json({ error: 'Failed to associate category with listing' });
  }
};

// Remove a category association from a listing
export const removeCategory = async (req, res) => {
  const { listing_id, category_id } = req.params;
  
  try {
    // Check if association exists
    const associationCheck = await pool.query(
      'SELECT * FROM listing_categories WHERE listing_id = $1 AND category_id = $2',
      [listing_id, category_id]
    );
    
    if (associationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Category association not found' });
    }
    
    // Remove the association
    await pool.query(
      'DELETE FROM listing_categories WHERE listing_id = $1 AND category_id = $2',
      [listing_id, category_id]
    );
    
    res.json({ message: 'Category removed from listing successfully' });
  } catch (error) {
    console.error('Error removing category from listing:', error);
    res.status(500).json({ error: 'Failed to remove category from listing' });
  }
};

// Get categories for a specific listing
export const getListingCategories = async (req, res) => {
  const { listing_id } = req.params;
  
  try {
    // Check if listing exists
    const listingCheck = await pool.query('SELECT * FROM listings WHERE id = $1', [listing_id]);
    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Get all categories for this listing
    const result = await pool.query(
      `SELECT c.*, lc.is_primary 
       FROM categories c
       JOIN listing_categories lc ON c.id = lc.category_id
       WHERE lc.listing_id = $1
       ORDER BY lc.is_primary DESC, c.name`,
      [listing_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching listing categories:', error);
    res.status(500).json({ error: 'Failed to fetch listing categories' });
  }
};
