import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promptService } from '../lib/prompt-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Prompt by ID API Called =====');
  console.log('Request method:', req.method);
  console.log('Request query params:', req.query);
  
  // Get prompt ID from request
  const { id } = req.query;
  
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'Invalid prompt ID' });
  }
  
  const promptId = Number(id);
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getPromptById(promptId, res);
    case 'PUT':
      return updatePrompt(promptId, req, res);
    case 'DELETE':
      return deletePrompt(promptId, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get a prompt by ID
async function getPromptById(id: number, res: VercelResponse) {
  try {
    // Get a specific prompt by ID
    const { getPool } = await import('../lib/database');
    const result = await getPool().query(
      'SELECT * FROM prompts WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Prompt with ID ${id} not found` });
    }
    
    return res.status(200).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch prompt',
      error: error.message
    });
  }
}

// Update a prompt
async function updatePrompt(id: number, req: VercelRequest, res: VercelResponse) {
  try {
    const { name, type, content } = req.body;
    
    if (!name && !type && !content) {
      return res.status(400).json({ message: 'At least one field (name, type, or content) must be provided' });
    }
    
    console.log('Updating prompt:', { id, name, type });
    const prompt = await promptService.updatePrompt(id, { name, type, content });
    
    if (!prompt) {
      return res.status(404).json({ message: `Prompt with ID ${id} not found` });
    }
    
    return res.status(200).json({
      message: 'Prompt updated successfully',
      prompt
    });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    return res.status(500).json({ 
      message: 'Failed to update prompt',
      error: error.message
    });
  }
}

// Delete a prompt
async function deletePrompt(id: number, res: VercelResponse) {
  try {
    console.log('Deleting prompt:', { id });
    const success = await promptService.deletePrompt(id);
    
    if (!success) {
      return res.status(404).json({ message: `Prompt with ID ${id} not found` });
    }
    
    return res.status(200).json({
      message: 'Prompt deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    return res.status(500).json({ 
      message: 'Failed to delete prompt',
      error: error.message
    });
  }
}
