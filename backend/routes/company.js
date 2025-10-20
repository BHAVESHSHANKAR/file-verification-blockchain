const express = require('express');
const router = express.Router();
const { signup, login, getProfile, searchUniversities, searchStudent, verifyCertificateHash, markStudentVerified, getVerifiedStudents } = require('../controllers/companyController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/profile', protect, getProfile);
router.get('/search/universities', protect, searchUniversities);
router.get('/search/student', protect, searchStudent);
router.post('/verify-certificate', protect, verifyCertificateHash);
router.post('/mark-verified', protect, markStudentVerified);
router.get('/verified-students', protect, getVerifiedStudents);

module.exports = router;
