/**
 * @desc    Get emergency contacts, local clinics, and first aid instructions
 * @route   GET /api/emergency
 * @access  Public
 */
const getEmergencyInfo = async (req, res) => {
  // Common helpline numbers in India
  const helplineNumbers = [
    { label: 'National Emergency Number', number: '112', purpose: 'General Emergency / पुलिस' },
    { label: 'Ambulance Helpline', number: '102', purpose: 'Ambulance service / एम्बुलेंस' },
    { label: 'Medical Helpline (State)', number: '108', purpose: 'Emergency Medical Services / 108 सेवा' },
    { label: 'Health Advice / Blood Bank', number: '104', purpose: 'Medical Consultation / स्वास्थ्य परामर्श' },
    { label: 'Women Helpline', number: '1091', purpose: 'Women safety / महिला सुरक्षा' }
  ];

  // Mock clinic data for rural context (Primary Health Centers - PHCs)
  const nearbyClinics = [
    {
      name: 'Primary Health Centre (PHC) - Ramgarh',
      phone: '+91-9431102837',
      address: 'Near Gram Panchayat Office, Ramgarh, Sector 2',
      hours: '24 Hours Open',
      distance: '1.2 km'
    },
    {
      name: 'Community Health Centre (CHC) - Bilaspur',
      phone: '+91-9835109282',
      address: 'Main Bazar Road, Bilaspur Junction',
      hours: '8:00 AM - 8:00 PM',
      distance: '4.5 km'
    },
    {
      name: 'Dr. Verma Clinic (Private GP)',
      phone: '+91-9934509876',
      address: 'Station Road, near Durga Temple, Ramgarh',
      hours: '9:00 AM - 1:00 PM, 4:00 PM - 7:00 PM',
      distance: '0.8 km'
    }
  ];

  // Simple, actionable, illustrated first-aid cards in multiple languages
  const firstAidGuides = {
    en: [
      {
        title: 'Snakebite First Aid',
        steps: [
          'Keep the person calm. Restrict movement.',
          'Keep the bitten area at or below heart level.',
          'Remove tight clothing, rings, or shoes (swelling might happen).',
          'Clean the wound with soap and water. Cover with clean dressing.',
          'DO NOT cut the wound, DO NOT try to suck out venom, DO NOT apply ice.',
          'Rush the patient immediately to the nearest PHC that has anti-snake venom.'
        ],
        icon: 'snake'
      },
      {
        title: 'Heat Stroke Treatment',
        steps: [
          'Move the person into a cool, shaded area immediately.',
          'Cool them down: pour cool water over their body or apply wet clothes.',
          'Fan the person to lower body temperature.',
          'Give water or ORS to drink ONLY if they are conscious.',
          'Call for a vehicle to transport them to the hospital.'
        ],
        icon: 'sun'
      },
      {
        title: 'Bone Fracture (Broken Bone)',
        steps: [
          'Stop any bleeding by applying pressure with a clean cloth.',
          'Do NOT try to push the bone back or move the broken part.',
          'Support the broken part using a splint (stick, cardboard, or folded newspaper) tied gently to prevent movement.',
          'Apply an ice pack wrapped in a cloth to reduce swelling.',
          'Take the patient to an X-ray facility.'
        ],
        icon: 'bone'
      }
    ],
    hi: [
      {
        title: 'सांप काटने पर प्राथमिक चिकित्सा (Snakebite)',
        steps: [
          'मरीज को शांत रखें, घबराएं नहीं। शरीर में हलचल कम से कम करें।',
          'काटे गए स्थान को दिल के स्तर (heart level) से नीचे रखें।',
          'टाइट कपड़े, अंगूठी, कड़े या जूते उतार दें क्योंकि सूजन आ सकती है।',
          'घाव को साफ पानी और साबुन से धोएं। साफ पट्टी से ढकें।',
          'घाव को चीरा न लगाएं, मुंह से जहर न चूसें, और बर्फ न लगाएं।',
          'मरीज को तुरंत नजदीकी सरकारी अस्पताल (PHC) ले जाएं जहां एंटी-स्नेक वेनम उपलब्ध हो।'
        ],
        icon: 'snake'
      },
      {
        title: 'लू लगना (Heat Stroke)',
        steps: [
          'मरीज को तुरंत छायादार और ठंडी जगह पर ले जाएं।',
          'शरीर को ठंडा करें: ठंडे पानी की बौछार करें या गीले कपड़े से शरीर पोछें।',
          'हवा करें ताकि शरीर का तापमान जल्दी कम हो सके।',
          'यदि मरीज होश में हो, तो उसे पानी, ओआरएस (ORS) या नीम्बू पानी पिलाएं।',
          'तुरंत डॉक्टर के पास ले जाने की व्यवस्था करें।'
        ],
        icon: 'sun'
      },
      {
        title: 'हड्डी टूटने पर (Bone Fracture)',
        steps: [
          'यदि खून बह रहा हो, तो साफ कपड़े से दबाकर पहले खून बहना रोकें।',
          'टूटी हुई हड्डी को हिलाने या खुद से जोड़ने की कोशिश बिलकुल न करें।',
          'टूटे हिस्से के नीचे खपच्ची (लकड़ी, गत्ता या मुड़ा अखबार) रखकर हल्के से बांधें ताकि अंग हिले नहीं।',
          'सूजन कम करने के लिए कपड़े में लपेटकर बर्फ से सिकाई करें।',
          'मरीज को एक्सरे (X-Ray) सुविधा वाले अस्पताल ले जाएं।'
        ],
        icon: 'bone'
      }
    ]
  };

  return res.json({
    success: true,
    data: {
      helplines: helplineNumbers,
      clinics: nearbyClinics,
      firstAid: firstAidGuides
    }
  });
};

module.exports = {
  getEmergencyInfo
};
