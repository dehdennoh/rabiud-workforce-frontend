
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasPermission } from './authorization';
import { Permission, User, UserRole } from '../types';

type AuthContextValue = {
  currentUser: User | null;
  users: User[];
  can: (permission: Permission) => boolean;
  selectUser: (userId: string) => void;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status')
      .order('name');

    if (error) {
      console.error('Could not load user profiles:', error.message);
      return;
    }

    setUsers((data ?? []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role as UserRole,
      status: profile.status,
    })));
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, status')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Could not load user profile:', error.message);
      setCurrentUser(null);
      return;
    }

    setCurrentUser({
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      status: data.status,
    });
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Authentication error:', error.message);
      }

      if (!mounted) return;

      setSession(data.session);

      if (data.session?.user) {
        await loadProfile(data.session.user.id);
        await loadProfiles();
      }

      if (mounted) setLoading(false);
    };

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);

      if (newSession?.user) {
        void loadProfile(newSession.user.id);
        void loadProfiles();
      } else {
        setCurrentUser(null);
        setUsers([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, loadProfiles]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const can = useCallback(
    (permission: Permission) =>
      currentUser?.status === 'Active' &&
      currentUser.role
        ? hasPermission(currentUser.role, permission)
        : false,
    [currentUser],
  );

  const selectUser = useCallback((_userId: string) => {
    console.warn('Demo user switching is disabled. Sign in with a real account.');
  }, []);

  const updateUserRole = useCallback(
    async (userId: string, role: UserRole) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      if (currentUser?.id === userId) {
        await loadProfile(userId);
      }
    },
    [currentUser, loadProfile],
  );

  const value = useMemo(
    () => ({
      currentUser,
      users,
      can,
      selectUser,
      updateUserRole,
      loading,
      signIn,
      signOut,
    }),
    [currentUser, users, can, selectUser, updateUserRole, loading, signIn, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
