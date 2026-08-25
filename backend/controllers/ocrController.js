const Prescription = require('../models/Prescription');
const { simplifyPrescriptionTextOrImage, translatePrescription, retryCall, cleanJsonString } = require('../utils/gemini');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');


/**
 * @desc    Upload and simplify a prescription image or PDF
 * @route   POST /api/ocr/upload
 * @access  Private
 */
const uploadPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a prescription image or PDF' });
    }

    const targetLanguage = req.body.language || 'en';
    
    // Process image/PDF buffer via Gemini API
    console.log(`Processing file: ${req.file.originalname} (${req.file.mimetype}) in language: ${targetLanguage}`);
    
    const simplifiedData = await simplifyPrescriptionTextOrImage(
      req.file.buffer,
      req.file.mimetype,
      targetLanguage
    );

    if (simplifiedData.error) {
      return res.status(422).json({ success: false, message: simplifiedData.error });
    }

    // Save processed prescription to database
    // We store the image name/mime in memory. Since we don't save physical files to disk,
    // we can represent the file path as an in-memory URI or store a mock path,
    // or we can convert it to a base64 DataURL or store it locally.
    // Let's store a base64 DataURL so the frontend can easily render it back to the user!
    // This is a brilliant mobile-first design decision: the user uploads, and we save the base64 string
    // in the database, meaning they can always view their original prescription image even without disk storage configs.
    const base64Data = req.file.buffer.toString('base64');
    const imagePath = `data:${req.file.mimetype};base64,${base64Data}`;

    // Sanitize array outputs to clean bulleted text lists (satisfies Mongoose schema & formatting)
    if (simplifiedData) {
      if (Array.isArray(simplifiedData.generalAdvice)) {
        simplifiedData.generalAdvice = simplifiedData.generalAdvice.map(x => `• ${x}`).join('\n');
      }
      if (Array.isArray(simplifiedData.emergencyInstructions)) {
        simplifiedData.emergencyInstructions = simplifiedData.emergencyInstructions.map(x => `• ${x}`).join('\n');
      }
    }

    const prescription = await Prescription.create({
      user: req.user.id,
      imagePath: imagePath,
      rawText: 'Processed via Gemini Multi-modal OCR',
      simplifiedContent: simplifiedData,
      language: targetLanguage
    });

    return res.status(201).json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('OCR Controller Error:', error);
    const errMsg = error.message ? error.message.toLowerCase() : '';
    if (
      errMsg.includes('503') ||
      errMsg.includes('429') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('experiencing high demand') ||
      errMsg.includes('service unavailable')
    ) {
      return res.status(503).json({ success: false, message: 'SERVER_BUSY' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all prescriptions for logged in user
 * @route   GET /api/ocr/prescriptions
 * @access  Private
 */
const getUserPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: prescriptions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single prescription by ID
 * @route   GET /api/ocr/prescriptions/:id
 * @access  Private
 */
const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Check ownership
    if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(401).json({ success: false, message: 'Not authorized to view this prescription' });
    }

    const lang = req.query.lang || prescription.language;
    if (lang && process.env.GEMINI_API_KEY) {
      if (!prescription.translations) {
        prescription.translations = new Map();
      }

      const isOriginalLanguage = (lang === prescription.language);
      let activeContent = isOriginalLanguage ? prescription.simplifiedContent : prescription.translations.get(lang);

      // We trigger regeneration if the content for the requested language doesn't exist,
      // or if it exists but is missing our newly introduced TTS narration/transliteration fields.
      if (!activeContent || !activeContent.ttsTransliterated || !activeContent.ttsNarration) {
        console.log(`Generating or healing dynamic translation of prescription ${prescription._id} to language: ${lang}`);
        try {
          const translatedData = await translatePrescription(prescription.simplifiedContent, lang);
          
          // Sanitize array outputs to clean bulleted text lists
          if (Array.isArray(translatedData.generalAdvice)) {
            translatedData.generalAdvice = translatedData.generalAdvice.map(x => `• ${x}`).join('\n');
          }
          if (Array.isArray(translatedData.emergencyInstructions)) {
            translatedData.emergencyInstructions = translatedData.emergencyInstructions.map(x => `• ${x}`).join('\n');
          }

          if (isOriginalLanguage) {
            // Heal the original document
            prescription.simplifiedContent = translatedData;
            prescription.markModified('simplifiedContent');
          } else {
            // Cache in translations map
            prescription.translations.set(lang, translatedData);
            prescription.markModified('translations');
          }
          
          await prescription.save();
          activeContent = translatedData;
        } catch (geminiError) {
          console.error(`Failed to heal/translate prescription ${prescription._id} via Gemini:`, geminiError);
          // If we already have some cached content for this language, use it as a fallback!
          if (activeContent) {
            console.log(`Fallback: using cached translation (without TTS fields) due to Gemini API error.`);
          } else {
            // No cached content exists, so we must report the error
            throw geminiError;
          }
        }
      }

      // Overwrite for client response
      prescription.simplifiedContent = activeContent;
      prescription.language = lang;
    }

    return res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    console.error('OCR Get By ID Error:', error);
    const errMsg = error.message ? error.message.toLowerCase() : '';
    if (
      errMsg.includes('503') ||
      errMsg.includes('429') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('experiencing high demand') ||
      errMsg.includes('service unavailable')
    ) {
      return res.status(503).json({ success: false, message: 'SERVER_BUSY' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete prescription
 * @route   DELETE /api/ocr/prescriptions/:id
 * @access  Private
 */
const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Check ownership
    if (prescription.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this prescription' });
    }

    await prescription.deleteOne();

    return res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Download simplified prescription as PDF
 * @route   GET /api/ocr/prescriptions/:id/pdf
 * @access  Private
 */
const downloadPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // Check ownership or permissions
    if (
      prescription.user.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'doctor'
    ) {
      return res.status(401).json({ success: false, message: 'Not authorized to download this PDF' });
    }

    const pdfBuffer = await generatePrescriptionPDF(prescription);

    res.contentType('application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=simplified_prescription_${prescription._id}.pdf`);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF Download Controller Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
  uploadPrescription,
  getUserPrescriptions,
  getPrescriptionById,
  deletePrescription,
  downloadPDF
};

