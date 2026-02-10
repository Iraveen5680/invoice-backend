import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Eye, Search, X, Pencil, Trash2 } from 'lucide-react';
import EditPaymentDialog from './EditPaymentDialog';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import Spinner from '@/components/Spinner';
import { Input } from '@/components/ui/input';
import InvoiceView from '@/components/invoices/InvoiceView';
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

const PaymentList = ({ refreshKey }) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/payments');
        setPayments(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching payments',
          description: error.response?.data?.message || error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [toast, refreshKey, refreshTrigger]);

  const filteredPayments = useMemo(() => {
    if (!searchTerm) return payments;
    return payments.filter(payment =>
      (payment.invoice_id?.invoice_number && payment.invoice_id.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.customer_id?.name && payment.customer_id.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (payment.payment_mode && payment.payment_mode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [payments, searchTerm]);

  const handleViewInvoice = (invoiceId) => {
    setViewingInvoiceId(invoiceId);
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
  };

  const handlePaymentUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteClick = (payment) => {
    setDeletingPayment(payment);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return;

    try {
      await api.delete(`/payments/${deletingPayment._id}`);
      toast({
        title: "Payment Deleted",
        description: "The payment has been removed and invoice balance updated.",
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error Deleting Payment",
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setDeletingPayment(null);
    }
  };

  if (loading && payments.length === 0) {
    return <div className="flex justify-center items-center p-8"><Spinner /></div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by invoice #, customer, mode..."
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Invoice #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mode</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10"><Spinner /></td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-500">
                      {payments.length > 0 ? "No payments match your search." : "No payments recorded yet."}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <motion.tr
                      key={payment._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{payment.invoice_id?.invoice_number || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {payment.customer_id?.name || payment.party_id?.name || 'N/A'}
                      </td>    <td className="px-6 py-4 text-sm font-semibold text-slate-800">₹{Number(payment.amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{payment.payment_mode}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewInvoice(payment.invoice_id?._id)}
                            title="View Invoice"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(payment)}
                            title="Edit Payment"
                          >
                            <Pencil className="w-4 h-4 text-orange-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(payment)}
                            title="Delete Payment"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
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

      {viewingInvoiceId && (
        <InvoiceView
          open={!!viewingInvoiceId}
          onOpenChange={() => setViewingInvoiceId(null)}
          invoiceId={viewingInvoiceId}
        />
      )}

      {editingPayment && (
        <EditPaymentDialog
          open={!!editingPayment}
          onOpenChange={(open) => !open && setEditingPayment(null)}
          payment={editingPayment}
          onPaymentUpdated={handlePaymentUpdated}
        />
      )}

      <AlertDialog open={!!deletingPayment} onOpenChange={(open) => !open && setDeletingPayment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment and revert the invoice balance.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PaymentList;