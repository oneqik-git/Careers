const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { body } = require('express-validator');
const { query, queryOne, transaction } = require('../../config/database');
const { v4: uuid } = require('uuid');
const { asyncHandler, handleValidationErrors, sendError, sendSuccess } = require('../utils/api');
const { normalizeCareerScore } = require('../utils/normalize');

const router = express.Router();
const blockedEmployerDomains = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'rediffmail.com',
]);

function generateTokens(userId, role) {
  const access = jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });
  return { access, refresh };
}

async function getUserLinks(userId, role) {
  if (role === 'candidate') {
    const candidate = await queryOne('SELECT id FROM candidates WHERE user_id = ?', [userId]);
    return { candidate_id: candidate?.id || null };
  }

  if (role === 'employer' || role === 'admin') {
    const employer = await queryOne('SELECT id, company_id FROM employers WHERE user_id = ?', [userId]);
    return {
      employer_id: employer?.id || null,
      company_id: employer?.company_id || null,
    };
  }

  return {};
}

async function buildAuthPayload(user) {
  const tokens = generateTokens(user.id, user.role);
  const links = await getUserLinks(user.id, user.role);

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    tokens,
    links,
  };
}

function sendAuthPayload(res, payload, status = 200, message) {
  return sendSuccess(res, {
    status,
    message,
    data: payload,
    legacy: {
      role: payload.user.role,
      tokens: payload.tokens,
      user: payload.user,
      links: payload.links,
    },
  });
}

// POST /api/auth/register/candidate
router.post('/register/candidate', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('phone').isMobilePhone('en-IN').withMessage('A valid Indian mobile number is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('full_name').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const { email, phone, password, full_name } = req.body;
  const existing = await queryOne('SELECT id FROM users WHERE email = ? OR phone = ?', [email, phone]);

  if (existing) {
    return sendError(res, {
      status: 409,
      code: 'USER_ALREADY_EXISTS',
      message: 'Email or phone already registered',
    });
  }

  try {
    await transaction(async (conn) => {
      const userId = uuid();
      const candidateId = uuid();
      const hash = await bcrypt.hash(password, 12);

      await conn.execute(
        'INSERT INTO users (id, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [userId, email, phone, hash, 'candidate']
      );
      await conn.execute(
        'INSERT INTO candidates (id, user_id, full_name) VALUES (?, ?, ?)',
        [candidateId, userId, full_name]
      );
      await conn.execute(
        'INSERT INTO career_scores (candidate_id, total_score) VALUES (?, 300)',
        [candidateId]
      );
    });

    const user = await queryOne('SELECT id, email, role FROM users WHERE email = ?', [email]);
    const payload = await buildAuthPayload(user);

    return sendAuthPayload(res, payload, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, {
      status: 500,
      code: 'REGISTRATION_FAILED',
      message: 'Registration failed',
    });
  }
}));

