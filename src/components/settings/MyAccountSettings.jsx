import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { useToast } from '../ui/use-toast';
import api from '@/lib/api';
import Spinner from '../Spinner';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { UploadCloud } from 'lucide-react';

const MyAccountSettings = () => {
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        site_name: '',
        logo_url: '',
        favicon_url: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [profileExists, setProfileExists] = useState(false);

    const fetchProfile = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await api.get('/company-profile');
            if (data) {
                setProfile(prev => ({ ...prev, ...data }));
                setProfileExists(true);
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching profile', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleInputChange = (e) => {
        setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (e, fileType) => {
        if (e.target.files.length > 0) {
            if (fileType === 'logo') setLogoFile(e.target.files[0]);
            if (fileType === 'favicon') setFaviconFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file) => {
        if (!file) return null;
        try {
            const formData = new FormData();
            formData.append('image', file);
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data.url;
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error('Failed to upload image');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const uploadedLogoUrl = await uploadFile(logoFile);
            const uploadedFaviconUrl = await uploadFile(faviconFile);

            const { _id, __v, user_id, createdAt, updatedAt, ...dataToUpdate } = profile;
            if (uploadedLogoUrl) dataToUpdate.logo_url = uploadedLogoUrl;
            if (uploadedFaviconUrl) dataToUpdate.favicon_url = uploadedFaviconUrl;

            if (profileExists) {
                await api.put('/company-profile', dataToUpdate);
            } else {
                await api.post('/company-profile', dataToUpdate);
            }

            // Update browser favicon dynamically
            if (uploadedFaviconUrl || profile.favicon_url) {
                const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
                link.rel = 'icon';
                link.href = uploadedFaviconUrl || profile.favicon_url;
                document.getElementsByTagName('head')[0].appendChild(link);
            }

            // Update site title if site_name is changed
            if (profile.site_name) {
                document.title = `${profile.site_name} - Invoice Management`;
            }

            toast({ title: 'Success!', description: 'Your account details have been saved.' });
            setProfileExists(true);
            setLogoFile(null);
            setFaviconFile(null);
            fetchProfile();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error saving details',
                description: error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const logoPreview = logoFile ? URL.createObjectURL(logoFile) : profile.logo_url;
    const faviconPreview = faviconFile ? URL.createObjectURL(faviconFile) : profile.favicon_url;

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="space-y-6 pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>My Account</CardTitle>
                    <CardDescription>Manage your personal and site information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Email Address</Label>
                        <p className="text-sm font-medium text-foreground p-3 bg-muted rounded-md mt-1">{user?.email}</p>
                    </div>
                    <div>
                        <Label htmlFor="name">Your Name / Business Name</Label>
                        <Input id="name" name="name" value={profile.name || ''} onChange={handleInputChange} />
                    </div>
                    <div>
                        <Label htmlFor="site_name">Site Name</Label>
                        <Input id="site_name" name="site_name" value={profile.site_name || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Site Logo</Label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                                    {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="h-full w-full object-contain p-1" /> : <UploadCloud className="h-8 w-8 text-muted-foreground" />}
                                </div>
                                <Input id="logoFile" type="file" onChange={(e) => handleFileChange(e, 'logo')} accept="image/png, image/jpeg, image/webp" className="flex-grow" />
                            </div>
                        </div>
                        <div>
                            <Label>Site Favicon</Label>
                            <div className="mt-1 flex items-center gap-4">
                                <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                                    {faviconPreview ? <img src={faviconPreview} alt="Favicon Preview" className="h-full w-full object-contain p-1" /> : <UploadCloud className="h-8 w-8 text-muted-foreground" />}
                                </div>
                                <Input id="faviconFile" type="file" onChange={(e) => handleFileChange(e, 'favicon')} accept="image/x-icon, image/png, image/svg+xml" className="flex-grow" />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardContent>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <><Spinner size="small" className="mr-2" /> Saving...</> : 'Save Account Details'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Authentication</CardTitle>
                    <CardDescription>Manage your session.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" onClick={signOut}>Sign Out</Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default MyAccountSettings;
