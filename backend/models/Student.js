const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    certificateName: {
        type: String,
        required: true,
        trim: true
    },
    ipfsHash: {
        type: String,
        required: true
    },
    fileHash: {
        type: String,
        required: true // SHA-512 hash of the file
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    // Blockchain fields
    blockchainTxHash: {
        type: String,
        default: null
    },
    blockchainBlockNumber: {
        type: Number,
        default: null
    },
    blockchainVerified: {
        type: Boolean,
        default: false
    },
    // Revocation and replacement fields
    status: {
        type: String,
        enum: ['active', 'revoked', 'replaced'],
        default: 'active'
    },
    revokedAt: {
        type: Date,
        default: null
    },
    revokedReason: {
        type: String,
        default: null
    },
    replacedBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    replacementFor: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    }
}, {
    timestamps: true
});

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true,
        maxlength: 100
    },
    registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        unique: true,
        trim: true,
        uppercase: true
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required'],
        trim: true
    },
    currentYear: {
        type: String,
        required: [true, 'Current year of study is required'],
        enum: ['1', '2', '3', '4']
    },
    branch: {
        type: String,
        required: [true, 'Branch/Department is required'],
        trim: true
    },
    specialization: {
        type: String,
        trim: true
    },
    university: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'University',
        required: true
    },
    universityName: {
        type: String,
        required: true
    },
    certificates: [certificateSchema]
}, {
    timestamps: true
});

// Indexes for faster queries
studentSchema.index({ university: 1 });
studentSchema.index({ registrationNumber: 1 });
studentSchema.index({ name: 1 });

module.exports = mongoose.model('Student', studentSchema);
