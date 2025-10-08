#!/usr/bin/env node

const mongoose = require('mongoose');
const Bouquet = require('./models/bouquet.model');
require('dotenv').config();

// Function to convert to title case
function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Function to extract color from flower name and separate them
function separateFlowerAndColor(flowerName) {
    const colorPrefixes = [
        'Red', 'Pink', 'White', 'Yellow', 'Orange', 'Purple', 'Blue', 'Green', 
        'Lavender', 'Cream', 'Peach', 'Coral', 'Magenta', 'Burgundy', 'Maroon',
        'Light Pink', 'Dark Pink', 'Hot Pink', 'Baby Pink', 'Blush Pink',
        'Light Blue', 'Dark Blue', 'Navy Blue', 'Sky Blue', 'Royal Blue',
        'Bright Yellow', 'Pale Yellow', 'Golden Yellow', 'Lemon Yellow',
        'Deep Purple', 'Light Purple', 'Violet', 'Mauve', 'Lilac'
    ];
    
    let extractedColor = null;
    let cleanFlowerName = flowerName;
    
    // Check for color prefixes
    for (const color of colorPrefixes) {
        const regex = new RegExp(`^${color}\\s+`, 'i');
        if (regex.test(flowerName)) {
            extractedColor = color;
            cleanFlowerName = flowerName.replace(regex, '').trim();
            break;
        }
    }
    
    return {
        flower: cleanFlowerName,
        color: extractedColor
    };
}

// Function to clean and standardize colors
function cleanColor(colorName) {
    let cleaned = colorName.trim();
    
    // Remove parenthetical descriptions
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
    
    // Split on '/' and return array of colors
    const colors = cleaned.split('/').map(c => c.trim());
    
    // Convert to title case
    const titleCaseColors = colors.map(color => toTitleCase(color));
    
    // Apply color mappings for standardization
    return titleCaseColors.map(color => {
        const colorMappings = {
            "Soft Pink": "Light Pink",
            "Deep Pink": "Pink"
        };
        
        return colorMappings[color] || color;
    });
}

// Function to clean and standardize occasions
function cleanOccasion(occasionString) {
    if (!occasionString || typeof occasionString !== 'string') {
        return [];
    }
    
    // Split by comma and clean each occasion
    const occasions = occasionString.split(',').map(occasion => {
        return toTitleCase(occasion.trim());
    }).filter(occasion => occasion.length > 0);
    
    return occasions;
}

// Function to standardize flower names
function cleanFlowerName(flowerName) {
    let cleaned = flowerName.trim();
    
    // Remove parentheses and their contents
    cleaned = cleaned.replace(/\s*\([^)]*\)/g, '');
    
    // Convert to title case
    cleaned = toTitleCase(cleaned);
    
    // Fix common naming issues
    const flowerMappings = {
        "Baby'S Breath": "Baby's Breath",
        "Babies Breath": "Baby's Breath",
        "Babys Breath": "Baby's Breath",
        "Birds Of Paradise": "Bird of Paradise",
        "Billy Balls": "Billy Button",
        "Billy Ball": "Billy Button",
        "Chrysanthemums": "Chrysanthemum",
        "Mums": "Chrysanthemum"
    };
    
    if (flowerMappings[cleaned]) {
        cleaned = flowerMappings[cleaned];
    }
    
    return cleaned;
}

async function analyzeCurrentData() {
    console.log('🔍 Analyzing current database issues...\n');
    
    const bouquets = await Bouquet.find({});
    
    console.log(`Found ${bouquets.length} bouquets to analyze\n`);
    
    // Collect all unique flower names, colors, and occasions
    const allFlowers = new Set();
    const allColors = new Set();
    const allOccasions = new Set();
    const problematicFlowers = [];
    const problematicColors = [];
    const problematicOccasions = [];
    
    bouquets.forEach(bouquet => {
        // Check flowers
        bouquet.flowers?.forEach(flower => {
            allFlowers.add(flower.name);
            
            // Check if flower name contains color
            const separated = separateFlowerAndColor(flower.name);
            if (separated.color) {
                problematicFlowers.push({
                    original: flower.name,
                    flower: separated.flower,
                    extractedColor: separated.color
                });
            }
            
            // Check if flower name contains parentheses
            if (flower.name.includes('(')) {
                const cleaned = cleanFlowerName(flower.name);
                if (cleaned !== flower.name) {
                    problematicFlowers.push({
                        original: flower.name,
                        flower: cleaned,
                        extractedColor: null
                    });
                }
            }
        });
        
        // Check colors
        bouquet.colors?.forEach(color => {
            allColors.add(color.name);
            
            // Check for problematic color formats
            if (color.name.includes('(') || color.name.includes('/') || 
                color.name === 'Soft Pink' || color.name === 'Deep Pink') {
                const cleaned = cleanColor(color.name);
                problematicColors.push({
                    original: color.name,
                    cleaned: cleaned
                });
            }
        });
        
        // Check occasions
        if (bouquet.occasion) {
            allOccasions.add(bouquet.occasion);
            
            // Check if occasion is a string (should be converted to array)
            if (typeof bouquet.occasion === 'string') {
                const cleanedOccasions = cleanOccasion(bouquet.occasion);
                problematicOccasions.push({
                    original: bouquet.occasion,
                    cleaned: cleanedOccasions
                });
            }
        }
    });
    
    console.log('🌺 Current Flower Names:');
    Array.from(allFlowers).sort().forEach(flower => console.log(`  - ${flower}`));
    
    console.log('\n🎨 Current Color Names:');
    Array.from(allColors).sort().forEach(color => console.log(`  - ${color}`));
    
    console.log('\n🎉 Current Occasions:');
    Array.from(allOccasions).sort().forEach(occasion => console.log(`  - ${occasion}`));
    
    console.log('\n❗ Problematic Flowers (containing colors):');
    problematicFlowers.forEach(p => {
        console.log(`  - "${p.original}" → Flower: "${p.flower}", Color: "${p.extractedColor}"`);
    });
    
    console.log('\n❗ Problematic Colors (need cleaning):');
    problematicColors.forEach(p => {
        console.log(`  - "${p.original}" → ${p.cleaned.join(', ')}`);
    });
    
    console.log('\n❗ Problematic Occasions (need conversion):');
    problematicOccasions.forEach(p => {
        console.log(`  - "${p.original}" → [${p.cleaned.join(', ')}]`);
    });
    
    return { problematicFlowers, problematicColors, problematicOccasions, bouquets };
}

