import type { VercelRequest, VercelResponse } from '@vercel/node';
import { promptService } from '../lib/prompt-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Prompts API Called =====');
  console.log('Request method:', req.method);
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getPrompts(req, res);
    case 'POST':
      return createPrompt(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all prompts
async function getPrompts(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Fetching all prompts');
    const prompts = await promptService.getAllPrompts();
    return res.status(200).json(prompts);
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch prompts',
      error: error.message
    });
  }
}

// Create a new prompt
async function createPrompt(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, type, content } = req.body;
    
    if (!name || !type || !content) {
      return res.status(400).json({ message: 'Name, type, and content are required fields' });
    }
    
    console.log('Creating new prompt:', { name, type });
    const prompt = await promptService.createPrompt({ name, type, content });
    
    return res.status(201).json({
      message: 'Prompt created successfully',
      prompt
    });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    return res.status(500).json({ 
      message: 'Failed to create prompt',
      error: error.message
    });
  }
}
