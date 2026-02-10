import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const InvoiceSettings = () => {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Invoice Defaults</CardTitle>
            <CardDescription>Manage default settings for your invoices.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-slate-500">
                All invoice default settings have been moved to the "Customization" tab for a more streamlined experience.
            </p>
        </CardContent>
    </Card>
  );
};

export default InvoiceSettings;