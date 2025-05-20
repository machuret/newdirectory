import { Configuration, OpenAIApi } from 'openai';
import { NextApiRequest, NextApiResponse } from 'next';
import { Listing } from '@/types/listing';
import { getListingById, updateListing } from '../lib/database';

// Initialize OpenAI configuration
const initializeOpenAI = () => {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!configuration.apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  return new OpenAIApi(configuration);
};

// Verify OpenAI connection
export const verifyOpenAIConnection = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const openai = initializeOpenAI();
    
    // Make a minimal API call to verify the connection
    await openai.listModels();
    
    return res.status(200).json({ status: 'connected', message: 'OpenAI connection successful' });
  } catch (error: any) {
    console.error('OpenAI connection error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Failed to connect to OpenAI API'
    });
  }
};

// Generate a listing description
export const generateDescription = async (listing: Listing): Promise<string> => {
  try {
    const openai = initializeOpenAI();
    
    // Extract listing details for prompt construction
    const { name, main_type, formatted_address, vicinity, rating, reviews } = listing;
    const businessType = main_type || 'business';
    const location = formatted_address || vicinity || '';
    const ratingInfo = rating ? `with a rating of ${rating} out of 5` : '';
    
    // Construct a detailed prompt for better descriptions
    const prompt = `
      Write a compelling and detailed description for "${name}", which is a ${businessType} located in ${location} ${ratingInfo}.
      The description should be engaging, professionally written, and highlight the unique aspects of this business.
      Include information about their services, atmosphere, and value proposition.
      Keep the tone professional but warm, and make it approximately 150-200 words.
      Do not use placeholder text or mention that this is AI-generated content.
    `;
    
    const response = await openai.createCompletion({
      model: "text-davinci-003", // Using a reliable model for text generation
      prompt: prompt,
      max_tokens: 350, // Allow enough tokens for a detailed description
      temperature: 0.7, // Balanced between creativity and factuality
    });
    
    const description = response.data.choices[0]?.text?.trim() || '';
    return description;
  } catch (error) {
    console.error('Error generating description with OpenAI:', error);
    throw new Error('Failed to generate description using OpenAI');
  }
};

// Generate FAQs for a listing
export const generateFAQs = async (listing: Listing): Promise<Array<{ question: string, answer: string }>> => {
  try {
    const openai = initializeOpenAI();
    
    // Extract listing details for prompt construction
    const { name, main_type } = listing;
    const businessType = main_type || 'business';
    
    // Construct a detailed prompt for realistic FAQs
    const prompt = `
      Generate 5 frequently asked questions (FAQs) with detailed answers for "${name}", which is a ${businessType}.
      These should address common customer inquiries and provide helpful, informative responses.
      Cover topics such as services offered, operating hours, pricing, unique features, and customer experience.
      Format each FAQ as a JSON object with "question" and "answer" properties, and return them in a JSON array.
      For example: [{"question": "What services does this business offer?", "answer": "We offer..."}]
    `;
    
    const response = await openai.createCompletion({
      model: "text-davinci-003", // Using a reliable model for structured content
      prompt: prompt,
      max_tokens: 800, // Allow enough tokens for 5 detailed Q&As
      temperature: 0.7, // Balanced between creativity and factuality
    });
    
    const content = response.data.choices[0]?.text?.trim() || '';
    
    // Parse the JSON response - this requires the OpenAI output to be in valid JSON format
    try {
      // Find the JSON array in the text (in case there's explanatory text around it)
      const jsonMatch = content.match(/\[.*\]/s);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON array is found, try parsing the entire content
      return JSON.parse(content);
    } catch (e) {
      console.error('Error parsing OpenAI FAQ JSON response:', e);
      console.log('Raw OpenAI response:', content);
      
      // Fallback to a basic structure if parsing fails
      return [
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
  } catch (error) {
    console.error('Error generating FAQs with OpenAI:', error);
    throw new Error('Failed to generate FAQs using OpenAI');
  }
};
