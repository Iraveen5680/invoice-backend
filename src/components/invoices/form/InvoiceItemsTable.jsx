import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

const InvoiceItemsTable = ({
    items, products, gstRates, isTaxInclusive,
    handleItemChange, getItemRowTotals, removeItem, setIsAddItemDialogOpen, setIsGstRateDialogOpen
}) => {
    return (
        <div className="space-y-4">
            <div className="overflow-x-auto bg-slate-50/50 p-4 rounded-lg">
                <table className="w-full text-sm">
                    <thead className="border-b-2 border-slate-200">
                        <tr>
                            <th className="p-2 text-left font-semibold text-slate-600 w-10">#</th>
                            <th className="p-2 text-left font-semibold text-slate-600 min-w-[200px] w-2/5">Item</th>
                            <th className="p-2 text-left font-semibold text-slate-600">Qty</th>
                            <th className="p-2 text-left font-semibold text-slate-600">Price</th>
                            <th className="p-2 text-left font-semibold text-slate-600">Tax</th>
                            <th className="p-2 text-right font-semibold text-slate-600">Amount</th>
                            <th className="p-2 text-right font-semibold text-slate-600"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => {
                            const { basePrice, total } = getItemRowTotals(item);
                            const itemInProducts = products.find(p => p._id === item.product_id);
                            return (
                                <tr key={index} className="border-b border-slate-100">
                                    <td className="p-2 text-slate-500">{index + 1}</td>
                                    <td className="p-2 font-medium text-slate-800">{item.description || itemInProducts?.name}</td>
                                    <td className="p-2"><Input type="number" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20 border-slate-400" /></td>
                                    <td className="p-2">
                                        <div className="flex flex-col gap-1">
                                            <Input
                                                type="number"
                                                value={isTaxInclusive ? basePrice.toFixed(2) : item.unit_price}
                                                onChange={e => handleItemChange(index, 'unit_price', e.target.value)}
                                                className="w-28 bg-white border-slate-400"
                                                readOnly={isTaxInclusive}
                                                title={isTaxInclusive ? "Base price (auto-calculated)" : "Unit Price"}
                                            />
                                            {isTaxInclusive && <Input type="number" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', e.target.value)} className="w-28 bg-white border-slate-400" placeholder="Incl. Price" title="Price including tax" />}
                                        </div>
                                    </td>
                                    <td className="p-2">
                                        <div className="flex items-center gap-1">
                                            <Select onValueChange={val => handleItemChange(index, 'gst_rate_id', val)} value={item.gst_rate_id || ''}>
                                                <SelectTrigger className="w-24 bg-white border-slate-400"><SelectValue placeholder="Tax" /></SelectTrigger>
                                                <SelectContent>{gstRates.map(r => <SelectItem key={r._id} value={r._id}>{r.rate}%</SelectItem>)}</SelectContent>
                                            </Select>
                                            {setIsGstRateDialogOpen && <Button type="button" variant="ghost" size="icon" onClick={() => setIsGstRateDialogOpen(true)}><Plus className="w-4 h-4 text-blue-500" /></Button>}
                                        </div>
                                    </td>
                                    <td className="p-2 text-right font-medium text-slate-800">₹{total.toFixed(2)}</td>
                                    <td className="p-2 text-right"><Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><X className="w-4 h-4 text-red-500" /></Button></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsAddItemDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Item</Button>
        </div>
    );
};

export default InvoiceItemsTable;