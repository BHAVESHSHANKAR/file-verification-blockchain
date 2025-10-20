const jwt = require('jsonwebtoken');
const University = require('../models/University');
const Company = require('../models/Company');

exports.protect = async (req, res, next) => {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if it's a company or university
        if (decoded.type === 'company') {
            req.user = await Company.findById(decoded.id).select('-password');
            req.userType = 'company';
            
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Company not found'
                });
            }
        } else {
            // Default to university for backward compatibility
            req.university = await University.findById(decoded.id).select('-password');
            req.user = req.university;
            req.userType = 'university';

            if (!req.university) {
                return res.status(401).json({
                    success: false,
                    message: 'University not found'
                });
            }
        }

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
            error: error.message
        });
    }
};
