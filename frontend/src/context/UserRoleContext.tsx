import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

interface UserRoleContextType {
    user: User | null | undefined;
    userRole: 'user' | 'admin' | null;
    isAdmin: boolean;
    loading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: ReactNode }) {
    const [user, authLoading] = useAuthState(auth);
    const [userRole, setUserRole] = useState<'user' | 'admin' | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            if (!user) {
                setUserRole(null);
                setRoleLoading(false);
                return;
            }

            try {
                setRoleLoading(true);
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setUserRole(docSnap.data().role as 'user' | 'admin');
                } else {
                    setUserRole('user'); // Default to user if doc missing but auth successful
                }
            } catch (error) {
                console.error("Error fetching user role:", error);
                setUserRole('user');
            } finally {
                setRoleLoading(false);
            }
        };

        if (!authLoading) {
            fetchRole();
        }
    }, [user, authLoading]);

    const value = {
        user,
        userRole,
        isAdmin: userRole === 'admin',
        loading: authLoading || roleLoading
    };

    return (
        <UserRoleContext.Provider value={value}>
            {children}
        </UserRoleContext.Provider>
    );
}

export function useUserRole() {
    const context = useContext(UserRoleContext);
    if (context === undefined) {
        throw new Error('useUserRole must be used within a UserRoleProvider');
    }
    return context;
}
