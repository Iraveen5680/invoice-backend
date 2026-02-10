import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Spinner from '@/components/Spinner';

const InvoiceHeader = ({ title, onSave, saving }) => {
    const navigate = useNavigate();
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{title}</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button 
                    onClick={() => onSave('Pending')} 
                    disabled={saving}
                    className="hidden sm:inline-flex"
                >
                    {saving ? <Spinner size="sm" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Invoice
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                         <Button
                            variant="outline"
                            className="sm:hidden"
                            disabled={saving}
                        >
                            <Save className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSave('Pending')} disabled={saving}>
                            Save Invoice
                        </DropdownMenuItem>
                         <DropdownMenuItem onClick={() => onSave('Draft')} disabled={saving}>
                            Save as Draft
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="hidden sm:inline-flex"
                        >
                           <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onSave('Draft')} disabled={saving}>
                            Save as Draft
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </div>
    );
};

export default InvoiceHeader;