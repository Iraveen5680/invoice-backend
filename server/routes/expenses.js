import express from 'express';
import Expense from '../models/Expense.js';
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

// @route   GET /api/expenses
router.get('/', protect, async (req, res) => {
    try {
        const query = { user_id: req.user._id };
        if (req.query.type && req.query.type !== 'all') query.type = req.query.type;

        // Date filtering
        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const expenses = await Expense.find(query).sort({ date: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/expenses
router.post('/', protect, async (req, res) => {
    try {
        const expense = new Expense({ ...req.body, user_id: req.user._id });
        const createdExpense = await expense.save();
        res.status(201).json(createdExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @route   PUT /api/expenses/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense && expense.user_id.toString() === req.user._id.toString()) {
            Object.assign(expense, req.body);
            const updatedExpense = await expense.save();
            res.json(updatedExpense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/expenses/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (expense && expense.user_id.toString() === req.user._id.toString()) {
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
