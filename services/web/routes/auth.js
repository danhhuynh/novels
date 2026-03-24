const express = require('express');
const router = express.Router();
const axios = require('axios');

const rawAuthUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
// Remove any accidental trailing semicolons, slashes, or whitespace from the .env variable
const AUTH_SERVICE_URL = rawAuthUrl.replace(/[;\/\s]+$/, '');

/**
 * Common configuration for HttpOnly JWT cookies
 */
const cookieConfig = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * POST /api/auth/login
 * Proxy login request to Auth Service
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Proxying login for ${email} to ${AUTH_SERVICE_URL}`);

        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, {
            email,
            password
        }, { timeout: 5000 });

        // 1. Safety check: ensure response.data exists
        if (!response.data || !response.data.token) {
            throw new Error('Auth service returned empty or invalid data');
        }

        const { token, user } = response.data;

        // 2. Set the cookie
        res.cookie('token', token, cookieConfig);
        console.log(`Login successful for ${email}`);

        // 3. Send and RETURN to ensure no further code executes
        return res.status(200).json({
            message: 'Login successful',
            user: user || {},
            success: true
        });

    } catch (error) {
        // Detailed logging to your EC2 terminal
        console.error('--- PROXY ERROR ---');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        } else {
            console.error('Message:', error.message);
            if (error.code === 'ECONNREFUSED') {
                console.error("❌ ERROR: Auth Service is NOT running on port 3001!");
            } else if (error.code === 'ETIMEDOUT') {
                console.error("❌ ERROR: Connection to Auth Service timed out!");
            }
            return res.status(500).json({ error: 'Auth service unreachable', details: error.message });
        }
    }
});

/**
 * POST /api/auth/register
 * Proxy register request to Auth Service
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/register`, {
            username,
            email,
            password
        });

        res.status(201).json(response.data);
    } catch (error) {
        console.error('Register proxy error:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const errData = error.response?.data || { error: 'Registration failed' };
        res.status(status).json(errData);
    }
});

/**
 * POST /api/auth/logout
 * Clear the cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
