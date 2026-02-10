import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import CustomerList from '@/components/customers/CustomerList';
import CustomerDialog from '@/components/customers/CustomerDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const Customers = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const handleSave = () => {
    setRefreshKey(oldKey => oldKey + 1);
    setEditingCustomer(null);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <Layout>
      <Helmet>
        <title>Customers - Invoice Management System</title>
        <meta name="description" content="Manage your customer database and track customer interactions" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Customers</h1>
            <p className="text-slate-600 mt-1">Manage your customer database</p>
          </div>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        </motion.div>

        <CustomerList refreshKey={refreshKey} onEdit={handleEdit} onAdd={handleAddNew} />
        <CustomerDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen} 
          onSave={handleSave}
          customerData={editingCustomer}
        />
      </div>
    </Layout>
  );
};

export default Customers;