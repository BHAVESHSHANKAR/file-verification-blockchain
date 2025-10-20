const express = require('express');
const router = express.Router();
const {
    addStudent,
    getStudents,
    getStudent,
    updateStudent,
    deleteStudent,
    searchStudents
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   POST /api/students
// @desc    Add new student
router.post('/', addStudent);

// @route   GET /api/students
// @desc    Get all students for university
router.get('/', getStudents);

// @route   GET /api/students/search/:query
// @desc    Search students
router.get('/search/:query', searchStudents);

// @route   GET /api/students/:id
// @desc    Get single student
router.get('/:id', getStudent);

// @route   PUT /api/students/:id
// @desc    Update student
router.put('/:id', updateStudent);

// @route   DELETE /api/students/:id
// @desc    Delete student
router.delete('/:id', deleteStudent);

module.exports = router;
