import express from 'express';
const router = express.Router();
import * as leadController from '../controllers/leadController.js';

// Create a new lead from contact form
router.post('/', leadController.createLead);

// Get all leads with pagination and filtering
router.get('/', leadController.getLeads);

// Get lead statistics
router.get('/stats', leadController.getLeadStats);

// Get a single lead by ID
router.get('/:id', leadController.getLeadById);

// Update lead status
router.put('/:id/status', leadController.updateLeadStatus);

// Delete a lead
router.delete('/:id', leadController.deleteLead);

// Bulk update lead statuses
router.put('/bulk/status', leadController.bulkUpdateLeadStatus);

export default router;
