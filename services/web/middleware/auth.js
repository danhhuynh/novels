const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

/**
 * Middleware to check for JWT in HttpOnly cookie and verify it.
 * If valid, user info is attached to res.locals.user for EJS templates.
 * Does not block request if token is missing or invalid.
 */
function extractUserVars(req, res, next) {
    const token = req.cookies && req.cookies.token;

    // Debug log to see if any cookies are present
    console.log(`[AuthMiddleware] Cookies found: ${Object.keys(req.cookies || {}).join(', ') || 'none'}`);

    if (!token) {
        res.locals.user = null;
        return next();
    }

    if (!JWT_SECRET || JWT_SECRET === 'change-this-secret-in-production') {
        console.warn('[AuthMiddleware] ⚠️ JWT_SECRET is using default or missing!');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.locals.user = decoded; // Contains { email, username }
        console.log(`[AuthMiddleware] ✅ User identified: ${decoded.username} (${decoded.email})`);
    } catch (err) {
        // Token invalid or expired
        console.error(`[AuthMiddleware] ❌ JWT verification failed for token. Error: ${err.message}`);
        res.locals.user = null;
    }

    next();
}

/**
 * Middleware to enforce authentication on specific routes.
 * Redirects to login if not authenticated.
 */
function requireAuth(req, res, next) {
    if (!res.locals.user) {
        return res.redirect('/login');
    }
    next();
}

module.exports = {
    extractUserVars,
    requireAuth
};
