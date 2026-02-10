import React from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, ShoppingCart, Ban, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";


const StatCard = ({ stat, index }) => {
    const Icon = stat.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="overflow-hidden border-none premium-shadow bg-card hover:scale-[1.02] transition-transform duration-300">
                <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-3 rounded-2xl text-white shadow-lg", stat.color)}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className={cn(
                            "flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-full",
                            stat.isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                        )}>
                            {stat.change}
                            {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <h3 className="text-2xl font-bold tracking-tight">{stat.value}</h3>
                        <p className="text-sm font-bold text-muted-foreground">{stat.title}</p>
                    </div>

                    {stat.progress !== undefined && (
                        <div className="mt-4 space-y-2">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stat.progress}%` }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className={cn("h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]", stat.color.replace('bg-', 'bg-'))}
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground text-right">{stat.subtitle}</p>
                        </div>
                    )}

                    {stat.progress === undefined && (
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

const DashboardStats = ({ data }) => {
    const stats = [
        {
            title: 'Customers',
            value: data?.totalCustomers || '0',
            change: '+100%',
            isPositive: true,
            icon: Users,
            color: 'bg-blue-500',
            progress: Math.min(((data?.totalCustomers || 0) / 100) * 100, 100),
            subtitle: 'Total registered'
        },
        {
            title: 'Invoices',
            value: data?.totalInvoices || '0',
            change: '+100%',
            isPositive: true,
            icon: ShoppingCart,
            color: 'bg-purple-500',
            progress: Math.min(((data?.totalInvoices || 0) / 50) * 100, 100),
            subtitle: 'Issued so far'
        },
        {
            title: 'Products',
            value: data?.totalProducts || '0',
            change: 'Active',
            isPositive: true,
            icon: FileText,
            color: 'bg-orange-500',
            progress: Math.min(((data?.totalProducts || 0) / 20) * 100, 100),
            subtitle: 'In inventory'
        },
        {
            title: 'Total Revenue',
            value: `₹${(data?.totalRevenue || 0).toLocaleString()}`,
            change: 'Growth',
            isPositive: true,
            icon: FileText,
            color: 'bg-green-500',
            subtitle: 'From paid invoices'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <StatCard key={stat.title} stat={stat} index={index} />
            ))}
        </div>
    );
};

export default DashboardStats;
