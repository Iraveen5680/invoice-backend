
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, Hash, Building, Landmark, Home, Wallet as Bank, QrCode, Receipt, Eye } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import InvoiceView from '@/components/invoices/InvoiceView';

const DetailItem = ({ icon, label, value }) => {
  if (!value && value !== 0) return null;
  const Icon = icon;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md text-foreground break-words">{value}</p>
      </div>
    </div>
  );
};

const AddressDetail = ({ label, address }) => {
  if (!address) return null;
  return (
    <div className="flex items-start gap-3">
      <Home className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-md text-foreground whitespace-pre-wrap">{address}</p>
      </div>
    </div>
  );
};

const CustomerViewDialog = ({ open, onOpenChange, customer, _fetchInvoicesOverride, _dialogTitle, _dialogDescription }) => {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [viewingInvoiceId, setViewingInvoiceId] = useState(null);

  const fetchData = async () => {
    if (!customer?._id) return;
    setLoading(true);

    try {
      if (_fetchInvoicesOverride) {
        const { data } = await _fetchInvoicesOverride(customer._id);
        setPayments(data || []);
      } else {
        const { data } = await api.get('/payments', { params: { customer_id: customer._id } });
        setPayments(data || []);
      }
    } catch (error) {
      console.warn('Data fetch failed or endpoint not implemented');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && customer?._id) {
      setPayments([]);
      setActiveTab("personal");
    }
  }, [open, customer]);

  useEffect(() => {
    if (open && activeTab === 'payments' && customer?._id) {
      if (payments.length === 0) fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeTab, customer]);

  if (!customer) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <User className="w-7 h-7" /> {_dialogTitle || customer.name}
            </DialogTitle>
            <DialogDescription>
              {_dialogDescription || `Viewing detailed profile and transaction history for ${customer.name}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto pr-4 pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                <TabsTrigger value="bank">Bank</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
              </TabsList>
              <TabsContent value="personal" className="pt-6 space-y-6">
                <DetailItem icon={Mail} label="Email" value={customer.email} />
                <DetailItem icon={Phone} label="Mobile" value={customer.phone} />
                <DetailItem icon={Hash} label="GST Number" value={customer.gst_no} />
                <DetailItem icon={Landmark} label="Opening Balance" value={customer.opening_balance ? `₹${Number(customer.opening_balance).toFixed(2)}` : null} />
                <DetailItem icon={Building} label="Balance Type" value={customer.balance_type ? (customer.balance_type === 'receivable' ? 'To Collect' : 'To Pay') : null} />
              </TabsContent>
              <TabsContent value="address" className="pt-6 space-y-6">
                <AddressDetail label="Billing Address" address={customer.billing_address} />
                <AddressDetail label="Shipping Address" address={customer.shipping_address} />
              </TabsContent>
              <TabsContent value="bank" className="pt-6 space-y-6">
                <DetailItem icon={User} label="Account Holder Name" value={customer.bank_account_holder_name} />
                <DetailItem icon={Bank} label="Bank Account Number" value={customer.bank_account_number} />
                <DetailItem icon={Hash} label="IFSC Code" value={customer.bank_ifsc_code} />
                <DetailItem icon={Building} label="Branch Name" value={customer.bank_branch_name} />
                <DetailItem icon={QrCode} label="UPI ID" value={customer.upi_id} />
              </TabsContent>
              <TabsContent value="payments" className="pt-6">
                {loading ? (
                  <div className="flex justify-center items-center h-40"><Spinner /></div>
                ) : (
                  <>
                    {payments.length === 0 ? (
                      <div className="text-center text-muted-foreground py-10">
                        <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium">No Payments</h3>
                        <p className="mt-1 text-sm text-gray-500">No payments recorded for this entity yet.</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {payments.map(payment => (
                          <li key={payment._id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center border border-slate-200">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">
                                {payment.amount ? `₹${Number(payment.amount).toFixed(2)}` : '₹0.00'}
                              </p>
                              <p className="text-sm text-slate-500">
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {payment.invoices ? `Invoice: ${payment.invoices.invoice_number}` : 'Direct Payment'}
                              </p>
                            </div>
                            {payment.invoices?._id && (
                              <Button variant="ghost" size="icon" onClick={() => setViewingInvoiceId(payment.invoices._id)}>
                                <Eye className="h-5 w-5 text-blue-500" />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
          <DialogFooter className="pt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {viewingInvoiceId && (
        <InvoiceView
          open={!!viewingInvoiceId}
          onOpenChange={() => setViewingInvoiceId(null)}
          invoiceId={viewingInvoiceId}
        />
      )}
    </>
  );
};

export default CustomerViewDialog;
