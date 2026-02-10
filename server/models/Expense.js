import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true, default: Date.now },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['profit', 'loss'], required: true },
    category: { type: String, required: true },
    payment_mode: { type: String, default: 'Cash' },
    notes: String,
    createdAt: { type: Date, default: Date.now }
});

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;
