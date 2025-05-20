import pool from '../db.js';

// Create a new lead from contact form
export const createLead = async (req, res) => {
  const { listingId, name, email, message } = req.body;
  
  if (!listingId || !name || !email || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields: listingId, name, email, and message are required' 
    });
  }
  
  try {
    // Start a transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert the lead
      const leadResult = await client.query(
        `INSERT INTO leads (listing_id, name, email, message) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, created_at`,
        [listingId, name, email, message]
      );
      
      // Update the listing to indicate it has unread leads
      await client.query(
        `UPDATE listings SET has_unread_leads = TRUE WHERE id = $1`,
        [listingId]
      );
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Lead created successfully',
        lead: {
          id: leadResult.rows[0].id,
          created_at: leadResult.rows[0].created_at
        }
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating lead:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create lead',
      error: err.message
    });
  }
};

// Get all leads with pagination and filtering
export const getLeads = async (req, res) => {
  const { page = 1, limit = 20, status, listingId, search } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Build the query with conditional filters
    let query = `
      SELECT l.*, li.name as listing_name 
      FROM leads l
      JOIN listings li ON l.listing_id = li.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCounter = 1;
    
    if (status) {
      query += ` AND l.status = $${paramCounter++}`;
      queryParams.push(status);
    }
    
    if (listingId) {
      query += ` AND l.listing_id = $${paramCounter++}`;
      queryParams.push(listingId);
    }
    
    if (search) {
      query += ` AND (l.name ILIKE $${paramCounter} OR l.email ILIKE $${paramCounter} OR l.message ILIKE $${paramCounter} OR li.name ILIKE $${paramCounter})`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }
    
    // Count total matching records for pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS count_query`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add ordering and pagination
    query += ` ORDER BY l.created_at DESC LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
    queryParams.push(limit, offset);
    
    // Execute the main query
    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      leads: result.rows,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads',
      error: err.message
    });
  }
};

// Get a single lead by ID
export const getLeadById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      `SELECT l.*, li.name as listing_name 
       FROM leads l
       JOIN listings li ON l.listing_id = li.id
       WHERE l.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }
    
    res.json({
      success: true,
      lead: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching lead:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead',
      error: err.message
    });
  }
};

// Update lead status
export const updateLeadStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: new, read, replied, archived'
    });
  }
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update the lead status
      const updateResult = await client.query(
        `UPDATE leads SET status = $1 WHERE id = $2 RETURNING *`,
        [status, id]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }
      
      // Check if the listing has any remaining unread leads
      const listingId = updateResult.rows[0].listing_id;
      const unreadLeadsResult = await client.query(
        `SELECT COUNT(*) FROM leads WHERE listing_id = $1 AND status = 'new'`,
        [listingId]
      );
      
      const hasUnreadLeads = parseInt(unreadLeadsResult.rows[0].count) > 0;
      
      // Update the listing's has_unread_leads flag
      await client.query(
        `UPDATE listings SET has_unread_leads = $1 WHERE id = $2`,
        [hasUnreadLeads, listingId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Lead status updated successfully',
        lead: updateResult.rows[0]
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating lead status:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead status',
      error: err.message
    });
  }
};

// Get lead counts by status (for dashboard)
export const getLeadStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'new') AS new_count,
        COUNT(*) FILTER (WHERE status = 'read') AS read_count,
        COUNT(*) FILTER (WHERE status = 'replied') AS replied_count,
        COUNT(*) FILTER (WHERE status = 'archived') AS archived_count,
        COUNT(*) AS total_count
      FROM leads
    `);
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (err) {
    console.error('Error fetching lead stats:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead statistics',
      error: err.message
    });
  }
};

// Delete a lead
export const deleteLead = async (req, res) => {
  const { id } = req.params;
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the listing ID before deleting the lead
      const leadResult = await client.query(
        'SELECT listing_id FROM leads WHERE id = $1',
        [id]
      );
      
      if (leadResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Lead not found'
        });
      }
      
      const listingId = leadResult.rows[0].listing_id;
      
      // Delete the lead
      await client.query('DELETE FROM leads WHERE id = $1', [id]);
      
      // Check if the listing has any remaining unread leads
      const unreadLeadsResult = await client.query(
        `SELECT COUNT(*) FROM leads WHERE listing_id = $1 AND status = 'new'`,
        [listingId]
      );
      
      const hasUnreadLeads = parseInt(unreadLeadsResult.rows[0].count) > 0;
      
      // Update the listing's has_unread_leads flag
      await client.query(
        `UPDATE listings SET has_unread_leads = $1 WHERE id = $2`,
        [hasUnreadLeads, listingId]
      );
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Lead deleted successfully'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error deleting lead:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete lead',
      error: err.message
    });
  }
};

// Bulk update lead statuses
export const bulkUpdateLeadStatus = async (req, res) => {
  const { ids, status } = req.body;
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No lead IDs provided'
    });
  }
  
  if (!status || !['new', 'read', 'replied', 'archived'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be one of: new, read, replied, archived'
    });
  }
  
  try {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update all leads
      const updateResult = await client.query(
        `UPDATE leads SET status = $1 WHERE id = ANY($2::int[]) RETURNING listing_id`,
        [status, ids]
      );
      
      if (updateResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'No leads found with the provided IDs'
        });
      }
      
      // Get unique listing IDs that were affected
      const listingIds = [...new Set(updateResult.rows.map(row => row.listing_id))];
      
      // For each affected listing, check if it has any remaining unread leads
      for (const listingId of listingIds) {
        const unreadLeadsResult = await client.query(
          `SELECT COUNT(*) FROM leads WHERE listing_id = $1 AND status = 'new'`,
          [listingId]
        );
        
        const hasUnreadLeads = parseInt(unreadLeadsResult.rows[0].count) > 0;
        
        // Update the listing's has_unread_leads flag
        await client.query(
          `UPDATE listings SET has_unread_leads = $1 WHERE id = $2`,
          [hasUnreadLeads, listingId]
        );
      }
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: `${updateResult.rows.length} leads updated successfully`,
        updatedCount: updateResult.rows.length
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error bulk updating leads:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update leads',
      error: err.message
    });
  }
};
