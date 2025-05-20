import express from 'express';
import { 
  getAllApiKeys,
  getApiKeyByService,
  upsertApiKey,
  deleteApiKey
} from '../controllers/apiKeyController.js';

const router = express.Router();

// Get all API keys (without exposing the actual keys)
router.get('/', getAllApiKeys);

// Get a specific API key by service name
router.get('/:serviceName', getApiKeyByService);

// Create or update an API key
router.post('/', upsertApiKey);

// Delete an API key
router.delete('/:id', deleteApiKey);

export default router;
