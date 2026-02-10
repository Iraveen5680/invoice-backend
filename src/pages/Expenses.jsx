import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Trash2, Edit, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Helmet } from 'react-helmet';

const Expenses = () => {
    const { user, companyProfile } = useAuth();
    const { toast } = useToast();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Modal State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form State
    const initialFormState = {
        date: new Date().toISOString().split('T')[0],
        type: 'loss',
        category: '',
        amount: '',
        description: '',
        payment_mode: 'Cash',
        notes: ''
    };
    const [formData, setFormData] = useState(initialFormState);

    const currencySymbol = companyProfile?.currency_symbol || '₹';

    const fetchExpenses = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            let query = `/expenses?type=${filterType}`;
            if (dateRange.start && dateRange.end) {
                query += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const response = await api.get(query);
            setExpenses(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error fetching expenses', description: error.message });
        } finally {
            setLoading(false);
        }
    }, [user, filterType, dateRange, toast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount)
            };

            if (currentExpense) {
                await api.put(`/expenses/${currentExpense._id}`, payload);
                toast({ title: 'Updated successfully' });
            } else {
                await api.post('/expenses', payload);
                toast({ title: 'Added successfully' });
            }
            setIsDialogOpen(false);
            fetchExpenses();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error saving', description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this entry?')) return;
        try {
            await api.delete(`/expenses/${id}`);
            toast({ title: 'Deleted successfully' });
            fetchExpenses();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error deleting', description: error.message });
        }
    };

    const openAddModal = () => {
        setCurrentExpense(null);
        setFormData(initialFormState);
        setIsDialogOpen(true);
    };

    const openEditModal = (expense) => {
        setCurrentExpense(expense);
        setFormData({
            ...expense,
            date: new Date(expense.date).toISOString().split('T')[0],
            category: expense.category || '',
            notes: expense.notes || ''
        });
        setIsDialogOpen(true);
    };

    // Calculations
    const totals = useMemo(() => {
        const income = expenses.filter(e => e.type === 'profit').reduce((sum, e) => sum + e.amount, 0);
        const expense = expenses.filter(e => e.type === 'loss').reduce((sum, e) => sum + e.amount, 0);
        return { income, expense, profit: income - expense };
    }, [expenses]);

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <Helmet><title>Expenses & P/L</title></Helmet>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Expenses & Profit/Loss</h1>
                        <p className="text-muted-foreground">Track your income, expenses, and net profit.</p>
                    </div>
                    <Button onClick={openAddModal}><Plus className="mr-2 h-4 w-4" /> Add Transaction</Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {currencySymbol} {totals.income.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {currencySymbol} {totals.expense.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {currencySymbol} {totals.profit.toFixed(2)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="p-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/4">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search description..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-1/4">
                            <Label>Type</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Transactions</SelectItem>
                                    <SelectItem value="profit">Profit</SelectItem>
                                    <SelectItem value="loss">Loss</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-1/4">
                            <Label>From Date</Label>
                            <Input type="date" value={dateRange.start} onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))} />
                        </div>
                        <div className="w-full md:w-1/4">
                            <Label>To Date</Label>
                            <Input type="date" value={dateRange.end} onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))} />
                        </div>
                    </div>
                </Card>

                {/* Table */}
                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Mode</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center"><Spinner /></TableCell>
                                </TableRow>
                            ) : filteredExpenses.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">No transactions found.</TableCell>
                                </TableRow>
                            ) : (
                                filteredExpenses.map((expense) => (
                                    <TableRow key={expense._id}>
                                        <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                                        <TableCell className="font-medium">{expense.description}</TableCell>
                                        <TableCell>{expense.category}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${expense.type === 'profit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {expense.type.toUpperCase()}
                                            </span>
                                        </TableCell>
                                        <TableCell>{expense.payment_mode}</TableCell>
                                        <TableCell className={`text-right font-bold ${expense.type === 'profit' ? 'text-green-600' : 'text-red-600'}`}>
                                            {currencySymbol} {expense.amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(expense)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense._id)} className="text-red-500 hover:text-red-600"><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{currentExpense ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
                        <DialogDescription>
                            {currentExpense ? 'Update details of the transaction.' : 'Add a new income or expense entry.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type">Type</Label>
                                <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="profit">Profit</SelectItem>
                                        <SelectItem value="loss">Loss</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" step="0.01" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" list="categories" required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Rent, Salary, Sales" />
                            <datalist id="categories">
                                <option value="Salary" />
                                <option value="Rent" />
                                <option value="Utilities" />
                                <option value="Sales" />
                                <option value="Freelance" />
                                <option value="Groceries" />
                            </datalist>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Short description" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="payment_mode">Payment Mode</Label>
                            <Select value={formData.payment_mode} onValueChange={(val) => setFormData({ ...formData, payment_mode: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Online">Online</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="Check">Check</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Input id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional details..." />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Transaction'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default Expenses;
