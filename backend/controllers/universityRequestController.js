const UniversityRequest = require('../models/UniversityRequest');
const University = require('../models/University');
const bcrypt = require('bcryptjs');

// Submit university registration request
exports.submitRequest = async (req, res) => {
    try {
        const { name, username, email, password, walletAddress } = req.body;

        // Validate required fields
        if (!name || !username || !email || !password || !walletAddress) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate wallet address format
        if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid wallet address format'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Check if request already exists - check each field separately for specific error
        const existingRequestByEmail = await UniversityRequest.findOne({ email });
        if (existingRequestByEmail) {
            return res.status(400).json({
                success: false,
                message: 'A registration request with this email already exists and is pending approval'
            });
        }

        const existingRequestByUsername = await UniversityRequest.findOne({ username });
        if (existingRequestByUsername) {
            return res.status(400).json({
                success: false,
                message: 'A registration request with this username already exists and is pending approval'
            });
        }

        const existingRequestByWallet = await UniversityRequest.findOne({ walletAddress });
        if (existingRequestByWallet) {
            return res.status(400).json({
                success: false,
                message: 'A registration request with this wallet address already exists and is pending approval'
            });
        }

        // Check if university already exists - check each field separately
        const existingUniversityByEmail = await University.findOne({ email });
        if (existingUniversityByEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered. Please login or use a different email'
            });
        }

        const existingUniversityByUsername = await University.findOne({ username });
        if (existingUniversityByUsername) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken. Please choose a different username'
            });
        }

        const existingUniversityByWallet = await University.findOne({ walletAddress });
        if (existingUniversityByWallet) {
            return res.status(400).json({
                success: false,
                message: 'This wallet address is already registered. Please use a different wallet address'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create request
        const request = await UniversityRequest.create({
            name,
            username,
            email,
            password: hashedPassword,
            walletAddress,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Registration request submitted successfully. Waiting for approval from existing universities.',
            data: {
                id: request._id,
                name: request.name,
                email: request.email,
                status: request.status
            }
        });

    } catch (error) {
        console.error('Submit request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit request',
            error: error.message
        });
    }
};

// Get all pending requests (for voting)
exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await UniversityRequest.find({ status: 'pending' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending requests',
            error: error.message
        });
    }
};

// Vote on a university request
exports.voteOnRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { vote } = req.body; // 'approve' or 'reject'
        const universityId = req.university.id;

        if (!['approve', 'reject'].includes(vote)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid vote. Must be "approve" or "reject"'
            });
        }

        const request = await UniversityRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This request has already been processed'
            });
        }

        // Check if university already voted
        const existingVote = request.votes.find(
            v => v.university.toString() === universityId
        );

        if (existingVote) {
            return res.status(400).json({
                success: false,
                message: 'You have already voted on this request'
            });
        }

        // Add vote
        request.votes.push({
            university: universityId,
            vote: vote
        });

        // Update counts
        if (vote === 'approve') {
            request.approvalCount += 1;
        } else {
            request.rejectionCount += 1;
        }
        request.totalVotes += 1;

        // Get total number of approved universities
        const totalUniversities = await University.countDocuments({ status: 'approved' });
        const requiredApprovals = Math.ceil(totalUniversities * 0.7); // 70% approval needed
        const maxPossibleRejections = totalUniversities - requiredApprovals;

        // Check if request should be approved or rejected
        if (request.approvalCount >= requiredApprovals) {
            // Enough approvals received
            request.status = 'approved';
            
            // Create university account
            await University.create({
                name: request.name,
                username: request.username,
                email: request.email,
                password: request.password,
                walletAddress: request.walletAddress,
                status: 'approved'
            });
        } else if (request.rejectionCount > maxPossibleRejections) {
            // Too many rejections - can't reach 70% approval anymore
            request.status = 'rejected';
        }
        // Otherwise, request stays 'pending' for more votes

        await request.save();

        res.status(200).json({
            success: true,
            message: `Vote recorded successfully. Request status: ${request.status}`,
            data: {
                requestId: request._id,
                status: request.status,
                approvalCount: request.approvalCount,
                rejectionCount: request.rejectionCount,
                totalVotes: request.totalVotes,
                requiredApprovals,
                totalUniversities
            }
        });

    } catch (error) {
        console.error('Vote on request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record vote',
            error: error.message
        });
    }
};

// Get request status (public - for applicants to check)
exports.getRequestStatus = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const request = await UniversityRequest.findOne({ email })
            .select('-password');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'No request found for this email'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                status: request.status,
                approvalCount: request.approvalCount,
                rejectionCount: request.rejectionCount,
                totalVotes: request.totalVotes,
                createdAt: request.createdAt
            }
        });

    } catch (error) {
        console.error('Get request status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request status',
            error: error.message
        });
    }
};
