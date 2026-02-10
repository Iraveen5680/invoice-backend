
import React, { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { numberToWords } from '@/lib/numberToWords';

const getStatusBadge = (status, dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = dueDate ? new Date(dueDate) : null;
    if (due) {
        due.setHours(0, 0, 0, 0);
    }

    let finalStatus = status;
    if (status?.toLowerCase() !== 'paid' && status?.toLowerCase() !== 'cancelled' && due && due < today) {
        finalStatus = 'Overdue';
    }

    const badgeStyles = {
        Paid: { backgroundColor: '#22c55e', color: 'white' },
        Pending: { backgroundColor: '#f97316', color: 'white' },
        Overdue: { backgroundColor: '#ef4444', color: 'white' },
        Draft: { backgroundColor: '#64748b', color: 'white' },
        Cancelled: { backgroundColor: '#64748b', color: 'white' },
    };

    const style = badgeStyles[finalStatus] || badgeStyles.Pending;

    return (
        <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '5px 15px',
            borderRadius: '9999px',
            fontSize: '10pt',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            ...style
        }}>
            {finalStatus}
        </div>
    );
};

// --- Payments Table Component ---
const PaymentsTable = ({ payments, currency_symbol }) => {
    if (!payments || payments.length === 0) return null;

    return (
        <div className="mt-4">
            <h4 className="font-semibold mb-2">Payment History</h4>
            <table className="w-full text-xs">
                <thead>
                    <tr className="border-b">
                        <th className="p-1 text-left font-semibold">Date</th>
                        <th className="p-1 text-left font-semibold">Mode</th>
                        <th className="p-1 text-right font-semibold">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {payments.map(payment => (
                        <tr key={payment.id} className="border-b">
                            <td className="p-1">{new Date(payment.payment_date).toLocaleDateString()}</td>
                            <td className="p-1">{payment.payment_mode}</td>
                            <td className="p-1 text-right">{currency_symbol}{Number(payment.amount).toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// --- Template Components ---

const TemplateModern = ({ settings, company, billTo, invoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_pan_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;

    const calculateTotals = (items, isTaxInclusive) => {
        return items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const gstRate = Number(item.gst_rate) || 0;

            let basePrice = unitPrice;
            if (isTaxInclusive && gstRate > 0) {
                basePrice = unitPrice / (1 + gstRate / 100);
            }

            const itemSubtotal = basePrice * quantity;
            const itemTax = itemSubtotal * (gstRate / 100);
            const itemTotal = item.total;

            return { ...item, basePrice, itemTax, itemTotal };
        });
    };



    const itemsWithCalculations = calculateTotals(invoice.items, invoice.is_tax_inclusive);
    const subtotal = itemsWithCalculations.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const totalTax = invoice.tax || itemsWithCalculations.reduce((sum, item) => sum + item.itemTax, 0);
    const total = invoice.total_amount;
    const amountReceived = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    const cgst = totalTax / 2;
    const sgst = totalTax / 2;

    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <header className="flex justify-between items-start pb-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: theme_primary_color }}>{company?.name || 'Your Company'}</h1>
                    {show_address_in_invoice && <p className="text-xs max-w-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                    {show_phone_in_invoice && <p className="text-xs">Phone no.: {company?.phone || 'N/A'}</p>}
                    <p className="text-xs">Email: {company?.email || 'N/A'}</p>
                </div>
                {show_logo_in_invoice && company?.logo_url && <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-20 w-20 object-contain" />}
            </header>

            <div className="text-center my-8">
                <h2 className="text-2xl font-bold uppercase" style={{ color: theme_primary_color }}>Tax Invoice</h2>
            </div>

            <section className="flex justify-between my-6 text-xs">
                <div>
                    <h3 className="font-semibold text-sm mb-1">Bill To</h3>
                    <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                    <p>{billTo?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    <p>Mobile: {billTo?.phone || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Invoice No :</span> {invoice.invoice_number}</p>
                    <p><span className="font-semibold">Date :</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                    {show_gst_in_invoice && <p><span className="font-semibold">GSTIN :</span> {company?.gst_number || 'N/A'}</p>}
                    {show_pan_in_invoice && <p><span className="font-semibold">PAN :</span> {company?.pan_number || 'N/A'}</p>}
                </div>
            </section>

            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr style={{ backgroundColor: theme_primary_color, color: 'white' }}>
                        <th className="p-2 text-left font-bold uppercase">#</th>
                        <th className="p-2 text-left font-bold uppercase w-2/5">Item name</th>
                        <th className="p-2 text-left font-bold uppercase">HSN/SAC</th>
                        <th className="p-2 text-center font-bold uppercase">Quantity</th>
                        <th className="p-2 text-right font-bold uppercase">Price/Unit</th>
                        <th className="p-2 text-right font-bold uppercase">GST</th>
                        <th className="p-2 text-right font-bold uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsWithCalculations.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.product?.sku || 'N/A'}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.basePrice.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.itemTax.toFixed(2)} ({item.gst_rate || 0}%)</td>
                            <td className="p-2 text-right">{currency_symbol}{item.itemTotal.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold">
                        <td colSpan="6" className="p-2 text-right">Total</td>
                        <td className="p-2 text-right">{currency_symbol}{total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-8 text-xs">
                <div>
                    <p className="font-semibold">Invoice Amount In Words</p>
                    <p className="capitalize">{numberToWords(total)} Only</p>
                    {show_terms_in_invoice && (
                        <div className="mt-4">
                            <p className="font-semibold">Terms and Conditions</p>
                            <p className="whitespace-pre-line">{company?.invoice_terms || "Terms and Conditions Apply"}</p>
                        </div>
                    )}
                    <PaymentsTable payments={invoice.payments} currency_symbol={currency_symbol} />
                </div>
                <div className="w-2/5">
                    <div className="flex justify-between p-1"><span>Sub Total</span><span>{currency_symbol}{subtotal.toFixed(2)}</span></div>
                    {cgst > 0 && <div className="flex justify-between p-1"><span>CGST</span><span>{currency_symbol}{cgst.toFixed(2)}</span></div>}
                    {sgst > 0 && <div className="flex justify-between p-1"><span>SGST</span><span>{currency_symbol}{sgst.toFixed(2)}</span></div>}
                    <div className="flex justify-between p-2 font-bold text-base mt-2" style={{ background: theme_primary_color, color: 'white' }}>
                        <span>Total</span>
                        <span>{currency_symbol}{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-1 mt-1"><span>Received</span><span>{currency_symbol}{(amountReceived).toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Remaining Balance</span><span>{currency_symbol}{(total - amountReceived).toFixed(2)}</span></div>
                    {show_signature_in_invoice && signature && (
                        <div className="text-right mt-8">
                            <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain ml-auto" />
                            <p className="border-t mt-1 pt-1 inline-block">For: {company?.name || 'Your Company'}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>Holder Name: {bank.account_holder_name}</p>
                                <p>Account Number: {bank.account_number}</p>
                                <p>IFSC Code: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        {(show_qr_in_invoice && company?.payment_qr_code_url) && (
                            <div className="text-right">
                                <h4 className="font-bold mb-1">Scan to Pay</h4>
                                <img src={company.payment_qr_code_url} crossOrigin="anonymous" alt="Payment QR Code" className="w-20 h-20 object-contain ml-auto" />
                                {(show_admin_upi_in_invoice && company?.upi_id) && <p className="mt-1">{company.upi_id}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateClassic = ({ settings, company, billTo, invoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;
    const total = invoice.total_amount;
    const amountReceived = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative border-2 border-black" style={{ fontFamily: settings.font_family }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <header className="text-center mb-6">
                {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-auto mx-auto mb-2" /> : <h1 className="text-2xl font-bold mb-1">{company?.name || 'Your Company'}</h1>}
                {show_address_in_invoice && <p className="text-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                {show_phone_in_invoice && <p className="text-xs">Mobile: {company?.phone || 'N/A'}</p>}
            </header>

            <section className="grid grid-cols-2 gap-4 my-6 text-xs border-y-2 border-black py-2">
                <div>
                    <h3 className="font-semibold mb-1">BILL TO</h3>
                    <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                    <p>{billTo?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    <p>Mobile: {billTo?.phone || 'N/A'}</p>
                    {show_gst_in_invoice && <p>GSTIN: {billTo?.gst_no || 'N/A'}</p>}
                </div>
                <div className="text-left">
                    <p><span className="font-semibold">Invoice No:</span> {invoice.invoice_number}</p>
                    <p><span className="font-semibold">Invoice Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                    {invoice.due_date && <p><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>}
                </div>
            </section>

            <table className="w-full border-collapse text-xs mb-8">
                <thead>
                    <tr className="border-y-2 border-black">
                        <th className="p-2 text-left font-bold uppercase">S.NO.</th>
                        <th className="p-2 text-left font-bold uppercase w-3/5">Items</th>
                        <th className="p-2 text-center font-bold uppercase">Qty</th>
                        <th className="p-2 text-right font-bold uppercase">Rate</th>
                        <th className="p-2 text-right font-bold uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody className="border-b-2 border-black">
                    {invoice.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border-r border-black">{index + 1}</td>
                            <td className="p-2 border-r border-black">{item.description}</td>
                            <td className="p-2 text-center border-r border-black">{item.quantity}</td>
                            <td className="p-2 text-right border-r border-black">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 10 - invoice.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}><td className="p-2 border-r border-black">&nbsp;</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold">
                        <td colSpan="4" className="p-2 text-right border-r border-black">TOTAL</td>
                        <td className="p-2 text-right">{currency_symbol}{total.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold border-y-2 border-black">
                        <td colSpan="4" className="p-2 text-right border-r border-black">RECEIVED AMOUNT</td>
                        <td className="p-2 text-right">{currency_symbol}{(amountReceived).toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold">
                        <td colSpan="4" className="p-2 text-right border-r border-black">BALANCE AMOUNT</td>
                        <td className="p-2 text-right">{currency_symbol}{(total - amountReceived).toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <PaymentsTable payments={invoice.payments} currency_symbol={currency_symbol} />

            <div className="flex justify-end mt-4">
                {show_signature_in_invoice && signature && (
                    <div className="text-center">
                        <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain mx-auto" />
                        <p className="border-t border-black mt-1 pt-1 inline-block">Authorized Signatory</p>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t border-black pt-4">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>Holder Name: {bank.account_holder_name}</p>
                                <p>Account Number: {bank.account_number}</p>
                                <p>IFSC Code: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        {(show_qr_in_invoice && company?.payment_qr_code_url) && (
                            <div className="text-right">
                                <h4 className="font-bold mb-1">Scan to Pay</h4>
                                <img src={company.payment_qr_code_url} crossOrigin="anonymous" alt="Payment QR Code" className="w-20 h-20 object-contain ml-auto" />
                                {(show_admin_upi_in_invoice && company?.upi_id) && <p className="mt-1">{company.upi_id}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateCreative = ({ settings, company, billTo, invoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;

    const calculateTotals = (items, isTaxInclusive) => {
        return items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const gstRate = Number(item.gst_rate) || 0;

            let basePrice = unitPrice;
            if (isTaxInclusive && gstRate > 0) {
                basePrice = unitPrice / (1 + gstRate / 100);
            }

            const itemSubtotal = basePrice * quantity;
            const itemTax = itemSubtotal * (gstRate / 100);
            const itemTotal = item.total;

            return { ...item, basePrice, itemTax, itemTotal };
        });
    };

    const itemsWithCalculations = calculateTotals(invoice.items, invoice.is_tax_inclusive);
    const subtotal = itemsWithCalculations.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const totalTax = invoice.tax || itemsWithCalculations.reduce((sum, item) => sum + item.itemTax, 0);
    const total = invoice.total_amount;
    const amountReceived = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <header className="flex justify-between items-center mb-4">
                <div>
                    {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-auto mb-2" /> : <h1 className="text-2xl font-bold mb-1">{company?.name || 'Your Company'}</h1>}
                    {show_address_in_invoice && <p className="text-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                    {show_phone_in_invoice && <p className="text-xs">Mobile: {company?.phone || 'N/A'}</p>}
                </div>
                <h2 className="text-4xl font-bold uppercase text-gray-300">Invoice</h2>
            </header>

            <div className="grid grid-cols-3 gap-4 my-6 text-xs p-2 rounded-md" style={{ backgroundColor: `${theme_primary_color}20` }}>
                <div><span className="font-semibold">Invoice No:</span> {invoice.invoice_number}</div>
                <div><span className="font-semibold">Invoice Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</div>
                {invoice.due_date && <div><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</div>}
            </div>

            <section className="grid grid-cols-2 gap-4 my-6 text-xs">
                <div>
                    <h3 className="font-semibold mb-1" style={{ color: theme_primary_color }}>BILL TO</h3>
                    <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                    <p>{billTo?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    <p>Mobile: {billTo?.phone || 'N/A'}</p>
                    {show_gst_in_invoice && <p>GSTIN: {billTo?.gst_no || 'N/A'}</p>}
                </div>
                <div>
                    <h3 className="font-semibold mb-1" style={{ color: theme_primary_color }}>SHIP TO</h3>
                    <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                    <p>{billTo?.shipping_address || '456 Client Ave, Town, State 54321'}</p>
                </div>
            </section>

            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr style={{ backgroundColor: theme_primary_color, color: 'white' }}>
                        <th className="p-2 text-left font-bold uppercase">Items</th>
                        <th className="p-2 text-left font-bold uppercase">HSN</th>
                        <th className="p-2 text-center font-bold uppercase">Qty.</th>
                        <th className="p-2 text-right font-bold uppercase">Rate</th>
                        <th className="p-2 text-right font-bold uppercase">Tax</th>
                        <th className="p-2 text-right font-bold uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsWithCalculations.map((item, index) => (
                        <tr key={item.id} className="border-b">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.product?.sku || 'N/A'}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.basePrice.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.itemTax.toFixed(2)} ({item.gst_rate || 0}%)</td>
                            <td className="p-2 text-right">{currency_symbol}{item.itemTotal.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-8 text-xs">
                <div className="w-1/2">
                    {show_terms_in_invoice && (
                        <div>
                            <p className="font-semibold">Terms and Conditions</p>
                            <p className="whitespace-pre-line text-[8pt]">{company?.invoice_terms || "1. Goods once sold will not be taken back.\n2. All disputes are subject to [ENTER_YOUR_CITY_NAME] jurisdiction only."}</p>
                        </div>
                    )}
                    <PaymentsTable payments={invoice.payments} currency_symbol={currency_symbol} />
                </div>
                <div className="w-2/5">
                    <div className="flex justify-between p-1"><span>Subtotal</span><span>{currency_symbol}{subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Taxable Amount</span><span>{currency_symbol}{subtotal.toFixed(2)}</span></div>
                    {totalTax > 0 && <div className="flex justify-between p-1"><span>Total Tax</span><span>{currency_symbol}{totalTax.toFixed(2)}</span></div>}
                    <div className="flex justify-between p-1 border-t font-bold"><span>TOTAL AMOUNT</span><span>{currency_symbol}{total.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Received Amount</span><span>{currency_symbol}{(amountReceived).toFixed(2)}</span></div>
                    <div className="flex justify-between p-1 border-t font-bold"><span>BALANCE AMOUNT</span><span>{currency_symbol}{(total - amountReceived).toFixed(2)}</span></div>
                    <p className="capitalize text-right mt-2">{numberToWords(total)}</p>
                </div>
            </div>

            <div className="absolute bottom-48 right-8 text-xs">
                {show_signature_in_invoice && signature && (
                    <div className="text-right">
                        <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain ml-auto" />
                        <p className="border-t mt-1 pt-1 inline-block">Authorized Signatory</p>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-8">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>Holder Name: {bank.account_holder_name}</p>
                                <p>Account Number: {bank.account_number}</p>
                                <p>IFSC Code: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        {(show_qr_in_invoice && company?.payment_qr_code_url) && (
                            <div className="text-right">
                                <h4 className="font-bold mb-1">Scan to Pay</h4>
                                <img src={company.payment_qr_code_url} crossOrigin="anonymous" alt="Payment QR Code" className="w-20 h-20 object-contain ml-auto" />
                                {(show_admin_upi_in_invoice && company?.upi_id) && <p className="mt-1">{company.upi_id}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateMinimalist = ({ settings, company, billTo, invoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;

    const calculateTotals = (items, isTaxInclusive) => {
        return items.map(item => {
            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unit_price) || 0;
            const gstRate = Number(item.gst_rate) || 0;

            let basePrice = unitPrice;
            if (isTaxInclusive && gstRate > 0) {
                basePrice = unitPrice / (1 + gstRate / 100);
            }

            const itemSubtotal = basePrice * quantity;
            const itemTotal = item.total;

            return { ...item, basePrice, itemTotal };
        });
    };

    const itemsWithCalculations = calculateTotals(invoice.items, invoice.is_tax_inclusive);
    const subtotal = itemsWithCalculations.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const totalTax = invoice.tax || 0;
    const total = invoice.total_amount;

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    return (
        <div className="p-10 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <header className="grid grid-cols-2 gap-4 mb-10">
                <div>
                    {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-12 w-auto mb-4" /> : <h1 className="text-xl font-bold mb-2">{company?.name || 'Your Company'}</h1>}
                    {show_address_in_invoice && <p className="text-xs max-w-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-800">Invoice</h2>
                    <p className="text-xs mt-1">{invoice.invoice_number}</p>
                </div>
            </header>

            <section className="grid grid-cols-3 gap-4 my-8 text-xs">
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
                    <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                    <p>{billTo?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    {show_phone_in_invoice && <p>{billTo?.phone || 'N/A'}</p>}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Sent From</h3>
                    <p className="font-bold">{company?.name || 'Your Company'}</p>
                    <p>{company?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</h3>
                    <p>{new Date(invoice.issue_date).toLocaleDateString()}</p>
                    {invoice.due_date && <>
                        <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Due Date</h3>
                        <p>{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </>}
                </div>
            </section>

            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="border-b-2 border-gray-800">
                        <th className="p-2 text-left font-bold uppercase w-3/5">Description</th>
                        <th className="p-2 text-center font-bold uppercase">Qty</th>
                        <th className="p-2 text-right font-bold uppercase">Rate</th>
                        <th className="p-2 text-right font-bold uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {itemsWithCalculations.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-200">
                            <td className="p-2 py-3">{item.description}</td>
                            <td className="p-2 py-3 text-center">{item.quantity}</td>
                            <td className="p-2 py-3 text-right">{currency_symbol}{item.basePrice.toFixed(2)}</td>
                            <td className="p-2 py-3 text-right">{currency_symbol}{item.itemTotal.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-8">
                <div className="w-1/2">
                    {show_terms_in_invoice && (
                        <div>
                            <h3 className="font-semibold text-gray-600 mb-1">Notes</h3>
                            <p className="whitespace-pre-line text-xs">{company?.invoice_terms || "Thank you for your business!"}</p>
                        </div>
                    )}
                    <PaymentsTable payments={invoice.payments} currency_symbol={currency_symbol} />
                </div>
                <div className="w-2/5 text-sm">
                    <div className="flex justify-between p-1"><span>Subtotal</span><span>{currency_symbol}{subtotal.toFixed(2)}</span></div>
                    {totalTax > 0 && <div className="flex justify-between p-1"><span>Tax</span><span>{currency_symbol}{totalTax.toFixed(2)}</span></div>}
                    <div className="flex justify-between p-2 mt-2 bg-gray-100 rounded-md font-bold text-base">
                        <span>Amount due</span>
                        <span>{currency_symbol}{total.toFixed(2)}</span>
                    </div>
                    {show_signature_in_invoice && signature && (
                        <div className="text-right mt-8">
                            <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain ml-auto" />
                            <p className="mt-1 pt-1 font-semibold text-gray-800">{company?.name || 'Your Company'}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="absolute bottom-10 left-10 right-10 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1 text-gray-600">Bank Details</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>Holder Name: {bank.account_holder_name}</p>
                                <p>Account Number: {bank.account_number}</p>
                                <p>IFSC Code: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end">
                        {(show_qr_in_invoice && company?.payment_qr_code_url) && (
                            <div className="text-right">
                                <h4 className="font-bold mb-1 text-gray-600">Scan to Pay</h4>
                                <img src={company.payment_qr_code_url} crossOrigin="anonymous" alt="Payment QR Code" className="w-20 h-20 object-contain ml-auto" />
                                {(show_admin_upi_in_invoice && company?.upi_id) && <p className="mt-1">{company.upi_id}</p>}
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateCorporate = ({ settings, company, billTo, invoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice } = settings;
    const subtotal = invoice.items.reduce((sum, item) => sum + item.total, 0);
    const totalTax = invoice.tax || 0;
    const total = invoice.total_amount;

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <div className="w-full h-2 mb-8" style={{ backgroundColor: theme_primary_color }}></div>
            <header className="grid grid-cols-2 gap-4 mb-10">
                <div>
                    {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-auto mb-4" /> : <h1 className="text-xl font-bold mb-2">{company?.name || 'Your Company'}</h1>}
                    {show_address_in_invoice && <p className="text-xs max-w-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                    {show_phone_in_invoice && <p className="text-xs">{company?.phone || 'N/A'}</p>}
                    <p className="text-xs">{company?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-light uppercase text-gray-800">INVOICE</h2>
                    <div className="mt-4">
                        <p><span className="text-gray-500">Invoice #:</span> {invoice.invoice_number}</p>
                        <p><span className="text-gray-500">Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
                        {invoice.due_date && <p><span className="text-gray-500">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>}
                    </div>
                </div>
            </header>

            <section className="my-8 text-xs">
                <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                <p>{billTo?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                {show_gst_in_invoice && <p>GSTIN: {billTo?.gst_no || 'N/A'}</p>}
            </section>

            <table className="w-full border-collapse text-xs">
                <thead style={{ backgroundColor: '#f3f4f6' }}>
                    <tr className="border-b-2 border-gray-300">
                        <th className="p-3 text-left font-semibold uppercase">#</th>
                        <th className="p-3 text-left font-semibold uppercase w-3/5">Item & Description</th>
                        <th className="p-3 text-center font-semibold uppercase">Qty</th>
                        <th className="p-3 text-right font-semibold uppercase">Rate</th>
                        <th className="p-3 text-right font-semibold uppercase">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-gray-200">
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3">{item.description}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-3 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-end mt-6">
                <div className="w-2/5 text-sm">
                    <div className="flex justify-between p-2"><span>Subtotal</span><span>{currency_symbol}{subtotal.toFixed(2)}</span></div>
                    {totalTax > 0 && <div className="flex justify-between p-2"><span>Tax</span><span>{currency_symbol}{totalTax.toFixed(2)}</span></div>}
                    <div className="flex justify-between p-3 mt-2 rounded-md font-bold text-base" style={{ backgroundColor: '#f3f4f6' }}>
                        <span>Total</span>
                        <span>{currency_symbol}{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                {show_terms_in_invoice && (
                    <div className="mb-4">
                        <h3 className="font-semibold text-gray-600 mb-1">Terms & Conditions</h3>
                        <p className="whitespace-pre-line text-[8pt] text-gray-500">{company?.invoice_terms || "Thank you for your business! Payment is due within 30 days."}</p>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1">Payment Information</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>A/C: {bank.account_number}</p>
                                <p>IFSC: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        {show_signature_in_invoice && signature && (
                            <div className="inline-block text-center">
                                <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain mx-auto mb-1" />
                                <p className="border-t pt-1 font-semibold">Authorized Signatory</p>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateMDConsultancy = ({ settings, company, billTo, invoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_signature_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice } = settings;
    const taxSummary = invoice.items.reduce((acc, item) => {
        const gstRate = Number(item.gst_rate) || 0;
        const hsn = item.product?.sku || 'N/A';
        const taxableValue = item.total / (1 + gstRate / 100);
        const taxAmount = item.total - taxableValue;

        if (!acc[hsn]) {
            acc[hsn] = { taxable: 0, cgst: 0, sgst: 0, rate: gstRate };
        }
        acc[hsn].taxable += taxableValue;
        acc[hsn].cgst += taxAmount / 2;
        acc[hsn].sgst += taxAmount / 2;
        return acc;
    }, {});
    const totalTaxable = Object.values(taxSummary).reduce((sum, item) => sum + item.taxable, 0);
    const totalCGST = Object.values(taxSummary).reduce((sum, item) => sum + item.cgst, 0);
    const totalSGST = Object.values(taxSummary).reduce((sum, item) => sum + item.sgst, 0);
    const total = invoice.total_amount;

    // Bank and Signature Logic
    const bank = invoice.admin_bank_account_id || company?.bank_accounts?.[0];
    const signature = invoice.admin_signature_id || company?.signatures?.[0];

    return (
        <div className="p-8 bg-white text-gray-900 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: "'Arial', sans-serif" }}>
            {getStatusBadge(invoice.status, invoice.due_date)}
            <header className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-center gap-4">
                    {show_logo_in_invoice && company?.logo_url && <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-16 object-contain" />}
                    <div>
                        <h1 className="font-bold text-lg text-blue-800">{company?.name || 'Your Company'}</h1>
                        {show_address_in_invoice && <p className="text-xs max-w-xs mt-1">{company?.address || 'Your Address'}</p>}
                    </div>
                </div>
                <div className="text-right text-xs">
                    {show_phone_in_invoice && <p><span className="font-bold">Mobile:</span> {company?.phone || 'N/A'}</p>}
                    <p><span className="font-bold">Email:</span> {company?.email || 'N/A'}</p>
                </div>
            </header>

            <section className="grid grid-cols-3 gap-4 my-4 text-xs">
                <div><span className="font-bold">Invoice No.</span><p>{invoice.invoice_number}</p></div>
                <div><span className="font-bold">Invoice Date</span><p>{new Date(invoice.issue_date).toLocaleDateString('en-GB')}</p></div>
                {invoice.due_date && <div><span className="font-bold">Due Date</span><p>{new Date(invoice.due_date).toLocaleDateString('en-GB')}</p></div>}
            </section>

            <section className="border-t pt-4 text-xs">
                <h3 className="font-bold mb-1">BILL TO</h3>
                <p className="font-bold">{billTo?.name || 'Valued Customer'}</p>
                <p className="max-w-md">{billTo?.billing_address || 'Client Address'}</p>
                <p>{billTo?.phone || 'N/A'}</p>
            </section>

            <table className="w-full border-collapse text-xs mt-4">
                <thead className="bg-slate-200">
                    <tr className="border-y border-black">
                        <th className="p-1 text-left font-bold border-x border-black">No.</th>
                        <th className="p-1 text-left font-bold border-x border-black w-2/5">SERVICES</th>
                        <th className="p-1 text-left font-bold border-x border-black">HSN</th>
                        <th className="p-1 text-right font-bold border-x border-black">PRICE/ITEM ({currency_symbol})</th>
                        <th className="p-1 text-right font-bold border-x border-black">Discount</th>
                        <th className="p-1 text-right font-bold border-x border-black">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.items.map((item, index) => (
                        <tr key={item.id} className="border-b border-black">
                            <td className="p-1 align-top border-x border-black">{index + 1}</td>
                            <td className="p-1 align-top border-x border-black whitespace-pre-wrap">{item.description}</td>
                            <td className="p-1 align-top border-x border-black">{item.product?.sku || '-'}</td>
                            <td className="p-1 align-top text-right border-x border-black">{item.unit_price.toFixed(2)}</td>
                            <td className="p-1 align-top text-right border-x border-black">0(0%)</td>
                            <td className="p-1 align-top text-right border-x border-black">{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold border-y border-black">
                        <td colSpan="5" className="p-1 text-center border-x border-black">TOTAL</td>
                        <td className="p-1 text-right border-x border-black">{currency_symbol} {total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <table className="w-full border-collapse text-xs mt-4">
                <thead className="bg-slate-200">
                    <tr className="border-y border-black">
                        <th rowSpan="2" className="p-1 text-left font-bold border-x border-black">HSN/SAC</th>
                        <th rowSpan="2" className="p-1 text-right font-bold border-x border-black">Taxable Value</th>
                        <th colSpan="2" className="p-1 text-center font-bold border-x border-black">CGST</th>
                        <th colSpan="2" className="p-1 text-center font-bold border-x border-black">SGST</th>
                        <th rowSpan="2" className="p-1 text-right font-bold border-x border-black">Total Tax Amount</th>
                    </tr>
                    <tr className="border-b border-black">
                        <th className="p-1 text-right font-bold border-x border-black">Rate</th>
                        <th className="p-1 text-right font-bold border-x border-black">Amount</th>
                        <th className="p-1 text-right font-bold border-x border-black">Rate</th>
                        <th className="p-1 text-right font-bold border-x border-black">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(taxSummary).map(([hsn, tax]) => (
                        <tr key={hsn} className="border-b border-black">
                            <td className="p-1 border-x border-black">{hsn}</td>
                            <td className="p-1 text-right border-x border-black">{tax.taxable.toFixed(2)}</td>
                            <td className="p-1 text-right border-x border-black">{(tax.rate / 2).toFixed(2)}%</td>
                            <td className="p-1 text-right border-x border-black">{tax.cgst.toFixed(2)}</td>
                            <td className="p-1 text-right border-x border-black">{(tax.rate / 2).toFixed(2)}%</td>
                            <td className="p-1 text-right border-x border-black">{tax.sgst.toFixed(2)}</td>
                            <td className="p-1 text-right border-x border-black">{(tax.cgst + tax.sgst).toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold border-y border-black">
                        <td className="p-1 border-x border-black">Total</td>
                        <td className="p-1 text-right border-x border-black">{totalTaxable.toFixed(2)}</td>
                        <td className="p-1 border-x border-black"></td>
                        <td className="p-1 text-right border-x border-black">{totalCGST.toFixed(2)}</td>
                        <td className="p-1 border-x border-black"></td>
                        <td className="p-1 text-right border-x border-black">{totalSGST.toFixed(2)}</td>
                        <td className="p-1 text-right border-x border-black">{(totalCGST + totalSGST).toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="mt-4 text-xs border border-black p-1">
                <span className="font-bold">Total Amount (in words): </span>
                <span className="capitalize">{numberToWords(total)}</span>
            </div>

            {show_terms_in_invoice && (
                <div className="mt-1 text-xs border border-black p-1">
                    <p className="font-bold">Terms and Conditions</p>
                    <p className="whitespace-pre-line text-[8pt]">{company?.invoice_terms || ''}</p>
                </div>
            )}

            <div className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
                    <div>
                        {(show_admin_bank_in_invoice && bank) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {bank.bank_name}</p>
                                <p>A/C: {bank.account_number}</p>
                                <p>IFSC: {bank.ifsc_code}</p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center">
                        {(show_qr_in_invoice && company?.payment_qr_code_url) && (
                            <div className="text-center">
                                <img src={company.payment_qr_code_url} crossOrigin="anonymous" alt="Payment QR Code" className="w-20 h-20 object-contain mx-auto" />
                            </div>
                        )}
                    </div>
                    <div className="text-right">
                        {show_signature_in_invoice && signature && (
                            <div className="inline-block text-center">
                                <img src={signature.signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain mx-auto mb-1" />
                                <p className="border-t pt-1 font-semibold">For {company?.name}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const templates = {
    modern: TemplateModern,
    classic: TemplateClassic,
    creative: TemplateCreative,
    minimalist: TemplateMinimalist,
    corporate: TemplateCorporate,
    'md-consultancy': TemplateMDConsultancy,
};

// --- Main Component ---

const InvoiceView = ({ open, onOpenChange, invoiceId, isForPdfGeneration = false, pdfRef, onDataLoaded }) => {
    const { toast } = useToast();
    const [invoice, setInvoice] = useState(null);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(false);
    const localInvoiceRef = useRef();
    const invoiceRef = pdfRef || localInvoiceRef;

    useEffect(() => {
        if (invoiceId && (open || isForPdfGeneration)) {
            setLoading(true);
            const fetchInvoiceData = async () => {
                try {
                    const [invoiceRes, companyRes, bankRes, sigRes] = await Promise.all([
                        api.get(`/invoices/${invoiceId}`),
                        api.get('/company-profile'),
                        api.get('/admin-bank-accounts'),
                        api.get('/admin-signatures')
                    ]);

                    const invoiceData = invoiceRes.data;
                    const companyData = companyRes.data ? {
                        ...companyRes.data,
                        bank_accounts: bankRes.data || [],
                        signatures: sigRes.data || [],
                    } : null;

                    setInvoice(invoiceData);
                    setCompany(companyData);
                    if (isForPdfGeneration && onDataLoaded) {
                        setTimeout(() => onDataLoaded(invoiceData), 500);
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Error fetching invoice details', description: error.message });
                } finally {
                    setLoading(false);
                }
            };
            fetchInvoiceData();
        }
    }, [invoiceId, open, isForPdfGeneration, toast, onDataLoaded]);


    const InvoiceContent = () => {
        if (!invoice || !company) return null;

        const settings = {
            theme: company.theme || 'modern',
            theme_primary_color: company.theme_primary_color || '#3b82f6',
            font_family: company.font_family || 'Inter',
            currency_symbol: company.currency_symbol || '₹',
            ...company
        };

        const TemplateComponent = templates[settings.theme] || templates['modern'];
        const billTo = invoice.customer_id || invoice.party_id;

        return (
            <div ref={invoiceRef}>
                <TemplateComponent settings={settings} company={company} billTo={billTo} invoice={invoice} />
            </div>
        );
    }

    if (isForPdfGeneration) {
        return loading || !invoice ? null : <InvoiceContent />;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Invoice {invoice ? `#${invoice.invoice_number}` : ''}</DialogTitle>
                    <DialogDescription className="sr-only">Detailed view of the selected invoice</DialogDescription>
                </DialogHeader>
                {loading ? (
                    <div className="flex items-center justify-center h-[70vh]">
                        <Spinner />
                    </div>
                ) : invoice && (
                    <>
                        <div className="max-h-[80vh] overflow-y-auto bg-slate-200 dark:bg-slate-900 p-8 flex justify-center">
                            <InvoiceContent />
                        </div>
                        <DialogFooter className="p-6 pt-0">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceView;
