import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
export default ProductCategory;
