import { useState } from 'react';
import { UserManagement } from './Admin/UserManagement';
import { BookInventory } from './Admin/BookInventory';
import { RentalManagement } from './Admin/RentalManagement';
import { TransactionHistory } from './Admin/TransactionHistory';
import { SystemSettings } from './Admin/SystemSettings';
import { CommunityManagement } from './Admin/CommunityManagement';
import { Button } from './ui/button';
import { Users, BookOpen, Calendar, DollarSign, Settings, LogOut, BarChart3, Shield, MessageCircle, Bell } from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'rentals' | 'transactions' | 'communities' | 'announcements' | 'settings'>('users');

  const tabs = [
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'books' as const, label: 'Book Inventory', icon: BookOpen },
    { id: 'rentals' as const, label: 'Rental Management', icon: Calendar },
    { id: 'transactions' as const, label: 'Transaction History', icon: DollarSign },
    { id: 'communities' as const, label: 'Communities', icon: MessageCircle },
    { id: 'announcements' as const, label: 'Announcements', icon: Bell },
    { id: 'settings' as const, label: 'System Settings', icon: Settings },
  ];

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
              <h1 className="text-xl">BookOra</h1>
              <p className="text-xs text-white/70">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#C4A672] text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{tab.label}</span>
              </button>
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
              <p className="text-xs text-white/70">admin@bookora.com</p>
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
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-gray-600 text-sm">
                Manage and monitor your BookOra platform
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
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'books' && <BookInventory />}
          {activeTab === 'rentals' && <RentalManagement />}
          {activeTab === 'transactions' && <TransactionHistory />}
          {activeTab === 'communities' && <CommunityManagement />}
          {activeTab === 'announcements' && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl text-gray-700 mb-2">Announcements Management</h3>
              <p className="text-gray-500 mb-4">Manage announcements from the main Announcements page</p>
              <Button className="bg-[#C4A672] hover:bg-[#8B7355] text-white">
                Go to Announcements
              </Button>
            </div>
          )}
          {activeTab === 'settings' && <SystemSettings />}
        </div>
      </main>
    </div>
  );
}