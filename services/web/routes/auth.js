const express = require('express');
const router = express.Router();
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

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

        // Call internal private Auth Service
        const response = await axios.post(`${AUTH_SERVICE_URL}/auth/login`, {
            email,
            password
        });

        // Setup HttpOnly Cookie with JWT token
        const { token, user } = response.data;
        res.cookie('token', token, cookieConfig);

        res.json({ message: 'Login successful', user });
    } catch (error) {
        console.error('Login proxy error:', error.response?.data || error.message);
        const status = error.response?.status || 500;
        const errMessage = error.response?.data?.error || 'Login failed';
        res.status(status).json({ error: errMessage });
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
        const errMessage = error.response?.data?.error || 'Registration failed';
        res.status(status).json({ error: errMessage });
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
