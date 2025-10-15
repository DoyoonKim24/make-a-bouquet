const AWS = require('aws-sdk');
const sharp = require('sharp');
require('dotenv').config();

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const bucketName = "flower-thumbnails";

async function compressAndReplaceImage(key) {
    try {
        console.log(`📥 Processing: ${key}`);
        
        // Download original
        const getParams = { Bucket: bucketName, Key: key };
        const original = await s3.getObject(getParams).promise();
        const originalSize = original.Body.length;
        
        // Compress
        const compressed = await sharp(original.Body)
            .resize(300, 300, { 
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toBuffer();
            
        const compressedSize = compressed.length;
        
        
        // Create new key with .webp extension
        const newKey = key.replace(/\.(jpg|jpeg|png|avif|webp)$/i, '.webp');

        // Upload compressed version with new key
        const uploadParams = {
            Bucket: bucketName,
            Key: newKey,
            Body: compressed,
            ContentType: 'image/webp',
            ACL: 'public-read'
        };
        
        await s3.upload(uploadParams).promise();
        
        // Delete original if the key changed
        if (newKey !== key) {
            await s3.deleteObject({ Bucket: bucketName, Key: key }).promise();
            console.log(`🗑️  Deleted original: ${key}`);
        }
        
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        console.log(`✅ ${key} → ${newKey}: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${savings}% smaller)`);
        
        return true;
    } catch (error) {
        console.error(`❌ Error processing ${key}:`, error.message);
        return false;
    }
}

async function compressAllImages() {
    try {
        // Get all images
        const listParams = { Bucket: bucketName };
        const objects = await s3.listObjectsV2(listParams).promise();
        
        console.log(`🔍 Found ${objects.Contents.length} files to process\n`);
        
        let processed = 0;
        let successful = 0;
        
        for (const obj of objects.Contents) {
            const success = await compressAndReplaceImage(obj.Key);
            if (success) successful++;
            processed++;
        }
        
        console.log(`\n🎉 Completed! ${successful}/${processed} files successfully compressed and replaced.`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the compression
compressAllImages();
