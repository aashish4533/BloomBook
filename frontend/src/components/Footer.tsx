import { Input } from './ui/input';
import { Button } from './ui/button';

interface FooterProps {
  onNavigateToAbout?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToRent?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToAnnouncements?: () => void;
}

export function Footer({ onNavigateToAbout, onNavigateToBuy, onNavigateToRent, onNavigateToSell, onNavigateToAnnouncements }: FooterProps) {
  return (
    <footer className="bg-[#2C3E50] text-white py-8 px-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-center gap-8 mb-4">
          <button onClick={onNavigateToBuy} className="hover:opacity-80 transition-opacity">Buy</button>
          <button onClick={onNavigateToRent} className="hover:opacity-80 transition-opacity">Rent</button>
          <button onClick={onNavigateToSell} className="hover:opacity-80 transition-opacity">Resell</button>
          <button onClick={onNavigateToAnnouncements} className="hover:opacity-80 transition-opacity">Announcements</button>
          <button onClick={onNavigateToAbout} className="hover:opacity-80 transition-opacity">About</button>
        </nav>
        
        <p className="text-center text-sm mb-6">
          © 2025 BookOra. All rights reserved.
        </p>
        
        <div className="flex items-center justify-center gap-3 max-w-md mx-auto">
          <Input 
            type="email" 
            placeholder="Subscribe to our newsletter" 
            className="flex-1 bg-white text-black border-none"
          />
          <Button className="bg-[#F5A623] hover:bg-[#E69610] text-white px-6">
            Subscribe
          </Button>
        </div>
      </div>
    </footer>
  );
}
