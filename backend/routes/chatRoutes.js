const express = require('express');
const { handleChat, simplifyTerm } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', handleChat);
router.get('/simplify', simplifyTerm);

module.exports = router;
