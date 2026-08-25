const express = require('express');
const { getEmergencyInfo } = require('../controllers/emergencyController');

const router = express.Router();

router.get('/', getEmergencyInfo);

module.exports = router;
