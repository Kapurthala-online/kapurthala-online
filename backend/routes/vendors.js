const express = require('express');
const router = express.Router();
const {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getStats,
  bulkCreateVendors,
} = require('../controllers/vendorController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', getAllVendors);
router.get('/stats', protect, getStats);  // Admin only
router.get('/:id', getVendorById);

// Admin-protected routes
router.post('/', protect, createVendor);
router.post('/bulk', protect, bulkCreateVendors);
router.put('/:id', protect, updateVendor);
router.delete('/:id', protect, deleteVendor);

module.exports = router;