// POST /api/auth/register/employer
router.post('/register/employer', [
  body('email')
    .isEmail()
    .withMessage('A valid work email is required')
    .normalizeEmail()
    .custom((value) => {
      const domain = String(value).split('@')[1]?.toLowerCase();

      if (!domain || blockedEmployerDomains.has(domain)) {
        throw new Error('Use your work email. Personal email providers are not allowed for employer registration.');
      }

      return true;
    }),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('full_name').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters long'),
  body('company_name').isLength({ min: 2 }).withMessage('Company name must be at least 2 characters long'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const { email, password, full_name, company_name, designation } = req.body;
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email]);

  if (existing) {
    return sendError(res, {
      status: 409,
      code: 'USER_ALREADY_EXISTS',
      message: 'Email already registered',
    });
  }

  try {
    await transaction(async (conn) => {
      const userId = uuid();
      const employerId = uuid();
      const companyId = uuid();
      const hash = await bcrypt.hash(password, 12);
      const slug = company_name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

      await conn.execute(
        'INSERT INTO users (id, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [userId, email, null, hash, 'employer']
      );
      await conn.execute(
        'INSERT INTO companies (id, name, slug) VALUES (?, ?, ?)',
        [companyId, company_name, slug]
      );
      await conn.execute(
        'INSERT INTO company_scores (company_id) VALUES (?)',
        [companyId]
      );
      await conn.execute(
        'INSERT INTO employers (id, user_id, company_id, full_name, designation, is_admin) VALUES (?, ?, ?, ?, ?, 1)',
        [employerId, userId, companyId, full_name, designation || null]
      );
    });

    const user = await queryOne('SELECT id, email, role FROM users WHERE email = ?', [email]);
    const payload = await buildAuthPayload(user);

    return sendAuthPayload(res, payload, 201);
  } catch (err) {
    console.error(err);
    return sendError(res, {
      status: 500,
      code: 'REGISTRATION_FAILED',
      message: 'Registration failed',
    });
  }
}));

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], asyncHandler(async (req, res) => {
  if (handleValidationErrors(req, res)) {
    return;
  }

  const { email, password } = req.body;

  try {
    const user = await queryOne('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);

    if (!user) {
      return sendError(res, {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return sendError(res, {
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      });
    }

    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    const payload = await buildAuthPayload(user);

    return sendAuthPayload(res, payload);
  } catch (err) {
    return sendError(res, {
      status: 500,
      code: 'LOGIN_FAILED',
      message: 'Login failed',
    });
  }
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.body.refresh_token || req.body.refreshToken;

  if (!refreshToken) {
    return sendError(res, {
      status: 401,
      code: 'REFRESH_TOKEN_REQUIRED',
      message: 'No refresh token provided',
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await queryOne('SELECT id, email, role, is_active FROM users WHERE id = ?', [decoded.userId]);

    if (!user || !user.is_active) {
      return sendError(res, {
        status: 401,
        code: 'INVALID_USER',
        message: 'Invalid user',
      });
    }

    const payload = await buildAuthPayload(user);
    return sendAuthPayload(res, payload);
  } catch {
    return sendError(res, {
      status: 401,
      code: 'REFRESH_TOKEN_INVALID',
      message: 'Invalid or expired refresh token',
    });
  }
}));

// GET /api/auth/digilocker/initiate
router.get('/digilocker/initiate', asyncHandler(async (req, res) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.DIGILOCKER_CLIENT_ID,
    redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
    scope: 'openid aadhaar_number DOB FULLNAME',
    state: req.query.candidateId || '',
  });

  return res.redirect(`https://api.digitallocker.gov.in/public/oauth2/1/authorize?${params}`);
}));

// GET /api/auth/digilocker/callback
router.get('/digilocker/callback', asyncHandler(async (req, res) => {
  const { code, state: candidateId } = req.query;

  if (!code) {
    return sendError(res, {
      status: 400,
      code: 'DIGILOCKER_AUTH_FAILED',
      message: 'DigiLocker auth failed',
    });
  }

  try {
    const tokenRes = await axios.post('https://api.digitallocker.gov.in/public/oauth2/1/token', {
      code,
      grant_type: 'authorization_code',
      client_id: process.env.DIGILOCKER_CLIENT_ID,
      client_secret: process.env.DIGILOCKER_CLIENT_SECRET,
      redirect_uri: process.env.DIGILOCKER_REDIRECT_URI,
    });

    const { access_token } = tokenRes.data;
    const userRes = await axios.get('https://api.digitallocker.gov.in/public/oauth2/1/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const crypto = require('crypto');
    const aadhaarHash = crypto.createHash('sha256').update(userRes.data.masked_aadhaar || '').digest('hex');

    const duplicate = await queryOne(
      'SELECT id FROM candidates WHERE aadhaar_hash = ? AND id != ?',
      [aadhaarHash, candidateId]
    );

    if (duplicate) {
      return sendError(res, {
        status: 409,
        code: 'DUPLICATE_PROFILE',
        message: 'A profile with this Aadhaar already exists',
      });
    }

    const updateResult = await query(
      'UPDATE candidates SET aadhaar_hash = ?, digilocker_linked = 1 WHERE id = ?',
      [aadhaarHash, candidateId]
    );

    if (!updateResult.affectedRows) {
      return sendError(res, {
        status: 404,
        code: 'CANDIDATE_NOT_FOUND',
        message: 'Candidate profile not found',
      });
    }

    const { calculateAndSave } = require('../services/careerScore');
    const score = await calculateAndSave(candidateId);

    return sendSuccess(res, {
      message: 'DigiLocker linked successfully',
      data: {
        candidate_id: candidateId,
        digilocker_linked: true,
        score: normalizeCareerScore(score),
      },
    });
  } catch (err) {
    console.error('DigiLocker error:', err.message);
    return sendError(res, {
      status: 500,
      code: 'DIGILOCKER_LINK_FAILED',
      message: 'DigiLocker linking failed',
    });
  }
}));

module.exports = router;
