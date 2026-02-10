import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const InvoiceTotals = ({
    totals, additionalCharges, setAdditionalCharges, overallDiscount, setOverallDiscount,
    amountReceived, setAmountReceived, isFullyPaid, setIsFullyPaid, paymentDetails, setPaymentDetails
}) => {
    const safeTotals = {
        subtotal: totals?.subtotal ?? 0,
        totalTax: totals?.totalTax ?? 0,
        grandTotal: totals?.grandTotal ?? 0,
        balanceAmount: totals?.balanceAmount ?? 0,
    };

    return (
        <div className="bg-slate-50 p-6 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
                <Label>Subtotal</Label>
                <span className="font-medium text-slate-700">₹{safeTotals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
                <Label>Total Tax</Label>
                <span className="font-medium text-slate-700">₹{safeTotals.totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="additionalCharges" className="text-slate-600">Additional Charges</Label>
                <Input id="additionalCharges" type="number" value={additionalCharges} onChange={e => setAdditionalCharges(e.target.value)} className="w-32 text-right border-slate-400" />
            </div>
            <div className="flex justify-between items-center">
                <Label htmlFor="overallDiscount" className="text-slate-600">Discount (₹)</Label>
                <Input id="overallDiscount" type="number" value={overallDiscount} onChange={e => setOverallDiscount(e.target.value)} className="w-32 text-right border-slate-400" />
            </div>
            <div className="border-t my-2 border-slate-200"></div>
            <div className="flex justify-between items-center text-xl font-bold text-slate-800">
                <Label>Grand Total</Label>
                <span>₹{safeTotals.grandTotal.toFixed(2)}</span>
            </div>
            <div className="border-t my-2 border-slate-200"></div>
            <div className="flex justify-between items-center">
                <Label htmlFor="amountReceived" className="text-slate-600">Amount Received</Label>
                <Input id="amountReceived" type="number" value={amountReceived} onChange={e => setAmountReceived(e.target.value)} className="w-32 text-right border-slate-400" disabled={isFullyPaid} />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="isFullyPaid" checked={isFullyPaid} onCheckedChange={setIsFullyPaid} />
                    <Label htmlFor="isFullyPaid" className="cursor-pointer">Mark as Fully Paid</Label>
                </div>
                <Select onValueChange={setPaymentDetails} value={paymentDetails}>
                    <SelectTrigger className="w-32 border-slate-400"><SelectValue placeholder="Paid via" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="border-t my-2 border-slate-200"></div>
            <div className="flex justify-between items-center text-lg font-bold text-green-600">
                <Label>Balance Amount</Label>
                <span>₹{safeTotals.balanceAmount.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default InvoiceTotals;