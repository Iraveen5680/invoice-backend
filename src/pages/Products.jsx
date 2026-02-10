import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import ProductList from '@/components/products/ProductList';
import ProductDialog from '@/components/products/ProductDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

const Products = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filters, setFilters] = useState({ type: 'all', category_id: 'all', search: '' });
  const [categories, setCategories] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/product-categories');
      setCategories(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching categories', description: error.message });
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories, refreshKey]);

  const handleSave = () => {
    setRefreshKey(oldKey => oldKey + 1);
    setEditingProduct(null);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  return (
    <Layout>
      <Helmet>
        <title>Products & Services - Invoice Management System</title>
        <meta name="description" content="Manage your product and service inventory" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Products & Services</h1>
            <p className="text-slate-600 mt-1">Manage your item inventory</p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add New Item
          </Button>
        </motion.div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name..."
                className="pl-10"
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
            <Tabs defaultValue="all" onValueChange={(value) => handleFilterChange('type', value)} className="md:col-span-2">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="all">All Items</TabsTrigger>
                <TabsTrigger value="product">Products</TabsTrigger>
                <TabsTrigger value="service">Services</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div>
            <Select onValueChange={(value) => handleFilterChange('category_id', value)} defaultValue="all">
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Filter by category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ProductList refreshKey={refreshKey} onEdit={handleEdit} filters={filters} />
        <ProductDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSave={handleSave}
          productData={editingProduct}
        />
      </div>
    </Layout>
  );
};

export default Products;
