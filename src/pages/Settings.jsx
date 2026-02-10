import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import SettingsTabs from '@/components/settings/SettingsTabs';

const Settings = () => {
  return (
    <Layout>
      <Helmet>
        <title>Settings - Invoice Management System</title>
        <meta name="description" content="Configure your account and business settings" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your account, business, and invoicing preferences.</p>
        </motion.div>

        <SettingsTabs />
      </div>
    </Layout>
  );
};

export default Settings;