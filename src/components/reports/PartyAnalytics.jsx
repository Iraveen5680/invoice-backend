import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const PartyAnalytics = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Parties and Payments to aggregate
                const [partiesRes, paymentsRes] = await Promise.all([
                    api.get('/parties'),
                    api.get('/payments') // We will filter checks on frontend or ideally backend
                ]);

                const parties = partiesRes.data;
                const payments = paymentsRes.data;

                const summaryData = parties.map(party => {
                    const partyPayments = payments.filter(p => p.party_id?._id === party._id || p.party_id === party._id);
                    const total_paid = partyPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

                    return {
                        name: party.name,
                        gst_no: party.gst_no,
                        total_paid
                    };
                }).sort((a, b) => b.total_paid - a.total_paid);

                setData(summaryData);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Error fetching party data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);

    const exportToCSV = () => {
        const headers = ['Name', 'GST No.', 'Total Paid'];
        const rows = data.map(row => [
            row.name,
            row.gst_no,
            row.total_paid
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "party_analytics.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToExcel = () => {
        const headers = ['Name', 'GST No.', 'Total Paid'];
        const table = `
            <table>
                <thead>
                    <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr>
                        <td>${row.name}</td>
                        <td>${row.gst_no || '-'}</td>
                        <td>${row.total_paid.toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        `;
        const blob = new Blob([table], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "party_analytics.xls";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text("Party Transaction Report", 14, 16);
        doc.autoTable({
            head: [['Name', 'GST No.', 'Total Paid']],
            body: data.map(row => [
                row.name,
                row.gst_no,
                `₹${row.total_paid.toFixed(2)}`
            ]),
            startY: 20,
        });
        doc.save("party_analytics.pdf");
    };

    if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Party Analytics</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}><FileText className="w-4 h-4 mr-2" /> CSV</Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel}><FileText className="w-4 h-4 mr-2" /> Excel</Button>
                    <Button variant="outline" size="sm" onClick={exportToPDF}><Download className="w-4 h-4 mr-2" /> PDF</Button>
                </div>
            </div>

            <div className="mb-8 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slice(0, 10)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Paid']} />
                        <Legend />
                        <Bar dataKey="total_paid" fill="#f59e0b" name="Total Payments" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">GST No.</th>
                            <th className="px-6 py-3">Total Paid</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="bg-white border-b hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{row.name}</td>
                                <td className="px-6 py-4">{row.gst_no || '-'}</td>
                                <td className="px-6 py-4">₹{row.total_paid.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p className="text-center text-xs text-slate-400 mt-2">Showing top 5 parties</p>
            </div>
        </motion.div>
    );
};

export default PartyAnalytics;
