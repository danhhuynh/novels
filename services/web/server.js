const express = require('express');
const path = require('path');
const helmet = require('helmet');
const crypto = require('crypto');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import routes
const indexRouter = require('./routes/index');
const novelsRouter = require('./routes/novels');
const chaptersRouter = require('./routes/chapters');
const authRouter = require('./routes/auth');
const { extractUserVars } = require('./middleware/auth');
const { initializeDb } = require('../../shared/database/db');
const forumChatRouter = require('./routes/forum-chat');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// Generate Nonce Middleware for CSP
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('hex');
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.nonce}'`, "https://www.googletagmanager.com"],
      scriptSrcAttr: ["'unsafe-inline'"], // Allow onclick handlers
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://www.google-analytics.com"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased for debugging
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// View engine setup
const isProd = process.env.NODE_ENV === 'production';
const viewsPath = isProd ? path.join(__dirname, 'dist/views') : path.join(__dirname, 'views');
const publicPath = isProd ? path.join(__dirname, 'dist/public') : path.join(__dirname, 'public');

app.set('view engine', 'ejs');
app.set('views', viewsPath);

// Static files
app.use(express.static(publicPath));

// Body parser and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add simple request logger to debug
app.use((req, res, next) => {
    console.log(`[Server] *** REQUEST RECEIVED *** ${req.method} ${req.path} from ${req.ip}`);
    next();
});

// Custom Middleware
console.log('[Server] Registering extractUserVars middleware...');
app.use(extractUserVars); // Extract user from JWT cookie on every request

// Routes
app.use('/', indexRouter);
app.use('/api', indexRouter);
app.use('/api/auth', authRouter); // Auth proxy routes
app.use('/api/forum-chat', forumChatRouter); // Forum chat proxy
app.use('/novels', novelsRouter);
app.use('/chapters', chaptersRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    statusCode: 404
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    statusCode: 500
  });
});

// Initialize database, then start server
initializeDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Novel reading website is running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

module.exports = app;