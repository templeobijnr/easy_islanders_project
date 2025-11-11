/**
 * User Account Dropdown - Easy Islanders
 *
 * A customized dropdown menu for user account actions.
 * Use this in the Header component or navigation bar.
 *
 * Features:
 * - Profile, Bookings, Requests navigation
 * - Settings and preferences
 * - Logout action
 * - Responsive design with Easy Islanders brand colors
 */

import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import {
  User,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export function UserAccountDropdown() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();

  const onLogout = async () => {
    await handleLogout();
    navigate('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-semibold">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.username || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user?.email || 'user@example.com'}</p>
            <div className="mt-1">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary capitalize">
                {user?.user_type || 'consumer'}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/bookings')}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>My Bookings</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/requests')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>My Requests</span>
          </DropdownMenuItem>
          {user?.user_type === 'seller' && (
            <DropdownMenuItem onClick={() => navigate('/listings')}>
              <Home className="mr-2 h-4 w-4" />
              <span>My Listings</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open('/help', '_blank')}>
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserAccountDropdown;
