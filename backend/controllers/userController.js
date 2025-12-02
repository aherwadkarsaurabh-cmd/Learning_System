const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            fullName,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                message: 'Account successfully created',
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    token: generateToken(user._id),
                },
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists and password matches
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials, please sign up first' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('enrolledCourses.course', 'title')
            .populate('achievements');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Calculate performance metrics
        const totalCourses = user.enrolledCourses ? user.enrolledCourses.length : 0;
        const hoursLearned = user.totalHoursLearned || 0;
        const achievementsCount = user.achievements ? user.achievements.length : 0;
        
        // Calculate average score (from quizzes if available)
        let averageScore = 0;
        if (user.enrolledCourses && user.enrolledCourses.length > 0) {
            // Average completion percentage across all enrolled courses
            const totalCompletion = user.enrolledCourses.reduce((sum, e) => sum + (e.completionPercentage || 0), 0);
            averageScore = Math.round(totalCompletion / user.enrolledCourses.length);
        }

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt,
            stats: {
                totalCourses,
                hoursLearned,
                achievementsCount,
                averageScore
            },
            institution: user.institution
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get student dashboard stats (hours learned, total courses, achievements)
// @route   GET /api/users/stats
// @access  Private/Student
const getStudentStats = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('enrolledCourses.course', 'title');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            totalHoursLearned: user.totalHoursLearned || 0,
            totalCourses: user.enrolledCourses ? user.enrolledCourses.length : 0,
            achievementsCount: user.achievements ? user.achievements.length : 0,
            achievements: user.achievements || []
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get student's enrolled courses with progress
// @route   GET /api/users/courses
// @access  Private/Student
const getStudentCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'enrolledCourses.course',
                select: 'title description thumbnail'
            })
            .populate('enrolledCourses.completedLessons', 'title');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const coursesWithProgress = user.enrolledCourses.map(enrollment => {
            const course = enrollment.course;
            const completedCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
            
            return {
                _id: course._id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                hoursSpent: enrollment.hoursSpent || 0,
                completedLessons: completedCount,
                completionPercentage: enrollment.completionPercentage || 0,
                enrollmentDate: enrollment.enrollmentDate
            };
        });

        res.json({
            courses: coursesWithProgress,
            totalCourses: coursesWithProgress.length
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get student's profile courses with detailed progress
// @route   GET /api/users/profile/courses
// @access  Private/Student
const getProfileCourses = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'enrolledCourses.course',
                select: 'title description thumbnail category instructor'
            })
            .populate({
                path: 'enrolledCourses.completedLessons',
                select: 'title'
            });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profileCourses = user.enrolledCourses.map(enrollment => {
            const course = enrollment.course;
            const completedCount = enrollment.completedLessons ? enrollment.completedLessons.length : 0;
            
            return {
                _id: course._id,
                title: course.title,
                description: course.description,
                thumbnail: course.thumbnail,
                category: course.category,
                instructor: course.instructor,
                hoursSpent: enrollment.hoursSpent || 0,
                completedLessons: completedCount,
                completionPercentage: enrollment.completionPercentage || 0,
                enrollmentDate: enrollment.enrollmentDate
            };
        });

        res.json({
            courses: profileCourses,
            totalCourses: profileCourses.length
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Mark lesson as completed (updates course progress)
// @route   POST /api/users/lesson/:lessonId/complete
// @access  Private/Student
const completeLessonInCourse = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const { courseId, hoursSpent = 0 } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the enrollment
        const enrollment = user.enrolledCourses.find(e => e.course.toString() === courseId);
        if (!enrollment) {
            return res.status(400).json({ message: 'Not enrolled in this course' });
        }

        // Check if lesson already completed
        if (enrollment.completedLessons.find(id => id.toString() === lessonId)) {
            return res.status(400).json({ message: 'Lesson already completed' });
        }

        // Add completed lesson
        enrollment.completedLessons.push(lessonId);
        enrollment.hoursSpent += hoursSpent;
        user.totalHoursLearned += hoursSpent;

        await user.save();

        res.json({ 
            message: 'Lesson marked as completed', 
            hoursSpent: enrollment.hoursSpent,
            totalHoursLearned: user.totalHoursLearned
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { 
    registerUser, 
    loginUser, 
    getUserProfile,
    getProfileCourses,
    getStudentStats,
    getStudentCourses,
    completeLessonInCourse
};