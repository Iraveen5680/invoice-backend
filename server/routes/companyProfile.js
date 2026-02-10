import express from 'express';
import CompanyProfile from '../models/CompanyProfile.js';
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
            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @route   GET /api/company-profile
router.get('/', protect, async (req, res) => {
    try {
        const profile = await CompanyProfile.findOne({ user_id: req.user._id });
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/company-profile (Create/Update)
router.post('/', protect, async (req, res) => {
    console.log('POST /api/company-profile body:', req.body);
    try {
        let profile = await CompanyProfile.findOne({ user_id: req.user._id });
        if (profile) {
            Object.assign(profile, req.body);
            await profile.save();
        } else {
            profile = new CompanyProfile({ ...req.body, user_id: req.user._id });
            await profile.save();
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/company-profile (Update)
router.put('/', protect, async (req, res) => {
    console.log('PUT /api/company-profile body:', req.body);
    try {
        let profile = await CompanyProfile.findOne({ user_id: req.user._id });
        if (profile) {
            Object.assign(profile, req.body);
            await profile.save();
            res.json(profile);
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
