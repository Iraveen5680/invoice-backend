import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import DashboardStats from '@/components/dashboard/DashboardStats';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoaders';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    invoices: [],
    customers: [],
    products: [],
    payments: [],
  });
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);

      try {
        const [invoicesRes, customersRes, productsRes, paymentsRes] = await Promise.all([
          api.get('/invoices'),
          api.get('/customers'),
          api.get('/products'),
          api.get('/payments'),
        ]);

        const invoices = invoicesRes.data || [];
        const customers = customersRes.data || [];
        const products = productsRes.data || [];
        const payments = paymentsRes.data || [];

        const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

        setData({ invoices, customers, products, payments });
        setStats({
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalRevenue: totalRevenue,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <Layout><DashboardSkeleton /></Layout>;

  return (
    <Layout>
      <Helmet>
        <title>Dashboard | Invoice Pro</title>
        <meta name="description" content="Manage your invoices, customers, products and payments efficiently" />
      </Helmet>

      <div className="space-y-10 pb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col justify-start gap-2"
        >
          <h1 className="text-4xl font-black tracking-tighter">Dashboard</h1>
          <p className="text-muted-foreground font-semibold text-lg">
            Welcome back, <span className="text-primary">{user?.name || user?.email}</span> !
          </p>
        </motion.div>

        {/* Premium Stats Grid */}
        <div className="w-full">
          <DashboardStats data={stats} />
        </div>

        {/* Charts & Analytics */}
        <div className="w-full">
          <DashboardCharts
            invoices={data.invoices}
            payments={data.payments}
            customers={data.customers}
          />
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
