import React from 'react';
import { motion } from 'framer-motion';
import { FileText, TrendingUp, Users, DollarSign, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const ReportCards = () => {
  const { toast } = useToast();

  const reports = [
    { title: 'Sales Report', icon: TrendingUp, description: 'View detailed sales analytics', color: 'bg-blue-500' },
    { title: 'GST Report', icon: FileText, description: 'Generate GST compliance reports', color: 'bg-green-500' },
    { title: 'Customer Ledger', icon: Users, description: 'Track customer transactions', color: 'bg-purple-500' },
    { title: 'Outstanding Report', icon: DollarSign, description: 'View pending payments', color: 'bg-orange-500' },
    { title: 'Profit & Loss', icon: TrendingUp, description: 'Analyze profit margins', color: 'bg-red-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reports.map((report, index) => (
        <motion.div
          key={report.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
        >
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${report.color} mb-4`}>
            <report.icon className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{report.title}</h3>
          <p className="text-sm text-slate-600 mb-4">{report.description}</p>
          <Button 
            className="w-full gap-2"
            onClick={() => toast({ description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀" })}
          >
            <Download className="w-4 h-4" />
            Generate Report
          </Button>
        </motion.div>
      ))}
    </div>
  );
};

export default ReportCards;