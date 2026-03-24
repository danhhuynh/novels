const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node tool for IDs
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

// 1. Updated Region to match your table
const client = new DynamoDBClient({ region: process.env.S3_REGION || 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const rawTable = process.env.DYNAMO_USERS_TABLE || 'user';
const USERS_TABLE = rawTable.replace(/["';\s]/g, ''); 
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = '7d';

/**
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if email exists (requires a Scan because email is not the Partition Key)
        const checkEmail = await docClient.send(new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": { S: email } }
        }));

        if (checkEmail.Count > 0) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 2. Aligning with your schema: Partition Key 'id' and Sort Key 'created_at'
        const newUser = {
            id: crypto.randomUUID(),           // Matches 'id' (String)
            created_at: new Date().toISOString(), // Matches 'created_at' (String)
            email,
            username,
            password: hashedPassword
        };

        await docClient.send(new PutCommand({
            TableName: USERS_TABLE,
            Item: newUser
        }));

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error details:', error);
        res.status(500).json({
            error: 'Registration failed',
            details: error.message
        });
    }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 3. Must use Scan to find user by email since email isn't the Key
        const result = await docClient.send(new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": { S: email } }
        }));

        const user = result.Items && result.Items[0]; 
        
        // Note: Scan returns raw DynamoDB JSON, so we access fields via .S (String)
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValid = await bcrypt.compare(password, user.password.S);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { email: user.email.S, username: user.username.S, id: user.id.S },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { username: user.username.S, email: user.email.S }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// ... (Logout and Me routes stay the same)

module.exports = router;