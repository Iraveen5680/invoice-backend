import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { format } from "date-fns";
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const InvoiceAnalytics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/invoices');
                const formattedData = response.data.map(d => ({
                    ...d,
                    billed_to: d.customer_id?.name || d.party_id?.name || 'N/A',
                    issue_date: format(new Date(d.issue_date), 'yyyy-MM-dd')
                }));
                setData(formattedData);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching invoice data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const chartData = React.useMemo(() => {
        // Aggregate by date for the chart
        const agg = data.reduce((acc, curr) => {
            const date = curr.issue_date;
            if (!acc[date]) acc[date] = { date, total: 0 };
            acc[date].total += (Number(curr.total_amount) || 0);
            return acc;
        }, {});
        return Object.values(agg).sort((a, b) => new Date(a.date) - new Date(b.date));
    }, [data]);

    const exportToCSV = () => {
        const headers = ['Invoice #', 'Date', 'Billed To', 'Status', 'Total'];
        const rows = data.map(row => [
            row.invoice_number,
            row.issue_date,
            row.billed_to,
            row.status,
            row.total_amount
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "invoice_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const headers = ['Invoice #', 'Date', 'Billed To', 'Status', 'Total'];
        const table = `
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr>
                        <td>${row.invoice_number}</td>
                        <td>${row.issue_date}</td>
                        <td>${row.billed_to}</td>
                        <td>${row.status}</td>
                        <td>${Number(row.total_amount).toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
        const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "invoice_analytics.xls";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Invoice Sales Report", 14, 16);
        doc.autoTable({
            head: [['Invoice #', 'Date', 'Billed To', 'Status', 'Total']],
            body: data.map(row => [
                row.invoice_number,
                row.issue_date,
                row.billed_to,
                row.status,
                `₹${Number(row.total_amount).toFixed(2)}`
            ]),
            startY: 20,
        });
        doc.save("invoice_analytics.pdf");
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Invoice & Sales Analytics</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}><FileText className="w-4 h-4 mr-2" /> CSV</Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel}><FileText className="w-4 h-4 mr-2" /> Excel</Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
                </div>
            </div>

            <div className="mb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']} />
                        <Legend />
                        <Bar dataKey="total" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Invoice #</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Billed To</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 5).map((row) => (
                            <tr key={row._id} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.invoice_number}</td>
                                <td className="px-6 py-4">{row.issue_date}</td>
                                <td className="px-6 py-4">{row.billed_to}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">₹{Number(row.total_amount).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="text-center text-xs text-slate-400 mt-2">Showing last 5 records</p>
            </div>
        </motion.div>
    );
};

export default InvoiceAnalytics;
