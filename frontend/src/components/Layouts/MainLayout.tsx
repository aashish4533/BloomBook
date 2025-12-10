import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import { Footer } from '../Footer';
import { Toaster } from '../ui/sonner';
import { SidebarProvider } from '../ui/sidebar';

interface MainLayoutProps {
    isLoggedIn: boolean;
    onLogout: () => void;
}

export function MainLayout({ isLoggedIn, onLogout }: MainLayoutProps) {
    return (
        <SidebarProvider defaultOpen={true}>
            <div className="min-h-screen flex flex-col w-full">
                <Navbar isLoggedIn={isLoggedIn} onLogout={onLogout} />
                <main className="flex-1">
                    <Outlet />
                </main>
                <Footer />
                <Toaster />
            </div>
        </SidebarProvider>
    );
}
