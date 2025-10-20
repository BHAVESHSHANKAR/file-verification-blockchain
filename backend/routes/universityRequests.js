const express = require('express');
const router = express.Router();
const {
    submitRequest,
    getPendingRequests,
    voteOnRequest,
    getRequestStatus
} = require('../controllers/universityRequestController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/submit', submitRequest);
router.get('/status', getRequestStatus);

// Protected routes (require authentication)
router.get('/pending', protect, getPendingRequests);
router.post('/vote/:requestId', protect, voteOnRequest);

module.exports = router;
