import React from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BusinessSettings from '@/components/settings/BusinessSettings';
import TaxSettings from '@/components/settings/TaxSettings';
import MyAccountSettings from './MyAccountSettings';
import InvoiceCustomization from './InvoiceCustomization';

const SettingsTabs = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-transparent"
    >
      <Tabs defaultValue="business" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="invoice_customization">Customization</TabsTrigger>
          <TabsTrigger value="account">My Account</TabsTrigger>
        </TabsList>
        <TabsContent value="business">
          <BusinessSettings />
        </TabsContent>
        <TabsContent value="tax">
            <div className="pt-6 space-y-8">
                 <TaxSettings />
            </div>
        </TabsContent>
        <TabsContent value="invoice_customization">
            <InvoiceCustomization />
        </TabsContent>
        <TabsContent value="account">
            <MyAccountSettings />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default SettingsTabs;