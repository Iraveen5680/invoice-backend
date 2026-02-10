import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['product', 'service'], default: 'product' },
    description: String,
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
    regular_price: { type: Number, required: true },
    sale_price: Number,
    sku: String,
    image_url: String,
    gst_rate_id: { type: mongoose.Schema.Types.ObjectId, ref: 'GstRate' },
    stock_qty: Number,
    createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model('Product', productSchema);
export default Product;
