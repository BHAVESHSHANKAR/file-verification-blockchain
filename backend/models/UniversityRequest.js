const mongoose = require('mongoose');

const universityRequestSchema = new mongoose.Schema({
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
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    votes: [{
        university: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'University'
        },
        vote: {
            type: String,
            enum: ['approve', 'reject']
        },
        votedAt: {
            type: Date,
            default: Date.now
        }
    }],
    approvalCount: {
        type: Number,
        default: 0
    },
    rejectionCount: {
        type: Number,
        default: 0
    },
    totalVotes: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes
universityRequestSchema.index({ email: 1 });
universityRequestSchema.index({ walletAddress: 1 });
universityRequestSchema.index({ username: 1 });
universityRequestSchema.index({ status: 1 });

module.exports = mongoose.model('UniversityRequest', universityRequestSchema);
