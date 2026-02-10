import express from 'express';
import Customer from '../models/Customer.js';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

// Middleware (Duplicate regarding DRY, but keeping it simple for now)
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

// @route   GET /api/customers
router.get('/', protect, async (req, res) => {
    try {
        const query = { user_id: req.user._id };
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } }
            ];
        }
        const customers = await Customer.find(query).sort({ name: 1 });
        res.json(customers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/customers
router.post('/', protect, async (req, res) => {
    try {
        const customer = new Customer({
            ...req.body,
            user_id: req.user._id,
        });
        const createdCustomer = await customer.save();
        res.status(201).json(createdCustomer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/customers/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer && customer.user_id.toString() === req.user._id.toString()) {
            Object.assign(customer, req.body);
            const updatedCustomer = await customer.save();
            res.json(updatedCustomer);
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/customers/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (customer && customer.user_id.toString() === req.user._id.toString()) {
            await customer.deleteOne();
            res.json({ message: 'Customer removed' });
        } else {
            res.status(404).json({ message: 'Customer not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
