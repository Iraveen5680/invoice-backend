import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    gst_no: String,
    opening_balance: Number,
    balance_type: { type: String, enum: ['receivable', 'payable'], default: 'receivable' },
    billing_address: String,
    shipping_address: String,
    bank_account_number: String,
    bank_ifsc_code: String,
    bank_branch_name: String,
    bank_account_holder_name: String,
    upi_id: String,
    createdAt: { type: Date, default: Date.now },
});

const Customer = mongoose.model('Customer', customerSchema);
export default Customer;
