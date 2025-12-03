import { Navigate, Outlet } from 'react-router-dom';

interface AdminRouteProps {
    userRole: 'user' | 'admin' | null;
    redirectPath?: string;
}

export function AdminRoute({ userRole, redirectPath = '/admin/login' }: AdminRouteProps) {
    if (userRole !== 'admin') {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
}
