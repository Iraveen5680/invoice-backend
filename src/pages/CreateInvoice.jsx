import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import InvoiceHeader from '@/components/invoices/form/InvoiceHeader';
import InvoiceTopSection from '@/components/invoices/form/InvoiceTopSection';
import InvoiceItemsTable from '@/components/invoices/form/InvoiceItemsTable';
import InvoiceFooter from '@/components/invoices/form/InvoiceFooter';
import BankAccountDialog from '@/components/settings/BankAccountDialog';
import SignatureDialog from '@/components/settings/SignatureDialog';
import AddItemDialog from '@/components/invoices/AddItemDialog';
import { v4 as uuidv4 } from 'uuid';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, companyProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [parties, setParties] = useState([]);
  const [products, setProducts] = useState([]);
  const [gstRates, setGstRates] = useState([]);
  const [adminBankAccounts, setAdminBankAccounts] = useState([]);
  const [adminSignatures, setAdminSignatures] = useState([]);

  const defaultTaxType = companyProfile?.tax_type === 'inclusive';
  const [isTaxInclusive, setIsTaxInclusive] = useState(defaultTaxType);

  const [isBankAccountDialogOpen, setIsBankAccountDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);

  const [showDueDate, setShowDueDate] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState('30');
  const [isFullyPaid, setIsFullyPaid] = useState(false);
  const [billToType, setBillToType] = useState('customer');

  const [invoiceData, setInvoiceData] = useState({
    customer_id: null,
    party_id: null,
    invoice_number: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    items: [],
    status: 'Pending',
    notes: '',
    additional_charges: 0,
    discount: 0,
    amount_received: 0,
    payment_details: '',
    admin_bank_account_id: null,
    admin_signature_id: null,
  });

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;

    invoiceData.items.forEach(item => {
      const quantity = Number(item.quantity) || 0;
      let unitPrice = Number(item.unit_price) || 0;
      const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id || r.id === item.gst_rate_id);
      const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;

      let itemSubtotal;
      let itemTax;

      if (isTaxInclusive) {
        const priceWithTax = unitPrice;
        const basePrice = priceWithTax / (1 + gstRate / 100);
        itemSubtotal = quantity * basePrice;
        itemTax = quantity * (priceWithTax - basePrice);
      } else {
        itemSubtotal = quantity * unitPrice;
        itemTax = itemSubtotal * (gstRate / 100);
      }

      subtotal += itemSubtotal;
      tax += itemTax;
    });

    const total_amount = Number((subtotal + tax + Number(invoiceData.additional_charges || 0) - Number(invoiceData.discount || 0)).toFixed(2));
    const balanceAmount = Number((total_amount - Number(invoiceData.amount_received || 0)).toFixed(2));

    return { subtotal, tax, grandTotal: total_amount, balanceAmount };
  }, [invoiceData.items, invoiceData.additional_charges, invoiceData.discount, invoiceData.amount_received, gstRates, isTaxInclusive]);


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [customersRes, partiesRes, productsRes, bankRes, sigRes, gstRes] = await Promise.all([
        api.get('/customers'),
        api.get('/parties'),
        api.get('/products'),
        api.get('/admin-bank-accounts'),
        api.get('/admin-signatures'),
        api.get('/gst-rates'),
      ]);

      setCustomers(customersRes.data || []);
      setParties(partiesRes.data || []);
      setProducts(productsRes.data || []);
      setGstRates(gstRes.data || []);
      setAdminBankAccounts(bankRes.data || []);
      setAdminSignatures(sigRes.data || []);

      const { data: invoices } = await api.get('/invoices');
      const count = invoices.length;
      const prefix = companyProfile?.invoice_prefix || 'INV-';
      const newNumber = `${prefix}${String(count + 1).padStart(3, '0')}`;

      const primaryBank = bankRes.data?.find(b => b.is_primary);
      const primarySig = sigRes.data?.find(s => s.is_primary);

      setInvoiceData(prev => ({
        ...prev,
        invoice_number: newNumber,
        admin_bank_account_id: primaryBank?._id || null,
        admin_signature_id: primarySig?._id || null,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: 'destructive', title: 'Error fetching data', description: error.message });
    }

    setLoading(false);
  }, [user, companyProfile, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (field, value) => {
    if (field === 'amount_received') {
      const receivedValue = Number(value) || 0;
      if (receivedValue > totals.grandTotal) {
        toast({
          variant: 'destructive',
          title: 'Overpayment Alert',
          description: `Received amount cannot exceed the total amount of ₹${totals.grandTotal.toFixed(2)}.`,
        });
        return;
      }
    }
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemsChange = (newItems) => {
    setInvoiceData(prev => ({ ...prev, items: newItems }));
  };

  const handleAddItems = (newItems) => {
    const itemsToAdd = newItems.map(product => ({
      id: uuidv4(),
      product_id: product._id || product.id,
      description: product.name,
      quantity: 1,
      unit_price: product.sale_price || product.regular_price,
      gst_rate_id: product.gst_rate_id,
    }));
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, ...itemsToAdd] }));
  };

  const handleItemUpdate = (index, field, value) => {
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    handleItemsChange(updatedItems);
  };

  const handleRemoveItem = (index) => {
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    handleItemsChange(updatedItems);
  };

  const handleSaveInvoice = async (status = 'Pending') => {
    const isCustomer = billToType === 'customer';
    if ((isCustomer && !invoiceData.customer_id) || (!isCustomer && !invoiceData.party_id)) {
      toast({ variant: 'destructive', title: 'Recipient not selected', description: `Please select a ${billToType}.` });
      return;
    }
    if (invoiceData.items.length === 0) {
      toast({ variant: 'destructive', title: 'No items in invoice', description: 'Please add at least one item.' });
      return;
    }
    if (invoiceData.amount_received > totals.grandTotal) {
      toast({
        variant: 'destructive',
        title: 'Invalid Received Amount',
        description: `The received amount (₹${invoiceData.amount_received}) cannot be more than the total invoice amount (₹${totals.grandTotal.toFixed(2)}).`,
      });
      return;
    }

    setSaving(true);

    try {
      const { items, ...invoiceDetails } = invoiceData;

      const formattedItems = items.map(item => {
        const quantity = Number(item.quantity) || 0;
        let unitPrice = Number(item.unit_price) || 0;
        const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id || r.id === item.gst_rate_id);
        const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;

        let finalUnitPrice = unitPrice;
        if (isTaxInclusive) {
          finalUnitPrice = unitPrice / (1 + gstRate / 100);
        }

        return {
          product_id: item.product_id,
          description: item.description,
          quantity: quantity,
          unit_price: finalUnitPrice,
          gst_rate_id: item.gst_rate_id,
          total: quantity * (isTaxInclusive ? unitPrice : (finalUnitPrice * (1 + gstRate / 100))),
        };
      });

      const finalInvoiceData = {
        ...invoiceDetails,
        customer_id: isCustomer ? invoiceData.customer_id : null,
        party_id: !isCustomer ? invoiceData.party_id : null,
        tax: totals.tax,
        total_amount: totals.grandTotal,
        status: isFullyPaid ? 'Paid' : (totals.grandTotal > 0 && totals.balanceAmount <= 0 ? 'Paid' : status),
        is_tax_inclusive: isTaxInclusive,
        items: formattedItems
      };

      await api.post('/invoices', finalInvoiceData);

      toast({ title: 'Success!', description: 'Invoice created successfully.' });
      navigate('/invoices');
    } catch (error) {
      console.error("Error saving invoice:", error);
      toast({ variant: 'destructive', title: 'Error saving invoice', description: error.response?.data?.message || 'Failed to save invoice' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-full">
          <Spinner />
        </div>
      </Layout>
    );
  }

  return (
    <>
      <Layout>
        <Helmet>
          <title>Create New Invoice</title>
        </Helmet>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <InvoiceHeader title="Create New Invoice" onSave={handleSaveInvoice} saving={saving} />

          <div className="p-6 bg-card rounded-lg border shadow-sm space-y-8">
            <InvoiceTopSection
              billToType={billToType}
              setBillToType={setBillToType}
              customerId={invoiceData.customer_id}
              setCustomerId={(value) => handleInputChange('customer_id', value)}
              customers={customers}
              partyId={invoiceData.party_id}
              setPartyId={(value) => handleInputChange('party_id', value)}
              parties={parties}
              issueDate={invoiceData.issue_date}
              setIssueDate={(value) => handleInputChange('issue_date', value)}
              showDueDate={showDueDate}
              setShowDueDate={setShowDueDate}
              paymentTerms={paymentTerms}
              setPaymentTerms={setPaymentTerms}
              dueDate={invoiceData.due_date}
              setDueDate={(value) => handleInputChange('due_date', value)}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="tax-inclusive"
                checked={isTaxInclusive}
                onCheckedChange={setIsTaxInclusive}
              />
              <Label htmlFor="tax-inclusive">Price is Tax Inclusive</Label>
            </div>
            <InvoiceItemsTable
              items={invoiceData.items}
              products={products}
              gstRates={gstRates}
              isTaxInclusive={isTaxInclusive}
              handleItemChange={handleItemUpdate}
              getItemRowTotals={(item) => {
                const quantity = Number(item.quantity) || 0;
                let unitPrice = Number(item.unit_price) || 0;
                const gstRateInfo = gstRates.find(r => r._id === item.gst_rate_id || r.id === item.gst_rate_id);
                const gstRate = gstRateInfo ? Number(gstRateInfo.rate) : 0;

                let basePrice = unitPrice;
                let total;

                if (isTaxInclusive) {
                  basePrice = unitPrice / (1 + gstRate / 100);
                  total = quantity * unitPrice;
                } else {
                  total = quantity * unitPrice * (1 + gstRate / 100);
                }

                return { basePrice, total };
              }}
              removeItem={handleRemoveItem}
              setIsAddItemDialogOpen={setIsAddItemDialogOpen}
            />
            <InvoiceFooter
              notes={invoiceData.notes}
              setNotes={(value) => handleInputChange('notes', value)}
              adminBankAccountId={invoiceData.admin_bank_account_id}
              setAdminBankAccountId={(value) => handleInputChange('admin_bank_account_id', value)}
              adminBankAccounts={adminBankAccounts}
              setIsBankAccountDialogOpen={setIsBankAccountDialogOpen}
              totals={totals}
              additionalCharges={invoiceData.additional_charges}
              setAdditionalCharges={(value) => handleInputChange('additional_charges', value)}
              overallDiscount={invoiceData.discount}
              setOverallDiscount={(value) => handleInputChange('discount', value)}
              amountReceived={invoiceData.amount_received}
              setAmountReceived={(value) => handleInputChange('amount_received', value)}
              isFullyPaid={isFullyPaid}
              setIsFullyPaid={(checked) => {
                setIsFullyPaid(checked);
                if (checked) {
                  handleInputChange('amount_received', totals.grandTotal);
                }
              }}
              paymentDetails={invoiceData.payment_details}
              setPaymentDetails={(value) => handleInputChange('payment_details', value)}
              adminSignatureId={invoiceData.admin_signature_id}
              setAdminSignatureId={(value) => handleInputChange('admin_signature_id', value)}
              adminSignatures={adminSignatures}
              setIsSignatureDialogOpen={setIsSignatureDialogOpen}
            />
          </div>
        </motion.div>
      </Layout>
      <BankAccountDialog open={isBankAccountDialogOpen} onOpenChange={setIsBankAccountDialogOpen} onSave={fetchData} />
      <SignatureDialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen} onSave={fetchData} />
      <AddItemDialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen} onItemsAdd={handleAddItems} />
    </>
  );
};

export default CreateInvoice;