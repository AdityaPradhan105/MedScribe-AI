const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Check if Gemini API key exists
const apiKey = process.env.GEMINI_API_KEY;
let genAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('Warning: GEMINI_API_KEY is not defined. AI features will run in Mock Mode.');
}

// Map language codes to names for the LLM prompt
const languageNames = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  te: 'Telugu (తెలుగు)',
  ta: 'Tamil (தமிழ்)',
  kn: 'Kannada (ಕನ್ನಡ)',
  gu: 'Gujarati (ગુજરાતી)'
};

/**
 * Helper to convert file buffer to Generative AI inline data structure
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType
    }
  };
}

/**
 * Helper to clean markdown code block wraps from Gemini output text
 */
function cleanJsonString(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

/**
 * Helper to retry API calls on transient errors with backoff
 */
async function retryCall(fn, retries = 4, delay = 3000) {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    // Check if error is transient (e.g. 503 Service Unavailable, 429 Rate Limit)
    const errMsg = error.message ? error.message.toLowerCase() : '';
    if (
      errMsg.includes('503') ||
      errMsg.includes('429') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('experiencing high demand') ||
      errMsg.includes('service unavailable') ||
      errMsg.includes('too many requests')
    ) {
      console.warn(`Gemini call failed with transient error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryCall(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

// Fallback list of models to try in case of rate limit (429) errors on the default model
const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite'
];

/**
 * Helper to generate content with fallback to alternative Gemini models on rate limits
 */
const generateContentWithFallback = async (promptOrParts, generationConfig = {}, systemInstruction = null) => {
  let lastError = null;
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Attempting generateContent with Gemini model: ${modelName}`);
      const modelOptions = { model: modelName };
      if (systemInstruction) {
        modelOptions.systemInstruction = systemInstruction;
      }
      const model = genAI.getGenerativeModel(modelOptions);
      
      const result = await retryCall(() =>
        model.generateContent(promptOrParts, { generationConfig }),
        2, // 2 retries per model to avoid excessive waiting
        2000
      );
      console.log(`SUCCESS with Gemini model: ${modelName}`);
      return result;
    } catch (error) {
      console.warn(`FAILED with Gemini model: ${modelName} -> Error: ${error.message}`);
      lastError = error;
    }
  }
  throw new Error(`All Gemini models failed. Last error: ${lastError ? lastError.message : 'Unknown'}`);
};

/**
 * Simplifies a prescription image or PDF using Gemini Multimodal
 */
