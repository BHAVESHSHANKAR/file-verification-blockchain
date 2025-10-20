const University = require('../models/University');

// Get all approved universities
exports.getAllUniversities = async (req, res) => {
    try {
        const universities = await University.find({ status: 'approved' })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: universities.length,
            data: universities
        });

    } catch (error) {
        console.error('Get universities error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch universities',
            error: error.message
        });
    }
};
