
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Search, LogOut, User, Users, Package, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const SearchResultItem = ({ icon, title, subtitle, onClick }) => {
    const Icon = icon;
    return (
        <div
            className="flex items-center p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md cursor-pointer"
            onClick={onClick}
        >
            <Icon className="h-5 w-5 mr-3 text-muted-foreground" />
            <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );
};

const Header = ({ onMenuClick }) => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const searchInputRef = useRef(null);

    const getInitials = (email) => {
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    };

    const performSearch = useCallback(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);

        try {
            const [customersRes, partiesRes, productsRes, invoicesRes] = await Promise.all([
                api.get('/customers', { params: { search: query, limit: 3 } }),
                api.get('/parties', { params: { search: query, limit: 3 } }),
                api.get('/products', { params: { search: query, limit: 3 } }),
                api.get('/invoices', { params: { search: query, limit: 3 } })
            ]);

            const results = [
                ...(customersRes.data || []).slice(0, 3).map(item => ({ type: 'Customer', ...item })),
                ...(partiesRes.data || []).slice(0, 3).map(item => ({ type: 'Party', ...item })),
                ...(productsRes.data || []).slice(0, 3).map(item => ({ type: 'Product', ...item })),
                ...(invoicesRes.data || []).slice(0, 3).map(item => ({ type: 'Invoice', ...item })),
            ];

            setSearchResults(results);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery, performSearch]);

    const handleResultClick = (item) => {
        switch (item.type) {
            case 'Customer': navigate(`/customers`); break;
            case 'Party': navigate(`/parties`); break;
            case 'Product': navigate(`/products`); break;
            case 'Invoice': navigate(`/invoices/edit/${item._id}`); break;
            default: break;
        }
        setSearchQuery('');
        setIsPopoverOpen(false);
    };

    return (
        <header className="bg-white dark:bg-background/95 backdrop-blur-xl sticky top-0 z-40 flex h-16 sm:h-20 items-center gap-2 sm:gap-4 px-3 sm:px-10 border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-all duration-300">
            {/* Mobile: Menu Toggle */}
            <div className="flex items-center md:hidden">
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onMenuClick}>
                    <Menu className="h-5 w-5" />
                </Button>
            </div>

            {/* Search Bar - Responsive */}
            <div className="flex-1 flex justify-center max-w-3xl mx-auto">
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative w-full group">
                            <Search className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search..."
                                className="pl-10 sm:pl-14 pr-10 h-10 sm:h-12 bg-accent/20 border border-border/50 rounded-xl sm:rounded-2xl focus-visible:ring-2 focus-visible:ring-primary/20 transition-all font-semibold text-xs sm:text-sm placeholder:text-muted-foreground/60 shadow-sm hover:border-border"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onClick={() => setIsPopoverOpen(true)}
                            />
                            {isSearching && <Loader2 className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-2xl premium-shadow border-border/50">
                        {searchResults.length > 0 && (
                            <div className="space-y-1">
                                {searchResults.map((item) => {
                                    if (item.type === 'Customer') return <SearchResultItem key={`cust-${item._id}`} icon={User} title={item.name} subtitle={item.email} onClick={() => handleResultClick(item)} />;
                                    if (item.type === 'Party') return <SearchResultItem key={`party-${item._id}`} icon={Users} title={item.name} subtitle={item.email} onClick={() => handleResultClick(item)} />;
                                    if (item.type === 'Product') return <SearchResultItem key={`prod-${item._id}`} icon={Package} title={item.name} subtitle={`₹${item.sale_price}`} onClick={() => handleResultClick(item)} />;
                                    if (item.type === 'Invoice') return <SearchResultItem key={`inv-${item._id}`} icon={FileText} title={item.invoice_number} subtitle={`₹${item.total_amount}`} onClick={() => handleResultClick(item)} />;
                                    return null;
                                })}
                            </div>
                        )}
                        {!isSearching && searchQuery.length > 1 && searchResults.length === 0 && (
                            <p className="p-4 text-center text-sm text-muted-foreground">No results found.</p>
                        )}
                    </PopoverContent>
                </Popover>
            </div>

            {/* Right Side: Profile */}
            <div className="flex items-center gap-1 sm:gap-2">


                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-primary/10 p-0 overflow-hidden hover:scale-105 transition-transform">
                            <Avatar className="h-full w-full">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs sm:text-sm">
                                    {getInitials(user?.email)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 rounded-xl premium-shadow border-border/50" align="end">
                        <DropdownMenuLabel className="font-bold py-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm leading-none">My Account</p>
                                <p className="text-xs font-medium text-muted-foreground truncate">{user?.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={signOut} className="text-red-500 focus:text-red-500 focus:bg-red-50/10 cursor-pointer py-2.5">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span className="font-bold">Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header >
    );
};

export default Header;
