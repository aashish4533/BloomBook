import { Menu, Sun, User, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface HeaderProps {
  onToggleAuth: () => void;
  showLogin: boolean;
  onNavigateToMarketplace: () => void;
  onNavigateToUserDashboard?: () => void;
  onNavigateToAdminLogin?: () => void;
  isLoggedIn?: boolean;
}

export function Header({ 
  onToggleAuth, 
  showLogin, 
  onNavigateToMarketplace,
  onNavigateToUserDashboard,
  onNavigateToAdminLogin,
  isLoggedIn = false
}: HeaderProps) {
  return (
    <header className="bg-[#C4A672] px-6 py-4">
      <div className="flex items-center justify-between gap-6">
        <button className="p-1">
          <Menu className="w-6 h-6 text-[#3D3D3D]" />
        </button>
        
        <nav className="flex items-center gap-8">
          <button onClick={onNavigateToMarketplace} className="text-[#3D3D3D] hover:opacity-80">Home</button>
          <button onClick={onNavigateToMarketplace} className="text-[#3D3D3D] hover:opacity-80">Buy</button>
          <a href="#" className="text-[#3D3D3D] hover:opacity-80">Rent</a>
          <a href="#" className="text-[#3D3D3D] hover:opacity-80">Sell</a>
          <a href="#" className="text-[#3D3D3D] hover:opacity-80">Announcements</a>
          <a href="#" className="text-[#3D3D3D] hover:opacity-80">About</a>
          <a href="#" className="text-[#3D3D3D] hover:opacity-80">Contact</a>
        </nav>

        <div className="flex items-center gap-4 ml-auto">
          {isLoggedIn ? (
            <button 
              onClick={onNavigateToUserDashboard}
              className="flex items-center gap-2 text-[#3D3D3D] hover:opacity-80 px-4"
            >
              <User className="w-4 h-4" />
              My Account
            </button>
          ) : (
            <>
              <button 
                onClick={onToggleAuth}
                className="text-[#3D3D3D] hover:opacity-80 px-4"
              >
                {showLogin ? 'Login' : 'Register'}
              </button>
              <button 
                onClick={onToggleAuth}
                className="text-[#3D3D3D] hover:opacity-80 px-4"
              >
                {showLogin ? 'Register' : 'Login'}
              </button>
            </>
          )}
          <button 
            onClick={onNavigateToAdminLogin}
            className="flex items-center gap-2 text-[#3D3D3D] hover:opacity-80 px-4"
            title="Admin Portal"
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
          <Input 
            type="text" 
            placeholder="Search..." 
            className="w-48 bg-white border-gray-300"
          />
          <button className="p-1">
            <Sun className="w-5 h-5 text-[#3D3D3D]" />
          </button>
        </div>
      </div>
    </header>
  );
}