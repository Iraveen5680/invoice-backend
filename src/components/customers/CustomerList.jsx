import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Edit, Trash2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import Spinner from '@/components/Spinner';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import CustomerViewDialog from './CustomerViewDialog';

import { TableSkeleton } from '@/components/ui/SkeletonLoaders';

const CustomerList = ({ refreshKey, onEdit, onAdd }) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerToView, setCustomerToView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const { data: customerData } = await api.get('/customers');

        // Concurrent fetch for invoices to calculate balances
        const { data: invoiceData } = await api.get('/invoices');

        const customersWithTotals = customerData.map(customer => {
          const customerInvoices = invoiceData.filter(inv => inv.customer_id?._id === customer._id || inv.customer_id === customer._id);
          const total_billed = customerInvoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
          const total_paid = customerInvoices.reduce((acc, inv) => acc + (Number(inv.amount_received) || 0), 0);
          const balance = (customer.opening_balance || 0) + total_billed - total_paid;
          return { ...customer, total_billed, total_paid, balance };
        });

        setCustomers(customersWithTotals);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching customers',
          description: error.response?.data?.message || error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [toast, refreshKey]);

  const handleDelete = async () => {
    if (!customerToDelete) return;

    try {
      await api.delete(`/customers/${customerToDelete._id}`);
      toast({ title: 'Success!', description: 'Customer has been deleted.' });
      setCustomers(customers.filter(c => c._id !== customerToDelete._id));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting customer',
        description: error.response?.data?.message || error.message,
      });
    }
    setCustomerToDelete(null);
  };

  const handleViewDetails = (customer) => {
    setCustomerToView(customer);
  };

  if (loading && customers.length === 0) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="w-full max-w-sm pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <motion.div
          layout
          className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
        >
          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total Billed</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Paid</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Balance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      {customers.length > 0 ? "No customers match your search." : "No customers found."}
                      <Button variant="link" onClick={onAdd}>Add one to get started!</Button>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <motion.tr
                      key={customer._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{customer.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{customer.email || customer.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">₹{Number(customer.total_billed).toFixed(2)}</td>
                      <td className="px-6 py-4 text-sm text-green-600 font-medium">₹{Number(customer.total_paid).toFixed(2)}</td>
                      <td className={`px-6 py-4 text-sm font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-slate-600'}`}>₹{Number(customer.balance).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(customer)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setCustomerToDelete(customer)}
                          >
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
      </div>

      <AlertDialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {customerToView && (
        <CustomerViewDialog
          open={!!customerToView}
          onOpenChange={() => setCustomerToView(null)}
          customer={customerToView}
        />
      )}
    </>
  );
};

export default CustomerList;