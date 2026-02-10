import React from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const RecentInvoices = ({ invoices, companyProfile }) => {
  const { toast } = useToast();
  const currencySymbol = companyProfile?.currency_symbol || '₹';

  const getStatusChip = (status) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300';
      case 'Pending':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300';
      case 'Overdue':
        return 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-card rounded-xl p-6 shadow-sm border"
    >
      <h2 className="text-xl font-bold text-foreground mb-4">Recent Invoices</h2>
      <div className="space-y-3">
        {invoices.length > 0 ? invoices.map((invoice, index) => (
          <motion.div
            key={invoice._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">{invoice.invoice_number}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusChip(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{invoice.customer_id?.name || 'N/A'}</p>
            </div>
            <div className="text-right mr-4">
              <p className="font-semibold text-foreground">{currencySymbol}{Number(invoice.total_amount).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">{new Date(invoice.issue_date).toLocaleDateString()}</p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to={`/invoices/edit/${invoice._id}`} className="flex items-center cursor-pointer">
                      <Eye className="w-4 h-4 mr-2" /> View / Edit
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })} className="flex items-center cursor-pointer">
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )) : (
          <p className="text-muted-foreground text-center py-8">No recent invoices found.</p>
        )}
      </div>
    </motion.div>
  );
};

export default RecentInvoices;