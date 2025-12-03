// Updated src/components/AdminDashboard.tsx
import { useState } from 'react';
import { UserManagement } from './Admin/UserManagement';
import { BookInventory } from './Admin/BookInventory';
import { RentalManagement } from './Admin/RentalManagement';
import { TransactionHistory } from './Admin/TransactionHistory';
import { SystemSettings } from './Admin/SystemSettings';
import { CommunityManagement } from './Admin/CommunityManagement';
import { Button } from './ui/button';
import { Users, BookOpen, Calendar, DollarSign, Settings, LogOut, BarChart3, Shield, MessageCircle, Bell } from 'lucide-react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  const tabs = [
    { id: 'users', label: 'User Management', icon: Users, path: '/admin/dashboard' },
    { id: 'books', label: 'Book Inventory', icon: BookOpen, path: '/admin/dashboard/books' },
    { id: 'rentals', label: 'Rental Management', icon: Calendar, path: '/admin/dashboard/rentals' },
    { id: 'transactions', label: 'Transaction History', icon: DollarSign, path: '/admin/dashboard/transactions' },
    { id: 'communities', label: 'Communities', icon: MessageCircle, path: '/admin/dashboard/communities' },
    { id: 'announcements', label: 'Announcements', icon: Bell, path: '/admin/dashboard/announcements' },
    { id: 'settings', label: 'System Settings', icon: Settings, path: '/admin/dashboard/settings' },
  ];

  const activeTab = tabs.find(tab =>
    tab.path === currentPath || (tab.path === '/admin/dashboard' && currentPath === '/admin/dashboard')
  ) || tabs[0];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2C3E50] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#C4A672] rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">BookBloom</h1>
              <p className="text-xs text-white/70">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                end={tab.path === '/admin/dashboard'}
                className={({ isActive }) => `w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#C4A672] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{tab.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Admin Info & Logout */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-[#C4A672] rounded-full flex items-center justify-center">
              <span>AD</span>
            </div>
            <div>
              <p className="text-sm">Admin User</p>
              <p className="text-xs text-white/70">admin@bookbloom.com</p>
            </div>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[#2C3E50] text-2xl mb-1">
                {activeTab.label}
              </h2>
              <p className="text-gray-600 text-sm">
                Manage and monitor your BookBloom platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl text-[#C4A672]">$12,450</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-xl text-[#2C3E50]">1,234</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}