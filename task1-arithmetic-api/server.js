// server.js - Complete Production Application
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Initialize Express
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// ============================================
// USER SCHEMA & MODEL
// ============================================
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// ============================================
// AUTHENTICATION MIDDLEWARE
// ============================================
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User no longer exists'
            });
        }

        req.user = {
            id: user._id,
            username: user.username,
            email: user.email
        };
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                success: false,
                error: 'Invalid token'
            });
        }
        return res.status(500).json({
            success: false,
            error: 'Authentication error'
        });
    }
};

// ============================================
// VALIDATION RULES
// ============================================
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

const numberValidation = [
    body('num1')
        .notEmpty().withMessage('First number is required')
        .isNumeric().withMessage('First number must be a valid number'),
    body('num2')
        .notEmpty().withMessage('Second number is required')
        .isNumeric().withMessage('Second number must be a valid number')
];

// ============================================
// API ROUTES
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Arithmetic API is running',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/register',
            login: 'POST /api/login',
            add: 'POST /api/add (protected)',
            subtract: 'POST /api/subtract (protected)',
            multiply: 'POST /api/multiply (protected)',
            divide: 'POST /api/divide (protected)',
            profile: 'GET /api/profile (protected)'
        }
    });
});

// ============================================
// PUBLIC ENDPOINTS
// ============================================

// User Registration
app.post('/api/register', registerValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: existingUser.email === email 
                    ? 'Email already registered' 
                    : 'Username already taken'
            });
        }

        // Create new user
        const user = new User({ username, email, password });
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Error registering user'
        });
    }
});

// User Login
app.post('/api/login', loginValidation, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Error logging in'
        });
    }
});

// ============================================
// PROTECTED ENDPOINTS
// ============================================

// Get User Profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error fetching profile'
        });
    }
});

// ADD
app.post('/api/add', authenticateToken, numberValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { num1, num2 } = req.body;
    const result = parseFloat(num1) + parseFloat(num2);

    res.json({
        success: true,
        operation: 'addition',
        num1: parseFloat(num1),
        num2: parseFloat(num2),
        result,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
    });
});

// SUBTRACT
app.post('/api/subtract', authenticateToken, numberValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { num1, num2 } = req.body;
    const result = parseFloat(num1) - parseFloat(num2);

    res.json({
        success: true,
        operation: 'subtraction',
        num1: parseFloat(num1),
        num2: parseFloat(num2),
        result,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
    });
});

// MULTIPLY
app.post('/api/multiply', authenticateToken, numberValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { num1, num2 } = req.body;
    const result = parseFloat(num1) * parseFloat(num2);

    res.json({
        success: true,
        operation: 'multiplication',
        num1: parseFloat(num1),
        num2: parseFloat(num2),
        result,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
    });
});

// DIVIDE
app.post('/api/divide', authenticateToken, numberValidation, (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    const { num1, num2 } = req.body;
    const divisor = parseFloat(num2);

    if (divisor === 0) {
        return res.status(400).json({
            success: false,
            error: 'Division by zero is not allowed'
        });
    }

    const result = parseFloat(num1) / divisor;

    res.json({
        success: true,
        operation: 'division',
        num1: parseFloat(num1),
        num2: divisor,
        result,
        performedBy: req.user.username,
        timestamp: new Date().toISOString()
    });
});

// ============================================
// ERROR HANDLING MIDDLEWARE
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`📝 Register: POST http://localhost:${PORT}/api/register`);
    console.log(`🔑 Login: POST http://localhost:${PORT}/api/login`);
    console.log(`➕ Add: POST http://localhost:${PORT}/api/add`);
});