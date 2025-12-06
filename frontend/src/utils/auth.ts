import { User } from 'firebase/auth';
import { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';

/**
 * Checks if the user is authenticated. If not, redirects to login and saves the current location
 * so they can be redirected back after login.
 * 
 * @param user The current Firebase user object (or null/undefined)
 * @param navigate The react-router-dom navigate function
 * @param location The current location path (optional, defaults to '/')
 * @returns true if authenticated, false otherwise
 */
export const handleAuthCheck = (
    user: User | null | undefined,
    navigate: NavigateFunction,
    locationString: string = '/'
): boolean => {
    if (!user) {
        toast.error('Please login to continue');
        navigate('/login', { state: { from: locationString } });
        return false;
    }
    return true;
};
