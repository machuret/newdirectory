import { NextApiRequest, NextApiResponse } from 'next';
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received verification request for OpenAI connection');
  
  // Only allow GET requests for verification
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Create OpenAI configuration
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Validate API key exists
    if (!configuration.apiKey) {
      console.error('OpenAI API key is not configured');
      return res.status(500).json({ 
        status: 'error', 
        message: 'OpenAI API key is not configured in environment variables' 
      });
    }

    const openai = new OpenAIApi(configuration);
    
    // Make a lightweight request to verify connection
    console.log('Making test request to OpenAI API...');
    const modelsList = await openai.listModels();
    
    // If we get here, connection is working
    console.log('OpenAI connection verified successfully');
    return res.status(200).json({
      status: 'connected',
      message: 'OpenAI connection verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying OpenAI connection:', error);
    
    let statusCode = 500;
    let errorMessage = 'Unknown error occurred while verifying OpenAI connection';
    
    // Handle API error responses
    if (error.response) {
      statusCode = error.response.status;
      errorMessage = `OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
    });
  }
}
