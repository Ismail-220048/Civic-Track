const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Road Damage', 'Garbage', 'Water Leak', 'Street Light', 'Other']
    },
    location: {
        type: String, // E.g., 'Main Street, Sector 4'
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Active', 'Resolved'],
        default: 'Pending'
    },
    bounty: {
        type: Number,
        default: 150 // Default reward for a task
    },
    citizenId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    officerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Assigned when an officer clicks "Accept"
    },
    reportImage: {
        type: String, // Base64 or URL (Using base64 for simplicity in prototype)
        default: null
    },
    proofImage: {
        type: String, // Uploaded by officer when resolving
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
