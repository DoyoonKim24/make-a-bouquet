# Bouquet Image Analyzer

This system automatically analyzes bouquet images stored in an S3 bucket using AI (OpenAI's GPT-4 Vision) to detect flowers, colors, styles, and other attributes, then stores the results in MongoDB.

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key  
- `AWS_REGION` - Your AWS region (e.g., us-east-1)
- `S3_BUCKET_NAME` - Name of your S3 bucket containing bouquet images
- `OPENAI_API_KEY` - Your OpenAI API key
- `MONGODB_URI` - Your MongoDB connection string (already filled in)

### 3. AWS Setup

Ensure your AWS credentials have the following permissions for your S3 bucket:
- `s3:ListBucket`
- `s3:GetObject`
- `s3:GetObjectAcl`

### 4. OpenAI Setup

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

## 📊 Database Schema

The system creates bouquet records with the following structure:

```javascript
{
  name: String,           // Generated from filename
  imageUrl: String,       // Signed S3 URL
  s3Key: String,          // S3 object key
  flowers: [{             // Detected flowers
    name: String,
    confidence: Number
  }],
  colors: [{              // Detected colors
    name: String,
    hexCode: String,
    prominence: String    // 'primary', 'secondary', 'accent'
  }],
  style: String,          // 'romantic', 'modern', 'rustic', etc.
  size: String,           // 'small', 'medium', 'large'
  occasion: String,       // 'wedding', 'birthday', etc.
  aiAnalysis: {
    rawResponse: String,  // Full AI response
    confidence: Number,   // Overall confidence score
    analyzedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

## 🖥️ Command Line Usage

### Process All Images
Analyze all images in your S3 bucket:
```bash
node analyze-bouquets.js process
```

### View Statistics
Get analysis statistics:
```bash
node analyze-bouquets.js stats
```

### List S3 Images
See all images in your bucket:
```bash
node analyze-bouquets.js list
```

### Test Connections
Verify S3 and OpenAI connectivity:
```bash
node analyze-bouquets.js test
```

## 🌐 API Endpoints

Start the server:
```bash
npm run dev
# or
node index.js
```

Available endpoints:

### Get All Bouquets
```
GET /bouquets?page=1&limit=20&flowers=rose&colors=red&style=romantic
```

### Search Bouquets
```
GET /bouquets/search?q=wedding&flowers=rose,lily&colors=white,pink
```

### Get Specific Bouquet
```
GET /bouquets/:id
```

### Trigger Processing
```
POST /analyze/process
```

### Get Statistics
```
GET /analyze/stats
```

### Get Filter Options
```
GET /filters
```

## 📝 Example Usage

1. **Set up your environment:**
   ```bash
   # Fill in your .env file with real credentials
   nano .env
   ```

2. **Test connectivity:**
   ```bash
   node analyze-bouquets.js test
   ```

3. **Process your images:**
   ```bash
   node analyze-bouquets.js process
   ```

4. **View results:**
   ```bash
   node analyze-bouquets.js stats
   ```

5. **Start the API server:**
   ```bash
   npm run dev
   ```

6. **Query via API:**
   ```bash
   # Get all bouquets with roses
   curl "http://localhost:8080/bouquets?flowers=rose"
   
   # Search for wedding bouquets
   curl "http://localhost:8080/bouquets/search?q=wedding"
   ```

## 🔧 Features

- **Batch Processing**: Processes images in configurable batches to respect API rate limits
- **Duplicate Detection**: Skips already processed images
- **Error Handling**: Continues processing even if individual images fail
- **Rich Search**: Search by flowers, colors, style, occasion, or general text
- **Statistics**: Get insights into your bouquet collection
- **RESTful API**: Full CRUD operations via HTTP endpoints

## 💡 Tips

- **Rate Limits**: OpenAI has rate limits. The system processes in batches with delays
- **Image Formats**: Supports JPG, PNG, WebP, and BMP images
- **Cost Optimization**: Each image analysis costs ~$0.01-0.03 via OpenAI Vision API
- **Reprocessing**: Delete records from MongoDB to reprocess specific images

## 🛠️ Customization

You can modify the AI analysis prompt in `bouquet-analyzer.js` to:
- Detect different flower types
- Identify specific color schemes
- Classify different bouquet styles
- Add custom metadata fields

## 📋 Troubleshooting

**AWS Connection Issues:**
- Verify your AWS credentials and region
- Check bucket permissions
- Ensure bucket exists and contains images

**OpenAI API Issues:**
- Verify your API key is valid
- Check your account has sufficient credits
- Monitor rate limits

**MongoDB Issues:**
- Verify connection string
- Check network connectivity
- Ensure database permissions
