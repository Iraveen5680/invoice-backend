import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    gst_no: String,
});
export const Party = mongoose.model('Party', partySchema);

const bankAccountSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account_holder_name: String,
    account_number: String,
    bank_name: String,
    ifsc_code: String,
    is_primary: { type: Boolean, default: false },
});
export const AdminBankAccount = mongoose.model('AdminBankAccount', bankAccountSchema);

const signatureSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    signature_url: String,
    is_primary: { type: Boolean, default: false },
});
export const AdminSignature = mongoose.model('AdminSignature', signatureSchema);

const companyWebsiteSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
});
export const CompanyWebsite = mongoose.model('CompanyWebsite', companyWebsiteSchema);

const gstRateSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rate: { type: Number, required: true },
    name: String,
});
export const GstRate = mongoose.model('GstRate', gstRateSchema);

const productCategorySchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
});
export const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);
