const { chatHealthcareAssistant, simplifyMedicalTerms } = require('../utils/gemini');

/**
 * @desc    Send message to AI Health Assistant
 * @route   POST /api/chat
 * @access  Private
 */
const handleChat = async (req, res) => {
  const { chatHistory, message, language } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Please provide a message' });
  }

  try {
    const lang = language || 'en';
    const response = await chatHealthcareAssistant(chatHistory || [], message, lang);
    
    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Chat Controller Error:', error);
    const errMsg = error.message ? error.message.toLowerCase() : '';
    if (
      errMsg.includes('503') ||
      errMsg.includes('429') ||
      errMsg.includes('overloaded') ||
      errMsg.includes('experiencing high demand') ||
      errMsg.includes('service unavailable') ||
      errMsg.includes('quota') ||
      errMsg.includes('limit')
    ) {
      return res.status(503).json({ success: false, message: 'SERVER_BUSY' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Simplify complex medical term
 * @route   GET /api/chat/simplify
 * @access  Private
 */
const simplifyTerm = async (req, res) => {
  const { term, lang } = req.query;

  if (!term) {
    return res.status(400).json({ success: false, message: 'Please provide a medical term to simplify' });
  }

  try {
    const targetLang = lang || 'en';
    const response = await simplifyMedicalTerms(term, targetLang);
    
    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Simplify Term Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  handleChat,
  simplifyTerm
};
