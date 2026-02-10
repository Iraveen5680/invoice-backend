import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Spinner from '@/components/Spinner';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'];

const AddPaymentDialog = ({ open, onOpenChange, onPaymentAdded }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState([]);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        invoice_id: '',
        amount: '',
        payment_mode: 'Cash',
        payment_date: new Date(),
        reference: '',
        notes: ''
    });

    useEffect(() => {
        if (open) {
            fetchUnpaidInvoices();
        }
    }, [open]);

    const fetchUnpaidInvoices = async () => {
        setLoadingInvoices(true);
        try {
            const { data } = await api.get('/invoices');

            // Normalize and filter invoices
            const unpaidInvoices = data.map(inv => {
                // Normalize fields to ensure total and total_paid are numbers
                const total = parseFloat(inv.total || inv.grand_total || inv.amount || inv.total_amount) || 0;
                const paid = parseFloat(inv.amount_received || inv.total_paid || inv.paid_amount || inv.amount_paid) || 0;

                return {
                    ...inv,
                    total,
                    total_paid: paid
                };
            }).filter(inv => {
                const status = inv.status?.toLowerCase();

                // Show invoices that are pending, draft, or overdue (not paid or cancelled)
                const isUnpaidStatus = status !== 'paid' && status !== 'cancelled';

                // Fix precision issues
                const roundedTotal = Number(inv.total.toFixed(2));
                const roundedPaid = Number(inv.total_paid.toFixed(2));
                const hasBalance = roundedTotal > roundedPaid;

                return isUnpaidStatus && hasBalance;
            });

            setInvoices(unpaidInvoices);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error fetching invoices',
                description: error.response?.data?.message || error.message,
            });
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleInvoiceSelect = (invoiceId) => {
        const invoice = invoices.find(inv => inv._id === invoiceId);
        setSelectedInvoice(invoice);
        setFormData(prev => ({
            ...prev,
            invoice_id: invoiceId,
            amount: invoice ? (invoice.total - (invoice.total_paid || 0)).toFixed(2) : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedInvoice) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please select an invoice',
            });
            return;
        }

        const amount = parseFloat(formData.amount);
        const balance = selectedInvoice.total - (selectedInvoice.total_paid || 0);

        if (amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Payment amount must be greater than 0',
            });
            return;
        }

        if (amount > balance) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: `Payment amount cannot exceed invoice balance of ${balance.toFixed(2)}`,
            });
            return;
        }

        setLoading(true);
        try {
            await api.post('/payments', {
                invoice_id: formData.invoice_id,
                invoice_id: formData.invoice_id,
                customer_id: selectedInvoice.customer_id?._id || selectedInvoice.customer_id, // Ensure customer linked
                party_id: selectedInvoice.party_id?._id || selectedInvoice.party_id, // Ensure party linked
                amount: amount,
                payment_mode: formData.payment_mode,
                payment_date: formData.payment_date,
                reference: formData.reference,
                notes: formData.notes
            });

            toast({
                title: 'Success!',
                description: 'Payment added successfully',
            });

            // Reset form
            setFormData({
                invoice_id: '',
                amount: '',
                payment_mode: 'Cash',
                payment_date: new Date(),
                reference: '',
                notes: ''
            });
            setSelectedInvoice(null);
            setSearchTerm('');

            onPaymentAdded?.();
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error adding payment',
                description: error.response?.data?.message || error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.party_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const balance = selectedInvoice ? (selectedInvoice.total - (selectedInvoice.total_paid || 0)) : 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                    <DialogDescription>
                        Record a new payment against an invoice
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Invoice Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="invoice">Select Invoice *</Label>
                        {loadingInvoices ? (
                            <div className="flex justify-center p-4">
                                <Spinner size="small" />
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by invoice number or customer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={formData.invoice_id} onValueChange={handleInvoiceSelect}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an invoice" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredInvoices.length === 0 ? (
                                            <div className="p-4 text-sm text-muted-foreground text-center">
                                                No unpaid invoices found
                                            </div>
                                        ) : (
                                            filteredInvoices.map(invoice => (
                                                <SelectItem key={invoice._id} value={invoice._id}>
                                                    {invoice.invoice_number} - {invoice.customer_id?.name} - Bal: ₹{(invoice.total - (invoice.total_paid || 0)).toFixed(2)}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </>
                        )}
                    </div>

                    {/* Invoice Summary */}
                    {selectedInvoice && (
                        <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Invoice Total:</span>
                                <span className="font-medium">₹{selectedInvoice.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Amount Paid:</span>
                                <span className="font-medium">₹{(selectedInvoice.total_paid || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between border-t pt-2">
                                <span className="text-muted-foreground font-semibold">Balance Due:</span>
                                <span className="font-bold text-primary">₹{balance.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">Payment Amount *</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            required
                        />
                    </div>

                    {/* Payment Mode */}
                    <div className="space-y-2">
                        <Label htmlFor="payment_mode">Payment Mode *</Label>
                        <Select value={formData.payment_mode} onValueChange={(value) => setFormData({ ...formData, payment_mode: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {PAYMENT_MODES.map(mode => (
                                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label>Payment Date *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.payment_date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.payment_date ? format(formData.payment_date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.payment_date}
                                    onSelect={(date) => setFormData({ ...formData, payment_date: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Reference */}
                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference / Transaction ID</Label>
                        <Input
                            id="reference"
                            placeholder="e.g., TXN123456"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any additional notes..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !selectedInvoice}>
                            {loading ? (
                                <>
                                    <Spinner size="small" className="mr-2" />
                                    Adding...
                                </>
                            ) : (
                                'Add Payment'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPaymentDialog;
