const express = require('express');
const {
  searchMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine
} = require('../controllers/medicineController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All search & read endpoints are protected for logged-in users
router.use(protect);

router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);

// Write/Edit endpoints are protected & restricted by roles
router.post('/', authorize('doctor', 'admin'), addMedicine);
router.put('/:id', authorize('doctor', 'admin'), updateMedicine);
router.delete('/:id', authorize('admin'), deleteMedicine);

module.exports = router;
