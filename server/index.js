import './config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoices.js';
import customerRoutes from './routes/customers.js';
import productRoutes from './routes/products.js';
import companyProfileRoutes from './routes/companyProfile.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes from './routes/upload.js';
import { partyRoutes, bankAccountRoutes, signatureRoutes, gstRateRoutes, productCategoryRoutes, companyWebsiteRoutes } from './routes/misc.js';
import expenseRoutes from './routes/expenses.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/company-profile', companyProfileRoutes);
app.use('/api/parties', partyRoutes);
app.use('/api/admin-bank-accounts', bankAccountRoutes);
app.use('/api/admin-signatures', signatureRoutes);
app.use('/api/gst-rates', gstRateRoutes);
app.use('/api/product-categories', productCategoryRoutes);
app.use('/api/company-websites', companyWebsiteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/upload', uploadRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    res.status(500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
