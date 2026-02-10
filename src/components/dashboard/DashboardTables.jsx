import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, TrendingUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';

const DashboardTables = ({ invoices = [], products = [] }) => {
    const navigate = useNavigate();

    const recentOrders = invoices.slice(-4).reverse().map(inv => ({
        id: inv._id,
        name: inv.invoice_number,
        time: inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : 'Today',
        amount: `₹${inv.total_amount?.toLocaleString()}`,
        status: inv.status || 'Pending',
        image: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=50&h=50&fit=crop'
    }));

    const trendingItems = products.slice(-2).reverse().map(prod => ({
        id: prod._id,
        name: prod.name,
        stock: `In stock ${prod.quantity || 0}`,
        price: `₹${prod.sale_price?.toLocaleString()}`,
        image: prod.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop'
    }));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none premium-shadow bg-card h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        <CardTitle className="text-xl font-bold">Recent Invoices</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary font-bold"
                        onClick={() => navigate('/invoices')}
                    >
                        See All
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {recentOrders.length > 0 ? recentOrders.map((order) => (
                            <motion.div
                                key={order.id}
                                className="flex items-center justify-between group cursor-pointer"
                                whileHover={{ x: 5 }}
                                onClick={() => navigate(`/invoices/view/${order.id}`)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl overflow-hidden border bg-muted">
                                        <img src={order.image} alt={order.name} className="h-full w-full object-cover" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-tight">{order.name}</span>
                                        <span className="text-xs text-muted-foreground">{order.time}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-sm text-primary">{order.amount}</div>
                                    <Badge variant="secondary" className={cn(
                                        "mt-1 text-[10px] px-1.5 py-0 h-4 border-none font-bold",
                                        order.status === 'Paid' ? "bg-green-500/10 text-green-500" :
                                            order.status === 'Overdue' ? "bg-red-500/10 text-red-500" :
                                                "bg-orange-500/10 text-orange-500"
                                    )}>
                                        {order.status}
                                    </Badge>
                                </div>
                            </motion.div>
                        )) : <p className="text-xs text-muted-foreground text-center py-4">No invoices yet</p>}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none premium-shadow bg-card h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-500" />
                        <CardTitle className="text-xl font-bold">Trending Products</CardTitle>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground font-bold"
                        onClick={() => navigate('/products')}
                    >
                        See All
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {trendingItems.length > 0 ? trendingItems.map((item) => (
                            <motion.div
                                key={item.id}
                                className="flex items-center gap-4 group cursor-pointer p-3 rounded-2xl hover:bg-muted/50 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                onClick={() => navigate('/products')}
                            >
                                <div className="h-20 w-32 rounded-xl overflow-hidden shadow-md">
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className="font-bold text-md leading-tight">{item.name}</h4>
                                    <div className="flex items-center gap-1.5">
                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                        <p className="text-xs text-muted-foreground font-medium">{item.stock}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-primary">{item.price}</div>
                            </motion.div>
                        )) : <p className="text-xs text-muted-foreground text-center py-4">No products yet</p>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardTables;
