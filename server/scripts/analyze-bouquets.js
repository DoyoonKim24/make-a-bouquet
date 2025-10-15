#!/usr/bin/env node

const mongoose = require('mongoose');
const BouquetAnalyzer = require('../bouquet-analyzer');
require('dotenv').config();

async function main() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Initialize analyzer
        const analyzer = new BouquetAnalyzer();

        // Check command line arguments
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'process':
                console.log('Starting to process all images...\n');
                await analyzer.processAllImages();
                break;

            case 'stats':
                console.log('Generating analysis statistics...\n');
                const stats = await analyzer.getAnalysisStats();
                console.log('📊 Analysis Statistics:');
                console.log(`Total Bouquets: ${stats.totalBouquets}`);
                
                console.log('\n🌺 Top Flowers:');
                stats.topFlowers.forEach((flower, i) => {
                    console.log(`${i + 1}. ${flower._id}: ${flower.count} bouquets (avg confidence: ${(flower.avgConfidence * 100).toFixed(1)}%)`);
                });

                console.log('\n🎨 Top Colors:');
                stats.topColors.forEach((color, i) => {
                    console.log(`${i + 1}. ${color._id}: ${color.count} bouquets`);
                });

                console.log('\n✨ Style Distribution:');
                stats.styleDistribution.forEach((style, i) => {
                    console.log(`${i + 1}. ${style._id}: ${style.count} bouquets`);
                });
                break;

            case 'list':
                console.log('Listing images in S3 bucket...\n');
                const images = await analyzer.listImages();
                console.log(`Found ${images.length} images:`);
                images.forEach((img, i) => {
                    console.log(`${i + 1}. ${img.Key} (${(img.Size / 1024).toFixed(1)} KB)`);
                });
                break;

            case 'test':
                console.log('Testing connection to S3 and OpenAI...\n');
                
                // Test S3 connection
                try {
                    const images = await analyzer.listImages();
                    console.log(`✅ S3 Connection: Found ${images.length} images`);
                } catch (error) {
                    console.log('❌ S3 Connection failed:', error.message);
                }

                // Test OpenAI connection (just check if API key is set)
                if (process.env.OPENAI_API_KEY) {
                    console.log('✅ OpenAI API key is configured');
                } else {
                    console.log('❌ OpenAI API key is not configured');
                }
                break;

            default:
                console.log('Available commands:');
                console.log('  process  - Process all images in S3 bucket');
                console.log('  stats    - Show analysis statistics');
                console.log('  list     - List all images in S3 bucket');
                console.log('  test     - Test connections to S3 and OpenAI');
                console.log('\nUsage: node analyze-bouquets.js <command>');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('\n👋 Done!');
        process.exit(0);
    }
}

// Handle uncaught errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled promise rejection:', error);
    process.exit(1);
});

// Run the main function
main();
