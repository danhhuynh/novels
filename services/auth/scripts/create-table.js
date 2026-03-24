/**
 * One-time script to create the DynamoDB users table.
 * Run on EC2: node scripts/create-table.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: process.env.S3_REGION || 'us-east-1' });
const TABLE_NAME = process.env.DYNAMO_USERS_TABLE || 'novels-users';

async function createTable() {
    try {
        await client.send(new CreateTableCommand({
            TableName: TABLE_NAME,
            KeySchema: [
                { AttributeName: 'email', KeyType: 'HASH' }
            ],
            AttributeDefinitions: [
                { AttributeName: 'email', AttributeType: 'S' }
            ],
            BillingMode: 'PAY_PER_REQUEST'
        }));
        console.log(`Table "${TABLE_NAME}" created successfully!`);
    } catch (error) {
        if (error.name === 'ResourceInUseException') {
            console.log(`Table "${TABLE_NAME}" already exists.`);
        } else {
            console.error('Error creating table:', error);
        }
    }
}

createTable();
