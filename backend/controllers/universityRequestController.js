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
        
        // 🔥 NEW LOGIC: 100% unanimous approval required
        // If ANY university rejects → Request is REJECTED immediately
        if (vote === 'reject') {
            request.status = 'rejected';
            await request.save();
            
            return res.status(200).json({
                success: true,
                message: 'Request rejected. Unanimous approval is required for new universities.',
                data: {
                    requestId: request._id,
                    status: 'rejected',
                    approvalCount: request.approvalCount,
                    rejectionCount: request.rejectionCount,
                    totalVotes: request.totalVotes,
                    totalUniversities
                }
            });
        }

        // Check if ALL universities have approved (100% unanimous)
        if (request.approvalCount === totalUniversities) {
            // 🎉 ALL universities approved - Auto-register on blockchain
            request.status = 'approved';
            
            try {
                // Create university account in MongoDB
                const newUniversity = await University.create({
                    name: request.name,
                    username: request.username,
                    email: request.email,
                    password: request.password,
                    walletAddress: request.walletAddress,
                    status: 'approved'
                });

                // 🔗 Automatically register on Sepolia blockchain (backend-side)
                const { ethers } = require('ethers');
                const fs = require('fs');
                const path = require('path');

                try {
                    // Load contract config
                    const contractConfigPath = path.join(__dirname, '../university-registry-sepolia-config.json');
                    const contractABIPath = path.join(__dirname, '../../frontend/src/UniversityRegistrySepolia.json');
                    
                    if (fs.existsSync(contractConfigPath) && fs.existsSync(contractABIPath)) {
                        const contractConfig = JSON.parse(fs.readFileSync(contractConfigPath, 'utf8'));
                        const contractABI = JSON.parse(fs.readFileSync(contractABIPath, 'utf8'));
                        
                        const CONTRACT_ADDRESS = process.env.UNIVERSITY_REGISTRY_SEPOLIA_ADDRESS || contractConfig.contractAddress;
                        const RPC_URLS = [
                            'https://ethereum-sepolia-rpc.publicnode.com',
                            'https://rpc2.sepolia.org',
                            process.env.RPC_URL_SEPOLIA
                        ].filter(Boolean);

                        // Try to connect to Sepolia
                        let provider = null;
                        for (const rpcUrl of RPC_URLS) {
                            try {
                                const tempProvider = new ethers.JsonRpcProvider(rpcUrl);
                                await tempProvider.getBlockNumber();
                                provider = tempProvider;
                                break;
                            } catch (err) {
                                continue;
                            }
                        }

                        if (provider && process.env.PRIVATE_KEY) {
                            const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
                            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, wallet);

                            // Register on blockchain
                            console.log('🔗 Registering university on Sepolia blockchain...');
                            const tx = await contract.registerUniversity(
                                request.name,
                                request.username,
                                request.email,
                                request.walletAddress,
                                'approved'
                            );

                            console.log('⏳ Waiting for blockchain confirmation...');
                            const receipt = await tx.wait();
                            console.log('✅ University registered on blockchain:', receipt.hash);

                            // Update MongoDB with blockchain info
                            await University.findByIdAndUpdate(newUniversity._id, {
                                $set: {
                                    blockchainRegistered: true,
                                    blockchainTxHash: receipt.hash,
                                    blockchainNetwork: 'sepolia',
                                    blockchainRegisteredAt: new Date()
                                }
                            });

                            console.log('✅ MongoDB updated with blockchain data');
                        } else {
                            console.warn('⚠️  Blockchain registration skipped - provider or private key not available');
                        }
                    } else {
                        console.warn('⚠️  Blockchain registration skipped - contract config not found');
                    }
                } catch (blockchainError) {
                    console.error('❌ Blockchain registration failed:', blockchainError.message);
                    // Don't fail the entire approval - university is still created in MongoDB
                }

            } catch (createError) {
                // Rollback if university creation fails
                request.status = 'pending';
                await request.save();
                throw createError;
            }
        }
        // Otherwise, request stays 'pending' waiting for more votes

        await request.save();

        // Prepare response message
        let message = `Vote recorded successfully. Request status: ${request.status}`;
        if (request.status === 'approved') {
            message = '✅ Request approved! University has been registered and added to the blockchain.';
        } else if (request.status === 'pending') {
            const votesNeeded = totalUniversities - request.approvalCount;
            message = `Vote recorded. Waiting for ${votesNeeded} more approval(s). (${request.approvalCount}/${totalUniversities} approved)`;
        }

        res.status(200).json({
            success: true,
            message,
            data: {
                requestId: request._id,
                status: request.status,
                approvalCount: request.approvalCount,
                rejectionCount: request.rejectionCount,
                totalVotes: request.totalVotes,
                requiredApprovals: totalUniversities, // 100% required
                totalUniversities,
                votesRemaining: totalUniversities - request.totalVotes
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
