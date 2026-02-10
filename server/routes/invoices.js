import express from 'express';
import Invoice from '../models/Invoice.js';
// import { protect } from '../middleware/authMiddleware.js'; // We need middleware

const router = express.Router();

// Middleware to protect routes (basic implementation)
// Ideally, this should be in a separate file
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};


// @route   GET /api/invoices
router.get('/', protect, async (req, res) => {
    try {
        const query = { user_id: req.user._id };
        if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
        if (req.query.customer_id && req.query.customer_id !== 'all') query.customer_id = req.query.customer_id;
        if (req.query.search) {
            query.invoice_number = { $regex: req.query.search, $options: 'i' };
        }

        const invoices = await Invoice.find(query)
            .populate('customer_id', 'name')
            .populate('party_id', 'name')
            .sort({ issue_date: -1 });
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/invoices/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('customer_id')
            .populate('party_id')
            .populate('items.product_id')
            .populate('admin_bank_account_id')
            .populate('admin_signature_id');

        if (invoice && invoice.user_id.toString() === req.user._id.toString()) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/invoices
router.post('/', protect, async (req, res) => {
    try {
        const invoice = new Invoice({
            ...req.body,
            user_id: req.user._id,
        });
        const createdInvoice = await invoice.save();
        res.status(201).json(createdInvoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/invoices/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await Invoice.findById(id);

        if (invoice && invoice.user_id.toString() === req.user._id.toString()) {
            Object.assign(invoice, req.body);
            const updatedInvoice = await invoice.save();
            res.json(updatedInvoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/invoices/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);

        if (invoice && invoice.user_id.toString() === req.user._id.toString()) {
            await Invoice.deleteOne({ _id: req.params.id });
            res.json({ message: 'Invoice removed' });
        } else {
            res.status(404).json({ message: 'Invoice not found or unauthorized' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
