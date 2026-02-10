import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarPlus as CalendarIcon, Plus, Users, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InvoiceTopSection = ({
    billToType, setBillToType,
    customerId, setCustomerId, customers,
    partyId, setPartyId, parties,
    issueDate, setIssueDate,
    showDueDate, setShowDueDate,
    paymentTerms, setPaymentTerms,
    dueDate, setDueDate
}) => {
    const navigate = useNavigate();

    const handlePaymentTermsChange = (value) => {
        setPaymentTerms(value);
        if (issueDate && value && value !== 'custom') { // Only calculate if a specific term is selected
            const newDueDate = new Date(issueDate);
            newDueDate.setDate(newDueDate.getDate() + parseInt(value));
            setDueDate(newDueDate.toISOString().split('T')[0]);
        } else if (value === 'custom') {
            // Do nothing, user will pick manually
        } else {
            // If value is null/undefined (e.g., initial state or cleared), clear due date
            setDueDate(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-2 lg:col-span-1">
                <Label htmlFor="customer">Bill To</Label>
                <Tabs value={billToType} onValueChange={setBillToType} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="customer" className="gap-2"><Users className="h-4 w-4" /> Customer</TabsTrigger>
                        <TabsTrigger value="party" className="gap-2"><UserCheck className="h-4 w-4" /> Party</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                    {billToType === 'customer' ? (
                        <Select onValueChange={setCustomerId} value={customerId}>
                            <SelectTrigger id="customer" className="border-slate-400"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                            <SelectContent>
                                {customers.map(c => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Select onValueChange={setPartyId} value={partyId}>
                            <SelectTrigger id="party" className="border-slate-400"><SelectValue placeholder="Select Party" /></SelectTrigger>
                            <SelectContent>
                                {parties.map(p => <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}

                    <Button type="button" variant="outline" size="icon" onClick={() => navigate(billToType === 'customer' ? '/customers' : '/parties')}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal border-slate-400", !issueDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {issueDate ? format(new Date(issueDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={new Date(issueDate)} onSelect={(d) => setIssueDate(d.toISOString().split('T')[0])} initialFocus /></PopoverContent>
                </Popover>
            </div>

            <div className="space-y-2">
                <div className="flex items-center space-x-2 h-9">
                    <Checkbox id="showDueDate" checked={showDueDate} onCheckedChange={setShowDueDate} />
                    <Label htmlFor="showDueDate">Payment Terms</Label>
                </div>
                {showDueDate ? (
                    <Select onValueChange={handlePaymentTermsChange} value={paymentTerms || 'custom'}> {/* Default to 'custom' if paymentTerms is empty */}
                        <SelectTrigger className="border-slate-400"><SelectValue placeholder="Select Terms" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="custom">Custom Date</SelectItem> {/* Changed value to 'custom' */}
                            <SelectItem value="15">Net 15</SelectItem>
                            <SelectItem value="30">Net 30</SelectItem>
                            <SelectItem value="45">Net 45</SelectItem>
                            <SelectItem value="60">Net 60</SelectItem>
                        </SelectContent>
                    </Select>
                ) : <div className="h-10" />}
            </div>

            <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal border-slate-400", !dueDate && "text-muted-foreground")} disabled={!showDueDate || paymentTerms !== 'custom'}> {/* Enable only for 'custom' */}
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dueDate ? format(new Date(dueDate), "PPP") : <span>Pick a date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dueDate ? new Date(dueDate) : null} onSelect={(d) => d && setDueDate(d.toISOString().split('T')[0])} initialFocus /></PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

export default InvoiceTopSection;