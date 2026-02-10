import express from 'express';
import { Party, AdminBankAccount, AdminSignature, GstRate, ProductCategory, CompanyWebsite } from '../models/Misc.js';
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

// Generic CRUD handler generator could be used, but writing explicit for clarity/flexibility
const createCrudRoutes = (Model) => {
    const r = express.Router();

    r.get('/', protect, async (req, res) => {
        try {
            const query = { user_id: req.user._id };
            if (req.query.search) {
                query.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } }
                ];
            }
            const items = await Model.find(query).sort({ name: 1 });
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    r.post('/', protect, async (req, res) => {
        try {
            const item = new Model({ ...req.body, user_id: req.user._id });
            const created = await item.save();
            res.status(201).json(created);
        } catch (e) {
            res.status(400).json({ message: e.message });
        }
    });

    r.put('/:id', protect, async (req, res) => {
        try {
            const item = await Model.findById(req.params.id);
            if (item && item.user_id.toString() === req.user._id.toString()) {
                Object.assign(item, req.body);
                const updated = await item.save();
                res.json(updated);
            } else {
                res.status(404).json({ message: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    r.delete('/:id', protect, async (req, res) => {
        try {
            const item = await Model.findById(req.params.id);
            if (item && item.user_id.toString() === req.user._id.toString()) {
                await item.deleteOne();
                res.json({ message: 'Item removed' });
            } else {
                res.status(404).json({ message: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    r.patch('/primary/:id', protect, async (req, res) => {
        try {
            // First reset all to false for this user
            await Model.updateMany({ user_id: req.user._id }, { is_primary: false });
            // Then set this one to true
            const item = await Model.findById(req.params.id);
            if (item && item.user_id.toString() === req.user._id.toString()) {
                item.is_primary = true;
                const updated = await item.save();
                res.json(updated);
            } else {
                res.status(404).json({ message: 'Item not found' });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });

    return r;
};

export const partyRoutes = createCrudRoutes(Party);
export const bankAccountRoutes = createCrudRoutes(AdminBankAccount);
export const signatureRoutes = createCrudRoutes(AdminSignature);
export const gstRateRoutes = createCrudRoutes(GstRate);
export const productCategoryRoutes = createCrudRoutes(ProductCategory);
export const companyWebsiteRoutes = createCrudRoutes(CompanyWebsite);

