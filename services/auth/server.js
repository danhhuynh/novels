const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.AUTH_PORT || 3001;

// Security middleware
app.use(helmet());
app.set('trust proxy', 1);
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'novels-auth' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server (no DB init needed — DynamoDB is serverless)
app.listen(PORT, () => {
    console.log(`Auth service is running on port ${PORT}`);
    console.log(`Visit: http://localhost:${PORT}`);
});

module.exports = app;
