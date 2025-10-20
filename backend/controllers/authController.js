const University = require('../models/University');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @desc    Register new university admin
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
    try {
        const { name, username, email, password, walletAddress } = req.body;

        // Validation
        if (!name || !username || !email || !password || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if university already exists
        const existingUniversity = await University.findOne({
            $or: [{ email }, { username }, { walletAddress }]
        });

        if (existingUniversity) {
            let field = 'University';
            if (existingUniversity.email === email) field = 'Email';
            else if (existingUniversity.username === username) field = 'Username';
            else if (existingUniversity.walletAddress === walletAddress) field = 'Wallet address';
            
            return res.status(400).json({
                success: false,
                message: `${field} already registered`
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create university
        const university = await University.create({
            name,
            username,
            email,
            password: hashedPassword,
            walletAddress
        });

        // Generate token
        const token = generateToken(university._id);

        res.status(201).json({
            success: true,
            message: 'University registered successfully',
            data: {
                id: university._id,
                name: university.name,
                username: university.username,
                email: university.email,
                walletAddress: university.walletAddress,
                status: university.status
            },
            token
        });

    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration',
            error: error.message
        });
    }
};

// @desc    Login university admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if university exists
        const university = await University.findOne({ email });

        if (!university) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await bcrypt.compare(password, university.password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if account is suspended
        if (university.status === 'suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        // Generate token
        const token = generateToken(university._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                id: university._id,
                name: university.name,
                username: university.username,
                email: university.email,
                walletAddress: university.walletAddress,
                status: university.status,
                certificatesIssued: university.certificatesIssued
            },
            token
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
};

// @desc    Get logged in admin profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const university = await University.findById(req.university.id).select('-password');

        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        res.status(200).json({
            success: true,
            data: university
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
