const mongoose = require('mongoose');

const FlowerSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('Flower', FlowerSchema);
