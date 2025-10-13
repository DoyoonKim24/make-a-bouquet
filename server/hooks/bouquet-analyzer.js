const AWS = require('aws-sdk');
const OpenAI = require('openai');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Bouquet = require('../models/bouquet.model');
require('dotenv').config();

class BouquetAnalyzer {
    constructor() {
        // Initialize AWS S3
        this.s3 = new AWS.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION
        });

        // this.openai = new OpenAI({
        //     apiKey: process.env.OPENAI_API_KEY
        // });

        this.bucketName = process.env.S3_BUCKET_NAME;
    }

    /**
     * List all images in the S3 bucket
     */
    async listImages() {
        try {
            const params = {
                Bucket: this.bucketName,
                // Filter for common image formats
                Prefix: '', // Add prefix if images are in a specific folder
            };

            const response = await this.s3.listObjectsV2(params).promise();
            
            // Filter for image files
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];
            const images = response.Contents.filter(obj => {
                const extension = obj.Key.toLowerCase().substring(obj.Key.lastIndexOf('.'));
                return imageExtensions.includes(extension);
            });

            return images;
        } catch (error) {
            console.error('Error listing S3 images:', error);
            throw error;
        }
    }

    /**
     * Get image URL from S3
     */
    getImageUrl(key) {
        return this.s3.getSignedUrl('getObject', {
            Bucket: this.bucketName,
            Key: key,
            Expires: 3600 // URL expires in 1 hour
        });
    }

    /**
     * Generate thumbnail key from original key
     */
    getThumbnailKey(originalKey) {
        const extension = originalKey.split('.').pop();
        const nameWithoutExt = originalKey.replace(`.${extension}`, '');
        return `thumbnails/${nameWithoutExt}_thumb.webp`;
    }

    /**
     * Create and upload thumbnail to S3
     */
    async createThumbnail(originalKey) {
        try {
            // Download original image from S3
            const originalImage = await this.s3.getObject({
                Bucket: this.bucketName,
                Key: originalKey
            }).promise();

            // Create thumbnail using Sharp
            const thumbnailBuffer = await sharp(originalImage.Body)
                .resize(400, 300, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({ quality: 80 })
                .toBuffer();

            // Upload thumbnail to S3
            const thumbnailKey = this.getThumbnailKey(originalKey);
            await this.s3.upload({
                Bucket: this.bucketName,
                Key: thumbnailKey,
                Body: thumbnailBuffer,
                ContentType: 'image/webp',
                ACL: 'public-read'
            }).promise();

            return thumbnailKey;
        } catch (error) {
            console.error('Error creating thumbnail:', error);
            return null;
        }
    }

    /**
     * Get thumbnail URL from S3 (signed URL like original images)
     */
    getThumbnailUrl(thumbnailKey) {
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;
    }

    /**
     * Analyze bouquet image using OpenAI Vision API
     */
    async analyzeBouquet(imageUrl) {
        try {
            const prompt = `
            Analyze this bouquet image and provide detailed information in JSON format. Please identify:

            1. Flowers present
            2. Primary colors
            3. Suitable occasions (wedding, birthday, anniversary, etc.)

            You can be generous with the occasions if multiple fit.

            Return ONLY a valid JSON object with this exact structure:
            {
                "flowers": [{"name": "Rose"}],
                "colors": [{"name": "Red", "prominence": "primary"}],
                "occasion": "wedding",
                "title": "Quick title for the bouquet"
            }
            `;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: { url: imageUrl }
                            }
                        ]
                    }
                ],
                max_tokens: 1000
            });

            const analysisText = response.choices[0].message.content;
            
            // Try to parse JSON from the response
            let analysis;
            try {
                // Sometimes the AI wraps JSON in markdown, so let's clean it
                const jsonMatch = analysisText.match(/```json\n?(.*?)\n?```/s);
                const cleanJson = jsonMatch ? jsonMatch[1] : analysisText;
                analysis = JSON.parse(cleanJson);
            } catch (parseError) {
                // If JSON parsing fails, create a structured response
                console.warn('Failed to parse JSON response, using raw text:', parseError);
                analysis = {
                    flowers: [],
                    colors: [],
                    occasion: "unknown",
                    description: analysisText
                };
            }

            return {
                ...analysis,
                rawResponse: analysisText
            };

        } catch (error) {
            console.error('Error analyzing image:', error);
            throw error;
        }
    }

    /**
     * Determine the seasons when all flowers in a bouquet are available
     */
    async determineSeasons(flowers) {
        try {
            if (!flowers || flowers.length === 0) {
                return ['Spring', 'Summer', 'Fall', 'Winter']; // Default to all seasons if no flowers identified
            }

            const flowerNames = flowers.map(f => f.name).join(', ');
            
            const prompt = `
            For the following flowers: ${flowerNames}
            
            You are in Ontario, Canada.

            Determine which seasons where most of these flower (~75%) are in bloom naturally, grown in a greenhouse, or typically imported and available to buy at a store or farmer's market simultaneously. 
            Consider their natural and commercial growing seasons as well as commonly imported flowers and when they would typically be available together.
            
            Return ONLY a JSON array of season names when ALL flowers would be available together, choosing from: ["Spring", "Summer", "Fall", "Winter"]
            
            Example response format: ["Spring", "Summer"]

            If some flowers are available year-round (like roses from greenhouses), return ["Spring", "Summer", "Fall", "Winter"].
            `;

            const response = await this.openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 200
            });

            const analysisText = response.choices[0].message.content.trim();
            
            // Try to parse JSON from the response
            let seasons;
            try {
                // Clean the response and parse JSON
                const jsonMatch = analysisText.match(/\[(.*?)\]/s);
                const cleanJson = jsonMatch ? jsonMatch[0] : analysisText;
                seasons = JSON.parse(cleanJson);
                
                // Validate that all items are valid seasons
                const validSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];
                seasons = seasons.filter(season => validSeasons.includes(season));
                
                if (seasons.length === 0) {
                    seasons = ['Spring', 'Summer', 'Fall', 'Winter']; // Default fallback
                }
            } catch (parseError) {
                console.warn('Failed to parse season response, using default:', parseError);
                seasons = ['Spring', 'Summer', 'Fall', 'Winter']; // Default fallback
            }

            return seasons;

        } catch (error) {
            console.error('Error determining seasons:', error);
            return ['Spring', 'Summer', 'Fall', 'Winter']; // Default fallback
        }
    }
    

    /**
     * Process a single image
     */
    async processImage(s3Object) {
        try {
            console.log(`Processing image: ${s3Object.Key}`);

            // Check if this image has already been processed
            const existing = await Bouquet.findOne({ s3Key: s3Object.Key });
            if (existing) {
                console.log(`Image ${s3Object.Key} already processed, skipping...`);
                return existing;
            }

            // Get image URL
            const imageUrl = this.getImageUrl(s3Object.Key);

            // Create thumbnail
            console.log(`Creating thumbnail for: ${s3Object.Key}`);
            const thumbnailKey = await this.createThumbnail(s3Object.Key);
            const thumbnailUrl = thumbnailKey ? this.getThumbnailUrl(thumbnailKey) : null;

            // Analyze the image
            const analysis = await this.analyzeBouquet(imageUrl);

            // Determine seasons when all flowers are available
            const seasons = await this.determineSeasons(analysis.flowers);

            // Create bouquet record
            const bouquet = new Bouquet({
                name: this.generateBouquetName(s3Object.Key),
                imageUrl: imageUrl,
                thumbnailUrl: thumbnailUrl,
                s3Key: s3Object.Key,
                thumbnailS3Key: thumbnailKey,
                flowers: analysis.flowers || [],
                colors: analysis.colors || [],
                occasion: analysis.occasion,
                seasons: seasons,
                aiAnalysis: {
                    rawResponse: analysis.rawResponse,
                    confidence: analysis.confidence || 0.5,
                    analyzedAt: new Date()
                }
            });

            await bouquet.save();
            console.log(`✅ Successfully processed: ${s3Object.Key}`);
            return bouquet;

        } catch (error) {
            console.error(`❌ Error processing ${s3Object.Key}:`, error);
            throw error;
        }
    }

    /**
     * Generate a friendly name from S3 key
     */
    generateBouquetName(s3Key) {
        const filename = s3Key.split('/').pop();
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'));
        
        // Convert to title case and replace common separators
        return nameWithoutExt
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
     * Process all images in the bucket
     */
    async processAllImages(batchSize = 5) {
        try {
            console.log('🚀 Starting batch processing of bouquet images...');
            
            // List all images
            const images = await this.listImages();
            console.log(`Found ${images.length} images to process`);

            if (images.length === 0) {
                console.log('No images found in bucket');
                return [];
            }

            const results = [];
            
            // Process images in batches to avoid rate limits
            for (let i = 0; i < images.length; i += batchSize) {
                const batch = images.slice(i, i + batchSize);
                console.log(`\nProcessing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}`);
                
                const batchPromises = batch.map(image => this.processImage(image));
                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        console.error(`Failed to process ${batch[index].Key}:`, result.reason);
                    }
                });

                // Add delay between batches to respect API rate limits
                if (i + batchSize < images.length) {
                    console.log('Waiting 5 seconds before next batch...');
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            console.log(`\n✅ Batch processing complete! Processed ${results.length} images`);
            return results;

        } catch (error) {
            console.error('Error in batch processing:', error);
            throw error;
        }
    }

    /**
     * Get analysis statistics
     */
    async getAnalysisStats() {
        try {
            const totalBouquets = await Bouquet.countDocuments();
            const flowerStats = await Bouquet.aggregate([
                { $unwind: '$flowers' },
                { $group: { _id: '$flowers.name', count: { $sum: 1 }, avgConfidence: { $avg: '$flowers.confidence' } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            const colorStats = await Bouquet.aggregate([
                { $unwind: '$colors' },
                { $group: { _id: '$colors.name', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            const styleStats = await Bouquet.aggregate([
                { $group: { _id: '$style', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            const seasonStats = await Bouquet.aggregate([
                { $unwind: '$seasons' },
                { $group: { _id: '$seasons', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]);

            return {
                totalBouquets,
                topFlowers: flowerStats,
                topColors: colorStats,
                styleDistribution: styleStats,
                seasonDistribution: seasonStats
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            throw error;
        }
    }
}

module.exports = BouquetAnalyzer;
