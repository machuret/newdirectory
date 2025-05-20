import express from 'express';
import { 
  getAllCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  getListingsByCategory,
  getCategoriesWithCounts,
  associateCategory,
  removeCategory,
  getListingCategories
} from '../controllers/categoryController.js';

const router = express.Router();

// Category management routes
router.get('/', getAllCategories);
router.get('/with-counts', getCategoriesWithCounts);
router.get('/id/:id', getCategoryById);
router.get('/slug/:slug', getCategoryBySlug);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

// Category-listing relationship routes
router.get('/listings/:slug', getListingsByCategory);
router.get('/listing/:listing_id', getListingCategories);
router.post('/associate', associateCategory);
router.delete('/listing/:listing_id/category/:category_id', removeCategory);

export default router;
