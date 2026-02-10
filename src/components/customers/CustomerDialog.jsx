import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Spinner from '@/components/Spinner';

const CustomerDialog = ({ open, onOpenChange, onSave, customerData, _onSaveOverride, _dialogTitle }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchingIFSC, setFetchingIFSC] = useState(false);
  const [formData, setFormData] = useState({});
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const isEditMode = !!customerData;

  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    gst_no: '',
    opening_balance: '',
    balance_type: 'receivable',
    billing_address: '',
    shipping_address: '',
    bank_account_number: '',
    bank_ifsc_code: '',
    bank_branch_name: '',
    bank_account_holder_name: '',
    upi_id: '',
  };

  useEffect(() => {
    if (isEditMode && customerData) {
      setFormData({ ...initialFormState, ...customerData });
      if (customerData.billing_address === customerData.shipping_address) {
        setSameAsBilling(true);
      }
    } else {
      setFormData(initialFormState);
      setSameAsBilling(false);
    }
  }, [customerData, isEditMode, open]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleCheckboxChange = (checked) => {
    setSameAsBilling(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, shipping_address: prev.billing_address }));
    }
  };

  const fetchBranchFromIFSC = useCallback(async (ifsc) => {
    if (ifsc && ifsc.length === 11) {
      setFetchingIFSC(true);
      try {
        const response = await fetch(`https://ifsc.razorpay.com/${ifsc}`);
        if (response.ok) {
          const data = await response.json();
          setFormData(prev => ({ ...prev, bank_branch_name: data.BRANCH }));
          toast({ title: "Bank details fetched successfully!" });
        } else {
          setFormData(prev => ({ ...prev, bank_branch_name: '' }));
          toast({ variant: 'destructive', title: "Invalid IFSC Code", description: "Could not fetch bank details." });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: "Network Error", description: "Failed to fetch bank details." });
      } finally {
        setFetchingIFSC(false);
      }
    }
  }, [toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    setLoading(true);

    const dataToSave = { ...formData };
    delete dataToSave._id; // Remove _id if it's there
    delete dataToSave.user_id; // Let backend handle user_id from token

    try {
      if (_onSaveOverride) {
        const result = await _onSaveOverride(dataToSave, isEditMode);
        if (result?.error) throw new Error(result.error.message);
      } else {
        if (isEditMode) {
          await api.put(`/customers/${customerData._id}`, dataToSave);
        } else {
          await api.post('/customers', dataToSave);
        }
      }
      toast({
        title: 'Success!',
        description: `Details have been saved.`,
      });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Error saving details`,
        description: error.response?.data?.message || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{_dialogTitle || (isEditMode ? 'Edit Customer' : 'Add New Customer')}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update customer information and preferences.' : 'Enter details to add a new customer to your records.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="bank">Bank Details</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={formData.name || ''} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="phone">Mobile</Label>
                  <Input id="phone" value={formData.phone || ''} onChange={handleChange} />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="opening_balance">Opening Balance</Label>
                  <Input id="opening_balance" type="number" value={formData.opening_balance || ''} onChange={handleChange} />
                </div>
                <div>
                  <Label htmlFor="balance_type">Balance Type</Label>
                  <Select onValueChange={(value) => handleSelectChange('balance_type', value)} value={formData.balance_type}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receivable">To Collect</SelectItem>
                      <SelectItem value="payable">To Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="gst_no">GST Number (Optional)</Label>
                <Input id="gst_no" value={formData.gst_no || ''} onChange={handleChange} />
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="billing_address">Billing Address</Label>
                <textarea id="billing_address" value={formData.billing_address || ''} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg" rows="3" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="shipping_address">Shipping Address</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sameAsBilling" checked={sameAsBilling} onCheckedChange={handleCheckboxChange} />
                    <Label htmlFor="sameAsBilling" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Same as billing address
                    </Label>
                  </div>
                </div>
                <textarea id="shipping_address" value={formData.shipping_address || ''} onChange={handleChange} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg" rows="3" disabled={sameAsBilling} />
              </div>
            </TabsContent>
            <TabsContent value="bank" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="bank_account_holder_name">Account Holder Name</Label>
                <Input id="bank_account_holder_name" value={formData.bank_account_holder_name || ''} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_account_number">Bank Account Number</Label>
                  <Input id="bank_account_number" value={formData.bank_account_number || ''} onChange={handleChange} />
                </div>
                <div className="relative">
                  <Label htmlFor="bank_ifsc_code">IFSC Code</Label>
                  <Input id="bank_ifsc_code" value={formData.bank_ifsc_code || ''} onChange={(e) => { handleChange(e); fetchBranchFromIFSC(e.target.value); }} />
                  {fetchingIFSC && <div className="absolute right-2 top-8"><Spinner size="small" /></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank_branch_name">Branch Name</Label>
                  <Input id="bank_branch_name" value={formData.bank_branch_name || ''} onChange={handleChange} disabled />
                </div>
                <div>
                  <Label htmlFor="upi_id">UPI ID</Label>
                  <Input id="upi_id" value={formData.upi_id || ''} onChange={handleChange} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </form>
        <DialogFooter className="pt-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <Spinner size="small" /> : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDialog;
