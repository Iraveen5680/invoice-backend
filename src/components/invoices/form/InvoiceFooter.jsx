import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import InvoiceTotals from './InvoiceTotals';

const InvoiceFooter = ({
    notes, setNotes, adminBankAccountId, setAdminBankAccountId, adminBankAccounts, setIsBankAccountDialogOpen,
    totals, additionalCharges, setAdditionalCharges, overallDiscount, setOverallDiscount, amountReceived, setAmountReceived,
    isFullyPaid, setIsFullyPaid, paymentDetails, setPaymentDetails,
    adminSignatureId, setAdminSignatureId, adminSignatures, setIsSignatureDialogOpen
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t">
            <div className="space-y-4">
                <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for the customer..." className="border-slate-400" />
                </div>
                <div>
                    <Label>Bank Account (for payment)</Label>
                    <div className="flex items-center gap-2">
                        <Select onValueChange={setAdminBankAccountId} value={adminBankAccountId}>
                            <SelectTrigger className="flex-grow border-slate-400"><SelectValue placeholder="Select bank account" /></SelectTrigger>
                            <SelectContent>{adminBankAccounts.map(acc => <SelectItem key={acc._id} value={acc._id}>{acc.bank_name} - {acc.account_number}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button type="button" variant="outline" size="icon" onClick={() => setIsBankAccountDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
            </div>

            <InvoiceTotals
                totals={totals}
                additionalCharges={additionalCharges} setAdditionalCharges={setAdditionalCharges}
                overallDiscount={overallDiscount} setOverallDiscount={setOverallDiscount}
                amountReceived={amountReceived} setAmountReceived={setAmountReceived}
                isFullyPaid={isFullyPaid} setIsFullyPaid={setIsFullyPaid}
                paymentDetails={paymentDetails} setPaymentDetails={setPaymentDetails}
            />

            <div className="lg:col-span-2 pt-6 border-t">
                <Label>Signature</Label>
                <div className="flex items-center gap-2">
                    <Select onValueChange={setAdminSignatureId} value={adminSignatureId}>
                        <SelectTrigger className="w-full md:w-1/3 border-slate-400"><SelectValue placeholder="Select a signature" /></SelectTrigger>
                        <SelectContent>{adminSignatures.map(sig => <SelectItem key={sig._id} value={sig._id}>{sig.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsSignatureDialogOpen(true)}><Plus className="h-4 w-4" /></Button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceFooter;