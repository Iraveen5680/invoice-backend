import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const PaymentAnalytics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/payments');
                const modeMap = response.data.reduce((acc, curr) => {
                    const mode = curr.payment_mode || 'Unknown';
                    if (!acc[mode]) {
                        acc[mode] = { name: mode, value: 0, amount: 0 };
                    }
                    acc[mode].value += 1;
                    acc[mode].amount += Number(curr.amount) || 0;
                    return acc;
                }, {});
                setData(Object.values(modeMap));
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching payment data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const exportToCSV = () => {
        const headers = ['Mode', 'Count', 'Total Amount'];
        const rows = data.map(row => [
            row.name,
            row.value,
            row.amount
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "payment_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const headers = ['Mode', 'Count', 'Total Amount'];
        const table = `
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr>
                        <td>${row.name}</td>
                        <td>${row.value}</td>
                        <td>${row.amount.toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
        const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "payment_analytics.xls";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Payment Mode Analysis", 14, 16);
        doc.autoTable({
            head: [['Mode', 'Count', 'Total Amount']],
            body: data.map(row => [
                row.name,
                row.value,
                `₹${row.amount.toFixed(2)}`
            ]),
            startY: 20,
        });
        doc.save("payment_analytics.pdf");
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Payment Analytics</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}><FileText className="w-4 h-4 mr-2" /> CSV</Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel}><FileText className="w-4 h-4 mr-2" /> Excel</Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
                </div>
            </div>

            <div className="mb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="amount"
                            nameKey="name"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Mode</th>
                            <th className="px-6 py-3">Count</th>
                            <th className="px-6 py-3">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                <td className="px-6 py-4">{row.value}</td>
                                <td className="px-6 py-4">₹{row.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default PaymentAnalytics;
