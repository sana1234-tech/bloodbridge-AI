/**
 * Authentication and authorization middleware for BloodBridge AI.
 *
 * Role model:
 *   - staff (verified) = Admin: full control, can approve other staff, post requests
 *   - staff (pending): can browse but cannot post requests or approve others
 *   - donor: can browse, respond to requests
 */
const jwt = require('jsonwebtoken');
const db = require('../store');

// Fail closed: a predictable fallback secret in production would let anyone
// forge a valid staff/admin token. The default is only allowed for local dev.
const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
const JWT_SECRET = process.env.JWT_SECRET || (isProduction ? null : 'bloodbridge-dev-secret');

if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is required in production. Set it in your environment before starting the server.'
  );
}
if (isProduction && JWT_SECRET.length < 32) {
  console.warn('[security] JWT_SECRET is shorter than 32 characters. Use a long random value.');
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus || null,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** Verify JWT and attach the *fresh* user record to req.user */
function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Never trust role/verificationStatus from the token alone: re-read the
    // user so approvals, rejections and deletions take effect immediately.
    const user = db.users.data.find(u => u._id === payload.userId);
    if (!user) return res.status(401).json({ error: 'Account no longer exists.' });

    req.user = {
      userId: user._id,
      role: user.role,
      verificationStatus: user.verificationStatus || null,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

/** Optional auth — attaches user if token present, continues either way */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      const user = db.users.data.find(u => u._id === payload.userId);
      if (user) {
        req.user = {
          userId: user._id,
          role: user.role,
          verificationStatus: user.verificationStatus || null,
        };
      }
    } catch {
      // ignore invalid tokens
    }
  }
  next();
}

/** Require a verified staff (admin) account */
function requireVerifiedStaff(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  if (req.user.role !== 'staff') {
    return res.status(403).json({ error: 'Only hospital staff can perform this action.' });
  }
  if (req.user.verificationStatus !== 'verified') {
    return res.status(403).json({ error: 'Your institution is pending verification.' });
  }
  next();
}

/** Require any authenticated user */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  next();
}

module.exports = { JWT_SECRET, signToken, authenticateToken, optionalAuth, requireVerifiedStaff, requireAuth };
