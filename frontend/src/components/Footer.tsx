import { Input } from './ui/input';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-[#2C3E50] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        <nav className="mb-6 flex w-full flex-wrap items-center justify-center sm:justify-between gap-4 text-sm sm:text-base">
          <Link to="/marketplace" className="shrink-0 hover:opacity-80 transition-opacity">Buy</Link>
          <Link to="/rent" className="shrink-0 hover:opacity-80 transition-opacity">Rent</Link>
          <Link to="/sell" className="shrink-0 hover:opacity-80 transition-opacity">Resell</Link>
          <Link to="/announcements" className="shrink-0 hover:opacity-80 transition-opacity">Announcements</Link>
          <Link to="/about" className="shrink-0 hover:opacity-80 transition-opacity">About</Link>
          <Link to="/contact" className="shrink-0 hover:opacity-80 transition-opacity">Contact</Link>
        </nav>

        <p className="text-center text-sm mb-6">
          © 2025 BookBloom. All rights reserved.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto w-full">
          <Input
            type="email"
            placeholder="Subscribe to our newsletter"
            className="flex-1 min-w-0 bg-white text-black border-none text-base"
          />
          <Button className="bg-[#F5A623] hover:bg-[#E69610] text-white px-6 shrink-0 w-full sm:w-auto">
            Subscribe
          </Button>
        </div>
      </div>
    </footer>
  );
}
