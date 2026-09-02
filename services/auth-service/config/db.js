const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.AUTH_MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/civicsense_auth';
        const conn = await mongoose.connect(uri);
        console.log(`🍃 Auth Service MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Error connecting Auth Service DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