const simplifyPrescriptionTextOrImage = async (fileBuffer, mimeType, targetLanguage = 'en') => {
  const targetLangName = languageNames[targetLanguage] || 'English';

  if (!genAI) {
    return getMockPrescriptionData(targetLanguage);
  }

  try {
    const prompt = `
      You are an expert medical assistant trained to support rural Indian patients who have low health literacy.
      Your task is to analyze the attached prescription (which could be an image or a PDF, handwritten or printed).
      
      Perform OCR to extract all information, simplify it, and translate it into ${targetLangName}.
      
      You must respond ONLY with a JSON object. The JSON must strictly match the following schema:
      {
        "patientName": "Name of the patient (if readable, otherwise 'Unknown')",
        "doctorName": "Name of the doctor/clinic/hospital (if readable, otherwise 'Unknown')",
        "date": "Date of prescription (if readable, otherwise 'Unknown')",
        "medicines": [
          {
            "name": "Original brand name of the medicine exactly as written in the prescription",
            "genericName": "Scientific or generic chemical name of the drug",
            "purposeSimple": "Explain in very simple words what this medicine is used for. Do not use jargon like 'analgesic', say 'For body pain/fever'.",
            "dosage": "How much to take (e.g., '1 tablet', '5 ml', '1 capsule')",
            "frequency": "How often to take in a day (e.g., 'Three times a day' or '1-0-1' or 'Once at night')",
            "timing": "When to take relative to food (e.g., 'After eating food', 'On an empty stomach')",
            "duration": "For how many days (e.g., '5 days', 'Continue until doctor says')",
            "instructions": "Any special warning or instruction in simple words (e.g., 'Take with warm water', 'Avoid cold drinks')",
            "sideEffects": ["2 or 3 common side effects explained simply (e.g., 'May cause sleepiness', 'Dry mouth')"]
          }
        ],
        "generalAdvice": "Simple summary of general guidelines written (e.g., 'Drink lots of water', 'Rest for 3 days', 'Avoid oily food').",
        "emergencyInstructions": "List 2-3 critical symptoms or warnings that mean the patient should immediately STOP the medicine and go to a hospital (e.g., 'Severe skin rash', 'Difficulty breathing').",
        "ttsNarration": "A natural, flowing paragraph summarizing this entire prescription in simple language in ${targetLangName} (e.g. Devanagari script for Hindi) for read-aloud playback.",
        "ttsTransliterated": "A phonetic transliteration of the 'ttsNarration' written in English characters (Latin script, e.g. Hinglish for Hindi) so that an English TTS speaker can read it out phonetically if the system lacks native regional voices."
      }

      Important rules:
      1. Translate the values of ALL fields (like purposeSimple, dosage, frequency, timing, instructions, generalAdvice, emergencyInstructions, sideEffects, ttsNarration) into ${targetLangName}.
      2. The "name" field of the medicine MUST remain in English (so they can match it with the physical medicine packet which is usually printed in English). The "genericName" can be in English or transliterated, but keep it clear.
      3. Use the simplest possible terms in ${targetLangName} that a common villager can easily understand.
      4. If you cannot read the file or if it is not a prescription, return an object with a field "error": "This file does not look like a readable medical prescription. Please upload a clearer image."
    `;

    const imagePart = fileToGenerativePart(fileBuffer, mimeType);

    const result = await generateContentWithFallback(
      [prompt, imagePart],
      { responseMimeType: 'application/json' }
    );

    const text = result.response.text();
    return JSON.parse(cleanJsonString(text));
  } catch (error) {
    console.error('Gemini API Error (Prescription OCR):', error);
    throw new Error(`Failed to simplify prescription: ${error.message}`);
  }
};

/**
 * Simplifies a specific medical term or disease
 */
const simplifyMedicalTerms = async (term, targetLanguage = 'en') => {
  const targetLangName = languageNames[targetLanguage] || 'English';

  if (!genAI) {
    return getMockTermSimplification(term, targetLanguage);
  }

  try {
    const prompt = `
      Explain the medical term or disease "${term}" to a rural Indian villager who speaks ${targetLangName}.
      
      Respond ONLY with a JSON object matching this schema:
      {
        "term": "The term asked",
        "simpleExplanation": "Explain in 2-3 simple sentences what this is in very basic language.",
        "commonSymptoms": ["3-4 common symptoms explained simply"],
        "basicTreatments": ["General simple treatments or lifestyle changes (mentioning they should see a doctor)"],
        "whenToSeeDoctor": "Clear warnings or emergency triggers."
      }
      
      All explanation values must be in ${targetLangName}.
    `;

    const result = await generateContentWithFallback(
      [prompt],
      { responseMimeType: 'application/json' }
    );

    return JSON.parse(cleanJsonString(result.response.text()));
  } catch (error) {
    console.error('Gemini API Error (Term Simplifier):', error);
    return getMockTermSimplification(term, targetLanguage);
  }
};

/**
 * Translates and simplifies a prescription structure into target language
 */
