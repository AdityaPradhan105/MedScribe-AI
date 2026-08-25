const User = require('../models/User');
const Prescription = require('../models/Prescription');
const Medicine = require('../models/Medicine');
const Feedback = require('../models/Feedback');

/**
 * @desc    Get dashboard metrics & analytics
 * @route   GET /api/admin/analytics
 * @access  Private (Admin)
 */
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPrescriptions = await Prescription.countDocuments();
    const totalMedicines = await Medicine.countDocuments();
    const totalFeedback = await Feedback.countDocuments();

    // Average rating
    const ratings = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);
    const averageRating = ratings.length > 0 ? ratings[0].averageRating.toFixed(1) : '5.0';

    // Count roles
    const patientCount = await User.countDocuments({ role: 'patient' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const adminCount = await User.countDocuments({ role: 'admin' });

    // Recent feedback list
    const feedbacks = await Feedback.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.json({
      success: true,
      data: {
        counts: {
          users: totalUsers,
          prescriptions: totalPrescriptions,
          medicines: totalMedicines,
          feedback: totalFeedback
        },
        roles: {
          patient: patientCount,
          doctor: doctorCount,
          admin: adminCount
        },
        averageRating,
        recentFeedback: feedbacks
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private (Admin)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private (Admin)
 */
const updateUserRole = async (req, res) => {
  const { role } = req.body;

  if (!role || !['patient', 'doctor', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid role' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting/demoting the very last admin
    if (user.role === 'admin' && role !== 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot demote the only administrator' });
      }
    }

    user.role = role;
    await user.save();

    return res.json({
      success: true,
      message: 'User role updated successfully',
      data: user
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all feedback list
 * @route   GET /api/admin/feedback
 * @access  Private (Admin)
 */
const getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Post feedback rating
 * @route   POST /api/admin/feedback
 * @access  Private
 */
const submitFeedback = async (req, res) => {
  const { rating, comments } = req.body;

  try {
    const feedback = await Feedback.create({
      user: req.user ? req.user.id : null,
      rating,
      comments
    });

    return res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAnalytics,
  getAllUsers,
  updateUserRole,
  getAllFeedback,
  submitFeedback
};
