import { Input } from './ui/input';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#2C3E50] text-white py-8 px-8">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-center gap-8 mb-4">
          <Link to="/marketplace" className="hover:opacity-80 transition-opacity">Buy</Link>
          <Link to="/rent" className="hover:opacity-80 transition-opacity">Rent</Link>
          <Link to="/sell" className="hover:opacity-80 transition-opacity">Resell</Link>
          <Link to="/announcements" className="hover:opacity-80 transition-opacity">Announcements</Link>
          <Link to="/about" className="hover:opacity-80 transition-opacity">About</Link>
        </nav>

        <p className="text-center text-sm mb-6">
          © 2025 BookBloom. All rights reserved.
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
