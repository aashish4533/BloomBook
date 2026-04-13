import { Outlet } from 'react-router-dom';
import { Toaster } from '../ui/sonner';

export function AuthLayout() {
    return (
        <div className="min-h-screen flex flex-col w-full min-w-0 overflow-x-hidden">
            <main className="flex-1 w-full min-w-0 px-3 sm:px-4">
                <Outlet />
            </main>
            <Toaster />
        </div>
    );
}
