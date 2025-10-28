const Student = require('../models/Student');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const { registerCertificateOnChain } = require('../utils/blockchain');

// Generate SHA-512 hash from buffer
const generateFileHash = (buffer) => {
    return crypto.createHash('sha512').update(buffer).digest('hex');
};

// Upload certificate to IPFS and store in student record
exports.uploadCertificate = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { certificateName } = req.body;

        // Validate required fields
        if (!certificateName) {
            return res.status(400).json({
                success: false,
                message: 'Certificate name is required'
            });
        }

        // Check if file is uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Certificate file is required'
            });
        }

        // Find student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Verify university owns this student
        if (student.university.toString() !== req.university.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to issue certificate for this student'
            });
        }

        // Validate student has required fields
        if (!student.name || student.name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Student name is missing. Please update student record.'
            });
        }
        
        if (!student.registrationNumber || student.registrationNumber.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Student registration number is missing. Please update student record.'
            });
        }

        // Generate SHA-512 hash of the file
        const fileHash = generateFileHash(req.file.buffer);
        
        console.log('📋 Certificate upload data:', {
            studentName: student.name,
            registrationNumber: student.registrationNumber,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            fileHashLength: fileHash.length
        });

        // Upload to Pinata IPFS using direct API
        const formData = new FormData();
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const pinataResponse = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                maxBodyLength: Infinity,
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.IPFS_PINATA_JWT}`
                }
            }
        );

        const ipfsHash = pinataResponse.data.IpfsHash;
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
        
        // Validate all data before sending to frontend
        const responseData = {
            ipfsHash: ipfsHash,
            ipfsUrl: ipfsUrl,
            fileHash: fileHash,
            studentName: student.name.trim(),
            registrationNumber: student.registrationNumber.trim(),
            fileName: req.file.originalname,
            fileSize: req.file.size,
            studentId: student._id,
            certificateName: certificateName.trim()
        };
        
        // Final validation
        if (!responseData.studentName || !responseData.registrationNumber || 
            !responseData.fileName || !responseData.ipfsUrl || !responseData.fileHash) {
            console.error('❌ Missing required fields in response:', responseData);
            return res.status(500).json({
                success: false,
                message: 'Internal error: Missing required certificate data'
            });
        }
        
        console.log('✅ Certificate data validated, ready for blockchain registration');

        // Don't save to database yet - frontend will save after blockchain registration
        // Just return the data needed for blockchain
        res.status(201).json({
            success: true,
            message: 'Certificate uploaded to IPFS successfully',
            data: {
                // Data needed for blockchain registration
                ipfsHash: ipfsHash,
                ipfsUrl: ipfsUrl,
                fileHash: fileHash,
                fileName: req.file.originalname,
                fileSize: req.file.size,
                studentName: student.name,
                registrationNumber: student.registrationNumber,
                certificateName: certificateName
            }
        });

    } catch (error) {
        console.error('Certificate upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload certificate',
            error: error.message
        });
    }
};

// Get all certificates for a student
exports.getStudentCertificates = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await Student.findById(studentId)
            .populate('university', 'name')
            .select('name registrationNumber certificates');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Verify university owns this student
        if (student.university._id.toString() !== req.university.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view certificates for this student'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                student: {
                    name: student.name,
                    registrationNumber: student.registrationNumber
                },
                certificates: student.certificates.map(cert => ({
                    ...cert.toObject(),
                    ipfsUrl: `https://gateway.pinata.cloud/ipfs/${cert.ipfsHash}`
                }))
            }
        });

    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certificates',
            error: error.message
        });
    }
};

// Get single certificate details
exports.getCertificate = async (req, res) => {
    try {
        const { studentId, certificateId } = req.params;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const certificate = student.certificates.id(certificateId);
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                certificate: {
                    ...certificate.toObject(),
                    ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
                },
                student: {
                    name: student.name,
                    registrationNumber: student.registrationNumber
                }
            }
        });

    } catch (error) {
        console.error('Get certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch certificate',
            error: error.message
        });
    }
};

// Verify certificate by hash
exports.verifyCertificate = async (req, res) => {
    try {
        const { fileHash } = req.body;

        if (!fileHash) {
            return res.status(400).json({
                success: false,
                message: 'File hash is required'
            });
        }

        // Find student with matching certificate hash
        const student = await Student.findOne({
            'certificates.fileHash': fileHash
        }).populate('university', 'name');

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found',
                verified: false
            });
        }

        const certificate = student.certificates.find(cert => cert.fileHash === fileHash);

        res.status(200).json({
            success: true,
            verified: true,
            data: {
                certificate: {
                    ...certificate.toObject(),
                    ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
                },
                student: {
                    name: student.name,
                    registrationNumber: student.registrationNumber,
                    branch: student.branch
                },
                university: student.university.name
            }
        });

    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify certificate',
            error: error.message
        });
    }
};


// Save blockchain transaction data after frontend completes transaction
exports.saveBlockchainData = async (req, res) => {
    try {
        const { studentId, certificateName, ipfsHash, fileHash, fileName, fileSize, blockchainTxHash, blockchainBlockNumber, network } = req.body;

        // Find student
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Verify university owns this student
        if (student.university.toString() !== req.university.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        // Create certificate object with blockchain data
        const certificate = {
            certificateName,
            ipfsHash,
            fileHash,
            fileName,
            fileSize,
            issuedBy: req.university.id,
            issuedAt: new Date(),
            blockchainTxHash,
            blockchainBlockNumber,
            blockchainVerified: true,
            network: network || 'polygon' // Default to polygon for backward compatibility
        };

        // Add certificate to student
        student.certificates.push(certificate);
        await student.save();

        res.status(201).json({
            success: true,
            message: 'Certificate saved successfully',
            data: {
                certificate: student.certificates[student.certificates.length - 1]
            }
        });

    } catch (error) {
        console.error('Save blockchain data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save certificate data',
            error: error.message
        });
    }
};

// Revoke certificate
exports.revokeCertificateEndpoint = async (req, res) => {
    try {
        const { certificateId } = req.params;
        const { reason, txHash, blockNumber } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Revocation reason is required'
            });
        }

        // Find student with this certificate
        const student = await Student.findOne({
            'certificates._id': certificateId
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Verify university owns this student
        if (student.university.toString() !== req.university.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to revoke this certificate'
            });
        }

        // Find the certificate
        const certificate = student.certificates.id(certificateId);
        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found'
            });
        }

        // Check if already revoked
        if (certificate.isRevoked) {
            return res.status(400).json({
                success: false,
                message: 'Certificate is already revoked'
            });
        }

        // Update certificate with revocation data
        certificate.isRevoked = true;
        certificate.revocationReason = reason.trim();
        certificate.revocationTimestamp = new Date();
        certificate.revocationTxHash = txHash;
        certificate.revocationBlockNumber = blockNumber;

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Certificate revoked successfully',
            data: {
                certificate
            }
        });

    } catch (error) {
        console.error('Revoke certificate error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke certificate',
            error: error.message
        });
    }
};
