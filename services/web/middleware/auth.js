const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

console.log('[AuthMiddleware] Middleware loaded');
console.log(`[AuthMiddleware] JWT_SECRET configured: ${JWT_SECRET === 'change-this-secret-in-production' ? 'NO (using default)' : 'YES'}`);

/**
 * Middleware to check for JWT in HttpOnly cookie and verify it.
 * If valid, user info is attached to res.locals.user for EJS templates.
 * Does not block request if token is missing or invalid.
 */
function extractUserVars(req, res, next) {
    // Add immediate log to see if function is called at all
    console.log(`[AuthMiddleware] *** MIDDLEWARE CALLED *** ${new Date().toISOString()}`);
    
    try {
        console.log(`[AuthMiddleware] Processing request: ${req.method} ${req.path}`);
        console.log(`[AuthMiddleware] Headers present: ${Object.keys(req.headers).join(', ')}`);
        console.log(`[AuthMiddleware] Cookie header: ${req.headers.cookie || 'none'}`);
        console.log(`[AuthMiddleware] Parsed cookies: ${req.cookies ? Object.keys(req.cookies).join(', ') : 'none'}`);

        const token = req.cookies && req.cookies.token;

        if (!token) {
            console.log(`[AuthMiddleware] No token found in cookies`);
            res.locals.user = null;
            return next();
        }

        console.log(`[AuthMiddleware] Token found: ${token.substring(0, 20)}...`);

        if (!JWT_SECRET || JWT_SECRET === 'change-this-secret-in-production') {
            console.warn('[AuthMiddleware] ⚠️ JWT_SECRET is using default or missing!');
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            res.locals.user = decoded; // Contains { email, username }
            console.log(`[AuthMiddleware] ✅ User authenticated: ${decoded.username} (${decoded.email})`);
        } catch (err) {
            // Token invalid or expired
            console.error(`[AuthMiddleware] ❌ JWT verification failed: ${err.message}`);
            res.locals.user = null;
        }

        console.log(`[AuthMiddleware] *** MIDDLEWARE COMPLETE *** calling next()`);
        next();
    } catch (error) {
        console.error(`[AuthMiddleware] *** CRITICAL ERROR IN MIDDLEWARE ***: ${error.message}`);
        console.error(error.stack);
        res.locals.user = null;
        next();
    }
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
