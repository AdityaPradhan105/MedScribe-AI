const mongoose = require('mongoose');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Feedback = require('../models/Feedback');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // load from parent folder relative to script location

const seedData = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URI is not defined in .env file');
    process.exit(1);
  }
  
  try {
    console.log('Connecting to MongoDB database to seed initial data...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // 1. Seed Demo Users
    console.log('Clearing existing users...');
    await User.deleteMany();

    console.log('Seeding default users (Admin, Doctor, Patient)...');
    
    const admin = await User.create({
      name: 'Aditya Pradhan',
      email: 'admin@gmail.com',
      password: 'adminpassword', // bcrypt hook will hash this on save
      role: 'admin',
      languagePreference: 'hi'
    });

    const doctor = await User.create({
      name: 'Aditya Pradhan',
      email: 'doctor@gmail.com',
      password: 'doctorpassword',
      role: 'doctor',
      languagePreference: 'en'
    });

    const patient = await User.create({
      name: 'Ramesh Kumar (Patient)',
      email: 'patient@gmail.com',
      password: 'patientpassword',
      role: 'patient',
      languagePreference: 'hi',
      medicalHistory: [
        {
          condition: 'Mild Asthma',
          diagnosedAt: new Date(2025, 4, 12),
          notes: 'Avoid exposure to dust and cold climate. Use inhaler if needed.',
          doctorName: 'Aditya Pradhan'
        }
      ]
    });

    // Reset password strings in plain text so seed matches console logs
    // The model hook will hash these automatically when save() is called by create()
    // Let's force set simple password hashes for local testing so they are easy to type: "123456"
    admin.password = '123456';
    await admin.save();

    doctor.password = '123456';
    await doctor.save();

    patient.password = '123456';
    await patient.save();

    console.log('Demo Users Seeded successfully:');
    console.log('- Admin: admin@gmail.com / 123456');
    console.log('- Doctor: doctor@gmail.com / 123456');
    console.log('- Patient: patient@gmail.com / 123456');

    // 2. Seed Directory Medicines
    console.log('Clearing existing medicines directory...');
    await Medicine.deleteMany();

    console.log('Seeding medicines data...');
    await Medicine.create([
      {
        name: 'Paracetamol 650mg',
        genericName: 'Paracetamol',
        uses: ['Reducing fever (बुखार)', 'Body ache & headache (बदन दर्द)'],
        dosage: '1 tablet twice or thrice daily after meals',
        sideEffects: ['Mild sweating', 'Nausea if taken empty stomach'],
        warnings: ['Do not exceed 4 tablets in 24 hours', 'Keep at least 4-6 hours gap between doses'],
        precautions: ['Avoid alcohol intake', 'Consult doctor if fever persists > 3 days'],
        alternatives: ['Dolo 650', 'Calpol 650', 'Pyrigesic 650'],
        descriptionSimple: 'This medicine is used to treat mild to moderate fever and relieve pain (headache, toothache, or joint pain).',
        translations: {
          hi: {
            uses: ['बुखार कम करने के लिए', 'बदन दर्द और सिरदर्द से राहत के लिए'],
            dosage: 'खाना खाने के बाद दिन में दो या तीन बार 1 गोली',
            sideEffects: ['हल्का पसीना आना', 'खाली पेट लेने पर जी मिचलाना'],
            warnings: ['24 घंटे में 4 गोली से अधिक न लें', 'दो खुराकों के बीच कम से कम 4-6 घंटे का अंतर रखें'],
            precautions: ['शराब के सेवन से बचें', 'यदि बुखार 3 दिन से अधिक रहे तो डॉक्टर से मिलें'],
            descriptionSimple: 'यह दवा सामान्य बुखार को कम करने और बदन दर्द (जैसे सिरदर्द, दांत दर्द या जोड़ों के दर्द) से राहत पाने के लिए दी जाती है।'
          }
        }
      },
      {
        name: 'Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        uses: ['Controlling type 2 diabetes (शुगर)', 'Reducing blood glucose'],
        dosage: '1 tablet daily with or after dinner',
        sideEffects: ['Diarrhea (दस्त)', 'Stomach ache', 'Metallic taste in mouth'],
        warnings: ['Do not take on empty stomach to avoid stomach upset', 'Monitor blood sugar levels regularly'],
        precautions: ['Limit alcohol to avoid lactic acidosis', 'Stay hydrated'],
        alternatives: ['Glycomet 500', 'Metokem 500', 'Exermet 500'],
        descriptionSimple: 'This medicine helps lower blood sugar levels in patients with type-2 diabetes, assisting the body to use insulin better.',
        translations: {
          hi: {
            uses: ['टाइप 2 मधुमेह (शुगर) को नियंत्रित करने के लिए', 'खून में ग्लूकोज की मात्रा कम करने के लिए'],
            dosage: 'रात के भोजन के साथ या उसके तुरंत बाद 1 गोली',
            sideEffects: ['दस्त लगना', 'पेट में हल्का दर्द', 'मुंह का स्वाद धातु जैसा होना'],
            warnings: ['पेट की खराबी से बचने के लिए खाली पेट न लें', 'नियमित रूप से अपनी शुगर जांचें'],
            precautions: ['शराब का सेवन बिलकुल न करें', 'खूब पानी पिएं'],
            descriptionSimple: 'यह दवा टाइप-2 डायबिटीज के मरीजों में खून की शुगर को कम करने में मदद करती है, जिससे शरीर इंसुलिन का बेहतर उपयोग कर पाता है।'
          }
        }
      },
      {
        name: 'Cetirizine 10mg',
        genericName: 'Cetirizine Dihydrochloride',
        uses: ['Allergy symptoms (एलर्जी)', 'Running nose & sneezing (जुकाम)', 'Watery eyes'],
        dosage: '1 tablet once daily at bedtime',
        sideEffects: ['Drowsiness (नींद आना)', 'Dry mouth', 'Tiredness'],
        warnings: ['Do not drive or operate machinery after taking this', 'May cause drowsiness'],
        precautions: ['Do not take with sleeping pills', 'Limit alcohol consumption'],
        alternatives: ['Alerid 10', 'Okacet 10', 'Zyrtec 10'],
        descriptionSimple: 'This is an antiallergic medicine used to treat runny nose, watery eyes, sneezing, and skin itching caused by allergies.',
        translations: {
          hi: {
            uses: ['एलर्जी के लक्षणों को ठीक करने के लिए', 'बहती नाक और छींक (जुकाम) के लिए', 'आँखों में खुजली और पानी आने पर'],
            dosage: 'रात को सोने से पहले दिन में 1 बार 1 गोली',
            sideEffects: ['नींद या सुस्ती आना', 'मुंह सूखना', 'थकान महसूस होना'],
            warnings: ['इसे खाने के बाद गाड़ी या कोई मशीन न चलाएं', 'इससे सुस्ती आ सकती है'],
            precautions: ['नींद की अन्य दवाओं के साथ न लें', 'शराब से परहेज करें'],
            descriptionSimple: 'यह एक एलर्जी रोधी दवा है जिसका उपयोग बहती नाक, छींकने, आँखों से पानी आने और एलर्जी के कारण होने वाली त्वचा की खुजली के इलाज के लिए किया जाता है।'
          }
        }
      }
    ]);
    console.log('Medicines seeded successfully.');

    // 3. Seed Mock Feedback
    console.log('Clearing existing feedback...');
    await Feedback.deleteMany();

    console.log('Seeding mock feedbacks...');
    await Feedback.create([
      {
        rating: 5,
        comments: 'Excellent app! The voice assistant is very helpful for my grandmother who cannot read English.',
        user: patient._id
      },
      {
        rating: 4,
        comments: 'Prescription scanner is working very fast. The translations in Hindi are simple to understand.',
        user: patient._id
      }
    ]);
    console.log('Feedback seeded successfully.');

    console.log('All seed operations completed successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  }
};

seedData();
