import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { lsGet, lsSet, KEYS } from '@/lib/localStore';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

// Fast local mock helper for profiles
export async function getProfile(userId: string): Promise<Profile | null> {
  const storedProfile = lsGet<Profile | null>(KEYS.PROFILE, null);
  if (storedProfile && storedProfile.id === userId) {
    return storedProfile;
  }
  return null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const storedProfile = lsGet<Profile | null>(KEYS.PROFILE, null);
    if (storedProfile) {
      setProfile(storedProfile);
    }
    setLoading(false);
  };

  useEffect(() => {
    const checkSession = () => {
      // 100% offline dummy user authentication bypass
      const dummyUser = {
        id: 'dummy-user-id',
        email: 'admin@miaoda.com',
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      } as User;

      const storedProfile = lsGet<Profile | null>(KEYS.PROFILE, null);
      const dummyProfile = storedProfile || {
        id: 'dummy-user-id',
        username: 'admin',
        full_name: 'System Admin',
        email: 'admin@miaoda.com',
        age: 28,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;

      if (!storedProfile) {
        lsSet(KEYS.PROFILE, dummyProfile);
      }

      setUser(dummyUser);
      setProfile(dummyProfile);
      localStorage.setItem('dev_admin_bypass', 'true');
      setLoading(false);
    };

    checkSession();
  }, []);

  // Trigger profile refresh whenever user changes
  useEffect(() => {
    refreshProfile();
  }, [user]);

  // Mock sign in - instantly succeeds using local dummy user
  const signInWithUsername = async (username: string, _password: string) => {
    try {
      const dummyUser = {
        id: 'dummy-user-id',
        email: `${username}@miaoda.com`,
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      } as User;

      let storedProfile = lsGet<Profile | null>(KEYS.PROFILE, null);
      if (!storedProfile) {
        storedProfile = {
          id: 'dummy-user-id',
          username: username,
          full_name: username.charAt(0).toUpperCase() + username.slice(1),
          email: `${username}@miaoda.com`,
          age: 28,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as Profile;
        lsSet(KEYS.PROFILE, storedProfile);
      }

      setUser(dummyUser);
      setProfile(storedProfile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Mock sign up - instantly succeeds using local dummy user
  const signUpWithUsername = async (username: string, _password: string) => {
    try {
      const storedProfile = {
        id: 'dummy-user-id',
        username: username,
        full_name: username.charAt(0).toUpperCase() + username.slice(1),
        email: `${username}@miaoda.com`,
        age: 28,
        role: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Profile;
      lsSet(KEYS.PROFILE, storedProfile);
      
      const dummyUser = {
        id: 'dummy-user-id',
        email: `${username}@miaoda.com`,
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {},
        created_at: new Date().toISOString(),
      } as User;

      setUser(dummyUser);
      setProfile(storedProfile);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
