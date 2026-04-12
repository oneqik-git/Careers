const jwt = require('jsonwebtoken');
const { queryOne } = require('../../config/database');
const { sendError } = require('../utils/api');

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      return sendError(res, {
        status: 401,
        code: 'AUTH_REQUIRED',
        message: 'No bearer token provided',
      });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT id, email, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user || !user.is_active) {
      return sendError(res, {
        status: 401,
        code: 'ACCOUNT_INACTIVE',
        message: 'Invalid or inactive account',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, {
        status: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      });
    }

    return sendError(res, {
      status: 401,
      code: 'TOKEN_INVALID',
      message: 'Invalid token',
    });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return sendError(res, {
      status: 403,
      code: 'FORBIDDEN',
      message: 'Forbidden: insufficient role',
    });
  }

  next();
};

const requireCandidate = requireRole('candidate');
const requireEmployer = requireRole('employer', 'admin');
const requireAdmin = requireRole('admin');

module.exports = { auth, requireRole, requireCandidate, requireEmployer, requireAdmin };
