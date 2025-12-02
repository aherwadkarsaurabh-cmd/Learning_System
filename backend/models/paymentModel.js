const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    institution: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Institution',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    type: {
        type: String,
        enum: ['course_purchase', 'subscription'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        required: true
    },
    transactionId: {
        type: String,
        unique: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
    },
    subscription: {
        plan: String,
        duration: Number,
        startDate: Date,
        endDate: Date
    },
    invoice: {
        number: String,
        url: String
    }
}, {
    timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;