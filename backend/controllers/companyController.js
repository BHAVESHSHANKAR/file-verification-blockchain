const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Company Signup
exports.signup = async (req, res) => {
    try {
        const { companyName, email, password } = req.body;

        // Check if company already exists
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new company
        const company = new Company({
            companyName,
            email,
            password: hashedPassword
        });

        await company.save();

        res.status(201).json({
            success: true,
            message: 'Company registered successfully'
        });
    } catch (error) {
        console.error('Company signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
};

// Company Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find company
        const company = await Company.findOne({ email });
        if (!company) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, company.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: company._id, type: 'company' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Return company data without password
        const companyData = {
            id: company._id,
            companyName: company.companyName,
            email: company.email,
            createdAt: company.createdAt
        };

        res.json({
            success: true,
            message: 'Login successful',
            token,
            data: companyData
        });
    } catch (error) {
        console.error('Company login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// Get Company Profile
exports.getProfile = async (req, res) => {
    try {
        const company = await Company.findById(req.user.id).select('-password');
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Get company profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Search Universities using Bloom Filter
exports.searchUniversities = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const University = require('../models/University');
        
        // Get all universities
        const universities = await University.find({
            status: 'approved'
        }).select('name username email');

        // Simple search implementation (Bloom filter can be added for optimization)
        const results = universities.filter(uni => 
            uni.name.toLowerCase().includes(query.toLowerCase()) ||
            uni.username.toLowerCase().includes(query.toLowerCase())
        );

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        console.error('Search universities error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during search'
        });
    }
};

// Search Student by Register Number
exports.searchStudent = async (req, res) => {
    try {
        const { universityId, registerNumber } = req.query;
        
        if (!universityId || !registerNumber) {
            return res.status(400).json({
                success: false,
                message: 'University ID and register number are required'
            });
        }

        const Student = require('../models/Student');
        
        // Find student by registration number (uppercase) and university
        const student = await Student.findOne({
            registrationNumber: registerNumber.toUpperCase(),
            university: universityId
        }).populate('university', 'name');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found with this registration number'
            });
        }

        res.json({
            success: true,
            data: student
        });
    } catch (error) {
        console.error('Search student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during search'
        });
    }
};

// Verify Certificate by Hash
exports.verifyCertificateHash = async (req, res) => {
    try {
        const { studentId, fileHash } = req.body;
        
        if (!studentId || !fileHash) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and file hash are required'
            });
        }

        const Student = require('../models/Student');
        
        // Find student with certificates
        const student = await Student.findById(studentId).populate('university', 'name');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Find matching certificate by hash
        const matchedCertificate = student.certificates.find(
            cert => cert.fileHash === fileHash
        );

        if (!matchedCertificate) {
            return res.json({
                success: true,
                matched: false,
                message: 'No matching certificate found. The uploaded file does not match any student certificates.'
            });
        }

        res.json({
            success: true,
            matched: true,
            message: 'Certificate verified successfully!',
            data: {
                certificateName: matchedCertificate.certificateName,
                fileName: matchedCertificate.fileName,
                fileSize: matchedCertificate.fileSize,
                issuedAt: matchedCertificate.issuedAt,
                studentName: student.name,
                registrationNumber: student.registrationNumber,
                university: student.university.name,
                branch: student.branch,
                currentYear: student.currentYear
            }
        });
    } catch (error) {
        console.error('Verify certificate hash error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during verification'
        });
    }
};

// Mark Student as Verified
exports.markStudentVerified = async (req, res) => {
    try {
        const { studentId, studentName, registrationNumber, universityName, branch } = req.body;
        
        if (!studentId) {
            return res.status(400).json({
                success: false,
                message: 'Student ID is required'
            });
        }

        const company = await Company.findById(req.user.id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Check if student is already verified
        const alreadyVerified = company.verifiedStudents.some(
            vs => vs.studentId.toString() === studentId
        );

        if (alreadyVerified) {
            return res.status(400).json({
                success: false,
                message: 'Student is already verified'
            });
        }

        // Add student to verified list
        company.verifiedStudents.push({
            studentId,
            studentName,
            registrationNumber,
            universityName,
            branch,
            verifiedAt: new Date()
        });

        await company.save();

        res.json({
            success: true,
            message: 'Student marked as verified successfully',
            data: company.verifiedStudents
        });
    } catch (error) {
        console.error('Mark student verified error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get Verified Students
exports.getVerifiedStudents = async (req, res) => {
    try {
        const company = await Company.findById(req.user.id)
            .populate('verifiedStudents.studentId', 'name registrationNumber branch university certificates');
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: company.verifiedStudents
        });
    } catch (error) {
        console.error('Get verified students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
