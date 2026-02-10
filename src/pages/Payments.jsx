import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import PaymentList from '@/components/payments/PaymentList';
import AddPaymentDialog from '@/components/payments/AddPaymentDialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Plus } from 'lucide-react';

const Payments = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const handlePaymentAdded = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <Layout>
      <Helmet>
        <title>Payments - Invoice Management System</title>
        <meta name="description" content="Track and manage all payment transactions" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments Received</h1>
            <p className="text-muted-foreground mt-1">Track and manage all payment transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setRefreshKey(k => k + 1)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </Button>
          </div>
        </motion.div>

        <PaymentList refreshKey={refreshKey} />
      </div>

      <AddPaymentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onPaymentAdded={handlePaymentAdded}
      />
    </Layout>
  );
};

export default Payments;