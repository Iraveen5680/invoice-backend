import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  X, LayoutDashboard, FileText, Users, UserCheck,
  Box, Wallet, BarChart, Settings, LogOut, PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Invoices', path: '/invoices', icon: FileText },
  { name: 'Customers', path: '/customers', icon: Users },
  { name: 'Parties', path: '/parties', icon: UserCheck },
  { name: 'Products', path: '/products', icon: Box },
  { name: 'Payments', path: '/payments', icon: Wallet },
  { name: 'Expenses', path: '/expenses', icon: PieChart },
  { name: 'Reports', path: '/reports', icon: BarChart },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { signOut, companyProfile, user } = useAuth();
  const logoUrl = companyProfile?.logo_url;
  const siteName = companyProfile?.site_name || "Invoice Pro";

  const getInitials = (email) => {
    if (!email) return "U";
    return email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const SidebarItem = ({ link }) => {
    const Icon = link.icon;
    return (
      <NavLink
        to={link.path}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center rounded-lg py-2.5 transition-all duration-200 group relative justify-start px-3 gap-3",
            isActive
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )
        }
      >
        <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
        <span className="font-medium whitespace-nowrap overflow-hidden">
          {link.name}
        </span>
      </NavLink>
    );
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r bg-card shadow-xl transition-all duration-300 md:relative md:translate-x-0 md:shadow-none w-64",
          !isOpen && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center px-4 justify-between border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">I</div>
            )}
            <h2 className="text-lg font-bold truncate transition-colors">{siteName}</h2>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navLinks.map((link) => (
            <SidebarItem key={link.name} link={link} />
          ))}
        </nav>

        <div className="p-3 mt-auto space-y-2 border-t bg-card/30 backdrop-blur-md">
          <div className="flex items-center rounded-xl p-2 bg-accent/50 border border-border/50 transition-all duration-300 justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {getInitials(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col truncate">
                <span className="text-sm font-semibold truncate leading-tight">My Account</span>
                <span className="text-xs text-muted-foreground truncate leading-tight text-[10px]">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-row justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50/10 rounded-lg group"
                >
                  <LogOut className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10}>Sign Out</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default Sidebar;
