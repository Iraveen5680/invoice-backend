import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Spinner from '@/components/Spinner';

const StatsCard = ({ title, value, icon: Icon, color, index, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-card rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          {loading ? (
            <div className="mt-2"><Spinner size="small" /></div>
          ) : (
            <p className="text-2xl font-bold text-foreground">{value}</p>
          )}
        </div>
        <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;