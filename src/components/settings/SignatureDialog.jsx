import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { UploadCloud, X } from 'lucide-react';
import Spinner from '@/components/Spinner';

const SignatureDialog = ({ open, onOpenChange, onSave, signatureData }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);
  const isEditMode = !!signatureData;

  useEffect(() => {
    if (signatureData && open) {
      setName(signatureData.name);
      setImagePreview(signatureData.signature_url);
    } else {
      setName('');
      setImagePreview('');
      setImageFile(null);
    }
  }, [signatureData, open]);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(imageFile);
    } else if (!isEditMode) {
      setImagePreview('');
    }
  }, [imageFile, isEditMode]);

  const handleImageUpload = async () => {
    if (!imageFile) return signatureData?.signature_url || null;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || (!imageFile && !isEditMode)) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please provide a name and an image.' });
      return;
    }
    setLoading(true);

    try {
      const imageUrl = await handleImageUpload();
      const dataToSave = { name, signature_url: imageUrl };

      if (isEditMode) {
        await api.put(`/admin-signatures/${signatureData._id}`, dataToSave);
      } else {
        await api.post('/admin-signatures', dataToSave);
      }

      toast({ title: 'Success!', description: `Signature has been ${isEditMode ? 'saved' : 'added'}.` });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error saving signature',
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
          <DialogTitle>{isEditMode ? 'Edit' : 'Add'} Signature</DialogTitle>
          <DialogDescription>Upload an image of a signature to use on invoices.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="name">Signature Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Authorized Signatory" required />
          </div>
          <div>
            <Label>Signature Image</Label>
            <div
              className="relative mt-1 w-full h-32 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-accent"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Spinner /> : imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="h-full object-contain p-2" />
                  <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto h-8 w-8" />
                  <p className="mt-1 text-sm">Click to upload</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
                onChange={e => setImageFile(e.target.files[0])}
              />
            </div>
          </div>
        </form>
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading || uploading}>
            {loading || uploading ? 'Saving...' : 'Save Signature'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SignatureDialog;
