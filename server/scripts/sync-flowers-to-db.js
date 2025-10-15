const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const Flower = require('../models/flower.model');
require('dotenv').config();

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const bucketName = "flower-thumbnails";

// Convert dashed filename to title case
function convertToTitleCase(filename) {
    // Remove file extension and split by dashes
    const nameWithoutExt = filename.replace(/\.webp$/i, '');
    const words = nameWithoutExt.split('-');
    
    // Convert each word to title case
    const titleCaseWords = words.map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });
    
    return titleCaseWords.join(' ');
}

async function syncS3ToMongoDB() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all images from S3
        console.log('🔍 Fetching flower images from S3...');
        const listParams = { Bucket: bucketName };
        const s3Objects = await s3.listObjectsV2(listParams).promise();
        
        const webpFiles = s3Objects.Contents.filter(obj => obj.Key.endsWith('.webp'));
        console.log(`📸 Found ${webpFiles.length} WebP flower images`);
        
        let created = 0;
        let updated = 0;
        let skipped = 0;
        
        for (const file of webpFiles) {
            try {
                const s3Key = file.Key;
                const flowerName = convertToTitleCase(s3Key);
                const imageUrl = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
                
                console.log(`\n📥 Processing: ${s3Key} → "${flowerName}"`);
                
                // Check if flower already exists
                const existingFlower = await Flower.findOne({ name: flowerName });
                
                if (existingFlower) {
                    // Update existing flower with new S3 info
                    existingFlower.imageUrl = imageUrl;
                    existingFlower.s3Key = s3Key;
                    await existingFlower.save();
                    console.log(`🔄 Updated existing flower: ${flowerName}`);
                    updated++;
                } else {
                    // Create new flower
                    const newFlower = new Flower({
                        name: flowerName,
                        imageUrl: imageUrl,
                        s3Key: s3Key
                    });
                    
                    await newFlower.save();
                    console.log(`✅ Created new flower: ${flowerName}`);
                    created++;
                }
                
            } catch (error) {
                console.error(`❌ Error processing ${file.Key}:`, error.message);
                skipped++;
            }
        }
        
        console.log('\n📊 SYNC SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total flowers processed: ${webpFiles.length}`);
        console.log(`New flowers created: ${created}`);
        console.log(`Existing flowers updated: ${updated}`);
        console.log(`Skipped (errors): ${skipped}`);
        
        // Show some examples
        console.log('\n🌸 Sample flowers in database:');
        const sampleFlowers = await Flower.find().limit(5);
        sampleFlowers.forEach(flower => {
            console.log(`- ${flower.name} (${flower.s3Key})`);
        });
        
        console.log('\n🎉 Sync completed successfully!');
        
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the sync
if (require.main === module) {
    console.log('🚀 Starting S3 to MongoDB sync...\n');
    syncS3ToMongoDB();
}

module.exports = { syncS3ToMongoDB, convertToTitleCase };
