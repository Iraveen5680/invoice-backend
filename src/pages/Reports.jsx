import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/Layout';
import InvoiceAnalytics from '@/components/reports/InvoiceAnalytics';
import CustomerAnalytics from '@/components/reports/CustomerAnalytics';
import PaymentAnalytics from '@/components/reports/PaymentAnalytics';
import PartyAnalytics from '@/components/reports/PartyAnalytics';

const Reports = () => {
    return (
        <Layout>
            <Helmet>
                <title>Reports - Invoice Management</title>
                <meta name="description" content="View and export detailed reports" />
            </Helmet>

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Reports Dashboard</h1>
                    <p className="text-slate-600 mt-1">Comprehensive overview of your business analytics</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InvoiceAnalytics />
                    <CustomerAnalytics />
                    <PaymentAnalytics />
                    <PartyAnalytics />
                </div>
            </div>
        </Layout>
    );
};

export default Reports;