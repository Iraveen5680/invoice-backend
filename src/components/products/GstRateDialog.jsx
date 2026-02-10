import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const GstRateDialog = ({ open, onOpenChange, onSave, gstRateData }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const isEditMode = !!gstRateData;

  useEffect(() => {
    if (gstRateData) {
      setName(gstRateData.name);
      setRate(gstRateData.rate);
    } else {
      setName('');
      setRate('');
    }
  }, [gstRateData, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      name,
      rate: parseFloat(rate),
    };

    try {
      if (isEditMode) {
        await api.put(`/gst-rates/${gstRateData._id}`, dataToSave);
      } else {
        await api.post('/gst-rates', dataToSave);
      }
      toast({ title: 'Success!', description: `GST Rate has been ${isEditMode ? 'updated' : 'added'}.` });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: `Error ${isEditMode ? 'updating' : 'saving'} GST rate`,
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
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} GST Rate</DialogTitle>
          <DialogDescription>
            Manage your GST tax rates here.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="GST Rate Name (e.g., GST 18%)"
            required
          />
          <Input
            id="rate"
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="Rate (%)"
            required
            step="0.01"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GstRateDialog;
