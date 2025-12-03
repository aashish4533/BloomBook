import { Outlet } from 'react-router-dom';
import { Toaster } from '../ui/sonner';

export function AuthLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1">
                <Outlet />
            </main>
            <Toaster />
        </div>
    );
}
