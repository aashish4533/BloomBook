import { useState } from 'react';
import { UserProfile } from './User/UserProfile';
import { PurchaseHistory } from './User/PurchaseHistory';
import { SalesHistory } from './User/SalesHistory';
import { RentalHistory } from './User/RentalHistory';
import { Wishlist } from './User/Wishlist';
import { UserCommunities } from './User/UserCommunities';
import { UserChats } from './User/UserChats';
import { Button } from './ui/button';
import { User, ShoppingBag, DollarSign, Calendar, Heart, BookOpen, LogOut, Users, MessageCircle } from 'lucide-react';

interface UserDashboardProps {
  onLogout: () => void;
  onNavigateToMarketplace: () => void;
  onNavigateToRent: () => void;
  onNavigateToSell: () => void;
  onNavigateToCommunities?: () => void;
}

export function UserDashboard({ onLogout, onNavigateToMarketplace, onNavigateToRent, onNavigateToSell, onNavigateToCommunities }: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'purchases' | 'sales' | 'rentals' | 'wishlist' | 'communities' | 'chats'>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'purchases' as const, label: 'Purchases', icon: ShoppingBag },
    { id: 'sales' as const, label: 'Sales', icon: DollarSign },
    { id: 'rentals' as const, label: 'Rentals', icon: Calendar },
    { id: 'wishlist' as const, label: 'Wishlist', icon: Heart },
    { id: 'communities' as const, label: 'Communities', icon: Users },
    { id: 'chats' as const, label: 'Chats', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#C4A672] rounded-lg flex items-center justify-center text-white">
              <span>BO</span>
            </div>
            <h1 className="text-[#2C3E50] text-2xl">BookOra</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onNavigateToMarketplace}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse Books
            </Button>
            <Button
              variant="outline"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-[#C4A672] to-[#8B7355] rounded-2xl p-8 text-white mb-8">
          <h2 className="text-3xl mb-2">Welcome back, User!</h2>
          <p className="text-white/90 mb-6">Manage your books, view history, and explore new titles</p>
          <div className="flex gap-3">
            <Button
              onClick={onNavigateToMarketplace}
              className="bg-white text-[#C4A672] hover:bg-white/90"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Buy Books
            </Button>
            <Button
              onClick={onNavigateToRent}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Rent Books
            </Button>
            <Button
              onClick={onNavigateToSell}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Sell Books
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex gap-2 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#C4A672] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'profile' && <UserProfile />}
          {activeTab === 'purchases' && <PurchaseHistory />}
          {activeTab === 'sales' && <SalesHistory />}
          {activeTab === 'rentals' && <RentalHistory />}
          {activeTab === 'wishlist' && <Wishlist onNavigateToMarketplace={onNavigateToMarketplace} />}
          {activeTab === 'communities' && <UserCommunities onNavigateToCommunity={onNavigateToCommunities} onNavigateToCreate={onNavigateToCommunities} />}
          {activeTab === 'chats' && <UserChats />}
        </div>
      </div>
    </div>
  );
}