const translatePrescription = async (prescriptionContent, targetLanguage = 'en') => {
  const targetLangName = languageNames[targetLanguage] || 'English';

  if (!genAI) {
    return prescriptionContent;
  }

  try {
    const translationPrompt = `
      You are a professional medical translator.
      Translate and simplify the following prescription details into ${targetLangName} for a rural patient.
      Details:
      ${JSON.stringify(prescriptionContent)}
      
      Respond ONLY with a JSON object matching this schema:
      {
        "patientName": "Translated patient name (keep original if proper noun)",
        "doctorName": "Translated doctor/clinic name (keep original if proper noun)",
        "date": "Date of prescription",
        "medicines": [
          {
            "name": "Keep this brand name exactly in English",
            "genericName": "Generic name of medicine",
            "purposeSimple": "Translated simplified purpose of medicine",
            "dosage": "Translated dosage",
            "frequency": "Translated frequency",
            "timing": "Translated timing",
            "duration": "Translated duration",
            "instructions": "Translated instructions",
            "sideEffects": ["Translated side effects"]
          }
        ],
        "generalAdvice": "Translated general health advice",
        "emergencyInstructions": "Translated emergency warning instructions",
        "ttsNarration": "A natural, flowing paragraph summarizing this entire prescription in simple language in ${targetLangName} (e.g. Devanagari script for Hindi) for read-aloud playback.",
        "ttsTransliterated": "A phonetic transliteration of the 'ttsNarration' written in English characters (Latin script, e.g. Hinglish for Hindi) so that an English TTS speaker can read it out phonetically if the system lacks native regional voices."
      }

      Rules:
      1. Keep all medicine brand names in English so patients can match them with their medicine packet label.
      2. Translate all other values to simple, easy-to-understand ${targetLangName}.
    `;

    const result = await generateContentWithFallback(
      [translationPrompt],
      { responseMimeType: 'application/json' }
    );

    return JSON.parse(cleanJsonString(result.response.text()));
  } catch (error) {
    console.error('Gemini API Error (Translation):', error);
    throw error;
  }
};

/**
 * Conversational Health Chatbot with Gemini
 */
