import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarPlus as CalendarIcon } from 'lucide-react';
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { useAuth } from '@/contexts/AuthContext';
import { cn } from "@/lib/utils";
import Spinner from '@/components/Spinner';

const AddPaymentDialog = ({ open, onOpenChange, onSave, entity }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [invoiceId, setInvoiceId] = useState(null); // 'none' for direct payment
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);


  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      if (!open || !entity?._id) return;
      setLoadingInvoices(true);
      try {
        const { data } = await api.get('/invoices', {
          params: {
            customer_id: entity.type === 'customers' ? entity._id : undefined,
            party_id: entity.type === 'parties' ? entity._id : undefined,
            status: 'Pending' // Or not Paid
          }
        });
        // Filtering for non-paid is better done on backend or here
        setUnpaidInvoices(data.filter(inv => inv.status !== 'Paid'));
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching invoices' });
      } finally {
        setLoadingInvoices(false);
      }
    }
    fetchUnpaidInvoices();
  }, [open, entity, toast]);

  const resetForm = () => {
    setDate(new Date());
    setAmount('');
    setNotes('');
    setPaymentMode('Cash');
    setInvoiceId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid payment amount.' });
      return;
    }

    setIsSaving(true);

    const paymentData = {
      payment_date: format(date, 'yyyy-MM-dd'),
      amount: Number(amount),
      payment_mode: paymentMode,
      notes: notes,
      invoice_id: invoiceId !== 'none' ? invoiceId : null,
      customer_id: entity.type === 'customers' ? entity._id : undefined,
      party_id: entity.type === 'parties' ? entity._id : undefined
    };

    try {
      await api.post('/payments', paymentData);

      if (paymentData.invoice_id) {
        const selectedInvoice = unpaidInvoices.find(inv => inv._id === paymentData.invoice_id);
        if (selectedInvoice) {
          const newAmountReceived = (selectedInvoice.amount_received || 0) + paymentData.amount;
          const newStatus = newAmountReceived >= selectedInvoice.total_amount ? 'Paid' : selectedInvoice.status;

          await api.put(`/invoices/${paymentData.invoice_id}`, {
            amount_received: newAmountReceived,
            status: newStatus
          });
        }
      }

      toast({ title: 'Payment Saved!', description: 'The payment has been recorded successfully.' });
      resetForm();
      if (onSave) onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving payment',
        description: error.response?.data?.message || error.message
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Payment</DialogTitle>
          <DialogDescription>Record a new payment received from the entity.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label htmlFor="invoice">Link to Invoice (Optional)</Label>
              {loadingInvoices ? <Spinner /> :
                <Select value={invoiceId} onValueChange={setInvoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an unpaid invoice..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Record as a direct payment (unlinked)</SelectItem>
                    {unpaidInvoices.map(invoice => (
                      <SelectItem key={invoice._id} value={invoice._id}>
                        {invoice.invoice_number} - ₹{((invoice.total_amount || 0) - (invoice.amount_received || 0)).toFixed(2)} due
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            </div>
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any payment details or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <Spinner /> : 'Save Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPaymentDialog;
