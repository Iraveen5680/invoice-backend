import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, UploadCloud, X } from 'lucide-react';
import CategoryDialog from './CategoryDialog';
import GstRateDialog from './GstRateDialog';
import Spinner from '@/components/Spinner';

const ProductDialog = ({ open, onOpenChange, onSave, productData }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [categories, setCategories] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isGstRateDialogOpen, setIsGstRateDialogOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isEditMode = !!productData;
  const productType = formData.type || 'product';

  const initialFormState = {
    name: '',
    type: 'product',
    description: '',
    category_id: null,
    regular_price: '',
    sale_price: '',
    image_url: '',
    sku: '',
    gst_rate_id: null,
    stock_qty: '',
  };

  const fetchDependencies = useCallback(async () => {
    if (!user) return;
    try {
      const [categoriesRes, gstRatesRes] = await Promise.all([
        api.get('/product-categories'),
        api.get('/gst-rates')
      ]);
      setCategories(categoriesRes.data);
      setGstRates(gstRatesRes.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching dependencies', description: error.message });
    }
  }, [user, toast]);

  useEffect(() => {
    if (open) {
      fetchDependencies();
    }
  }, [fetchDependencies, open]);

  useEffect(() => {
    if (isEditMode && productData) {
      setFormData({
        ...initialFormState,
        ...productData,
        category_id: productData.category_id?._id || productData.category_id || null,
        gst_rate_id: productData.gst_rate_id?._id || productData.gst_rate_id || null,
      });
      if (productData.image_url) setImagePreview(productData.image_url);
    } else {
      setFormData(initialFormState);
      setImagePreview('');
      setImageFile(null);
    }
  }, [productData, isEditMode, open]);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(imageFile);
    } else if (!formData.image_url) {
      setImagePreview('');
    }
  }, [imageFile, formData.image_url]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    let newFormData = { ...formData, [id]: value };
    if (id === 'regular_price' && (!value || parseFloat(value) === 0)) {
      newFormData = { ...newFormData, sale_price: '0' };
    }
    setFormData(newFormData);
  };

  const handleSelectChange = (id, value) => {
    let newFormData = { ...formData, [id]: value };
    if (id === 'type' && value === 'service') {
      newFormData = { ...newFormData, stock_qty: null };
    }
    setFormData(newFormData);
  };

  const handleDependencySave = () => {
    fetchDependencies();
  };

  const handleImageUpload = async () => {
    if (!imageFile) return formData.image_url || null;
    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('image', imageFile);
      const response = await api.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error' });
      return;
    }
    setLoading(true);

    try {
      const imageUrl = await handleImageUpload();

      const dataToSave = { ...formData, image_url: imageUrl };

      // Clean up related data before saving
      delete dataToSave.product_categories;
      delete dataToSave.gst_rates;
      delete dataToSave._id; // Ensure we don't send _id on create if it's there

      dataToSave.regular_price = parseFloat(dataToSave.regular_price) || 0;
      dataToSave.sale_price = dataToSave.sale_price ? parseFloat(dataToSave.sale_price) : null;
      dataToSave.stock_qty = dataToSave.stock_qty ? parseInt(dataToSave.stock_qty, 10) : null;

      if (dataToSave.sale_price && dataToSave.sale_price > dataToSave.regular_price) {
        toast({ variant: 'destructive', title: 'Invalid Price', description: 'Sale price cannot be greater than regular price.' });
        setLoading(false);
        return;
      }

      if (isEditMode) {
        await api.put(`/products/${productData._id}`, dataToSave);
      } else {
        await api.post('/products', dataToSave);
      }

      toast({ title: 'Success!', description: `Item has been ${isEditMode ? 'updated' : 'added'}.` });
      onSave();
      onOpenChange(false);

    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Error ${isEditMode ? 'updating' : 'saving'} item`,
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of your item.' : 'Add a new product or service to your catalog.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 space-y-4">
                <div
                  className="relative w-full h-48 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? <Spinner /> : imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); setImageFile(null); setFormData(f => ({ ...f, image_url: '' })) }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="text-center">
                      <UploadCloud className="mx-auto h-8 w-8" />
                      <p className="mt-1 text-sm">Click to upload</p>
                      <p className="text-xs">PNG, JPG, WEBP</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={e => setImageFile(e.target.files[0])}
                  />
                </div>
                <Input id="image_url" value={formData.image_url || ''} onChange={handleChange} placeholder="Or paste image URL" disabled={!!imageFile} />
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <Select onValueChange={(value) => handleSelectChange('type', value)} value={productType} disabled={isEditMode}>
                      <SelectTrigger><SelectValue placeholder="Item Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Product</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input id="name" value={formData.name || ''} onChange={handleChange} placeholder="Item Name" required />
                  </div>
                </div>
                <Textarea id="description" value={formData.description || ''} onChange={handleChange} placeholder="Description" rows={3} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => handleSelectChange('category_id', value)} value={formData.category_id || ''}>
                        <SelectTrigger className="flex-grow"><SelectValue placeholder="Select Category" /></SelectTrigger>
                        <SelectContent>{categories.map(cat => <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(value) => handleSelectChange('gst_rate_id', value)} value={formData.gst_rate_id || ''}>
                        <SelectTrigger className="flex-grow"><SelectValue placeholder="Select GST Rate" /></SelectTrigger>
                        <SelectContent>{gstRates.map(rate => <SelectItem key={rate._id} value={rate._id}>{rate.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsGstRateDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="regular_price" type="number" value={formData.regular_price || ''} onChange={handleChange} placeholder="Regular Price" required />
                  <Input id="sale_price" type="number" value={formData.sale_price || ''} onChange={handleChange} placeholder="Sale Price" />
                </div>
                {productType === 'product' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input id="sku" value={formData.sku || ''} onChange={handleChange} placeholder="SKU (Optional)" />
                    <Input id="stock_qty" type="number" value={formData.stock_qty || ''} onChange={handleChange} placeholder="Stock Quantity" />
                  </div>
                )}
              </div>
            </div>

          </form>
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} disabled={loading}>
              {loading || uploading ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CategoryDialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen} onSave={handleDependencySave} />
      <GstRateDialog open={isGstRateDialogOpen} onOpenChange={setIsGstRateDialogOpen} onSave={handleDependencySave} />
    </>
  );
};

export default ProductDialog;
