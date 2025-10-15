#!/usr/bin/env node

const mongoose = require('mongoose');
const Bouquet = require('../models/bouquet.model');
require('dotenv').config();

async function replaceFlower() {
    const flowerName = "Stock";
    const replacementName = "Stock Flower";
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');

        const bouquetsFound = await Bouquet.find({
            "flowers.name": flowerName
        });

        console.log(`Found ${bouquetsFound.length} bouquets containing "${flowerName}"`);

        let updatedCount = 0;

        for (const bouquet of bouquetsFound) {
            let hasChanges = false;
            
            // Check each flower in the flowers array
            bouquet.flowers.forEach(flower => {
                if (flower.name && flower.name.toLowerCase() === (flowerName.toLowerCase())) {
                    console.log(`  Updating "${flower.name}" in bouquet: ${bouquet.name}`);
                    flower.name = flower.name.replace(flowerName, replacementName);
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                // Save the updated bouquet
                await bouquet.save();
                updatedCount++;
                console.log(`  ✓ Updated bouquet: ${bouquet.name}`);
            }
        }

        console.log(`\n✅ Successfully updated ${updatedCount} bouquets`);
        console.log('All occurrences replaced');

    } catch (error) {
        console.error('❌ Error updating database:', error);
    } finally {
        // Close the database connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the replacement
replaceFlower();
