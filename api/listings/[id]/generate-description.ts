import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';
import { getListingById, updateListing } from '../../lib/database';
import { promptService } from '../../lib/prompt-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== Description Generation API Called =====');
  console.log('Request method:', req.method);
  console.log('Request query params:', req.query);
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get listing ID from the request
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      console.error('Invalid listing ID provided:', id);
      return res.status(400).json({ message: 'Invalid listing ID' });
    }
    
    console.log(`Generating description for listing ID: ${id}`);
    
    // Get the listing from the database
    console.log('Fetching listing data from database...');
    const listing = await getListingById(id);
    
    if (!listing) {
      console.error(`Listing with ID ${id} not found in database`);
      return res.status(404).json({ message: `Listing with ID ${id} not found` });
    }
    
    console.log('Listing data retrieved successfully:', {
      id: listing.id,
      name: listing.name,
      type: listing.main_type
    });
    
    // Initialize OpenAI
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    if (!configuration.apiKey) {
      console.error('OpenAI API key is missing or invalid');
      return res.status(500).json({ message: 'OpenAI API key is not configured' });
    }
    
    const openai = new OpenAIApi(configuration);
    
    // Extract listing details for the prompt
    const { name, main_type, formatted_address, vicinity, rating } = listing;
    const businessType = main_type || 'business';
    const location = formatted_address || vicinity || 'various locations';
    const ratingInfo = rating ? `with a rating of ${rating} out of 5` : '';
    
    // Get the description prompt from the database
    console.log('Fetching description prompt from database...');
    const promptData = await promptService.getPromptByType('description');
    
    let promptTemplate;
    if (promptData && promptData.content) {
      console.log('Using custom prompt template from database');
      promptTemplate = promptData.content;
    } else {
      console.log('No custom prompt found, using default template');
      promptTemplate = `
        Write a compelling and detailed description for "{name}", which is a {business_type} located in {location} {rating_info}.
        The description should be engaging, professionally written, and highlight the unique aspects of this business.
        Include information about their services, atmosphere, and value proposition.
        Keep the tone professional but warm, and make it approximately 150-200 words.
        Do not use placeholder text or mention that this is AI-generated content.
      `;
    }
    
    // Replace placeholders in the prompt template
    const prompt = promptTemplate
      .replace(/{name}/g, name)
      .replace(/{business_type}/g, businessType)
      .replace(/{location}/g, location)
      .replace(/{rating_info}/g, ratingInfo);
    
    console.log('Sending request to OpenAI for description generation...');
    console.log('Prompt:', prompt);
    
    // Generate the description with OpenAI
    const response = await openai.createCompletion({
      model: "text-davinci-003", // Using a reliable model for text generation
      prompt: prompt,
      max_tokens: 350, // Allow enough tokens for a detailed description
      temperature: 0.7, // Balanced between creativity and factuality
    });
    
    const description = response.data.choices[0]?.text?.trim() || '';
    
    if (!description) {
      console.error('OpenAI returned empty description');
      return res.status(500).json({ message: 'Failed to generate description' });
    }
    
    console.log('Description generated successfully:', description.substring(0, 50) + '...');
    console.log('Updating listing in database...');
    
    // Update the listing in the database
    const updatedListing = await updateListing(id, {
      description,
      description_generated: true
    });
    
    console.log('Listing updated successfully in database');
    
    // Return the generated description
    return res.status(200).json({
      message: 'Description generated successfully',
      description,
      listing: updatedListing
    });
  } catch (error: any) {
    console.error('===== ERROR DETAILS =====');
    console.error('Error type:', typeof error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Response error data:', JSON.stringify(error.response.data));
      console.error('Response error status:', error.response.status);
    }
    
    return res.status(500).json({
      message: 'Failed to generate description',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
