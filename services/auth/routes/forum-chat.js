const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Built-in Node tool for IDs
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// 1. Updated Region to match your table
const client = new DynamoDBClient({ region: process.env.S3_REGION || 'ap-southeast-1' });
const docClient = DynamoDBDocumentClient.from(client);

const FORUM_CHAT_TABLE = process.env.DYNAMO_FORUM_CHAT_TABLE || 'forum-chat';

const rawTable = process.env.DYNAMO_USERS_TABLE || 'user';
const USERS_TABLE = rawTable.replace(/["';\s]/g, ''); 
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const JWT_EXPIRY = '7d';

// ... (Logout and Me routes stay the same)

/**
 * POST /forum-chat
 * Body: { message: string }
 * Auth required (expects req.user or pass userId in body for now)
 */
router.post('/', async (req, res) => {
    try {
        const { message, username, userId } = req.body;
        if (!message || !username || !userId) {
            return res.status(400).json({ error: 'Message, username, and userId are required' });
        }
        if (message.length > 70) {
            return res.status(400).json({ error: 'Message must be 70 characters or less' });
        }
        const chatItem = {
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            message,
            username,
            userId
        };
        await docClient.send(new PutCommand({
            TableName: FORUM_CHAT_TABLE,
            Item: chatItem
        }));
        res.status(201).json({ message: 'Message sent', item: chatItem });
    } catch (error) {
        console.error('Forum chat create error:', error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

/**
 * GET /forum-chat
 * Query: ?limit=50 (default 50)
 * Returns latest messages (descending by created_at)
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 50));
        // Scan all, sort in-memory (for demo, not for large scale)
        const result = await docClient.send(new ScanCommand({
            TableName: FORUM_CHAT_TABLE
        }));
        const items = (result.Items || []).sort((a, b) => {
            return (b.created_at > a.created_at) ? 1 : -1;
        }).slice(0, limit);
        res.json({ messages: items });
    } catch (error) {
        console.error('Forum chat read error:', error);
        res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
    }
});

module.exports = router;