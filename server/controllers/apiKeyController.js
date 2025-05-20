import pool from '../db.js';

// Get all API keys
export const getAllApiKeys = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, service_name, is_active, created_at, updated_at FROM api_keys ORDER BY service_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
};

// Get a specific API key by service name
export const getApiKeyByService = async (req, res) => {
  const { serviceName } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM api_keys WHERE service_name = $1',
      [serviceName]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching API key for ${serviceName}:`, error);
    res.status(500).json({ error: 'Failed to fetch API key' });
  }
};

// Create or update an API key
export const upsertApiKey = async (req, res) => {
  const { service_name, api_key, is_active } = req.body;
  
  // Validate required fields
  if (!service_name || !api_key) {
    return res.status(400).json({ error: 'Service name and API key are required' });
  }
  
  try {
    // Check if the API key already exists
    const checkResult = await pool.query(
      'SELECT id FROM api_keys WHERE service_name = $1',
      [service_name]
    );
    
    let result;
    
    if (checkResult.rows.length > 0) {
      // Update existing API key
      result = await pool.query(
        'UPDATE api_keys SET api_key = $1, is_active = $2, updated_at = NOW() WHERE service_name = $3 RETURNING *',
        [api_key, is_active !== undefined ? is_active : true, service_name]
      );
    } else {
      // Insert new API key
      result = await pool.query(
        'INSERT INTO api_keys (service_name, api_key, is_active) VALUES ($1, $2, $3) RETURNING *',
        [service_name, api_key, is_active !== undefined ? is_active : true]
      );
    }
    
    // Return the API key without exposing the actual key value
    const apiKey = result.rows[0];
    res.json({
      id: apiKey.id,
      service_name: apiKey.service_name,
      is_active: apiKey.is_active,
      created_at: apiKey.created_at,
      updated_at: apiKey.updated_at,
      message: checkResult.rows.length > 0 ? 'API key updated successfully' : 'API key created successfully'
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({ error: 'Failed to save API key' });
  }
};

// Delete an API key
export const deleteApiKey = async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'DELETE FROM api_keys WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    res.json({ message: 'API key deleted successfully' });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: 'Failed to delete API key' });
  }
};

// Get API key by service name (internal function)
export const getApiKey = async (serviceName) => {
  try {
    const result = await pool.query(
      'SELECT api_key FROM api_keys WHERE service_name = $1 AND is_active = TRUE',
      [serviceName]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].api_key;
  } catch (error) {
    console.error(`Error retrieving ${serviceName} API key:`, error);
    return null;
  }
};
