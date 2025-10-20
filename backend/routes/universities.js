const express = require('express');
const router = express.Router();
const { getAllUniversities } = require('../controllers/universityController');
const { protect } = require('../middleware/auth');

// Protected route - get all universities
router.get('/', protect, getAllUniversities);

module.exports = router;
