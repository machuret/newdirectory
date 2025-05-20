import express from 'express';
import { 
  getAllListings,
  getListingById,
  getListingsByBusinessType,
  getFeaturedListings,
  createListing,
  updateListing,
  updateFeaturedStatus,
  deleteListing
} from '../controllers/listingController.js';

const router = express.Router();

// Get all listings
router.get('/', getAllListings);

// Get featured listings
router.get('/featured', getFeaturedListings);

// Get listings by business type
router.get('/by-type/:type', getListingsByBusinessType);

// Get a single listing by ID
router.get('/:id', getListingById);

// Create a new listing
router.post('/', createListing);

// Update an existing listing
router.put('/:id', updateListing);

// Update featured status for multiple listings
router.put('/featured/batch', updateFeaturedStatus);

// Delete a listing
router.delete('/:id', deleteListing);

export default router;
