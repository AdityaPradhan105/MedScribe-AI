const Medicine = require('../models/Medicine');
const { simplifyMedicalTerms, cleanJsonString, retryCall } = require('../utils/gemini');

/**
 * Helper to dynamically create a new medicine profile using Gemini
 */
const generateMedicineProfile = async (medicineName, lang = 'en') => {
  try {
    console.log(`Generating medicine profile for: ${medicineName} via Gemini...`);
    const prompt = `
      Create a simplified medical profile for the medicine brand or drug "${medicineName}".
      
      Respond ONLY with a JSON object matching this schema:
      {
        "name": "Correct standard brand name or drug name capitalized",
        "genericName": "Scientific generic/chemical name",
        "uses": ["2-3 main uses explained in simple language"],
        "dosage": "Typical standard adult dosage in simple terms",
        "sideEffects": ["2-3 common side effects in simple language"],
        "warnings": ["2-3 critical warnings or danger signals"],
        "precautions": ["2-3 precautions, e.g. alcohol, driving, pregnancy"],
        "alternatives": ["2-3 alternative common Indian brand names for this drug"],
        "descriptionSimple": "A 1-2 sentence explanation of what this medicine does in extremely simple words."
      }
    `;

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await retryCall(() =>
      model.generateContent([prompt], {
        generationConfig: { responseMimeType: 'application/json' }
      })
    );

    const parsedData = JSON.parse(cleanJsonString(result.response.text()));

    // Generate Hindi translation automatically as well for cache warming
    let hiTranslation = null;
    try {
      const hiPrompt = `
        Translate the following medicine details into simple Hindi (हिन्दी) for rural users.
        Details: ${JSON.stringify(parsedData)}
        
        Respond ONLY with a JSON object matching this schema:
        {
          "uses": ["uses translated to Hindi"],
          "dosage": "dosage translated to Hindi",
          "sideEffects": ["side effects translated to Hindi"],
          "warnings": ["warnings translated to Hindi"],
          "precautions": ["precautions translated to Hindi"],
          "descriptionSimple": "descriptionSimple translated to Hindi"
        }
      `;
      const hiResult = await retryCall(() =>
        model.generateContent([hiPrompt], {
          generationConfig: { responseMimeType: 'application/json' }
        })
      );
      hiTranslation = JSON.parse(cleanJsonString(hiResult.response.text()));
    } catch (hiErr) {
      console.error('Failed to pre-translate medicine details to Hindi:', hiErr.message);
    }

    // Save in DB
    const newMedicine = await Medicine.create({
      ...parsedData,
      translations: hiTranslation ? { hi: hiTranslation } : {}
    });

    return newMedicine;
  } catch (error) {
    console.error(`Error generating profile for ${medicineName}:`, error);
    throw new Error(`Failed to generate medicine profile: ${error.message}`);
  }
};

/**
 * @desc    Search medicine by name or generic name
 * @route   GET /api/medicines/search
 * @access  Private
 */
const searchMedicines = async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.status(400).json({ success: false, message: 'Please provide a search term' });
  }

  try {
    // Search local database
    let medicines = await Medicine.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { genericName: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);

    // If not found and query is long enough, dynamically generate medicine profile via Gemini
    if (medicines.length === 0 && query.trim().length >= 3 && process.env.GEMINI_API_KEY) {
      try {
        const generated = await generateMedicineProfile(query.trim());
        if (generated) {
          medicines = [generated];
        }
      } catch (err) {
        console.warn('Dynamic medicine generation failed:', err.message);
      }
    }

    return res.json({
      success: true,
      count: medicines.length,
      data: medicines
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single medicine details by ID
 * @route   GET /api/medicines/:id
 * @access  Private
 */
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const lang = req.query.lang || 'en';

    // If regional language requested but translation doesn't exist yet in DB, dynamically generate translation!
    if (lang !== 'en' && (!medicine.translations || !medicine.translations[lang]) && process.env.GEMINI_API_KEY) {
      try {
        console.log(`Generating dynamic translation for medicine: ${medicine.name} to language: ${lang}`);
        
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const translationPrompt = `
          Translate these medicine details into simple regional language (Code: ${lang}).
          Details:
          Uses: ${JSON.stringify(medicine.uses)}
          Dosage: ${medicine.dosage}
          Side Effects: ${JSON.stringify(medicine.sideEffects)}
          Warnings: ${JSON.stringify(medicine.warnings)}
          Precautions: ${JSON.stringify(medicine.precautions)}
          Description Simple: ${medicine.descriptionSimple}

          Respond ONLY with a JSON object matching this schema:
          {
            "uses": ["translated uses"],
            "dosage": "translated dosage",
            "sideEffects": ["translated side effects"],
            "warnings": ["translated warnings"],
            "precautions": ["translated precautions"],
            "descriptionSimple": "translated simplified description"
          }
        `;

          const transResult = await retryCall(() =>
            model.generateContent([translationPrompt], {
              generationConfig: { responseMimeType: 'application/json' }
            })
          );

        const translatedData = JSON.parse(cleanJsonString(transResult.response.text()));

        // Update medicine record with cached translation
        if (!medicine.translations) {
          medicine.translations = {};
        }
        medicine.translations[lang] = translatedData;
        medicine.markModified('translations');
        await medicine.save();
      } catch (err) {
        console.error(`Failed dynamic translation of medicine details:`, err);
      }
    }

    return res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Add new medicine profile (Manual)
 * @route   POST /api/medicines
 * @access  Private (Doctor/Admin)
 */
const addMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.create(req.body);
    return res.status(201).json({
      success: true,
      data: medicine
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Medicine with this name already exists' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update medicine profile
 * @route   PUT /api/medicines/:id
 * @access  Private (Doctor/Admin)
 */
const updateMedicine = async (req, res) => {
  try {
    let medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.json({
      success: true,
      data: medicine
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete medicine
 * @route   DELETE /api/medicines/:id
 * @access  Private (Admin)
 */
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    await medicine.deleteOne();

    return res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  searchMedicines,
  getMedicineById,
  addMedicine,
  updateMedicine,
  deleteMedicine
};