const chatHealthcareAssistant = async (chatHistory, userMessage, targetLanguage = 'en') => {
  const targetLangName = languageNames[targetLanguage] || 'English';

  const systemInstruction = `
    You are a friendly, compassionate AI Rural Health Assistant named "MedScribe AI", developed and maintained by Aditya Pradhan.
    Your goal is to answer health-related queries for villagers in rural India in a simple, supportive tone using ${targetLangName}.
    
    Follow these constraints strictly:
    1. Talk in simple, short sentences. Avoid complex medical words.
    2. If asked about treatments, suggest home remedies or general precautions first (like staying hydrated, taking rest) but ALWAYS emphasize seeing a local doctor or health worker (ASHA worker).
    3. Highlight emergency warnings clearly.
    4. You MUST write your entire response in the target language: ${targetLangName} (using its native script, e.g. Devanagari script for Hindi). Even if the user message is written in English or Latin characters, you must reply strictly in ${targetLangName} script. Do not write in English unless ${targetLangName} is English.
    5. Add a short warning disclaimer at the end of every message reminding them that you are an AI assistant and they must consult a real doctor for serious illness.
    6. Do not prescribe specific antibiotics or high-risk scheduled drugs. Recommend common generic options like paracetamol for mild fever, ORS for dehydration, and advise medical consultations.
    7. If asked about who made you or who owns this application, proudly state that you are developed and maintained by developer Aditya Pradhan.
  `;

  // Try using Groq if API key is configured
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey) {
    try {
      console.log('Attempting Groq API for health chat assistant...');
      // Format chat history for OpenAI/Groq: [{ role: 'user' | 'assistant', content: string }]
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));

      // Filter leading assistant messages to maintain standard ordering
      let cleanHistory = [...formattedHistory];
      while (cleanHistory.length > 0 && cleanHistory[0].role === 'assistant') {
        cleanHistory.shift();
      }

      const messages = [
        { role: 'system', content: systemInstruction },
        ...cleanHistory,
        { role: 'user', content: userMessage }
      ];

      const makeGroqRequest = async (modelName = 'llama-3.3-70b-versatile') => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: messages,
            temperature: 0.3,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const errMsg = errData.error?.message || response.statusText;
          throw new Error(`Groq API error (${response.status}): ${errMsg}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      };

      // Call Groq with retryCall helper
      const responseText = await retryCall(async () => {
        try {
          return await makeGroqRequest('llama-3.3-70b-versatile');
        } catch (err) {
          console.warn(`Groq 70B failed (${err.message}). Trying fallback 8B model...`);
          return await makeGroqRequest('llama-3.1-8b-instant');
        }
      });

      return {
        message: responseText,
        disclaimer: "चिकित्सा सलाह अस्वीकरण: यह एक एआई सहायक है और वास्तविक डॉक्टर का विकल्प नहीं है। गंभीर बीमारी में डॉक्टर से संपर्क करें। (Disclaimer: This is an AI assistant and not a substitute for a real doctor.)"
      };
    } catch (groqError) {
      console.warn('Groq API call failed completely. Falling back to Gemini...', groqError.message);
      // Fall through to Gemini execution below
    }
  }

  if (!genAI) {
    return {
      message: `[MOCK MODE - No Gemini/Groq Key] Hello! I received your message: "${userMessage}". Please configure a valid GEMINI_API_KEY or GROQ_API_KEY in the environment for actual AI health conversations.`,
      disclaimer: "Disclaimer: This is simulated advice. Always consult a real doctor for medical queries."
    };
  }

  try {
    let responseText;
    let lastError;
    for (const modelName of GEMINI_MODELS) {
      try {
        console.log(`Attempting chat with Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction
        });
        const chat = model.startChat({
          history: cleanHistory
        });
        const result = await retryCall(() => chat.sendMessage(userMessage), 2, 2000);
        responseText = result.response.text();
        console.log(`SUCCESS chat with Gemini model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`Chat failed with Gemini model: ${modelName} -> Error: ${err.message}`);
        lastError = err;
      }
    }
    if (!responseText) {
      throw lastError || new Error('All Gemini chat models failed');
    }

    return {
      message: responseText,
      disclaimer: "चिकित्सा सलाह अस्वीकरण: यह एक एआई सहायक है और वास्तविक डॉक्टर का विकल्प नहीं है। गंभीर बीमारी में डॉक्टर से संपर्क करें। (Disclaimer: This is an AI assistant and not a substitute for a real doctor.)"
    };
  } catch (error) {
    console.error('Gemini API Error (Health Chat):', error);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
};

/**
 * Mock data generator in case API key is missing (for local development testing)
 */
function getMockPrescriptionData(lang) {
  const mockData = {
    en: {
      patientName: "Ramesh Kumar",
      doctorName: "Dr. Alok Sharma, Primary Health Centre",
      date: "06-06-2026",
      medicines: [
        {
          name: "Paracetamol 650mg",
          genericName: "Paracetamol",
          purposeSimple: "For reducing fever and relieving body pain.",
          dosage: "1 Tablet",
          frequency: "Three times a day (1-1-1)",
          timing: "After meals",
          duration: "3 days",
          instructions: "Take with plain water. Do not take on an empty stomach.",
          sideEffects: ["Mild sweat", "Feeling sleepy"]
        },
        {
          name: "Amoxicillin 500mg",
          genericName: "Amoxicillin (Antibiotic)",
          purposeSimple: "For treating bacterial infections (throat/chest).",
          dosage: "1 Capsule",
          frequency: "Twice a day (1-0-1)",
          timing: "After meals",
          duration: "5 days",
          instructions: "Complete the full 5-day course even if you feel better.",
          sideEffects: ["Loose motions", "Stomach upset"]
        }
      ],
      generalAdvice: "Drink plenty of warm water. Take full bed rest for 3 days. Eat light foods like khichdi.",
      emergencyInstructions: "If you develop a skin rash, severe itching, or face difficulty in breathing, stop the medicines immediately and visit the nearest hospital.",
      ttsNarration: "This prescription is for Ramesh Kumar from Dr. Alok Sharma. It contains 2 medicines: Paracetamol for reducing fever and Amoxicillin for throat infection. Drink plenty of warm water, take full bed rest, and eat light foods. If you experience skin rash or difficulty breathing, stop the medicines and seek medical help immediately.",
      ttsTransliterated: "This prescription is for Ramesh Kumar from Dr. Alok Sharma. It contains 2 medicines: Paracetamol for reducing fever and Amoxicillin for throat infection. Drink plenty of warm water, take full bed rest, and eat light foods. If you experience skin rash or difficulty breathing, stop the medicines and seek medical help immediately."
    },
    hi: {
      patientName: "रमेश कुमार",
      doctorName: "डॉ. आलोक शर्मा, प्राथमिक स्वास्थ्य केंद्र",
      date: "06-06-2026",
      medicines: [
        {
          name: "Paracetamol 650mg",
          genericName: "पैरासिटामोल",
          purposeSimple: "बुखार कम करने और बदन दर्द से राहत पाने के लिए।",
          dosage: "1 गोली",
          frequency: "दिन में तीन बार (1-1-1)",
          timing: "खाना खाने के बाद",
          duration: "3 दिन",
          instructions: "सादे पानी के साथ लें। खाली पेट न लें।",
          sideEffects: ["हल्का पसीना आना", "नींद आना"]
        },
        {
          name: "Amoxicillin 500mg",
          genericName: "एमोक्सिसिलिन (एंटीबायोटिक)",
          purposeSimple: "गले या छाती में बैक्टीरिया के संक्रमण (इन्फेक्शन) को ठीक करने के लिए।",
          dosage: "1 कैप्सूल",
          frequency: "दिन में दो बार (1-0-1)",
          timing: "खाना खाने के बाद",
          duration: "5 दिन",
          instructions: "बेहतर महसूस होने पर भी 5 दिन का पूरा कोर्स खत्म करें।",
          sideEffects: ["दस्त लगना", "पेट खराब होना"]
        }
      ],
      generalAdvice: "खूब सारा गुनगुना पानी पिएं। 3 दिनों तक पूरा आराम करें। खिचड़ी जैसा हल्का भोजन खाएं।",
      emergencyInstructions: "यदि शरीर पर लाल चकत्ते (रैश), तेज खुजली हो या सांस लेने में तकलीफ हो, तो तुरंत दवा बंद करें और नजदीकी अस्पताल जाएं।",
      ttsNarration: "यह पर्ची रमेश कुमार के लिए डॉक्टर आलोक शर्मा द्वारा दी गई है। इस पर्ची में दो दवाएं हैं। पहली दवा पैरासिटामोल बुखार और दर्द के लिए है, इसे दिन में तीन बार खाना खाने के बाद लें। दूसरी दवा एमोक्सिसिलिन इन्फेक्शन के लिए है, इसे दिन में दो बार खाना खाने के बाद लें। गुनगुना पानी पिएं और तीन दिन आराम करें। यदि लाल चकत्ते या सांस की तकलीफ हो, तो तुरंत अस्पताल जाएं।",
      ttsTransliterated: "Yeh parchee Ramesh Kumar ke liye doctor Alok Sharma dwara dee gayee hai. Is parchee mein do dawaen hain. Pehlee dawa Paracetamol bukhaar aur dard ke liye hai, ise din mein teen baar khaana khaane ke baad len. Doosree dawa Amoxicillin infection ke liye hai, ise din mein do baar khaana khaane ke baad len. Gunguna paanee peeyen aur teen din aaraam karen. Yadi laal chakatte ya saans kee takleef ho, toh turant hospital jaayen."
    }
  };

  return mockData[lang] || mockData['en'];
}

function getMockTermSimplification(term, lang) {
  return {
    term: term,
    simpleExplanation: `This is a mock explanation for "${term}". Please ensure your GEMINI_API_KEY is configured in your environment for live medical simplifications.`,
    commonSymptoms: ["Symptom A", "Symptom B"],
    basicTreatments: ["Drink warm water", "Rest", "Consult a doctor"],
    whenToSeeDoctor: "If symptoms persist for more than 2 days."
  };
}

module.exports = {
  simplifyPrescriptionTextOrImage,
  simplifyMedicalTerms,
  translatePrescription,
  chatHealthcareAssistant,
  cleanJsonString,
  retryCall
};
