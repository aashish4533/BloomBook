import { Navigate, Outlet } from 'react-router-dom';
import { useUserRole } from '../../context/UserRoleContext';
import { hasAdminOtpVerified } from '../../utils/adminOtpSession';

interface AdminRouteProps {
    redirectPath?: string;
}

export function AdminRoute({ redirectPath = '/admin/login' }: AdminRouteProps) {
    const { userRole, loading } = useUserRole();

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                data-testid="app-shell"
            >
                Loading…
            </div>
        );
    }

    if (userRole !== 'admin') {
        return <Navigate to={redirectPath} replace />;
    }

    if (!hasAdminOtpVerified()) {
        return <Navigate to={redirectPath} replace />;
    }

    return <Outlet />;
}
