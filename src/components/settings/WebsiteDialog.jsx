import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const WebsiteDialog = ({ open, onOpenChange, onSave, websiteData }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!websiteData;
  const [formData, setFormData] = useState({ name: '', url: '' });

  useEffect(() => {
    if (websiteData && open) {
      setFormData(websiteData);
    } else {
      setFormData({ name: '', url: '' });
    }
  }, [websiteData, open]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { _id, __v, user_id, createdAt, updatedAt, ...dataToSave } = formData;

    try {
      if (isEditMode) {
        await api.put(`/company-websites/${websiteData._id}`, dataToSave);
      } else {
        await api.post('/company-websites', dataToSave);
      }
      toast({ title: 'Success!', description: 'Website saved.' });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving website',
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
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Website</DialogTitle>
          <DialogDescription>Add a website link for your business.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="name">Website Name</Label>
            <Input id="name" value={formData.name || ''} onChange={handleChange} placeholder="e.g., Company Blog" required />
          </div>
          <div>
            <Label htmlFor="url">URL</Label>
            <Input id="url" type="url" value={formData.url || ''} onChange={handleChange} placeholder="https://example.com" required />
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

export default WebsiteDialog;
