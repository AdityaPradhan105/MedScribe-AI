const { GoogleGenerativeAI } = require('@google/generative-ai');

const run = async () => {
  const key = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
  const models = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
    'gemini-2.0-flash-lite'
  ];
  
  const genAI = new GoogleGenerativeAI(key);
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      console.log(`SUCCESS for model: ${m} -> Response: ${result.response.text().trim()}`);
      return; // Stop if any succeeds
    } catch (error) {
      console.log(`FAILED for model: ${m} -> Error: ${error.message.substring(0, 150)}...`);
    }
  }
};

run();
