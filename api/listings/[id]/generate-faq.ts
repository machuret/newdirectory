import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Configuration, OpenAIApi } from 'openai';
import { getListingById, updateListing } from '../../lib/database';
import { promptService } from '../../lib/prompt-service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('===== FAQ Generation API Called =====');
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
    
    console.log(`Generating FAQs for listing ID: ${id}`);
    
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
    const { name, main_type, formatted_address, vicinity } = listing;
    const businessType = main_type || 'business';
    const location = formatted_address || vicinity || 'various locations';
    
    // Get the FAQ prompt from the database
    console.log('Fetching FAQ prompt from database...');
    const promptData = await promptService.getPromptByType('faq');
    
    let promptTemplate;
    if (promptData && promptData.content) {
      console.log('Using custom prompt template from database');
      promptTemplate = promptData.content;
    } else {
      console.log('No custom prompt found, using default template');
      promptTemplate = `
        Generate 5 frequently asked questions (FAQs) with detailed answers for "{name}", which is a {business_type} located in {location}.
        Each question should address a different aspect of the business that potential customers might want to know about, such as:
        1. Services or products offered
        2. Business hours or availability
        3. Pricing or payment options
        4. Special features or unique selling points
        5. Customer experience or what to expect when visiting

        Format the output as a valid JSON array with each object having 'question' and 'answer' fields.
        Make the answers informative, accurate, and helpful to potential customers.
        Each answer should be 2-3 sentences long.
        Do not include any introductory or concluding text outside the JSON structure.
      `;
    }
    
    // Replace placeholders in the prompt template
    const prompt = promptTemplate
      .replace(/{name}/g, name)
      .replace(/{business_type}/g, businessType)
      .replace(/{location}/g, location);
    
    console.log('Sending request to OpenAI for FAQ generation...');
    console.log('Prompt:', prompt);
    
    // Generate the FAQs with OpenAI
    const response = await openai.createCompletion({
      model: "text-davinci-003", // Using a reliable model for structured content
      prompt: prompt,
      max_tokens: 800, // Allow enough tokens for 5 detailed Q&As
      temperature: 0.7, // Balanced between creativity and factuality
    });
    
    const content = response.data.choices[0]?.text?.trim() || '';
    console.log('Raw OpenAI response:', content);
    
    let faqs;
    
    // Parse the JSON response
    try {
      // Find the JSON array in the text (in case there's explanatory text around it)
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        console.log('JSON match found in response');
        faqs = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array is found, try parsing the entire content
        console.log('No JSON array pattern found, trying to parse entire content');
        faqs = JSON.parse(content);
      }
      
      console.log('Successfully parsed FAQs:', faqs);
    } catch (e) {
      console.error('Error parsing OpenAI FAQ JSON response:', e);
      console.log('Raw OpenAI response:', content);
      
      // Fallback to a basic structure if parsing fails
      console.log('Using fallback FAQs due to parsing error');
      faqs = [
        {
          question: `What services does ${name} offer?`,
          answer: `As a ${businessType}, ${name} offers a comprehensive range of services tailored to meet customer needs.`
        },
        {
          question: `What are the operating hours for ${name}?`,
          answer: `Please contact ${name} directly for their current operating hours as they may vary.`
        },
        {
          question: `Is ${name} available for appointments or consultations?`,
          answer: `Yes, ${name} generally offers consultations. Contact them directly to schedule.`
        }
      ];
    }
    
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      console.error('Failed to generate valid FAQs, no valid FAQ array created');
      return res.status(500).json({ message: 'Failed to generate valid FAQs' });
    }
    
    console.log(`Generated ${faqs.length} FAQs successfully`);
    console.log('Updating listing in database...');
    
    // Update the listing in the database
    const updatedListing = await updateListing(id, {
      faqs,
      faqs_generated: true
    });
    
    console.log('Listing updated successfully in database');
    
    // Return the generated FAQs
    return res.status(200).json({
      message: 'FAQs generated successfully',
      faqs,
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
      message: 'Failed to generate FAQs',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
