const express = require('express');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Assuming your router is in the same directory or adjust path accordingly
const authRouter = require('./routes/auth');
const forumChatRouter = require('./routes/forum-chat');

const app = express();
const PORT = process.env.PORT || 3003;

// --- 1. PROXY SETTING (MUST BE FIRST) ---
// This fixes the ValidationError and allows the limiter to see real IPs
app.set('trust proxy', 1);

// --- 2. RATE LIMITER CONFIG ---
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

// --- 3. MIDDLEWARE ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 4. ROUTES ---
app.use('/auth', authRouter);
app.use('/forum-chat', forumChatRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'novels-auth',
        ip: req.ip // Useful for debugging to see what IP Express detects
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// --- 5. ERROR HANDLER ---
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

// --- 6. START SERVER ---
// Explicitly binding to '0.0.0.0' to ensure EC2 accessibility
const server = app.listen(PORT, '0.0.0.0', (err) => {
    if (err) {
        console.error('Failed to bind to port:', err);
        process.exit(1);
    }
    console.log(`✅ Auth service successfully started!`);
    console.log(`Port: ${PORT}`);
    console.log(`Interface: 0.0.0.0 (Publicly Accessible)`);
    console.log(`Trust Proxy: ${app.get('trust proxy')}`);
});

// Handle graceful shutdown or unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;