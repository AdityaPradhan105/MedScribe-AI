const express = require('express');
const multer = require('multer');
const {
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  deletePrescription,
  downloadPDF
} = require('../controllers/ocrController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Multer memory storage configuration (in-memory buffer)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDF files are allowed!'), false);
    }
  }
});

// All routes are protected
router.use(protect);

router.post('/upload', upload.single('file'), uploadPrescription);
router.get('/prescriptions', getUserPrescriptions);
router.get('/prescriptions/:id', getPrescriptionById);
router.get('/prescriptions/:id/pdf', downloadPDF);
router.delete('/prescriptions/:id', deletePrescription);

module.exports = router;
