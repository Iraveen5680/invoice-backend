import express from 'express';
import Payment from '../models/Payment.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   GET /api/payments
router.get('/', protect, async (req, res) => {
    try {
        const query = { user_id: req.user._id };
        if (req.query.customer_id) query.customer_id = req.query.customer_id;
        if (req.query.party_id) query.party_id = req.query.party_id;
        if (req.query.invoice_id) query.invoice_id = req.query.invoice_id;

        const payments = await Payment.find(query)
            .populate('customer_id', 'name')
            .populate('party_id', 'name')
            .populate('invoice_id', 'invoice_number')
            .sort({ payment_date: -1 });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

import Invoice from '../models/Invoice.js';

// Helper to update invoice status based on payment
const updateInvoiceStatus = async (invoiceId) => {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) return;

    // Recalculate total paid from all payments for this invoice
    const payments = await Payment.find({ invoice_id: invoiceId });
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    invoice.amount_received = totalPaid; // Correct field name
    invoice.payments = payments.map(p => ({
        amount: p.amount,
        payment_date: p.payment_date,
        payment_mode: p.payment_mode,
        reference: p.reference,
        notes: p.notes
    }));

    const roundedTotalPaid = Number(totalPaid.toFixed(2));
    const roundedTotalAmount = Number(invoice.total_amount.toFixed(2));

    if (roundedTotalPaid >= roundedTotalAmount) {
        invoice.status = 'Paid';
    } else if (roundedTotalPaid > 0) {
        invoice.status = 'Partial';
    } else {
        invoice.status = 'Pending';
    }

    await invoice.save();
};

// @route   POST /api/payments
router.post('/', protect, async (req, res) => {
    try {
        // If customer_id or party_id is not provided, fetch from invoice
        let customer_id = req.body.customer_id;
        let party_id = req.body.party_id;

        if (!customer_id && !party_id && req.body.invoice_id) {
            const invoice = await Invoice.findById(req.body.invoice_id);
            if (invoice) {
                customer_id = invoice.customer_id;
                party_id = invoice.party_id;
            }
        }

        const payment = new Payment({
            ...req.body,
            customer_id,
            party_id,
            user_id: req.user._id
        });
        const created = await payment.save();

        // Update Invoice
        await updateInvoiceStatus(req.body.invoice_id);

        res.status(201).json(created);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   PUT /api/payments/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (payment && payment.user_id.toString() === req.user._id.toString()) {
            const oldInvoiceId = payment.invoice_id;

            // Update fields
            payment.amount = req.body.amount || payment.amount;
            payment.payment_date = req.body.payment_date || payment.payment_date;
            payment.payment_mode = req.body.payment_mode || payment.payment_mode;
            payment.reference = req.body.reference || payment.reference;
            payment.notes = req.body.notes || payment.notes;

            // If invoice_id is changed (rare, but possible)
            if (req.body.invoice_id && req.body.invoice_id !== payment.invoice_id.toString()) {
                payment.invoice_id = req.body.invoice_id;
            }

            const updatedPayment = await payment.save();

            // Update Invoice Status (for both old and new if changed)
            await updateInvoiceStatus(oldInvoiceId);
            if (req.body.invoice_id && req.body.invoice_id !== oldInvoiceId.toString()) {
                await updateInvoiceStatus(req.body.invoice_id);
            }

            res.json(updatedPayment);
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/payments/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if (payment && payment.user_id.toString() === req.user._id.toString()) {
            const invoiceId = payment.invoice_id;

            await payment.deleteOne();

            // Update Invoice Status
            if (invoiceId) {
                await updateInvoiceStatus(invoiceId);
            }

            res.json({ message: 'Payment removed' });
        } else {
            res.status(404).json({ message: 'Payment not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
