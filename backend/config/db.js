const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryURI = process.env.MONGO_URI;
  const fallbackURI = 'mongodb://localhost:27017/rural-healthcare';

  try {
    console.log('Attempting to connect to MongoDB Atlas (Primary)...');
    const conn = await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });
    console.log(`MongoDB Connected (Primary): ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Atlas Connection Failed: ${error.message}`);
    console.log('\n================================================================');
    console.log('WARNING: Could not connect to MongoDB Atlas.');
    console.log('This is typically because your local IP address is not whitelisted');
    console.log('in your MongoDB Atlas console (Network Access Access List).');
    console.log('================================================================\n');

    try {
      console.log('Attempting to connect to Local MongoDB instance (Fallback)...');
      const conn = await mongoose.connect(fallbackURI, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`MongoDB Connected (Local Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Local MongoDB Fallback Failed: ${fallbackError.message}`);
      console.log('\n================================================================');
      console.log('Please ensure that either:');
      console.log('1. A local MongoDB instance is running at: mongodb://localhost:27017');
      console.log('2. Or you whitelist all IPs (0.0.0.0/0) in MongoDB Atlas.');
      console.log('================================================================\n');
      // Do not crash the server so other scripts can compile/run and show UI
    }
  }
};

module.exports = connectDB;
