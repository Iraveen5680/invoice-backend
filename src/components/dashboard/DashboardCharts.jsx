import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Calendar, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const VISIT_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

export const DashboardCharts = ({ invoices = [], payments = [], customers = [] }) => {
    const [timeRange, setTimeRange] = useState('12 Months');

    const filteredRevenueData = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();

        let data = [];
        const isSameDay = (d1, d2) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

        if (timeRange === 'Today') {
            const todayInvoices = invoices.filter(inv => isSameDay(new Date(inv.issue_date || Date.now()), now));
            data = [{ name: 'Today', earning: todayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0), expense: 0 }];
        } else if (timeRange === '7 Days') {
            for (let i = 6; i >= 0; i--) {
                const day = new Date();
                day.setDate(now.getDate() - i);
                const dayInvoices = invoices.filter(inv => isSameDay(new Date(inv.issue_date || Date.now()), day));
                data.push({
                    name: day.toLocaleDateString('en-US', { weekday: 'short' }),
                    earning: dayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
                    expense: dayInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) * 0.4
                });
            }
        } else if (timeRange === '30 Days') {
            // Group by weeks for 30 days
            for (let i = 3; i >= 0; i--) {
                const start = new Date();
                start.setDate(now.getDate() - (i * 7 + 7));
                const end = new Date();
                end.setDate(now.getDate() - (i * 7));
                const rangeInvoices = invoices.filter(inv => {
                    const d = new Date(inv.issue_date || Date.now());
                    return d >= start && d <= end;
                });
                data.push({
                    name: `W${4 - i}`,
                    earning: rangeInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
                    expense: rangeInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) * 0.4
                });
            }
        } else {
            // 12 Months
            const last12Months = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date();
                d.setMonth(now.getMonth() - i);
                last12Months.push({ month: months[d.getMonth()], year: d.getFullYear() });
            }
            data = last12Months.map(m => {
                const monthInvoices = invoices.filter(inv => {
                    const date = new Date(inv.issue_date || Date.now());
                    return months[date.getMonth()] === m.month && date.getFullYear() === m.year;
                });
                const earning = monthInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
                return { name: m.month, earning, expense: earning * 0.4 };
            });
        }
        return data;
    }, [invoices, timeRange]);

    const profitValue = invoices.length > 0 ? 75 : 0;
    const profitData = [{ name: 'Profit', value: profitValue, fill: '#3b82f6' }];

    const visitData = [
        { name: 'Invoices', value: invoices.length },
        { name: 'Payments', value: payments.length },
        { name: 'Customers', value: customers.length },
    ];

    const latestCustomers = customers.slice(-3).reverse().map(c => ({
        id: c._id,
        name: c.name,
        email: c.email,
        avatar: `https://i.pravatar.cc/150?u=${c._id}`
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Report */}
            <Card className="lg:col-span-2 border-none premium-shadow bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold">Revenue Report</CardTitle>
                        <p className="text-xs text-muted-foreground font-medium">Overview of earnings and expenses</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-4 text-xs font-bold mr-4">
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Earning</div>
                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400" /> Expense</div>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2 font-bold border-border/50 rounded-xl">
                                    <Calendar className="h-4 w-4" />
                                    {timeRange}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl premium-shadow border-border/50">
                                {['Today', '7 Days', '30 Days', '12 Months'].map((range) => (
                                    <DropdownMenuItem
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className="font-bold cursor-pointer"
                                    >
                                        {range}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="h-[350px] pt-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={filteredRevenueData} barGap={8}>
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 600 }}
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600, fontSize: '12px' }}
                            />
                            <Bar dataKey="earning" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={timeRange === 'Today' ? 60 : 12} />
                            <Bar dataKey="expense" fill="#fb923c" radius={[4, 4, 0, 0]} barSize={timeRange === 'Today' ? 60 : 12} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Business Pulse & New Customers */}
            <div className="flex flex-col gap-6">
                <Card className="border-none premium-shadow bg-card flex-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">Business Pulse</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="h-[180px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <RadialBarChart
                                    innerRadius="70%"
                                    outerRadius="100%"
                                    data={profitData}
                                    startAngle={90}
                                    endAngle={450}
                                >
                                    <RadialBar background dataKey="value" cornerRadius={30} />
                                </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black">{profitValue}%</span>
                                <span className="text-[10px] text-muted-foreground font-bold">ACTIVITY</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none premium-shadow bg-card flex-1">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-bold">New Customers</CardTitle>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {latestCustomers.length > 0 ? latestCustomers.map((customer) => (
                            <div key={customer.id} className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/5">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold leading-none">{customer.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{customer.email}</span>
                                    </div>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                        )) : <p className="text-xs text-muted-foreground text-center py-4">No customers yet</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Operations Pie */}
            <Card className="border-none premium-shadow bg-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-bold">Operations</CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="h-[250px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={visitData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {visitData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={VISIT_COLORS[index % VISIT_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black">{invoices.length + payments.length + customers.length}</span>
                            <span className="text-[10px] text-muted-foreground font-bold">TOTAL ASSETS</span>
                        </div>
                    </div>
                    <div className="w-full grid grid-cols-3 gap-2 mt-4">
                        {visitData.map((d, i) => (
                            <div key={d.name} className="flex flex-col items-center text-[10px] font-bold">
                                <div className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: VISIT_COLORS[i] }} />
                                    <span className="text-muted-foreground">{d.name}</span>
                                </div>
                                <span className="text-sm">{d.value}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
