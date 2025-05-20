import type { VercelRequest, VercelResponse } from '@vercel/node';
import { homepageService } from '../lib/homepage-service';
import { getPool } from '../lib/database';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Homepage Content API Called =====');
  console.log('Request method:', req.method);
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getHomepageContent(req, res);
    case 'POST':
    case 'PUT':
      return updateHomepageContent(req, res);
    default:
      return res.status(405).json({ message: 'Method not allowed' });
  }
}

// Get all homepage content
async function getHomepageContent(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('Fetching homepage content');
    
    // First ensure table exists
    try {
      await homepageService.initializeTable();
      console.log('Homepage content table initialized');
    } catch (initError) {
      console.warn('Table initialization warning:', initError);
      // Continue anyway - the table might already exist
    }
    
    // Check if we should return grouped content
    const grouped = req.query.grouped === 'true';
    let content;
    
    if (grouped) {
      content = await homepageService.getGroupedContent();
    } else {
      content = await homepageService.getAllContent();
    }
    
    return res.status(200).json(content);
  } catch (error: any) {
    console.error('Error fetching homepage content:', error);
    return res.status(500).json({ 
      message: 'Failed to fetch homepage content',
      error: error.message
    });
  }
}

// Update homepage content
async function updateHomepageContent(req: VercelRequest, res: VercelResponse) {
  try {
    // First ensure table exists
    try {
      await homepageService.initializeTable();
      console.log('Homepage content table initialized');
    } catch (initError) {
      console.warn('Table initialization warning:', initError);
      // Continue anyway - the table might already exist
    }
    
    console.log('Request body:', req.body);
    const { updates } = req.body;
    
    // Check if we're updating multiple content items or just one
    if (Array.isArray(updates)) {
      // Multiple updates
      if (updates.length === 0) {
        return res.status(400).json({ message: 'No updates provided' });
      }
      
      console.log(`Updating ${updates.length} homepage content items`);
      const success = await homepageService.updateMultipleContent(updates);
      
      if (success) {
        return res.status(200).json({
          message: 'Homepage content updated successfully'
        });
      } else {
        return res.status(500).json({
          message: 'Failed to update homepage content'
        });
      }
    } else {
      // Single update
      const { sectionId, contentKey, content } = req.body;
      
      if (!sectionId || !contentKey || content === undefined) {
        return res.status(400).json({ 
          message: 'Missing required fields: sectionId, contentKey, content' 
        });
      }
      
      console.log('Updating homepage content:', { sectionId, contentKey });
      const updatedContent = await homepageService.updateContent(sectionId, contentKey, content);
      
      return res.status(200).json({
        message: 'Homepage content updated successfully',
        content: updatedContent
      });
    }
  } catch (error: any) {
    console.error('Error updating homepage content:', error);
    return res.status(500).json({ 
      message: 'Failed to update homepage content',
      error: error.message
    });
  }
}
