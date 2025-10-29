const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'University name is required'],
        trim: true,
        maxlength: 200
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 50
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6
    },
    walletAddress: {
        type: String,
        required: [true, 'Wallet address is required'],
        unique: true,
        match: [/^0x[a-fA-F0-9]{40}$/, 'Please enter a valid Ethereum wallet address']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'suspended'],
        default: 'pending'
    },
    certificatesIssued: {
        type: Number,
        default: 0
    },
    // Blockchain registration fields
    blockchainRegistered: {
        type: Boolean,
        default: false
    },
    blockchainTxHash: {
        type: String,
        default: null
    },
    blockchainNetwork: {
        type: String,
        enum: ['sepolia', 'polygon', null],
        default: null
    },
    blockchainRegisteredAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Indexes for faster queries
universitySchema.index({ email: 1 });
universitySchema.index({ walletAddress: 1 });
universitySchema.index({ username: 1 });

module.exports = mongoose.model('University', universitySchema);
