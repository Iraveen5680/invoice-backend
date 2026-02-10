import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const QuickActions = () => {
  const actions = [
    { label: 'New Invoice', icon: FileText, color: 'bg-blue-500', path: '/invoices/new' },
    { label: 'Add Customer', icon: Users, color: 'bg-green-500', path: '/customers' },
    { label: 'Add Product', icon: Package, color: 'bg-purple-500', path: '/products' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-card rounded-xl p-6 shadow-sm border"
    >
      <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
          >
            <Button
              asChild
              className="w-full justify-start gap-3 h-auto py-4"
              variant="outline"
            >
              <Link to={action.path}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium">{action.label}</span>
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default QuickActions;