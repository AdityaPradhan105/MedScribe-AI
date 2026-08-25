const mongoose = require('mongoose');

const TranslationSchema = new mongoose.Schema({
  uses: [String],
  dosage: String,
  sideEffects: [String],
  warnings: [String],
  precautions: [String],
  descriptionSimple: String
}, { _id: false });

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a medicine name'],
    unique: true,
    trim: true
  },
  genericName: {
    type: String,
    required: [true, 'Please add a generic name'],
    trim: true
  },
  uses: {
    type: [String],
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  sideEffects: {
    type: [String],
    default: []
  },
  warnings: {
    type: [String],
    default: []
  },
  precautions: {
    type: [String],
    default: []
  },
  alternatives: {
    type: [String],
    default: []
  },
  descriptionSimple: {
    type: String,
    required: [true, 'Please add a simple description']
  },
  translations: {
    hi: TranslationSchema,
    bn: TranslationSchema,
    mr: TranslationSchema,
    te: TranslationSchema,
    ta: TranslationSchema,
    kn: TranslationSchema,
    gu: TranslationSchema
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index name and genericName for faster search
MedicineSchema.index({ name: 'text', genericName: 'text' });

module.exports = mongoose.model('Medicine', MedicineSchema);
