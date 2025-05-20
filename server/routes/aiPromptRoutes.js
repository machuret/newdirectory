import express from 'express';
import { 
  generateBusinessDescription,
  generateFAQs
} from '../controllers/aiPromptController.js';

const router = express.Router();

// Generate business description
router.post('/description/:listingId', generateBusinessDescription);

// Generate FAQs
router.post('/faq/:listingId', generateFAQs);

export default router;
