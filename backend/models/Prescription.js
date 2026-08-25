const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imagePath: {
    type: String,
    required: [true, 'Please provide an image or PDF path']
  },
  rawText: {
    type: String,
    default: ''
  },
  simplifiedContent: {
    patientName: String,
    doctorName: String,
    date: String,
    medicines: [
      {
        name: String,
        genericName: String,
        purposeSimple: String,
        dosage: String,
        frequency: String,
        timing: String,
        duration: String,
        instructions: String,
        sideEffects: [String]
      }
    ],
    generalAdvice: String,
    emergencyInstructions: String
  },
  language: {
    type: String,
    default: 'en'
  },
  translations: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prescription', PrescriptionSchema);
