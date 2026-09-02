const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const uri = process.env.COMPLAINT_MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/civicsense_complaints';
        const conn = await mongoose.connect(uri);
        console.log(`🍃 Complaint Service MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Error connecting Complaint Service DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
