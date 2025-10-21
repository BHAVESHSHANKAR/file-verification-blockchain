const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    uploadCertificate,
    getStudentCertificates,
    getCertificate,
    verifyCertificate,
    saveBlockchainData,
    revokeCertificateEndpoint
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

// Protected routes (require authentication)
router.post('/upload/:studentId', protect, upload.single('certificate'), uploadCertificate);
router.post('/save-blockchain', protect, saveBlockchainData);
router.post('/:certificateId/revoke', protect, revokeCertificateEndpoint);
router.get('/student/:studentId', protect, getStudentCertificates);
router.get('/:studentId/:certificateId', protect, getCertificate);

// Public route for verification
router.post('/verify', verifyCertificate);

module.exports = router;
