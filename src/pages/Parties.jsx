import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import Spinner from '@/components/Spinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Edit, Trash2 } from 'lucide-react';
import CustomerDialog from '@/components/customers/CustomerDialog'; // Re-using for parties
import CustomerViewDialog from '@/components/customers/CustomerViewDialog'; // Re-using for parties
import { useAuth } from '@/contexts/AuthContext';

const Parties = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingParty, setEditingParty] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partyToDelete, setPartyToDelete] = useState(null);
  const [partyToView, setPartyToView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const filteredParties = React.useMemo(() => {
    if (!searchTerm) return parties;
    return parties.filter(party =>
      party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.email && party.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (party.phone && party.phone.includes(searchTerm))
    );
  }, [parties, searchTerm]);

  useEffect(() => {
    const fetchParties = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/parties');
        setParties(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error fetching parties',
          description: error.response?.data?.message || error.message,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchParties();
  }, [toast, refreshKey]);

  const handleSave = () => {
    setIsDialogOpen(false);
    setEditingParty(null);
    setRefreshKey(oldKey => oldKey + 1);
  };

  const handleAddNew = () => {
    setEditingParty(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (party) => {
    setEditingParty(party);
    setIsDialogOpen(true);
  };

  const handleViewDetails = (party) => {
    setPartyToView(party);
  };

  const handleDelete = async () => {
    if (!partyToDelete) return;

    try {
      await api.delete(`/parties/${partyToDelete._id}`);
      toast({ title: 'Success!', description: 'Party deleted.' });
      setParties(parties.filter(p => p._id !== partyToDelete._id));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting party',
        description: error.response?.data?.message || error.message,
      });
    }
    setPartyToDelete(null);
  };

  const partySaveOverride = useCallback(async (formData, isEditMode) => {
    const dataToSave = { ...formData };
    delete dataToSave._id;
    delete dataToSave.user_id;

    try {
      let res;
      if (isEditMode) {
        res = await api.put(`/parties/${editingParty._id}`, dataToSave);
      } else {
        res = await api.post('/parties', dataToSave);
      }
      return { data: res.data };
    } catch (error) {
      return { error: { message: error.response?.data?.message || error.message } };
    }
  }, [editingParty]);

  return (
    <Layout>
      <Helmet>
        <title>Parties - Invoice Management</title>
        <meta name="description" content="Manage all your business parties" />
      </Helmet>

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Parties</h1>
            <p className="text-slate-600 mt-1">Manage all your business parties</p>
          </div>
          <Button onClick={handleAddNew} className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Add New Party
          </Button>
        </motion.div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            className="w-full max-w-sm pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading && parties.length === 0 ? (
          <div className="flex justify-center items-center p-8"><Spinner /></div>
        ) : filteredParties.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            {parties.length > 0 ? "No parties match your search." : "No parties found."}
            <Button variant="link" onClick={handleAddNew}>Add one to get started!</Button>
          </div>
        ) : (
          <motion.div
            layout
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Phone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">GST No.</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredParties.map((party) => (
                    <motion.tr
                      key={party._id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{party.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{party.email || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{party.phone || '-'}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{party.gst_no || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(party)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(party)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setPartyToDelete(party)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {isDialogOpen && (
          <CustomerDialog
            open={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            onSave={handleSave}
            customerData={editingParty}
            _onSaveOverride={partySaveOverride}
            _dialogTitle={editingParty ? "Edit Party" : "Add New Party"}
          />
        )}

        {partyToView && (
          <CustomerViewDialog
            open={!!partyToView}
            onOpenChange={() => setPartyToView(null)}
            customer={partyToView}
            _fetchInvoicesOverride={async (partyId) => {
              const { data } = await api.get('/payments', { params: { party_id: partyId } });
              return { data };
            }}
          />
        )}

        <AlertDialog open={!!partyToDelete} onOpenChange={() => setPartyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the party. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
};

export default Parties;
