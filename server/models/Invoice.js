import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    invoice_number: { type: String, required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    party_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' }, // Keeping flexible if Party is used
    issue_date: { type: Date, required: true },
    due_date: { type: Date },
    status: { type: String, enum: ['Paid', 'Partial', 'Pending', 'Overdue'], default: 'Pending' },
    total_amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    additional_charges: { type: Number, default: 0 },
    amount_received: { type: Number, default: 0 },
    admin_bank_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminBankAccount' },
    admin_signature_id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminSignature' },
    is_tax_inclusive: { type: Boolean, default: false },
    items: [{
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        description: String,
        quantity: Number,
        unit_price: Number,
        gst_rate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GstRate' },
        gst_rate: Number,
        total: Number
    }],
    payments: [{
        amount: Number,
        payment_date: Date,
        payment_mode: String
    }],
    notes: String,
    createdAt: { type: Date, default: Date.now },
});

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
