import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { Toaster } from '../ui/sonner';
import { GlobalChatWidget } from '../Chat/GlobalChatWidget';
import { MainSidebar } from './MainSidebar';

interface MainLayoutProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export function MainLayout({ isLoggedIn, onLogout }: MainLayoutProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <MainSidebar
                onLogout={onLogout}
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
                isMobileOpen={isMobileOpen}
                onMobileClose={() => setIsMobileOpen(false)}
            />

            {/* Main Content Area - with left padding for sidebar */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
                <Navbar isLoggedIn={isLoggedIn} onLogout={onLogout} />
                <main className="flex-1 relative z-0">
                    <Outlet />
                </main>
                <Footer />
                <Toaster />
            </div>
        </div>
    );
}

