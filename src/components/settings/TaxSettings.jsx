import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import GstRateDialog from '@/components/products/GstRateDialog';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Spinner from '../Spinner';
import { TableSkeleton } from '@/components/ui/SkeletonLoaders';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const TaxSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gstRates, setGstRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rateToDelete, setRateToDelete] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data } = await api.get('/gst-rates');
        setGstRates(data);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching GST rates' });
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, [refreshKey, user, toast]);

  const confirmDelete = async () => {
    if (!rateToDelete) return;

    try {
      // Backend handles usage check and returns error if used
      await api.delete(`/gst-rates/${rateToDelete._id}`);
      toast({ title: 'Success!', description: 'GST rate deleted.' });
      setRefreshKey(k => k + 1);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error deleting rate',
        description: error.response?.data?.message || 'Usage restriction or server error.'
      });
    }
    setRateToDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Tax Settings</CardTitle>
            <CardDescription>Manage your default GST rates.</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Rate</Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            {loading ? <TableSkeleton /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rate Name</TableHead>
                    <TableHead>Rate (%)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gstRates.length > 0 ? gstRates.map(rate => (
                    <TableRow key={rate._id}>
                      <TableCell>{rate.name}</TableCell>
                      <TableCell>{rate.rate}%</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => setRateToDelete(rate)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan="3" className="text-center h-24">No GST rates found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>

        <GstRateDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={() => setRefreshKey(k => k + 1)} />
      </Card>

      <AlertDialog open={!!rateToDelete} onOpenChange={() => setRateToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the GST rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TaxSettings;
