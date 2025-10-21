const Student = require('../models/Student');
const University = require('../models/University');

// @desc    Add new student
// @route   POST /api/students
// @access  Private
exports.addStudent = async (req, res) => {
    try {
        const { name, registrationNumber, academicYear, currentYear, branch, specialization } = req.body;

        // Validation
        if (!name || !registrationNumber || !academicYear || !currentYear || !branch) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Check if registration number already exists in THIS university
        const existingStudent = await Student.findOne({ 
            registrationNumber: registrationNumber.toUpperCase(),
            university: req.university.id
        });

        if (existingStudent) {
            return res.status(400).json({
                success: false,
                message: 'Registration number already exists in your university'
            });
        }

        // Get university details
        const university = await University.findById(req.university.id);
        if (!university) {
            return res.status(404).json({
                success: false,
                message: 'University not found'
            });
        }

        // Create student
        const student = await Student.create({
            name,
            registrationNumber: registrationNumber.toUpperCase(),
            academicYear,
            currentYear,
            branch,
            specialization,
            university: req.university.id,
            universityName: university.name
        });

        res.status(201).json({
            success: true,
            message: 'Student added successfully',
            data: student
        });

    } catch (error) {
        console.error('Add student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while adding student',
            error: error.message
        });
    }
};

// @desc    Get all students for a university
// @route   GET /api/students
// @access  Private
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({ university: req.university.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching students',
            error: error.message
        });
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
exports.getStudent = async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            university: req.university.id
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching student',
            error: error.message
        });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private
exports.updateStudent = async (req, res) => {
    try {
        const { name, academicYear, currentYear, branch, specialization } = req.body;

        let student = await Student.findOne({
            _id: req.params.id,
            university: req.university.id
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Update fields
        student.name = name || student.name;
        student.academicYear = academicYear || student.academicYear;
        student.currentYear = currentYear || student.currentYear;
        student.branch = branch || student.branch;
        student.specialization = specialization !== undefined ? specialization : student.specialization;

        await student.save();

        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });

    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating student',
            error: error.message
        });
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findOne({
            _id: req.params.id,
            university: req.university.id
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        await student.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Student deleted successfully'
        });

    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting student',
            error: error.message
        });
    }
};

// @desc    Search students
// @route   GET /api/students/search/:query
// @access  Private
exports.searchStudents = async (req, res) => {
    try {
        const query = req.params.query;

        const students = await Student.find({
            university: req.university.id,
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { registrationNumber: { $regex: query, $options: 'i' } },
                { branch: { $regex: query, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });

    } catch (error) {
        console.error('Search students error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while searching students',
            error: error.message
        });
    }
};
