const mongoose = require('mongoose');
const BouquetAnalyzer = require('./bouquet-analyzer');
const Bouquet = require('../models/bouquet.model');
require('dotenv').config();

/**
 * Script to add season information to existing bouquets that don't have it
 */
async function addSeasonsToExisting() {
    try {
        console.log('🌸 Starting to add seasons to existing bouquets...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Initialize analyzer
        const analyzer = new BouquetAnalyzer();

        // Find all bouquets
        const bouquetsWithoutSeasons = await Bouquet.find({});

        console.log(`Found ${bouquetsWithoutSeasons.length} bouquets to process`);


        // Process bouquets in batches to avoid rate limits
        const batchSize = 3;
        let processed = 0;

        for (let i = 0; i < bouquetsWithoutSeasons.length; i += batchSize) {
            const batch = bouquetsWithoutSeasons.slice(i, i + batchSize);
            console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(bouquetsWithoutSeasons.length / batchSize)}`);
            
            for (const bouquet of batch) {
                try {
                    console.log(`  Analyzing seasons for: ${bouquet.name}`);
                    
                    // Determine seasons based on existing flowers
                    const seasons = await analyzer.determineSeasons(bouquet.flowers);
                    
                    // Update the bouquet
                    await Bouquet.findByIdAndUpdate(bouquet._id, {
                        seasons: seasons,
                        updatedAt: new Date()
                    });
                    
                    console.log(`    ✅ Added seasons: ${seasons.join(', ')}`);
                    processed++;
                    
                } catch (error) {
                    console.error(`    ❌ Error processing ${bouquet.name}:`, error.message);
                }
            }

            // Add delay between batches to respect API rate limits
            if (i + batchSize < bouquetsWithoutSeasons.length) {
                console.log('  Waiting 3 seconds before next batch...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log(`\n🎉 Successfully added seasons to ${processed} bouquets!`);
        
        // Show summary statistics
        const seasonStats = await Bouquet.aggregate([
            { $unwind: '$seasons' },
            { $group: { _id: '$seasons', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);
        
        console.log('\n📊 Season Distribution:');
        seasonStats.forEach(stat => {
            console.log(`  ${stat._id}: ${stat.count} bouquets`);
        });

    } catch (error) {
        console.error('❌ Error adding seasons:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the script if called directly
if (require.main === module) {
    addSeasonsToExisting();
}

module.exports = addSeasonsToExisting;
