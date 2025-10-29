import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserProfile, isAdmin, isTeacher } from '../lib/rbac';
import type { UserProfile } from '../lib/types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      localStorage.removeItem('loggedUser');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        const loggedUser = localStorage.getItem('loggedUser');
        if (loggedUser) {
          try {
            const user = JSON.parse(loggedUser);
            setUserProfile(user);
          } catch (e) {
            console.error('Error parsing logged user:', e);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setLoading(false);
        return;
      }

      const profile = await getUserProfile(session.user.email!);
      if (!profile) {
        logout();
      } else {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    setLoading(true);
    await loadProfile();
  };

  useEffect(() => {
    const handleAuthChange = () => {
      loadProfile();
    };

    const handleUserDeleted = (e: Event) => {
      const event = e as CustomEvent<{ email: string; role: string }>;
      const loggedUserStr = localStorage.getItem('loggedUser');
      if (loggedUserStr) {
        try {
          const loggedUser = JSON.parse(loggedUserStr);
          if (loggedUser.email === event.detail?.email) {
            logout();
          }
        } catch (e) {
          console.error('Error parsing logged user on delete event:', e);
        }
      }
    };

    loadProfile();
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('userDeleted', handleUserDeleted as EventListener);

    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('userDeleted', handleUserDeleted as EventListener);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userProfile,
        loading,
        isAdmin: !!userProfile && userProfile.role === 'admin',
        isTeacher: !!userProfile && userProfile.role === 'teacher',
        refreshProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
