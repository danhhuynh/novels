const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB setup — EC2 uses IAM role, no explicit credentials needed
const client = new DynamoDBClient({ region: process.env.S3_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const USERS_TABLE = process.env.DYNAMO_USERS_TABLE || 'novels-users';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = '7d';

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
console.log('USERS_TABLE', USERS_TABLE);
        // Check if email already exists
        const existingUser = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { email }
        }));

        if (existingUser.Item) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();

        await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: {
                email,
                username,
                password: hashedPassword,
                createdAt: now
            },
            ConditionExpression: 'attribute_not_exists(email)'
        }));

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ConditionalCheckFailedException') {
            return res.status(409).json({ error: 'Email already registered' });
        }
        res.status(500).json({
            error: 'Registration failed',
            details: error.message,
            code: error.name
        });
    }
});

/**
 * POST /auth/login
 * Login and receive JWT token
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const result = await docClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { email }
        }));

        const user = result.Item;
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { username: user.username, email: user.email }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /auth/logout
 * Logout (client-side token removal, server-side placeholder)
 */
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

/**
 * GET /auth/me
 * Get current user info (requires valid JWT)
 */
router.get('/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ user: { username: decoded.username, email: decoded.email } });
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
});

module.exports = router;