async function fixDatabase() {
    console.log('\n🔧 Starting database fixes...\n');
    
    const bouquets = await Bouquet.find({});
    let updatedCount = 0;
    
    for (const bouquet of bouquets) {
        let needsUpdate = false;
        const newColors = new Set();
        
        // Add existing colors to the set (cleaned)
        bouquet.colors?.forEach(color => {
            const cleanedColors = cleanColor(color.name);
            cleanedColors.forEach(c => {
                newColors.add({
                    name: c,
                    prominence: color.prominence
                });
            });
        });
        
        // Process flowers
        const newFlowers = [];
        bouquet.flowers?.forEach(flower => {
            const separated = separateFlowerAndColor(flower.name);
            const cleanedFlowerName = cleanFlowerName(separated.flower);
            
            // Add cleaned flower
            newFlowers.push({
                name: cleanedFlowerName,
                confidence: flower.confidence
            });
            
            // If we extracted a color, add it to colors
            if (separated.color) {
                // Apply color mappings for extracted colors too
                const cleanedExtractedColors = cleanColor(separated.color);
                cleanedExtractedColors.forEach(c => {
                    newColors.add({
                        name: c,
                        prominence: 'secondary' // Default prominence for extracted colors
                    });
                });
                needsUpdate = true;
            }
            
            // Check if flower name changed
            if (cleanedFlowerName !== flower.name) {
                needsUpdate = true;
            }
        });
        
        // Check if colors changed
        const originalColorNames = bouquet.colors?.map(c => c.name).sort().join(',') || '';
        const newColorNames = Array.from(newColors).map(c => c.name).sort().join(',');
        if (originalColorNames !== newColorNames) {
            needsUpdate = true;
        }
        
        // Process occasion (convert from string to array if needed)
        let newOccasion = bouquet.occasion;
        if (bouquet.occasion && typeof bouquet.occasion === 'string') {
            newOccasion = cleanOccasion(bouquet.occasion);
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            bouquet.flowers = newFlowers;
            bouquet.colors = Array.from(newColors);
            bouquet.occasion = newOccasion;
            await bouquet.save();
            updatedCount++;
            
            console.log(`✅ Updated bouquet: ${bouquet.name}`);
        }
    }
    
    console.log(`\n🎉 Database fix complete! Updated ${updatedCount} bouquets.`);
}

async function main() {
    try {
        console.log('🌸 Database Fixer Tool 🌸\n');

        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://kimdoyo424_db_user:JfTfdCXiaw037MEY@bouquet-db.1ht2jja.mongodb.net/?retryWrites=true&w=majority&appName=bouquet-db');
        console.log('✅ Connected to MongoDB\n');

        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'analyze':
                await analyzeCurrentData();
                break;
                
            case 'fix':
                const { problematicFlowers, problematicColors, problematicOccasions } = await analyzeCurrentData();
                
                if (problematicFlowers.length > 0 || problematicColors.length > 0 || problematicOccasions.length > 0) {
                    console.log('\n⚠️  Issues found! Proceeding with fixes...');
                    await fixDatabase();
                } else {
                    console.log('\n✅ No issues found! Database is already clean.');
                }
                break;
                
            case 'preview':
                console.log('🔍 Previewing what changes would be made...\n');
                await analyzeCurrentData();
                console.log('\n💡 To apply these fixes, run: node fix-database.js fix');
                break;
                
            default:
                console.log('Available commands:');
                console.log('  analyze  - Analyze current database issues');
                console.log('  preview  - Preview what fixes would be applied');
                console.log('  fix      - Fix the database issues');
                console.log('\nUsage: node fix-database.js <command>');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 Done!');
        process.exit(0);
    }
}

main();
