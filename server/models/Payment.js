import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer'
    },
    party_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Party'
    },
    invoice_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    amount: {
        type: Number,
        required: true
    },
    payment_date: {
        type: Date,
        default: Date.now
    },
    payment_mode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Other'],
        default: 'Cash'
    },
    reference_number: String,
    notes: String
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
