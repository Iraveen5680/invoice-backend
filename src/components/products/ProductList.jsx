import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import Spinner from '@/components/Spinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

import { TableSkeleton } from '@/components/ui/SkeletonLoaders';

const ProductList = ({ refreshKey, onEdit, filters }) => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', { params: filters });
        setProducts(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching items',
          description: error.response?.data?.message || error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [toast, refreshKey, filters]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await api.delete(`/products/${itemToDelete._id}`);
      toast({ title: 'Success!', description: 'Item has been deleted.' });
      setProducts(products.filter(p => p._id !== itemToDelete._id));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting item', description: error.response?.data?.message || error.message });
    }
    setItemToDelete(null);
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Item</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-500">No items found. Try adjusting your filters.</td>
                </tr>
              ) : (
                products.map((product, index) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageOff className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{product.name}</div>
                          <div className="text-xs text-slate-500">{product.sku || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge variant={product.type === 'service' ? 'secondary' : 'outline'}>{product.type}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{product.category_id?.name || 'Uncategorized'}</td>
                    <td className="px-4 py-3">
                      {product.sale_price && product.sale_price < product.regular_price ? (
                        <div>
                          <span className="font-semibold text-green-600">{`₹${product.sale_price}`}</span>
                          <span className="text-xs text-slate-500 line-through ml-2">{`₹${product.regular_price}`}</span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-800">{`₹${product.regular_price}`}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {product.type === 'product' ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${!product.stock_qty || product.stock_qty <= 0 ? 'bg-red-100 text-red-700' :
                          product.stock_qty < 10 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                          {product.stock_qty || 0} in stock
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setItemToDelete(product)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item and its image from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProductList;