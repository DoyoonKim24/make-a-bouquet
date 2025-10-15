const mongoose = require('mongoose');
const Bouquet = require('../models/bouquet.model');
const BouquetAnalyzer = require('./bouquet-analyzer');
require('dotenv').config();

async function generateThumbnailsForExisting() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Initialize analyzer
        const analyzer = new BouquetAnalyzer();

        // Find all bouquets without thumbnails
        const bouquetsWithoutThumbnails = await Bouquet.find({
            thumbnailUrl: { $exists: false }
        });

        console.log(`Found ${bouquetsWithoutThumbnails.length} bouquets without thumbnails`);

        for (const bouquet of bouquetsWithoutThumbnails) {
            try {
                console.log(`Generating thumbnail for: ${bouquet.s3Key}`);
                
                // Create thumbnail
                const thumbnailKey = await analyzer.createThumbnail(bouquet.s3Key);
                
                if (thumbnailKey) {
                    const thumbnailUrl = analyzer.getThumbnailUrl(thumbnailKey);
                    
                    // Update bouquet record
                    await Bouquet.findByIdAndUpdate(bouquet._id, {
                        thumbnailUrl: thumbnailUrl,
                        thumbnailS3Key: thumbnailKey
                    });
                    
                    console.log(`✅ Generated thumbnail for ${bouquet.name}`);
                } else {
                    console.log(`❌ Failed to generate thumbnail for ${bouquet.name}`);
                }
            } catch (error) {
                console.error(`Error processing ${bouquet.name}:`, error);
            }
        }

        console.log('🎉 Thumbnail generation complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error generating thumbnails:', error);
        process.exit(1);
    }
}

generateThumbnailsForExisting();
