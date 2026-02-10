// This file is no longer used for creating invoices.
// The logic has been moved to the new `CreateInvoice.jsx` page.
// You can safely ignore or request to delete this file.
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const InvoiceDialog = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Invoice creation has been moved to a dedicated page for a better experience.
          </DialogDescription>
        </DialogHeader>
        <p className="py-4 text-sm text-slate-600">
          Please click the "New Invoice" button to navigate to the new invoice creation page.
        </p>
        <Button onClick={() => onOpenChange(false)}>Close</Button>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDialog;