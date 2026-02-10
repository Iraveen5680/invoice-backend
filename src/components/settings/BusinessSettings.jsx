import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import { Plus, Trash2, Edit, Star, UploadCloud, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SignatureDialog from './SignatureDialog';
import BankAccountDialog from './BankAccountDialog';
import WebsiteDialog from './WebsiteDialog';
import { MultiSelect } from './MultiSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const businessTypesOptions = [
    { value: 'Retailer', label: 'Retailer' },
    { value: 'Wholesaler', label: 'Wholesaler' },
    { value: 'Manufacturer', label: 'Manufacturer' },
    { value: 'Service Provider', label: 'Service Provider' },
    { value: 'Distributor', label: 'Distributor' },
];

const industryTypesOptions = [
    'Technology', 'Healthcare', 'Finance', 'Education', 'Construction',
    'Hospitality', 'E-commerce', 'Consulting', 'Other'
];

const BusinessSettings = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '', address: '', state: '', pincode: '', phone: '', email: '',
        gst_number: '', pan_number: '', business_type: [], industry_type: '', logo_url: ''
    });

    const [profileExists, setProfileExists] = useState(false);
    const [signatures, setSignatures] = useState([]);
    const [bankAccounts, setBankAccounts] = useState([]);
    const [websites, setWebsites] = useState([]);

    const [isSignatureDialogOpen, setSignatureDialogOpen] = useState(false);
    const [isBankAccountDialogOpen, setBankAccountDialogOpen] = useState(false);
    const [isWebsiteDialogOpen, setWebsiteDialogOpen] = useState(false);

    const [editingSignature, setEditingSignature] = useState(null);
    const [editingBankAccount, setEditingBankAccount] = useState(null);
    const [editingWebsite, setEditingWebsite] = useState(null);

    const [refreshKey, setRefreshKey] = useState(0);
    const [deleteAlert, setDeleteAlert] = useState({ isOpen: false, item: null, type: '' });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [logoUploading, setLogoUploading] = useState(false);
    const logoInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        try {
            const [profileRes, sigRes, bankRes, webRes] = await Promise.all([
                api.get('/company-profile'),
                api.get('/admin-signatures'),
                api.get('/admin-bank-accounts'),
                api.get('/company-websites')
            ]);

            if (profileRes.data) {
                setProfile(prev => ({ ...prev, ...profileRes.data, business_type: profileRes.data.business_type || [] }));
                setProfileExists(true);
                if (profileRes.data.logo_url) setLogoPreview(profileRes.data.logo_url);
            }
            setSignatures(sigRes.data || []);
            setBankAccounts(bankRes.data || []);
            setWebsites(webRes.data || []);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching settings data' });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleDialogSave = () => {
        setRefreshKey(k => k + 1);
        setEditingSignature(null);
        setEditingBankAccount(null);
        setEditingWebsite(null);
    };

    const handleEdit = (item, type) => {
        if (type === 'signature') { setEditingSignature(item); setSignatureDialogOpen(true); }
        if (type === 'bank') { setEditingBankAccount(item); setBankAccountDialogOpen(true); }
        if (type === 'website') { setEditingWebsite(item); setWebsiteDialogOpen(true); }
    };

    const handleOpenDialog = (type) => {
        if (type === 'signature') { setEditingSignature(null); setSignatureDialogOpen(true); }
        if (type === 'bank') { setEditingBankAccount(null); setBankAccountDialogOpen(true); }
        if (type === 'website') { setEditingWebsite(null); setWebsiteDialogOpen(true); }
    }

    const handleLogoUpload = async () => {
        if (!logoFile) return profile.logo_url || '';
        setLogoUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', logoFile);
            const response = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.url;
        } catch (error) {
            toast({ variant: 'destructive', title: 'Logo upload failed', description: error.message });
            throw error;
        } finally {
            setLogoUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const logoUrl = await handleLogoUpload();
            const dataToUpdate = { ...profile, logo_url: logoUrl };

            // Omitting _id and internal fields
            const { _id, __v, user_id, createdAt, updatedAt, ...cleanData } = dataToUpdate;

            if (profileExists) {
                await api.put('/company-profile', cleanData);
            } else {
                await api.post('/company-profile', cleanData);
            }
            toast({ title: 'Success!', description: 'Business profile saved.' });
            setProfileExists(true);
            setRefreshKey(k => k + 1);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error saving profile',
                description: error.response?.data?.message || error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const confirmDeleteItem = async () => {
        const { item, type } = deleteAlert;
        if (!item || !type) return;

        const endpointMap = {
            signature: 'admin-signatures',
            bank: 'admin-bank-accounts',
            website: 'company-websites',
        };
        const itemName = type.charAt(0).toUpperCase() + type.slice(1);

        try {
            await api.delete(`/${endpointMap[type]}/${item._id}`);
            toast({ title: 'Success!', description: `${itemName} deleted.` });
            setRefreshKey(k => k + 1);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: `Error deleting ${itemName}`,
                description: error.response?.data?.message || 'Usage restriction or server error.'
            });
        }
        setDeleteAlert({ isOpen: false, item: null, type: '' });
    };


    const makePrimary = async (table_name, id, name) => {
        const endpointMap = {
            admin_signatures: 'admin-signatures',
            admin_bank_accounts: 'admin-bank-accounts',
            company_websites: 'company-websites'
        };

        try {
            await api.patch(`/${endpointMap[table_name]}/primary/${id}`);
            toast({ title: 'Success!', description: `Primary ${name} updated.` });
            setRefreshKey(k => k + 1);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: `Error setting primary ${name}`,
                description: error.response?.data?.message || error.message
            });
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-8 pt-6">
            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Business Profile</CardTitle>
                        <CardDescription>Manage your main business information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            <div className="w-full md:w-1/3 space-y-4">
                                <Label>Business Logo</Label>
                                <div
                                    className="relative w-full h-40 bg-muted rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground cursor-pointer hover:bg-accent"
                                    onClick={() => logoInputRef.current?.click()}
                                >
                                    {logoUploading ? <Spinner /> : logoPreview ? (
                                        <>
                                            <img src={logoPreview} alt="Logo Preview" className="h-full object-contain p-2" />
                                            <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-7 w-7 rounded-full" onClick={(e) => { e.stopPropagation(); setLogoFile(null); setLogoPreview(''); setProfile(p => ({ ...p, logo_url: '' })) }}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto h-8 w-8" />
                                            <p className="mt-1 text-sm">Click to upload logo</p>
                                        </div>
                                    )}
                                    <input
                                        ref={logoInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/png, image/jpeg, image/webp"
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                setLogoFile(file);
                                                const reader = new FileReader();
                                                reader.onloadend = () => setLogoPreview(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="w-full md:w-2/3 space-y-4">
                                <div className="space-y-2"><Label htmlFor="name">Business Name</Label><Input id="name" name="name" value={profile.name || ''} onChange={handleInputChange} /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" value={profile.email || ''} onChange={handleInputChange} /></div>
                                    <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" name="phone" value={profile.phone || ''} onChange={handleInputChange} /></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="address">Billing Address</Label><Textarea id="address" name="address" value={profile.address || ''} onChange={handleInputChange} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" name="state" value={profile.state || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" name="pincode" value={profile.pincode || ''} onChange={handleInputChange} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="gst_number">GST Number (Optional)</Label><Input id="gst_number" name="gst_number" value={profile.gst_number || ''} onChange={handleInputChange} /></div>
                            <div className="space-y-2"><Label htmlFor="pan_number">PAN Number</Label><Input id="pan_number" name="pan_number" value={profile.pan_number || ''} onChange={handleInputChange} /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Business Type</Label>
                                <MultiSelect
                                    options={businessTypesOptions}
                                    value={profile.business_type || []}
                                    onChange={(val) => setProfile(p => ({ ...p, business_type: val }))}
                                    placeholder="Select business types..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Industry Type</Label>
                                <Select value={profile.industry_type || ''} onValueChange={(val) => setProfile(p => ({ ...p, industry_type: val }))}>
                                    <SelectTrigger><SelectValue placeholder="Select industry type..." /></SelectTrigger>
                                    <SelectContent>{industryTypesOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Button type="submit" disabled={saving}>{saving ? <><Spinner size="small" className="mr-2" /> Saving...</> : 'Save Business Info'}</Button>
                    </CardContent>
                </Card>
            </form>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div><CardTitle>Signatures</CardTitle><CardDescription>Manage authorized signatures.</CardDescription></div>
                    <Button onClick={() => handleOpenDialog('signature')}><Plus className="mr-2 h-4 w-4" />Add Signature</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {signatures.map(sig => (
                            <div key={sig._id} className="flex items-center justify-between p-2 border rounded-lg">
                                <div className="flex items-center gap-4">
                                    <img src={sig.signature_url} alt={sig.name} className="h-10 bg-muted p-1 rounded" />
                                    <span>{sig.name} {sig.is_primary && <Star className="inline w-4 h-4 ml-2 text-yellow-500 fill-current" />}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => makePrimary('admin_signatures', sig._id, 'Signature')} disabled={sig.is_primary}><Star className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(sig, 'signature')}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteAlert({ isOpen: true, item: sig, type: 'signature' })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                        ))}
                        {signatures.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No signatures added.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div><CardTitle>Bank Accounts</CardTitle><CardDescription>Manage bank accounts.</CardDescription></div>
                    <Button onClick={() => handleOpenDialog('bank')}><Plus className="mr-2 h-4 w-4" />Add Account</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {bankAccounts.map(acc => (
                            <div key={acc._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{acc.bank_name} - {acc.account_holder_name} {acc.is_primary && <Star className="inline w-4 h-4 ml-2 text-yellow-500 fill-current" />}</p>
                                    <p className="text-sm text-muted-foreground">A/C: {acc.account_number}, IFSC: {acc.ifsc_code}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => makePrimary('admin_bank_accounts', acc._id, 'Bank Account')} disabled={acc.is_primary}><Star className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(acc, 'bank')}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteAlert({ isOpen: true, item: acc, type: 'bank' })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                        ))}
                        {bankAccounts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No bank accounts added.</p>}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div><CardTitle>Websites</CardTitle><CardDescription>Manage your company websites.</CardDescription></div>
                    <Button onClick={() => handleOpenDialog('website')}><Plus className="mr-2 h-4 w-4" />Add Website</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {websites.map(web => (
                            <div key={web._id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div>
                                    <p className="font-semibold">{web.name} {web.is_primary && <Star className="inline w-4 h-4 ml-2 text-yellow-500 fill-current" />}</p>
                                    <a href={web.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">{web.url}</a>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => makePrimary('company_websites', web._id, 'Website')} disabled={web.is_primary}><Star className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(web, 'website')}><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteAlert({ isOpen: true, item: web, type: 'website' })}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                        ))}
                        {websites.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No websites added.</p>}
                    </div>
                </CardContent>
            </Card>

            <SignatureDialog open={isSignatureDialogOpen} onOpenChange={setSignatureDialogOpen} onSave={handleDialogSave} signatureData={editingSignature} />
            <BankAccountDialog open={isBankAccountDialogOpen} onOpenChange={setBankAccountDialogOpen} onSave={handleDialogSave} accountData={editingBankAccount} />
            <WebsiteDialog open={isWebsiteDialogOpen} onOpenChange={setWebsiteDialogOpen} onSave={handleDialogSave} websiteData={editingWebsite} />

            <AlertDialog open={deleteAlert.isOpen} onOpenChange={(isOpen) => setDeleteAlert({ ...deleteAlert, isOpen })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the {deleteAlert.type}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteItem}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default BusinessSettings;
