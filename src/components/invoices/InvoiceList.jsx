import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';

import { useNavigate } from 'react-router-dom';
import Spinner from '@/components/Spinner';
import InvoiceView from './InvoiceView';
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { TableSkeleton } from '@/components/ui/SkeletonLoaders';

const InvoiceList = ({ refreshKey, filters }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
  const invoiceViewRef = useRef();

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/invoices');
        let filteredData = data;

        if (filters?.status && filters.status !== 'all') {
          filteredData = filteredData.filter(inv => inv.status === filters.status);
        }
        if (filters?.customerId && filters.customerId !== 'all') {
          filteredData = filteredData.filter(inv => inv.customer_id?._id === filters.customerId || inv.customer_id === filters.customerId);
        }
        if (filters?.dateRange?.from) {
          filteredData = filteredData.filter(inv => new Date(inv.issue_date) >= filters.dateRange.from);
        }
        if (filters?.dateRange?.to) {
          filteredData = filteredData.filter(inv => new Date(inv.issue_date) <= filters.dateRange.to);
        }

        setInvoices(filteredData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching invoices', description: error.message });
      }
      setLoading(false);
    };

    fetchInvoices();
  }, [toast, refreshKey, filters]);

  const handleDelete = async () => {
    if (!deletingInvoiceId) return;

    try {
      await api.delete(`/invoices/${deletingInvoiceId}`);
      toast({ title: 'Success!', description: 'Invoice deleted.' });
      setInvoices(invoices.filter(inv => inv._id !== deletingInvoiceId));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting invoice', description: error.message });
    }
    setDeletingInvoiceId(null);
  };

  const handleDownload = async (invoiceId) => {
    setDownloadingInvoiceId(invoiceId);
  };

  const generatePdf = (invoiceData) => {
    const input = invoiceViewRef.current;
    if (!input) {
      setDownloadingInvoiceId(null);
      return;
    }

    html2canvas(input, { scale: 3, useCORS: true, allowTaint: true }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`invoice-${invoiceData.invoice_number}.pdf`);

      setDownloadingInvoiceId(null);
      toast({ title: 'Success!', description: 'Invoice downloaded.' });
    }).catch(err => {
      toast({ variant: 'destructive', title: 'Error downloading PDF', description: err.message });
      setDownloadingInvoiceId(null);
    });
  };

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl shadow-sm border overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Invoice ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Billed To</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-muted-foreground">No invoices found. Create one to get started!</td>
                </tr>
              ) : (
                invoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{invoice.customer_id?.name || invoice.party_id?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">{`₹${Number(invoice.total_amount).toFixed(2)}`}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'Paid' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                        invoice.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                        }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingInvoiceId(invoice._id)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice._id)} disabled={downloadingInvoiceId === invoice._id}>
                          {downloadingInvoiceId === invoice._id ? <Spinner size="small" /> : <Download className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/invoices/edit/${invoice._id}`)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setDeletingInvoiceId(invoice._id)}>
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
      <InvoiceView
        open={!!viewingInvoiceId}
        onOpenChange={() => setViewingInvoiceId(null)}
        invoiceId={viewingInvoiceId}
      />
      {downloadingInvoiceId && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
          <InvoiceView
            open={true}
            invoiceId={downloadingInvoiceId}
            onOpenChange={() => { }}
            isForPdfGeneration={true}
            pdfRef={invoiceViewRef}
            onDataLoaded={generatePdf}
          />
        </div>
      )}
      <AlertDialog open={!!deletingInvoiceId} onOpenChange={() => setDeletingInvoiceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this invoice and all its items.
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

export default InvoiceList;