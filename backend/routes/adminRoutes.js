const express = require('express');
const {
  getAnalytics,
  getAllUsers,
  updateUserRole,
  getAllFeedback,
  submitFeedback
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All admin/feedback operations require login
router.use(protect);

// Feedback submission is accessible to all logged-in users
router.post('/feedback', submitFeedback);

// Restrict all other endpoints strictly to administrator role
router.get('/analytics', authorize('admin'), getAnalytics);
router.get('/users', authorize('admin'), getAllUsers);
router.put('/users/:id/role', authorize('admin'), updateUserRole);
router.get('/feedback', authorize('admin'), getAllFeedback);

module.exports = router;
