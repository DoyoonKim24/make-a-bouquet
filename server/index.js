const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Bouquet = require('./models/bouquet.model');
const BouquetAnalyzer = require('./bouquet-analyzer');
const aws = require('aws-sdk');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})
const bucket = process.env.S3_BUCKET_NAME;

async function testS3() {
    try {
        console.log('Testing S3 connection...');
        const response = await s3.listObjectsV2({ Bucket: bucket }).promise();
        console.log(`✅ S3 connection successful! Found ${response.Contents.length} objects in bucket.`);
        return response;
    } catch (error) {
        console.error('❌ S3 connection failed:', error.message);
        throw error;
    }
}

// Test S3 connection on startup
testS3().catch(console.error);

// Start server
app.get('/', (req, res) => {
    res.json({ 
        message: 'Bouquet Analysis API',
        status: 'running'
    });
});

// Add test endpoint
app.get('/test-s3', async (req, res) => {
    try {
        const result = await testS3();
        res.json({ 
            success: true, 
            message: `Found ${result.Contents.length} objects in S3 bucket`,
            objects: result.Contents.slice(0, 5) // Show first 5 objects
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});