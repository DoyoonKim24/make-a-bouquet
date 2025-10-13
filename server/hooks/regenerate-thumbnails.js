const mongoose = require('mongoose');
const Bouquet = require('../models/bouquet.model');
const BouquetAnalyzer = require('./bouquet-analyzer');
require('dotenv').config();

async function regenerateAllThumbnails() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Initialize analyzer
        const analyzer = new BouquetAnalyzer();

        // Get all bouquets
        const allBouquets = await Bouquet.find({});
        console.log(`Found ${allBouquets.length} bouquets to process`);

        let successCount = 0;
        let errorCount = 0;

        for (const bouquet of allBouquets) {
            try {
                console.log(`\n🔄 Processing: ${bouquet.name} (${bouquet.s3Key})`);
                
                // Delete old thumbnail from S3 if it exists
                if (bouquet.thumbnailS3Key) {
                    try {
                        await analyzer.s3.deleteObject({
                            Bucket: process.env.S3_BUCKET_NAME,
                            Key: bouquet.thumbnailS3Key
                        }).promise();
                        console.log(`🗑️  Deleted old thumbnail: ${bouquet.thumbnailS3Key}`);
                    } catch (deleteError) {
                        console.log(`⚠️  Old thumbnail not found or already deleted: ${bouquet.thumbnailS3Key}`);
                    }
                }
                
                // Create new thumbnail
                console.log(`📸 Creating new thumbnail for: ${bouquet.s3Key}`);
                const thumbnailKey = await analyzer.createThumbnail(bouquet.s3Key);
                
                if (thumbnailKey) {
                    const thumbnailUrl = analyzer.getThumbnailUrl(thumbnailKey);
                    
                    // Update bouquet record
                    await Bouquet.findByIdAndUpdate(bouquet._id, {
                        thumbnailUrl: thumbnailUrl,
                        thumbnailS3Key: thumbnailKey
                    });
                    
                    console.log(`✅ Successfully regenerated thumbnail for ${bouquet.name}`);
                    successCount++;
                } else {
                    console.log(`❌ Failed to generate thumbnail for ${bouquet.name}`);
                    errorCount++;
                }
            } catch (error) {
                console.error(`💥 Error processing ${bouquet.name}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\n🎉 Thumbnail regeneration complete!`);
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);
        console.log(`📊 Total: ${allBouquets.length}`);
        
        process.exit(0);
    } catch (error) {
        console.error('💥 Fatal error regenerating thumbnails:', error);
        process.exit(1);
    }
}

regenerateAllThumbnails();
