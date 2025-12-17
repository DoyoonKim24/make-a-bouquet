const AWS = require('aws-sdk');
const sharp = require('sharp');
require('dotenv').config();

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const bucketName = "bouquet-images";

async function compressAndCreateThumbnail(key) {
    try {
        console.log(`📥 Processing: ${key}`);
        
        // Download original high-quality image
        const getParams = { Bucket: bucketName, Key: key };
        const original = await s3.getObject(getParams).promise();
        const originalSize = original.Body.length;
        
        // Compress to create thumbnail
        const compressed = await sharp(original.Body)
            .resize(600, 600, { 
                fit: 'cover',
                position: 'center'
            })
            .webp({ quality: 80 })
            .toBuffer();
            
        const compressedSize = compressed.length;
        
        // Create thumbnail key: move to thumbnails folder and add _thumb suffix
        const fileName = key.split('/').pop(); // Get filename from path
        const baseName = fileName.replace(/\.(jpg|jpeg|png|avif|webp)$/i, '');
        const thumbnailKey = `thumbnails/${baseName}_thumb.webp`;

        // Upload compressed version as thumbnail
        const uploadParams = {
            Bucket: bucketName,
            Key: thumbnailKey,
            Body: compressed,
            ContentType: 'image/webp',
            ACL: 'public-read'
        };
        
        await s3.upload(uploadParams).promise();
        
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        console.log(`✅ ${key} → ${thumbnailKey}: ${(originalSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${savings}% smaller)`);
        
        return true;
    } catch (error) {
        console.error(`❌ Error processing ${key}:`, error.message);
        return false;
    }
}

async function compressAllImages() {
    try {
        // Get all objects in bucket
        const listParams = { Bucket: bucketName };
        const objects = await s3.listObjectsV2(listParams).promise();
        
        // Filter to only process high-quality images (not in thumbnails folder)
        const highQualityImages = objects.Contents.filter(obj => {
            const key = obj.Key;
            // Skip if it's in thumbnails folder
            if (key.startsWith('thumbnails/')) return false;
            // Only process image files
            return /\.(jpg|jpeg|png|avif|webp)$/i.test(key);
        });
        
        console.log(`🔍 Found ${highQualityImages.length} high-quality images to process\n`);
        
        let processed = 0;
        let successful = 0;
        
        for (const obj of highQualityImages) {
            const success = await compressAndCreateThumbnail(obj.Key);
            if (success) successful++;
            processed++;
        }
        
        console.log(`\n🎉 Completed! ${successful}/${processed} thumbnails successfully created.`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run the compression
compressAllImages();
