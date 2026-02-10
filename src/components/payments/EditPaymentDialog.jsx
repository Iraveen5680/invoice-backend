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
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Spinner from '@/components/Spinner';

const PAYMENT_MODES = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Other'];

const EditPaymentDialog = ({ open, onOpenChange, payment, onPaymentUpdated }) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        payment_mode: 'Cash',
        payment_date: new Date(),
        reference: '',
        notes: ''
    });

    useEffect(() => {
        if (payment) {
            setFormData({
                amount: payment.amount || '',
                payment_mode: payment.payment_mode || 'Cash',
                payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
                reference: payment.reference || '',
                notes: payment.notes || ''
            });
        }
    }, [payment]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const amount = parseFloat(formData.amount);
        if (amount <= 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Payment amount must be greater than 0',
            });
            return;
        }

        setLoading(true);
        try {
            await api.put(`/payments/${payment._id}`, {
                amount: amount,
                payment_mode: formData.payment_mode,
                payment_date: formData.payment_date,
                reference: formData.reference,
                notes: formData.notes,
                invoice_id: payment.invoice_id?._id || payment.invoice_id // Maintain link
            });

            toast({
                title: 'Success!',
                description: 'Payment updated successfully',
            });

            onPaymentUpdated?.();
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error updating payment',
                description: error.response?.data?.message || error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!payment) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Payment</DialogTitle>
                    <DialogDescription>
                        Update payment details for Invoice #{payment.invoice_id?.invoice_number}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Invoice Info (Read Only) */}
                    <div className="p-4 bg-muted rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Invoice Number:</span>
                            <span className="font-medium">{payment.invoice_id?.invoice_number}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="font-medium">{payment.customer_id?.name || 'N/A'}</span>
                        </div>
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-amount">Payment Amount *</Label>
                        <Input
                            id="edit-amount"
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
                        <Label htmlFor="edit-payment_mode">Payment Mode *</Label>
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
                        <Label htmlFor="edit-reference">Reference / Transaction ID</Label>
                        <Input
                            id="edit-reference"
                            placeholder="e.g., TXN123456"
                            value={formData.reference}
                            onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        />
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="edit-notes">Notes</Label>
                        <Textarea
                            id="edit-notes"
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
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner size="small" className="mr-2" />
                                    Updating...
                                </>
                            ) : (
                                'Update Payment'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditPaymentDialog;
