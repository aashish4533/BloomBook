import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { Toaster } from '../ui/sonner';

interface MainLayoutProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export function MainLayout({ isLoggedIn, onLogout }: MainLayoutProps) {
    return (
        <div className="min-h-screen flex flex-col min-w-0 overflow-x-hidden" data-testid="app-shell">
            <Navbar isLoggedIn={isLoggedIn} onLogout={onLogout} />
            <main className="flex-1 relative z-0 w-full min-w-0 overflow-x-hidden">
                <Outlet />
            </main>
            <Footer />
            <Toaster />
        </div>
    );
}
