import pool from '../db.js';
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { getApiKey } from './apiKeyController.js';

// Load environment variables
dotenv.config();

// Generate business description using OpenAI
export const generateBusinessDescription = async (req, res) => {
  const { listingId } = req.params;
  
  try {
    // Get listing details
    const listingResult = await pool.query(
      'SELECT name, formatted_address, main_type, description FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    
    // Get OpenAI API key from database
    const apiKey = await getApiKey('openai');
    
    // Check if OpenAI API key is configured
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured or not found in database' });
    }
    
    // Initialize OpenAI API with the key from database
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);
    
    // Create prompt for OpenAI
    const prompt = `Write a detailed and engaging business description for a ${listing.main_type} business called "${listing.name}" located at "${listing.formatted_address}". 
    The description should be professional, informative, and highlight the business's potential offerings and value to customers.
    Include details about what customers might expect when visiting this business.
    The description should be 3-4 paragraphs long and use a professional tone.`;
    
    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const generatedDescription = completion.data.choices[0].text.trim();
    
    // Update the listing with the new description
    await pool.query(
      'UPDATE listings SET description = $1, updated_at = NOW() WHERE id = $2',
      [generatedDescription, listingId]
    );
    
    res.json({ 
      success: true, 
      description: generatedDescription,
      message: 'Business description generated and updated successfully'
    });
  } catch (error) {
    console.error('Error generating business description:', error);
    res.status(500).json({ error: 'Failed to generate business description' });
  }
};

// Generate FAQs using OpenAI
export const generateFAQs = async (req, res) => {
  const { listingId } = req.params;
  
  try {
    // Get listing details
    const listingResult = await pool.query(
      'SELECT name, formatted_address, main_type, description FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const listing = listingResult.rows[0];
    
    // Get OpenAI API key from database
    const apiKey = await getApiKey('openai');
    
    // Check if OpenAI API key is configured
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key is not configured or not found in database' });
    }
    
    // Initialize OpenAI API with the key from database
    const configuration = new Configuration({
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);
    
    // Create prompt for OpenAI
    const prompt = `Generate 4 frequently asked questions (FAQs) with detailed answers for a ${listing.main_type} business called "${listing.name}" located at "${listing.formatted_address}".
    ${listing.description ? 'Here is the business description: ' + listing.description : ''}
    
    Format the response as a JSON array with question and answer fields like this:
    [
      {
        "question": "Question 1?",
        "answer": "Answer to question 1."
      },
      {
        "question": "Question 2?",
        "answer": "Answer to question 2."
      }
    ]
    
    Make the questions and answers relevant to what customers might want to know about this business.`;
    
    // Call OpenAI API
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
    });
    
    const generatedText = completion.data.choices[0].text.trim();
    
    // Extract the JSON part from the response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    let faqs = [];
    
    if (jsonMatch) {
      try {
        faqs = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error('Error parsing FAQs JSON:', e);
        // Fallback to regex parsing if JSON parsing fails
        const questionRegex = /"question":\s*"([^"]+)"/g;
        const answerRegex = /"answer":\s*"([^"]+)"/g;
        
        const questions = [];
        const answers = [];
        
        let match;
        while ((match = questionRegex.exec(generatedText)) !== null) {
          questions.push(match[1]);
        }
        
        while ((match = answerRegex.exec(generatedText)) !== null) {
          answers.push(match[1]);
        }
        
        faqs = questions.map((question, i) => ({
          question,
          answer: answers[i] || "Information not available."
        }));
      }
    }
    
    // Update the listing with the new FAQs
    await pool.query(
      'UPDATE listings SET faq = $1::jsonb, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(faqs), listingId]
    );
    
    res.json({ 
      success: true, 
      faqs: faqs,
      message: 'FAQs generated and updated successfully'
    });
  } catch (error) {
    console.error('Error generating FAQs:', error);
    res.status(500).json({ error: 'Failed to generate FAQs' });
  }
};
