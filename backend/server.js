const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

const mongoose = require('mongoose');

// Middleware to ensure DB connection in serverless environments
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }
  if (mongoose.connection.readyState === 0) {
    console.log('Database disconnected. Re-connecting now...');
    try {
      await connectDB();
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' })); // Support larger JSON payloads (like base64 image data)
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(morgan('dev'));

const rateLimiter = require('./middleware/rateLimiter');

// Rate limits for expensive AI routes
const ocrLimiter = rateLimiter({
  windowMs: 60000,
  max: 5,
  message: 'Too many prescription scans. Please wait a minute before trying again.'
});

const chatLimiter = rateLimiter({
  windowMs: 60000,
  max: 15,
  message: 'Too many chat messages. Please wait a minute.'
});

// Mount API routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ocr', ocrLimiter, require('./routes/ocrRoutes'));
app.use('/api/medicines', require('./routes/medicineRoutes'));
app.use('/api/chat', chatLimiter, require('./routes/chatRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Basic health check route
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
}

module.exports = app;
