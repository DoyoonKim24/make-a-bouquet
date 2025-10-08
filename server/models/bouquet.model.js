const mongoose = require('mongoose');

const BouquetSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true
    },
    flowers: [{
        name: String,
        confidence: Number
    }],
    colors: [{
        name: String,
        prominence: String // 'primary', 'secondary', 'accent'
    }],
    occasion: {
        type: [ String ],
    },
    aiAnalysis: {
        rawResponse: String,
        analyzedAt: {
            type: Date,
            default: Date.now
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

BouquetSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Bouquet = mongoose.model('Bouquet', BouquetSchema);

module.exports = Bouquet;