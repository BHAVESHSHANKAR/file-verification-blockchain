const express = require('express');
const router = express.Router();
const { signup, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/signup
// @desc    Register new university admin
// @access  Public
router.post('/signup', signup);

// @route   POST /api/auth/login
// @desc    Login university admin
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/profile
// @desc    Get logged in admin profile
// @access  Private
router.get('/profile', protect, getProfile);

module.exports = router;
