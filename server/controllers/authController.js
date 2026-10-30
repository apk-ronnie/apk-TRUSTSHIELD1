const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const storageService = require('../services/storageService');

// Zod Validation Schemas
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Helper to generate signed JWT token
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'trustshield_fallback_jwt_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user'
    },
    secret,
    { expiresIn }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await storageService.findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists.'
        }
      });
    }

    // Hash password with bcryptjs
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await storageService.createUser({
      name,
      email: email.toLowerCase(),
      passwordHash
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      },
      message: 'User registered successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & return JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await storageService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        token
      },
      message: 'Authentication successful.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private (JWT required)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await storageService.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found.'
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  registerSchema,
  loginSchema
};
