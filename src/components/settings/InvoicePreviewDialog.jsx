
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Spinner from '@/components/Spinner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { numberToWords } from '@/lib/numberToWords';

const TemplateModern = ({ settings, company, customer, mockInvoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_pan_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;
    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            <header className="flex justify-between items-start pb-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2" style={{ color: theme_primary_color }}>{company?.name}</h1>
                    {show_address_in_invoice && company?.address && <p className="text-xs max-w-xs">{company.address}</p>}
                    {show_phone_in_invoice && company?.phone && <p className="text-xs">Phone no.: {company.phone}</p>}
                    {company?.email && <p className="text-xs">Email: {company.email}</p>}
                </div>
                {show_logo_in_invoice && company?.logo_url && <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-20 w-20 object-contain" />}
            </header>

            <div className="text-center my-8">
                <h2 className="text-2xl font-bold uppercase" style={{ color: theme_primary_color }}>Tax Invoice</h2>
            </div>

            <section className="flex justify-between my-6 text-xs">
                <div>
                    <h3 className="font-semibold text-sm mb-1">Bill To</h3>
                    <p className="font-bold">{customer?.name}</p>
                    {customer?.billing_address && <p>{customer.billing_address}</p>}
                    {customer?.phone && <p>Mobile: {customer.phone}</p>}
                </div>
                <div className="text-right">
                    <p><span className="font-semibold">Invoice No :</span> {mockInvoice.invoice_number}</p>
                    <p><span className="font-semibold">Date :</span> {new Date(mockInvoice.issue_date).toLocaleDateString()}</p>
                    {show_gst_in_invoice && company?.gst_number && <p><span className="font-semibold">GSTIN :</span> {company.gst_number}</p>}
                    {show_pan_in_invoice && company?.pan_number && <p><span className="font-semibold">PAN :</span> {company.pan_number}</p>}
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
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{index + 1}</td>
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.hsn_sac}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.tax.toFixed(2)} (18%)</td>
                            <td className="p-2 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="font-bold">
                        <td colSpan="6" className="p-2 text-right">Total</td>
                        <td className="p-2 text-right">{currency_symbol}{mockInvoice.total.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-between items-start mt-8 text-xs">
                <div>
                    <p className="font-semibold">Invoice Amount In Words</p>
                    <p className="capitalize">{numberToWords(mockInvoice.total)} Only</p>
                    {show_terms_in_invoice && (
                        <div className="mt-4">
                            <p className="font-semibold">Terms and Conditions</p>
                            <p className="whitespace-pre-line">{company?.invoice_terms || "Terms and Conditions Apply"}</p>
                        </div>
                    )}
                </div>
                <div className="w-2/5">
                    <div className="flex justify-between p-1"><span>Sub Total</span><span>{currency_symbol}{mockInvoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>SGST@9%</span><span>{currency_symbol}{(mockInvoice.tax / 2).toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>CGST@9%</span><span>{currency_symbol}{(mockInvoice.tax / 2).toFixed(2)}</span></div>
                    <div className="flex justify-between p-2 font-bold text-base mt-2" style={{ background: theme_primary_color, color: 'white' }}>
                        <span>Total</span>
                        <span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between p-1 mt-1"><span>Received</span><span>{currency_symbol}0.00</span></div>
                    <div className="flex justify-between p-1"><span>Remaining Balance</span><span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span></div>
                    {show_signature_in_invoice && company?.signatures?.[0] && (
                        <div className="text-right mt-8">
                            <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain ml-auto" />
                            <p className="border-t mt-1 pt-1 inline-block">For: {company?.name || 'Your Company'}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-4">
                    <div>
                        {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {company.bank_accounts[0].bank_name}</p>
                                <p>Holder Name: {company.bank_accounts[0].account_holder_name}</p>
                                <p>Account Number: {company.bank_accounts[0].account_number}</p>
                                <p>IFSC Code: {company.bank_accounts[0].ifsc_code}</p>
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

const TemplateClassic = ({ settings, company, customer, mockInvoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;
    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative border-2 border-black" style={{ fontFamily: settings.font_family }}>
            <header className="text-center mb-6">
                {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-auto mx-auto mb-2" /> : <h1 className="text-2xl font-bold mb-1">{company?.name || 'Your Company'}</h1>}
                {show_address_in_invoice && <p className="text-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                {show_phone_in_invoice && <p className="text-xs">Mobile: {company?.phone || 'N/A'}</p>}
            </header>

            <section className="grid grid-cols-2 gap-4 my-6 text-xs border-y-2 border-black py-2">
                <div>
                    <h3 className="font-semibold mb-1">BILL TO</h3>
                    <p className="font-bold">{customer?.name || 'Valued Customer'}</p>
                    <p>{customer?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    <p>Mobile: {customer?.phone || 'N/A'}</p>
                    {show_gst_in_invoice && <p>GSTIN: {customer?.gst_no || 'N/A'}</p>}
                </div>
                <div className="text-left">
                    <p><span className="font-semibold">Invoice No:</span> {mockInvoice.invoice_number}</p>
                    <p><span className="font-semibold">Invoice Date:</span> {new Date(mockInvoice.issue_date).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Due Date:</span> {new Date(mockInvoice.due_date).toLocaleDateString()}</p>
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
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index}>
                            <td className="p-2 border-r border-black">{index + 1}</td>
                            <td className="p-2 border-r border-black">{item.description}</td>
                            <td className="p-2 text-center border-r border-black">{item.quantity}</td>
                            <td className="p-2 text-right border-r border-black">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    {Array.from({ length: Math.max(0, 10 - mockInvoice.items.length) }).map((_, i) => (
                        <tr key={`empty-${i}`}><td className="p-2 border-r border-black">&nbsp;</td><td className="border-r border-black"></td><td className="border-r border-black"></td><td className="border-r border-black"></td><td></td></tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold">
                        <td colSpan="4" className="p-2 text-right border-r border-black">TOTAL</td>
                        <td className="p-2 text-right">{currency_symbol}{mockInvoice.total.toFixed(2)}</td>
                    </tr>
                    <tr className="font-bold border-y-2 border-black">
                        <td colSpan="4" className="p-2 text-right border-r border-black">RECEIVED AMOUNT</td>
                        <td className="p-2 text-right">{currency_symbol}0.00</td>
                    </tr>
                    <tr className="font-bold">
                        <td colSpan="4" className="p-2 text-right border-r border-black">BALANCE AMOUNT</td>
                        <td className="p-2 text-right">{currency_symbol}{mockInvoice.total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div className="flex justify-end mt-4">
                {show_signature_in_invoice && company?.signatures?.[0] && (
                    <div className="text-center">
                        <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain mx-auto" />
                        <p className="border-t border-black mt-1 pt-1 inline-block">Authorized Signatory</p>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t border-black pt-4">
                    <div>
                        {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {company.bank_accounts[0].bank_name}</p>
                                <p>Holder Name: {company.bank_accounts[0].account_holder_name}</p>
                                <p>Account Number: {company.bank_accounts[0].account_number}</p>
                                <p>IFSC Code: {company.bank_accounts[0].ifsc_code}</p>
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

const TemplateCreative = ({ settings, company, customer, mockInvoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;
    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            <header className="flex justify-between items-center mb-4">
                <div>
                    {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-auto mb-2" /> : <h1 className="text-2xl font-bold mb-1">{company?.name || 'Your Company'}</h1>}
                    {show_address_in_invoice && <p className="text-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                    {show_phone_in_invoice && <p className="text-xs">Mobile: {company?.phone || 'N/A'}</p>}
                </div>
                <h2 className="text-4xl font-bold uppercase text-gray-300">Invoice</h2>
            </header>

            <div className="grid grid-cols-3 gap-4 my-6 text-xs p-2 rounded-md" style={{ backgroundColor: `${theme_primary_color}20` }}>
                <div><span className="font-semibold">Invoice No:</span> {mockInvoice.invoice_number}</div>
                <div><span className="font-semibold">Invoice Date:</span> {new Date(mockInvoice.issue_date).toLocaleDateString()}</div>
                <div><span className="font-semibold">Due Date:</span> {new Date(mockInvoice.due_date).toLocaleDateString()}</div>
            </div>

            <section className="grid grid-cols-2 gap-4 my-6 text-xs">
                <div>
                    <h3 className="font-semibold mb-1" style={{ color: theme_primary_color }}>BILL TO</h3>
                    <p className="font-bold">{customer?.name || 'Valued Customer'}</p>
                    <p>{customer?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    <p>Mobile: {customer?.phone || 'N/A'}</p>
                    {show_gst_in_invoice && <p>GSTIN: {customer?.gst_no || 'N/A'}</p>}
                </div>
                <div>
                    <h3 className="font-semibold mb-1" style={{ color: theme_primary_color }}>SHIP TO</h3>
                    <p className="font-bold">{customer?.name || 'Valued Customer'}</p>
                    <p>{customer?.shipping_address || '456 Client Ave, Town, State 54321'}</p>
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
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2">{item.hsn_sac}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 text-right">{currency_symbol}{item.tax.toFixed(2)} (18%)</td>
                            <td className="p-2 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
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
                </div>
                <div className="w-2/5">
                    <div className="flex justify-between p-1"><span>Subtotal</span><span>{currency_symbol}{mockInvoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Taxable Amount</span><span>{currency_symbol}{mockInvoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>IGST@18%</span><span>{currency_symbol}{mockInvoice.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1 border-t font-bold"><span>TOTAL AMOUNT</span><span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Received Amount</span><span>{currency_symbol}0.00</span></div>
                    <div className="flex justify-between p-1 border-t font-bold"><span>BALANCE AMOUNT</span><span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span></div>
                    <p className="capitalize text-right mt-2">{numberToWords(mockInvoice.total)}</p>
                </div>
            </div>

            <div className="absolute bottom-48 right-8 text-xs">
                {show_signature_in_invoice && company?.signatures?.[0] && (
                    <div className="text-right">
                        <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-32 h-12 object-contain ml-auto" />
                        <p className="border-t mt-1 pt-1 inline-block">Authorized Signatory</p>
                    </div>
                )}
            </div>

            <footer className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-8">
                    <div>
                        {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {company.bank_accounts[0].bank_name}</p>
                                <p>Holder Name: {company.bank_accounts[0].account_holder_name}</p>
                                <p>Account Number: {company.bank_accounts[0].account_number}</p>
                                <p>IFSC Code: {company.bank_accounts[0].ifsc_code}</p>
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

const TemplateMinimalist = ({ settings, company, customer, mockInvoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice, show_admin_upi_in_invoice } = settings;
    return (
        <div className="p-10 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
            <header className="grid grid-cols-2 gap-4 mb-10">
                <div>
                    {show_logo_in_invoice && company?.logo_url ? <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-12 w-auto mb-4" /> : <h1 className="text-xl font-bold mb-2">{company?.name || 'Your Company'}</h1>}
                    {show_address_in_invoice && <p className="text-xs max-w-xs">{company?.address || '123 Business St, City, State 12345'}</p>}
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold uppercase text-gray-800">Invoice</h2>
                    <p className="text-xs mt-1">{mockInvoice.invoice_number}</p>
                </div>
            </header>

            <section className="grid grid-cols-3 gap-4 my-8 text-xs">
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Billed To</h3>
                    <p className="font-bold">{customer?.name || 'Valued Customer'}</p>
                    <p>{customer?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                    {show_phone_in_invoice && <p>{customer?.phone || 'N/A'}</p>}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Sent From</h3>
                    <p className="font-bold">{company?.name || 'Your Company'}</p>
                    <p>{company?.email || 'N/A'}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Date</h3>
                    <p>{new Date(mockInvoice.issue_date).toLocaleDateString()}</p>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-2">Due Date</h3>
                    <p>{new Date(mockInvoice.due_date).toLocaleDateString()}</p>
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
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                            <td className="p-2 py-3">{item.description}</td>
                            <td className="p-2 py-3 text-center">{item.quantity}</td>
                            <td className="p-2 py-3 text-right">{currency_symbol}{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 py-3 text-right">{currency_symbol}{item.total.toFixed(2)}</td>
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
                </div>
                <div className="w-2/5 text-sm">
                    <div className="flex justify-between p-1"><span>Subtotal</span><span>{currency_symbol}{mockInvoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-1"><span>Tax (18%)</span><span>{currency_symbol}{mockInvoice.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2 mt-2 bg-gray-100 rounded-md font-bold text-base">
                        <span>Amount due</span>
                        <span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span>
                    </div>
                    {show_signature_in_invoice && company?.signatures?.[0] && (
                        <div className="text-right mt-8">
                            <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain ml-auto" />
                            <p className="mt-1 pt-1 font-semibold text-gray-800">{company?.name || 'Your Company'}</p>
                        </div>
                    )}
                </div>
            </div>

            <footer className="absolute bottom-10 left-10 right-10 text-xs text-gray-500">
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                            <div>
                                <h4 className="font-bold mb-1 text-gray-600">Bank Details</h4>
                                <p>Bank: {company.bank_accounts[0].bank_name}</p>
                                <p>Holder Name: {company.bank_accounts[0].account_holder_name}</p>
                                <p>Account Number: {company.bank_accounts[0].account_number}</p>
                                <p>IFSC Code: {company.bank_accounts[0].ifsc_code}</p>
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

const TemplateCorporate = ({ settings, company, customer, mockInvoice }) => {
    const { theme_primary_color, currency_symbol, show_logo_in_invoice, show_signature_in_invoice, show_gst_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_admin_bank_in_invoice } = settings;
    return (
        <div className="p-8 bg-white text-gray-800 w-[210mm] min-h-[297mm] shadow-lg text-[10pt] relative" style={{ fontFamily: settings.font_family }}>
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
                        <p><span className="text-gray-500">Invoice #:</span> {mockInvoice.invoice_number}</p>
                        <p><span className="text-gray-500">Date:</span> {new Date(mockInvoice.issue_date).toLocaleDateString()}</p>
                        <p><span className="text-gray-500">Due Date:</span> {new Date(mockInvoice.due_date).toLocaleDateString()}</p>
                    </div>
                </div>
            </header>

            <section className="my-8 text-xs">
                <h3 className="font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To</h3>
                <p className="font-bold">{customer?.name || 'Valued Customer'}</p>
                <p>{customer?.billing_address || '456 Client Ave, Town, State 54321'}</p>
                {show_gst_in_invoice && <p>GSTIN: {customer?.gst_no || 'N/A'}</p>}
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
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
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
                    <div className="flex justify-between p-2"><span>Subtotal</span><span>{currency_symbol}{mockInvoice.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between p-2"><span>Tax (18%)</span><span>{currency_symbol}{mockInvoice.tax.toFixed(2)}</span></div>
                    <div className="flex justify-between p-3 mt-2 rounded-md font-bold text-base" style={{ backgroundColor: '#f3f4f6' }}>
                        <span>Total</span>
                        <span>{currency_symbol}{mockInvoice.total.toFixed(2)}</span>
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
                    {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                        <div>
                            <h4 className="font-bold mb-1">Payment Information</h4>
                            <p>Bank: {company.bank_accounts[0].bank_name}</p>
                            <p>A/C: {company.bank_accounts[0].account_number}</p>
                            <p>IFSC: {company.bank_accounts[0].ifsc_code}</p>
                        </div>
                    )}
                    <div className="text-right">
                        {show_signature_in_invoice && company?.signatures?.[0] && (
                            <div className="inline-block text-center">
                                <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain mx-auto mb-1" />
                                <p className="border-t pt-1 font-semibold">Authorized Signatory</p>
                            </div>
                        )}
                    </div>
                </div>
            </footer>
        </div>
    );
};

const TemplateMDConsultancy = ({ settings, company, customer, mockInvoice }) => {
    const { currency_symbol, show_logo_in_invoice, show_phone_in_invoice, show_address_in_invoice, show_terms_in_invoice, show_signature_in_invoice, show_admin_bank_in_invoice, show_qr_in_invoice } = settings;
    const taxSummary = mockInvoice.items.reduce((acc, item) => {
        const taxRate = item.tax > 0 ? (item.tax / (item.quantity * item.unit_price)) * 100 : 0;
        const hsn = item.hsn_sac || 'N/A';
        if (!acc[hsn]) {
            acc[hsn] = { taxable: 0, cgst: 0, sgst: 0, rate: taxRate };
        }
        acc[hsn].taxable += item.quantity * item.unit_price;
        // Assuming tax is split equally between CGST and SGST
        acc[hsn].cgst += item.tax / 2;
        acc[hsn].sgst += item.tax / 2;
        return acc;
    }, {});
    const totalTaxable = Object.values(taxSummary).reduce((sum, item) => sum + item.taxable, 0);
    const totalCGST = Object.values(taxSummary).reduce((sum, item) => sum + item.cgst, 0);
    const totalSGST = Object.values(taxSummary).reduce((sum, item) => sum + item.sgst, 0);

    return (
        <div className="p-8 bg-white text-gray-900 w-[210mm] min-h-[297mm] shadow-lg text-[10pt]" style={{ fontFamily: "'Arial', sans-serif" }}>
            <header className="flex justify-between items-start pb-4 border-b">
                <div className="flex items-center gap-4">
                    {show_logo_in_invoice && company?.logo_url && <img src={company.logo_url} crossOrigin="anonymous" alt="company logo" className="h-16 w-16 object-contain" />}
                    <div>
                        <h1 className="font-bold text-lg text-blue-800">{company?.name}</h1>
                        {show_address_in_invoice && company?.address && <p className="text-xs max-w-xs mt-1">{company.address}</p>}
                    </div>
                </div>
                <div className="text-right text-xs">
                    {show_phone_in_invoice && company?.phone && <p><span className="font-bold">Mobile</span> {company.phone}</p>}
                    {company?.email && <p><span className="font-bold">Email</span> {company.email}</p>}
                </div>
            </header>

            <section className="grid grid-cols-3 gap-4 my-4 text-xs">
                <div><span className="font-bold">Invoice No.</span><p>{mockInvoice.invoice_number}</p></div>
                <div><span className="font-bold">Invoice Date</span><p>{new Date(mockInvoice.issue_date).toLocaleDateString('en-GB')}</p></div>
                <div><span className="font-bold">Due Date</span><p>{new Date(mockInvoice.due_date).toLocaleDateString('en-GB')}</p></div>
            </section>

            <section className="border-t pt-4 text-xs">
                <h3 className="font-bold mb-1">BILL TO</h3>
                <p className="font-bold">{customer?.name}</p>
                {customer?.billing_address && <p className="max-w-md">{customer.billing_address}</p>}
                {customer?.phone && <p>{customer.phone}</p>}
            </section>

            <table className="w-full border-collapse text-xs mt-4">
                <thead className="bg-slate-200">
                    <tr className="border-y border-black">
                        <th className="p-2 text-left font-bold border-x border-black">No.</th>
                        <th className="p-2 text-left font-bold border-x border-black w-2/5">SERVICES</th>
                        <th className="p-2 text-left font-bold border-x border-black">HSN</th>
                        <th className="p-2 text-right font-bold border-x border-black">PRICE/ITEM ({currency_symbol})</th>
                        <th className="p-2 text-right font-bold border-x border-black">Discount</th>
                        <th className="p-2 text-right font-bold border-x border-black">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {mockInvoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-black">
                            <td className="p-2 align-top border-x border-black min-h-[60px]">{index + 1}</td>
                            <td className="p-2 align-top border-x border-black whitespace-pre-wrap min-h-[60px]">{item.description}</td>
                            <td className="p-2 align-top border-x border-black min-h-[60px]">{item.hsn_sac || '-'}</td>
                            <td className="p-2 align-top text-right border-x border-black min-h-[60px]">{item.unit_price.toFixed(2)}</td>
                            <td className="p-2 align-top text-right border-x border-black min-h-[60px]">0(0%)</td>
                            <td className="p-2 align-top text-right border-x border-black min-h-[60px]">{item.total.toFixed(2)}</td>
                        </tr>
                    ))}
                    <tr className="bg-slate-200 font-bold border-y border-black">
                        <td colSpan="5" className="p-2 text-center border-x border-black">TOTAL</td>
                        <td className="p-2 text-right border-x border-black">{currency_symbol} {mockInvoice.total.toFixed(2)}</td>
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

            <div className="mt-4 text-xs border border-black p-3">
                <span className="font-bold">Total Amount (in words)</span>
                <p className="capitalize mt-1">{numberToWords(mockInvoice.total)}</p>
            </div>

            {show_terms_in_invoice && (
                <div className="mt-2 text-xs border border-black p-3">
                    <p className="font-bold mb-1">Terms and Conditions</p>
                    <p className="whitespace-pre-line text-[8pt]">{company?.invoice_terms || '1."All payments are non-refundable once work commences."\n2. All disputes are subject to [Gujrat Bhavnagar] jurisdiction only'}</p>
                </div>
            )}
            <div className="absolute bottom-8 left-8 right-8 text-xs">
                <div className="grid grid-cols-3 gap-4 pt-4 border-t mt-4">
                    <div>
                        {(show_admin_bank_in_invoice && company?.bank_accounts?.[0]) && (
                            <div>
                                <h4 className="font-bold mb-1">Bank Details</h4>
                                <p>Bank: {company.bank_accounts[0].bank_name}</p>
                                <p>A/C: {company.bank_accounts[0].account_number}</p>
                                <p>IFSC: {company.bank_accounts[0].ifsc_code}</p>
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
                        {show_signature_in_invoice && company?.signatures?.[0] && (
                            <div className="inline-block text-center">
                                <img src={company.signatures[0].signature_url} crossOrigin="anonymous" alt="Authorized Signature" className="w-28 h-10 object-contain mx-auto mb-1" />
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

const InvoicePreviewDialog = ({ open, onOpenChange, settings, themeId, isForPdfGeneration = false, pdfRef, onDataLoaded }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [customer, setCustomer] = useState(null);
    const localPdfRef = React.useRef();
    const currentRef = pdfRef || localPdfRef;

    const mockInvoice = {
        invoice_number: 'MDBVN1006',
        issue_date: new Date('2025-05-21'),
        due_date: new Date('2025-05-28'),
        items: [
            { description: 'DHA license activation\n& DHA license\nactivation & Experience\nCertificate and data\nflow verification DHA\nlicense activation DHA\nlicense Activation 2000\nAED', quantity: 1, unit_price: 2000, tax: 0, total: 2000, hsn_sac: null },
        ],
        subtotal: 2000,
        tax: 0,
        total: 2000,
    };

    useEffect(() => {
        if (!open || !user) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [companyRes, bankRes, sigRes, customerRes] = await Promise.all([
                    api.get('/company-profile'),
                    api.get('/admin-bank-accounts'),
                    api.get('/admin-signatures'),
                    api.get('/customers?limit=1')
                ]);

                const companyData = companyRes.data ? {
                    ...companyRes.data,
                    bank_accounts: bankRes.data || [],
                    signatures: sigRes.data || [],
                } : null;

                setCompany(companyData);
                setCustomer(customerRes.data?.[0] || null);

                if (isForPdfGeneration) {
                    setTimeout(() => onDataLoaded({ ...mockInvoice, company: companyData, customer: customerRes.data?.[0] }), 500);
                }
            } catch (error) {
                console.error('Error fetching preview data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [open, user, isForPdfGeneration, onDataLoaded]);

    // Combine settings from the page with the full company profile for rendering
    const fullCompanyData = { ...company, ...settings };

    const TemplateComponent = templates[themeId] || templates['modern'];

    const InvoiceContent = () => (
        <div ref={currentRef}>
            <TemplateComponent settings={settings} company={fullCompanyData} customer={customer} mockInvoice={mockInvoice} />
        </div>
    );

    if (isForPdfGeneration) {
        return loading ? null : <InvoiceContent />;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Invoice Preview</DialogTitle>
                    <DialogDescription>This is how your invoice will look with the '{themeId}' theme.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[80vh] overflow-y-auto bg-slate-200 p-8 flex justify-center">
                    {loading ? <Spinner /> : <InvoiceContent />}
                </div>
                <DialogFooter className="p-6">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default InvoicePreviewDialog;
