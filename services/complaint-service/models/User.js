const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: { type: String, lowercase: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
