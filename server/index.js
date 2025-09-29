const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Bouquet = require('./models/bouquet.model');
const BouquetAnalyzer = require('./bouquet-analyzer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Initialize analyzer
const analyzer = new BouquetAnalyzer();

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Bouquet Analysis API',
        endpoints: {
            'GET /bouquets': 'Get all bouquets',
            'GET /bouquets/:id': 'Get specific bouquet',
            'GET /bouquets/search?flowers=rose,lily': 'Search by flowers',
            'GET /bouquets/search?colors=red,pink': 'Search by colors',
            'GET /bouquets/search?style=romantic': 'Search by style',
            'POST /analyze/process': 'Process all S3 images',
            'GET /analyze/stats': 'Get analysis statistics'
        }
    });
});

// Get all bouquets with optional filtering
app.get('/bouquets', async (req, res) => {
    try {
        const { page = 1, limit = 20, flowers, colors, style, occasion } = req.query;
        
        let query = {};
        
        // Build query based on filters
        if (flowers) {
            const flowerList = flowers.split(',').map(f => f.trim());
            query['flowers.name'] = { $in: flowerList.map(f => new RegExp(f, 'i')) };
        }
        
        if (colors) {
            const colorList = colors.split(',').map(c => c.trim());
            query['colors.name'] = { $in: colorList.map(c => new RegExp(c, 'i')) };
        }
        
        if (style) {
            query.style = new RegExp(style, 'i');
        }
        
        if (occasion) {
            query.occasion = new RegExp(occasion, 'i');
        }

        const bouquets = await Bouquet.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const total = await Bouquet.countDocuments(query);

        res.json({
            bouquets,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get specific bouquet
app.get('/bouquets/:id', async (req, res) => {
    try {
        const bouquet = await Bouquet.findById(req.params.id);
        if (!bouquet) {
            return res.status(404).json({ error: 'Bouquet not found' });
        }
        res.json(bouquet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search bouquets by multiple criteria
app.get('/bouquets/search', async (req, res) => {
    try {
        const { q, flowers, colors, style, occasion } = req.query;
        
        let searchQuery = {};
        
        if (q) {
            // General search across name and description
            searchQuery.$or = [
                { name: new RegExp(q, 'i') },
                { 'aiAnalysis.rawResponse': new RegExp(q, 'i') }
            ];
        }

        // Add specific filters
        if (flowers) {
            const flowerList = flowers.split(',').map(f => f.trim());
            searchQuery['flowers.name'] = { $in: flowerList.map(f => new RegExp(f, 'i')) };
        }
        
        if (colors) {
            const colorList = colors.split(',').map(c => c.trim());
            searchQuery['colors.name'] = { $in: colorList.map(c => new RegExp(c, 'i')) };
        }
        
        if (occasion) {
            searchQuery.occasion = new RegExp(occasion, 'i');
        }

        const bouquets = await Bouquet.find(searchQuery).sort({ 'aiAnalysis.confidence': -1 });
        res.json(bouquets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger image processing
app.post('/analyze/process', async (req, res) => {
    try {
        res.json({ message: 'Processing started. This will run in the background.', status: 'started' });
        
        // Run processing in background
        analyzer.processAllImages().then(results => {
            console.log(`Background processing complete: ${results.length} images processed`);
        }).catch(error => {
            console.error('Background processing error:', error);
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Get unique values for filtering
app.get('/filters', async (req, res) => {
    try {
        const flowers = await Bouquet.distinct('flowers.name');
        const colors = await Bouquet.distinct('colors.name');
        const occasions = await Bouquet.distinct('occasion');
        
        res.json({
            flowers: flowers.filter(f => f), // Remove null/empty values
            colors: colors.filter(c => c),
            occasions: occasions.filter(o => o)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
    console.log('API Documentation available at http://localhost:8080');
});