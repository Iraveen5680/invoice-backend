
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '@/components/Spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Eye, Download, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import InvoicePreviewDialog from './InvoicePreviewDialog';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const themes = [
    { id: 'modern', name: 'Sleek Modern', image: '/plugins/inv-image/Sleek Modern.jpg' },
    { id: 'classic', name: 'Classic Pro', image: '/plugins/inv-image/Classic Pro.jpg' },
    { id: 'creative', name: 'Creative Touch', image: '/plugins/inv-image/Creative Touch.jpg' },
    { id: 'minimalist', name: 'Clean Minimalist', image: '/plugins/inv-image/Clean Minimalist.jpg' },
    { id: 'corporate', name: 'Corporate', image: '/plugins/inv-image/Corporate.jpg' },
    { id: 'md-consultancy', name: 'MD', image: '/plugins/inv-image/md-inv.jpg' },
];

const fonts = [
    'Inter', 'Roboto', 'Lato', 'Montserrat', 'Open Sans',
    'Poppins', 'Source Sans Pro', 'Playfair Display', 'Merriweather', 'Oswald'
];

const currencies = [
    { symbol: '₹', name: 'Indian Rupee (INR)' },
    { symbol: '$', name: 'US Dollar (USD)' },
    { symbol: '€', name: 'Euro (EUR)' },
    { symbol: '£', name: 'British Pound (GBP)' },
    { symbol: '¥', name: 'Japanese Yen (JPY)' },
    { symbol: 'A$', name: 'Australian Dollar (AUD)' },
    { symbol: 'C$', name: 'Canadian Dollar (CAD)' },
];


