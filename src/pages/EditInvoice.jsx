import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, Plus, Save, ArrowLeft, Users, UserCheck } from 'lucide-react';
import Spinner from '@/components/Spinner';
import GstRateDialog from '@/components/products/GstRateDialog';
import AddItemDialog from '@/components/invoices/AddItemDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const EditInvoice = () => {
  const { id: invoiceId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [billToType, setBillToType] = useState('customer');
  const [customerId, setCustomerId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDueDate, setShowDueDate] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [additionalCharges, setAdditionalCharges] = useState(0);
  const [overallDiscount, setOverallDiscount] = useState(0);

  const [payments, setPayments] = useState([]);
  const amountReceived = useMemo(() => payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0), [payments]);

  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [adminBankAccountId, setAdminBankAccountId] = useState('');
  const [adminSignatureId, setAdminSignatureId] = useState('');
  const [isTaxInclusive, setIsTaxInclusive] = useState(true);

  // Data from DB
  const [customers, setCustomers] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [adminBankAccounts, setAdminBankAccounts] = useState([]);
  const [adminSignatures, setAdminSignatures] = useState([]);

  const [isGstRateDialogOpen, setIsGstRateDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  const fetchDependencies = useCallback(async () => {
    if (!user) return;
    try {
      const [customersRes, partiesRes, productsRes, gstRatesRes, bankAccountsRes, signaturesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/parties'),
        api.get('/products'),
        api.get('/gst-rates'),
        api.get('/admin-bank-accounts'),
        api.get('/admin-signatures'),
      ]);

      setCustomers(customersRes.data || []);
      setParties(partiesRes.data || []);
      setProducts(productsRes.data || []);
      setGstRates(gstRatesRes.data || []);
      setAdminBankAccounts(bankAccountsRes.data || []);
      setAdminSignatures(signaturesRes.data || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error fetching dependencies', description: error.message });
    }
  }, [toast, user]);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setLoading(true);
      await fetchDependencies();

      try {
        const { data: invoiceData } = await api.get(`/invoices/${invoiceId}`);

        setCustomerId(invoiceData.customer_id);
        setPartyId(invoiceData.party_id);
        setBillToType(invoiceData.party_id ? 'party' : 'customer');
        setIssueDate(invoiceData.issue_date ? new Date(invoiceData.issue_date).toISOString().split('T')[0] : '');
        setDueDate(invoiceData.due_date ? new Date(invoiceData.due_date).toISOString().split('T')[0] : '');
        setShowDueDate(!!invoiceData.due_date);
        setNotes(invoiceData.notes || '');
        setAdditionalCharges(invoiceData.additional_charges || 0);
        setOverallDiscount(invoiceData.discount || 0);
        setPayments(invoiceData.payments || []);
        setIsFullyPaid(invoiceData.status === 'Paid');
        setAdminBankAccountId(invoiceData.admin_bank_account_id?._id || invoiceData.admin_bank_account_id || '');
        setAdminSignatureId(invoiceData.admin_signature_id?._id || invoiceData.admin_signature_id || '');
        setIsTaxInclusive(invoiceData.is_tax_inclusive);

        const loadedItems = (invoiceData.items || []).map(item => ({
          ...item,
          product_id: item.product_id?._id || item.product_id || '',
          gst_rate_id: item.gst_rate_id?._id || item.gst_rate_id || null
        }));
        setItems(loadedItems);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching invoice data', description: error.message });
        navigate('/invoices');
      }

      setLoading(false);
    };

    fetchInvoiceData();
  }, [invoiceId, fetchDependencies, navigate, toast]);

  useEffect(() => {
    if (isFullyPaid) {
      setShowDueDate(false);
      setDueDate(null);
    }
  }, [isFullyPaid]);

  const addPayment = () => {
    setPayments([...payments, { id: Date.now(), amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'Cash' }]);
  };

  const updatePayment = (index, field, value) => {
    const newPayments = [...payments];
    newPayments[index][field] = value;

    if (field === 'amount') {
      const currentAmount = Number(value) || 0;
      const otherPaymentsTotal = payments
        .filter((_, i) => i !== index)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      if (currentAmount + otherPaymentsTotal > totals.grandTotal) {
        toast({
          variant: 'destructive',
          title: 'Overpayment Alert',
          description: `Total received amount cannot exceed ₹${totals.grandTotal.toFixed(2)}.`,
        });
        // Optionally, cap the value
        const maxAllowed = totals.grandTotal - otherPaymentsTotal;
        newPayments[index][field] = maxAllowed > 0 ? maxAllowed : 0;
      }
    }
    setPayments(newPayments);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };


  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const currentItem = { ...newItems[index] };
    currentItem[field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p._id === value);
      if (product) {
        currentItem.unit_price = product.sale_price || product.regular_price || 0;
        currentItem.description = product.name;
        currentItem.gst_rate_id = product.gst_rate_id;
      }
    }

    if (field === 'unit_price' && isTaxInclusive) {
      const gstRateInfo = gstRates.find(r => r._id === currentItem.gst_rate_id);
      const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;
      if (gstRate > 0) {
        currentItem.unit_price = parseFloat(value).toFixed(4);
      }
    }

    newItems[index] = currentItem;
    setItems(newItems);
  };

  const handleItemsAdd = (newItemsFromDialog) => {
    const newInvoiceItems = newItemsFromDialog.map(product => ({
      product_id: product._id,
      description: product.name,
      quantity: 1,
      unit_price: product.sale_price || product.regular_price || 0,
      gst_rate_id: product.gst_rate_id,
    }));
    setItems(prev => [...prev, ...newInvoiceItems]);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    items.forEach(item => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id);
      const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;

      let basePrice = unitPrice;
      if (isTaxInclusive && gstRate > 0) {
        basePrice = unitPrice / (1 + gstRate / 100);
      }

      const itemSubtotal = quantity * basePrice;
      const itemTax = itemSubtotal * (gstRate / 100);

      subtotal += itemSubtotal;
      totalTax += itemTax;
    });

    const grandTotal = Number((subtotal + totalTax + Number(additionalCharges) - Number(overallDiscount)).toFixed(2));
    const balanceAmount = Number((grandTotal - amountReceived).toFixed(2));

    return { subtotal, totalTax, grandTotal, balanceAmount };
  }, [items, gstRates, additionalCharges, overallDiscount, amountReceived, isTaxInclusive]);

  const getItemRowTotals = (item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id);
    const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;

    let basePrice = unitPrice;
    if (isTaxInclusive && gstRate > 0) {
      basePrice = unitPrice / (1 + gstRate / 100);
    }
    const total = quantity * basePrice * (1 + gstRate / 100);
    return { basePrice, total };
  };

  useEffect(() => {
    if (totals.grandTotal > 0 && totals.balanceAmount <= 0) {
      setIsFullyPaid(true);
    } else {
      setIsFullyPaid(false);
    }
  }, [totals.grandTotal, totals.balanceAmount]);

  const handleSubmit = async () => {
    if ((billToType === 'customer' && !customerId) || (billToType === 'party' && !partyId)) {
      return toast({ variant: 'destructive', title: `Please select a ${billToType}.` });
    }
    if (items.some(item => !item.product_id && !item.description)) return toast({ variant: 'destructive', title: 'Please select a product or enter a description for all items.' });
    if (amountReceived > totals.grandTotal) {
      toast({
        variant: 'destructive',
        title: 'Invalid Payment Amount',
        description: `Total received amount (₹${amountReceived}) cannot exceed the invoice total (₹${totals.grandTotal.toFixed(2)}).`,
      });
      return;
    }

    setSaving(true);
    const { grandTotal, totalTax, balanceAmount } = totals;

    const invoiceItems = items.map(item => {
      const { basePrice, total } = getItemRowTotals(item);
      const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id || r.id === item.gst_rate_id);
      const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;
      return {
        product_id: item.product_id || null,
        description: item.description,
        quantity: Number(item.quantity) || 0,
        unit_price: isTaxInclusive ? basePrice : (Number(item.unit_price) || 0),
        gst_rate: gstRate,
        total: total,
        gst_rate_id: item.gst_rate_id || null,
      };
    });

    const paymentItems = payments.map(p => ({
      amount: Number(p.amount) || 0,
      payment_date: p.payment_date,
      payment_mode: p.payment_mode,
    })).filter(p => p.amount > 0);

    const updateData = {
      customer_id: billToType === 'customer' ? customerId : null,
      party_id: billToType === 'party' ? partyId : null,
      issue_date: issueDate,
      due_date: showDueDate && !isFullyPaid ? dueDate : null,
      total_amount: grandTotal,
      tax: totalTax,
      discount: Number(overallDiscount) || 0,
      status: isFullyPaid ? 'Paid' : (grandTotal > 0 && balanceAmount <= 0 ? 'Paid' : 'Pending'),
      notes,
      additional_charges: Number(additionalCharges) || 0,
      amount_received: amountReceived,
      admin_bank_account_id: adminBankAccountId || null,
      admin_signature_id: adminSignatureId || null,
      is_tax_inclusive: isTaxInclusive,
      items: invoiceItems,
      payments: paymentItems
    };

    try {
      await api.put(`/invoices/${invoiceId}`, updateData);
      setSaving(false);
      toast({ title: 'Success!', description: 'Invoice updated successfully.' });
      navigate('/invoices');
    } catch (error) {
      setSaving(false);
      toast({ variant: 'destructive', title: 'Failed to update invoice', description: error.message });
    }
  };

  if (loading) {
    return <Layout><div className="flex justify-center items-center h-full"><Spinner /></div></Layout>;
  }

  return (
    <>
      <Layout>
        <Helmet>
          <title>Edit Invoice - Invoice Management System</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/invoices')}><ArrowLeft className="h-4 w-4" /></Button>
            <h1 className="text-3xl font-bold text-slate-800">Edit Invoice</h1>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
            {/* Top Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer">Bill To</Label>
                <Tabs value={billToType} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="customer" disabled><Users className="h-4 w-4 mr-2" /> Customer</TabsTrigger>
                    <TabsTrigger value="party" disabled><UserCheck className="h-4 w-4 mr-2" /> Party</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                  {billToType === 'customer' ? (
                    <Select value={customerId} disabled>
                      <SelectTrigger id="customer"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Select value={partyId} disabled>
                      <SelectTrigger id="party"><SelectValue placeholder="Select Party" /></SelectTrigger>
                      <SelectContent>
                        {parties.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="issueDate">Invoice Date</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="showDueDate" checked={showDueDate} onCheckedChange={setShowDueDate} disabled={isFullyPaid} />
                  <Label htmlFor="showDueDate">Set Due Date & Payment Terms</Label>
                </div>
                {showDueDate && !isFullyPaid && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="text" placeholder="Payment Terms (e.g., Net 30)" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} />
                    <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2">
              <Label htmlFor="tax-inclusive-switch">Tax Inclusive</Label>
              <Switch id="tax-inclusive-switch" checked={isTaxInclusive} onCheckedChange={setIsTaxInclusive} disabled />
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left font-semibold text-slate-600 w-10">#</th>
                    <th className="p-2 text-left font-semibold text-slate-600 w-2/5">Item</th>
                    <th className="p-2 text-left font-semibold text-slate-600">Qty</th>
                    <th className="p-2 text-left font-semibold text-slate-600">Price</th>
                    <th className="p-2 text-left font-semibold text-slate-600">Tax</th>
                    <th className="p-2 text-right font-semibold text-slate-600">Amount</th>
                    <th className="p-2 text-right font-semibold text-slate-600"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const { basePrice, total } = getItemRowTotals(item);
                    return (
                      <tr key={index} className="border-b">
                        <td className="p-2">{index + 1}</td>
                        <td className="p-2">
                          <Select onValueChange={val => handleItemChange(index, 'product_id', val)} value={item.product_id || ''}>
                            <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                            <SelectContent>{products.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}</SelectContent>
                          </Select>
                          <Input type="text" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="w-full mt-1" placeholder="Or enter description" />
                        </td>
                        <td className="p-2"><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20" /></td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={isTaxInclusive ? item.unit_price : basePrice.toFixed(2)}
                            onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-28"
                            placeholder={isTaxInclusive ? "Price (incl. tax)" : "Price"}
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-1">
                            <Select onValueChange={val => handleItemChange(index, 'gst_rate_id', val)} value={item.gst_rate_id || ''}>
                              <SelectTrigger><SelectValue placeholder="Tax" /></SelectTrigger>
                              <SelectContent>{gstRates.map(r => <SelectItem key={r._id} value={r._id}>{r.rate}%</SelectItem>)}</SelectContent>
                            </Select>
                            <Button type="button" variant="ghost" size="icon" onClick={() => setIsGstRateDialogOpen(true)}><Plus className="w-4 h-4 text-blue-500" /></Button>
                          </div>
                        </td>
                        <td className="p-2 text-right font-medium">₹{total.toFixed(2)}</td>
                        <td className="p-2 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><X className="w-4 h-4 text-red-500" /></Button></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddItemDialogOpen(true)} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
            </div>

            {/* Footer Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes for the customer..." />
                </div>
                <div>
                  <Label>Bank Account (for payment)</Label>
                  <Select onValueChange={setAdminBankAccountId} value={adminBankAccountId}>
                    <SelectTrigger><SelectValue placeholder="Select bank account" /></SelectTrigger>
                    <SelectContent>{adminBankAccounts.map(acc => <SelectItem key={acc._id} value={acc._id}>{acc.bank_name} - {acc.account_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="flex justify-between items-center"><Label>Subtotal</Label><span className="font-medium">₹{totals.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><Label>Total Tax</Label><span className="font-medium">₹{totals.totalTax.toFixed(2)}</span></div>
                <div className="flex justify-between items-center"><Label htmlFor="additionalCharges">Additional Charges</Label><Input id="additionalCharges" type="number" value={additionalCharges} onChange={e => setAdditionalCharges(e.target.value)} className="w-32 text-right" /></div>
                <div className="flex justify-between items-center"><Label htmlFor="overallDiscount">Discount (₹)</Label><Input id="overallDiscount" type="number" value={overallDiscount} onChange={e => setOverallDiscount(e.target.value)} className="w-32 text-right" /></div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between items-center text-xl font-bold"><Label>Grand Total</Label><span>₹{totals.grandTotal.toFixed(2)}</span></div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label>Payments Received</Label>
                    <Button variant="ghost" size="icon" onClick={addPayment}><Plus className="w-4 h-4 text-blue-500" /></Button>
                  </div>
                  {payments.map((payment, index) => (
                    <div key={payment.id} className="flex items-center gap-2">
                      <Input type="date" value={payment.payment_date} onChange={e => updatePayment(index, 'payment_date', e.target.value)} />
                      <Input type="number" placeholder="Amount" value={payment.amount} onChange={e => updatePayment(index, 'amount', e.target.value)} />
                      <Select value={payment.payment_mode} onValueChange={val => updatePayment(index, 'payment_mode', val)}>
                        <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem><SelectItem value="Bank">Bank</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => removePayment(index)}><X className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="isFullyPaid" checked={isFullyPaid} disabled />
                    <Label htmlFor="isFullyPaid">Mark as Fully Paid</Label>
                  </div>
                </div>
                <div className="border-t my-2"></div>
                <div className="flex justify-between items-center text-lg font-bold text-green-600"><Label>Balance Amount</Label><span>₹{totals.balanceAmount.toFixed(2)}</span></div>
              </div>
            </div>

            {/* Signature */}
            <div className="pt-6 border-t">
              <Label>Signature</Label>
              <Select onValueChange={setAdminSignatureId} value={adminSignatureId}>
                <SelectTrigger className="w-full md:w-1/3"><SelectValue placeholder="Select a signature" /></SelectTrigger>
                <SelectContent>{adminSignatures.map(sig => <SelectItem key={sig._id} value={sig._id}>{sig.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => navigate('/invoices')} disabled={saving}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? <Spinner /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Update Invoice'}
            </Button>
          </div>
        </motion.div>
      </Layout>
      <GstRateDialog open={isGstRateDialogOpen} onOpenChange={setIsGstRateDialogOpen} onSave={fetchDependencies} />
      <AddItemDialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen} onItemsAdd={handleItemsAdd} />
    </>
  );
};

export default EditInvoice;
