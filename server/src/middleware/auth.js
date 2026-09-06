/**
 * Authentication and authorization middleware for BloodBridge AI.
 *
 * Role model:
 *   - staff (verified) = Admin: full control, can approve other staff, post requests
 *   - staff (pending): can browse but cannot post requests or approve others
 *   - donor: can browse, respond to requests
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bloodbridge-dev-secret';

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

/** Verify JWT and attach user payload to req.user */
function authenticateToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, JWT_SECRET);
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
      req.user = jwt.verify(header.slice(7), JWT_SECRET);
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
