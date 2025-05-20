import { Pool } from 'pg';
import { getPool } from './database';

// Define the Prompt interface
export interface Prompt {
  id: number;
  name: string;
  type: string; // e.g., 'description', 'faq'
  content: string;
  created_at: string;
  updated_at: string;
}

// Functions to manage prompts
export const promptService = {
  // Get all prompts
  async getAllPrompts(): Promise<Prompt[]> {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM prompts
      ORDER BY type, name
    `);
    return result.rows;
  },

  // Get prompt by type
  async getPromptByType(type: string): Promise<Prompt | null> {
    const pool = getPool();
    const result = await pool.query(`
      SELECT * FROM prompts
      WHERE type = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [type]);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Create a new prompt
  async createPrompt(data: Omit<Prompt, 'id' | 'created_at' | 'updated_at'>): Promise<Prompt> {
    const pool = getPool();
    const result = await pool.query(`
      INSERT INTO prompts (name, type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [data.name, data.type, data.content]);
    
    return result.rows[0];
  },

  // Update a prompt
  async updatePrompt(id: number, data: Partial<Prompt>): Promise<Prompt | null> {
    const pool = getPool();
    const fields: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;
    
    // Build the SET clause dynamically based on provided fields
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    });
    
    // Add updated_at timestamp
    fields.push(`updated_at = NOW()`);
    
    // Add the ID as the last parameter
    values.push(id);
    
    const result = await pool.query(`
      UPDATE prompts
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
    `, values);
    
    return result.rows.length > 0 ? result.rows[0] : null;
  },

  // Delete a prompt
  async deletePrompt(id: number): Promise<boolean> {
    const pool = getPool();
    const result = await pool.query(`
      DELETE FROM prompts
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    return result.rows.length > 0;
  },

  // Ensure the prompts table exists
  async initializeTable(): Promise<void> {
    const pool = getPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create default prompts if none exist
    const result = await pool.query('SELECT COUNT(*) FROM prompts');
    if (parseInt(result.rows[0].count) === 0) {
      await this.createDefaultPrompts();
    }
  },

  // Create default prompts
  async createDefaultPrompts(): Promise<void> {
    const defaultPrompts = [
      {
        name: 'Business Description',
        type: 'description',
        content: `
Write a compelling and detailed description for "{name}", which is a {business_type} located in {location} {rating_info}.
The description should be engaging, professionally written, and highlight the unique aspects of this business.
Include information about their services, atmosphere, and value proposition.
Keep the tone professional but warm, and make it approximately 150-200 words.
Do not use placeholder text or mention that this is AI-generated content.
        `.trim()
      },
      {
        name: 'Business FAQs',
        type: 'faq',
        content: `
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
        `.trim()
      }
    ];

    for (const prompt of defaultPrompts) {
      await this.createPrompt(prompt);
    }
  }
};

// Initialize the prompts table when this module is imported
promptService.initializeTable().catch(err => {
  console.error('Failed to initialize prompts table:', err);
});
