import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const BankAccountDialog = ({ open, onOpenChange, onSave, accountData }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!accountData;

  const initialFormState = {
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (accountData && isEditMode) {
      setFormData(accountData);
    } else {
      setFormData(initialFormState);
    }
  }, [accountData, isEditMode, open]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { _id, __v, user_id, createdAt, updatedAt, ...dataToSave } = formData;

    try {
      if (isEditMode) {
        await api.put(`/admin-bank-accounts/${accountData._id}`, dataToSave);
      } else {
        await api.post('/admin-bank-accounts', dataToSave);
      }
      toast({ title: 'Success!', description: 'Bank account saved.' });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving bank account',
        description: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Bank Account</DialogTitle>
          <DialogDescription>Add a bank account to display on your invoices.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="bank_name">Bank Name</Label>
            <Input id="bank_name" value={formData.bank_name || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="account_holder_name">Account Holder Name</Label>
            <Input id="account_holder_name" value={formData.account_holder_name || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="account_number">Account Number</Label>
            <Input id="account_number" value={formData.account_number || ''} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="ifsc_code">IFSC Code</Label>
            <Input id="ifsc_code" value={formData.ifsc_code || ''} onChange={handleChange} required />
          </div>
        </form>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BankAccountDialog;
