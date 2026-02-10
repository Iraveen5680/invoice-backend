import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import Spinner from '@/components/Spinner';
import api from '@/lib/api';
import { Plus, ImageOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AddItemDialog = ({ open, onOpenChange, onItemsAdd }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const { data } = await api.get('/products');
          setProducts(data || []);
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
      setSelectedItems({});
      setSearchTerm('');
    }
  }, [open]);

  const handleSelect = (productId) => {
    setSelectedItems(prev => {
      const newSelection = { ...prev };
      if (newSelection[productId]) {
        delete newSelection[productId];
      } else {
        newSelection[productId] = true;
      }
      return newSelection;
    });
  };

  const handleAddItems = () => {
    const itemsToAdd = products.filter(p => selectedItems[p._id]);
    onItemsAdd(itemsToAdd);
    onOpenChange(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Items to Invoice</DialogTitle>
          <DialogDescription>Select one or more items to add.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between gap-4">
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Button variant="outline" onClick={() => navigate('/products')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Item
          </Button>
        </div>
        <ScrollArea className="h-96 pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-full"><Spinner /></div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map(product => (
                <div
                  key={product._id}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selectedItems[product._id] ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => handleSelect(product._id)}
                >
                  <Checkbox checked={!!selectedItems[product._id]} />
                  <div className="w-12 h-12 rounded-md bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageOff className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium text-slate-800">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.description?.substring(0, 50) || ''}</p>
                  </div>
                  <p className="font-semibold text-slate-700">₹{product.sale_price || product.regular_price}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleAddItems} disabled={Object.keys(selectedItems).length === 0}>
            Add {Object.keys(selectedItems).length || ''} Items
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;