const InvoiceCustomization = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isPreviewOpen, setPreviewOpen] = useState(false);
    const [previewTheme, setPreviewTheme] = useState(null);
    const [downloadingTheme, setDownloadingTheme] = useState(null);
    const [qrFile, setQrFile] = useState(null);
    const pdfRef = React.useRef();

    const [settings, setSettings] = useState({
        theme: 'modern',
        theme_primary_color: '#3b82f6',
        font_family: 'Inter',
        currency_symbol: '₹',
        upi_id: '',
        payment_qr_code_url: '',
        invoice_prefix: 'INV-',
        invoice_terms: 'Thank you for your business!',
        show_logo_in_invoice: true,
        show_signature_in_invoice: true,
        show_gst_in_invoice: true,
        show_pan_in_invoice: true,
        show_address_in_invoice: true,
        show_terms_in_invoice: true,
        show_phone_in_invoice: true,
        show_time_in_invoice: false,
        show_admin_bank_in_invoice: true,
        show_customer_bank_in_invoice: false,
        show_admin_upi_in_invoice: true,
        show_customer_upi_in_invoice: false,
        show_qr_in_invoice: false,
    });

    const [profileExists, setProfileExists] = useState(false);

    const fetchSettings = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data } = await api.get('/company-profile');
            if (data) {
                setProfileExists(true);
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    theme: data.theme || 'modern',
                    theme_primary_color: data.theme_primary_color || '#3b82f6',
                    font_family: data.font_family || 'Inter',
                    currency_symbol: data.currency_symbol || '₹',
                    invoice_prefix: data.invoice_prefix || 'INV-',
                    invoice_terms: data.invoice_terms || 'Thank you for your business!',
                }));
            }
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleThemeSelect = (themeId) => {
        setSettings(prev => ({ ...prev, theme: themeId }));
    };

    const handleValueChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleFileChange = (e, fileSetter) => {
        if (e.target.files.length > 0) fileSetter(e.target.files[0]);
    };

    const handleSave = async () => {
        setSaving(true);
        let updatedSettings = { ...settings };

        if (qrFile) {
            setUploading(true);
            try {
                const formData = new FormData();
                formData.append('image', qrFile);
                const { data: uploadData } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                updatedSettings.payment_qr_code_url = uploadData.url;
                setQrFile(null);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload QR code.' });
                setSaving(false);
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        const { _id, __v, user_id, createdAt, updatedAt, bank_accounts, signatures, ...dataToUpdate } = updatedSettings;

        try {
            if (profileExists) {
                await api.put('/company-profile', dataToUpdate);
            } else {
                await api.post('/company-profile', dataToUpdate);
            }
            toast({ title: 'Success!', description: 'Invoice customization saved.' });
            setProfileExists(true);
            fetchSettings();
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error saving customization',
                description: error.response?.data?.message || error.message
            });
        } finally {
            setSaving(false);
        }
    };

    const handlePreview = (themeId) => {
        setPreviewTheme(themeId);
        setPreviewOpen(true);
    };

    const generatePdf = (invoiceData) => {
        const input = pdfRef.current;
        if (!input) {
            setDownloadingTheme(null);
            return;
        }

        html2canvas(input, { scale: 3, useCORS: true, allowTaint: true }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`invoice-sample-${downloadingTheme}.pdf`);

            setDownloadingTheme(null);
            toast({ title: 'Success!', description: 'Sample invoice downloaded.' });
        }).catch(err => {
            toast({ variant: 'destructive', title: 'Error downloading PDF', description: err.message });
            setDownloadingTheme(null);
        });
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    const selectedCurrency = currencies.find(c => c.symbol === settings.currency_symbol);
    const qrPreview = qrFile ? URL.createObjectURL(qrFile) : settings.payment_qr_code_url;

    return (
        <div className="space-y-8 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Invoice Themes</CardTitle>
                            <CardDescription>Choose a look and feel for your invoices. The selected theme will be used for all new invoices.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                {themes.map(theme => (
                                    <div key={theme.id} className="relative group">
                                        <div
                                            className={cn("aspect-[3/4] rounded-lg border-2 transition-all flex items-center justify-center overflow-hidden cursor-pointer", settings.theme === theme.id ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-border hover:border-blue-400')}
                                            onClick={() => handleThemeSelect(theme.id)}
                                        >
                                            <img className="w-full h-full object-cover" alt={`Preview of ${theme.name} theme`} src={theme.image} />
                                        </div>
                                        <div className="mt-2 space-y-1">
                                            <p className="text-sm font-semibold text-center truncate">{theme.name}</p>
                                            <div className="flex gap-1 justify-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs flex-1"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePreview(theme.id);
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Preview
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 px-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDownloadingTheme(theme.id);
                                                    }}
                                                    disabled={!!downloadingTheme}
                                                >
                                                    {downloadingTheme === theme.id ? <Spinner size="small" /> : <Download className="h-3 w-3" />}
                                                </Button>
                                            </div>
                                        </div>
                                        {settings.theme === theme.id && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-blue-500 bg-white rounded-full" />}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Branding & Defaults</CardTitle>
                                <CardDescription>Customize colors, fonts, and other defaults.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Primary Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings.theme_primary_color} onChange={(e) => handleValueChange('theme_primary_color', e.target.value)} className="h-10 w-10 p-1 border rounded-md" />
                                        <div className="px-3 py-2 rounded-md border bg-muted text-sm">{settings.theme_primary_color}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <Select value={settings.font_family} onValueChange={(val) => handleValueChange('font_family', val)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>{fonts.map(font => <SelectItem key={font} value={font} style={{ fontFamily: font }}>{font}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Currency</Label>
                                    <Select value={settings.currency_symbol} onValueChange={(val) => handleValueChange('currency_symbol', val)}>
                                        <SelectTrigger><SelectValue>{selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.symbol})` : "Select Currency"}</SelectValue></SelectTrigger>
                                        <SelectContent>{currencies.map(c => <SelectItem key={c.symbol} value={c.symbol}>{c.name} ({c.symbol})</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_prefix">Invoice Prefix</Label>
                                    <Input id="invoice_prefix" value={settings.invoice_prefix || ''} onChange={e => handleValueChange('invoice_prefix', e.target.value)} placeholder="INV-" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Details</CardTitle>
                                <CardDescription>Display payment details on your invoice.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="upi_id">Your UPI ID</Label>
                                    <Input id="upi_id" value={settings.upi_id || ''} onChange={e => handleValueChange('upi_id', e.target.value)} placeholder="yourname@upi" />
                                </div>
                                <div>
                                    <Label>Payment QR Code</Label>
                                    <div className="mt-1 flex items-center gap-4">
                                        <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center border">
                                            {uploading ? <Spinner /> : qrPreview ?
                                                <img src={qrPreview} alt="QR Code Preview" className="h-full w-full object-contain p-1" /> :
                                                <UploadCloud className="h-8 w-8 text-slate-400" />}
                                        </div>
                                        <Input id="qrFile" type="file" onChange={(e) => handleFileChange(e, setQrFile)} accept="image/png, image/jpeg, image/webp" className="flex-grow" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="invoice_terms">Default Terms & Conditions</Label>
                                    <Textarea id="invoice_terms" value={settings.invoice_terms || ''} onChange={e => handleValueChange('invoice_terms', e.target.value)} rows="4" placeholder="1. All payments are due within 30 days." />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Invoice Display Options</CardTitle>
                        <CardDescription>Toggle visibility of items on your invoice PDF.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { key: 'show_logo_in_invoice', label: 'Show Company Logo' },
                            { key: 'show_signature_in_invoice', label: 'Show Signature' },
                            { key: 'show_gst_in_invoice', label: 'Show GST Number' },
                            { key: 'show_pan_in_invoice', label: 'Show PAN Number' },
                            { key: 'show_address_in_invoice', label: 'Show Business Address' },
                            { key: 'show_phone_in_invoice', label: 'Show Phone Number' },
                            { key: 'show_time_in_invoice', label: 'Show Time on Invoice' },
                            { key: 'show_terms_in_invoice', label: 'Show Terms & Conditions' },
                            { key: 'show_admin_bank_in_invoice', label: 'Show Your Bank Details' },
                            { key: 'show_customer_bank_in_invoice', label: 'Show Customer Bank Details' },
                            { key: 'show_admin_upi_in_invoice', label: 'Show Your UPI ID' },
                            { key: 'show_customer_upi_in_invoice', label: 'Show Customer UPI ID' },
                            { key: 'show_qr_in_invoice', label: 'Show QR Code' },
                        ].map(({ key, label }) => (
                            <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <Label htmlFor={key} className="cursor-pointer">{label}</Label>
                                <Switch id={key} checked={!!settings[key]} onCheckedChange={(val) => handleValueChange(key, val)} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end items-center p-4 bg-muted rounded-lg shadow-inner">
                <Button onClick={handleSave} disabled={saving}>
                    {saving || uploading ? <><Spinner size="small" className="mr-2" />Saving...</> : 'Save Customization'}
                </Button>
            </div>
            <InvoicePreviewDialog
                open={isPreviewOpen}
                onOpenChange={setPreviewOpen}
                settings={settings}
                themeId={previewTheme}
            />
            {downloadingTheme && (
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', zIndex: -1 }}>
                    <InvoicePreviewDialog
                        open={true}
                        onOpenChange={() => { }}
                        settings={settings}
                        themeId={downloadingTheme}
                        isForPdfGeneration={true}
                        pdfRef={pdfRef}
                        onDataLoaded={generatePdf}
                    />
                </div>
            )}
        </div>
    );
};

export default InvoiceCustomization;
