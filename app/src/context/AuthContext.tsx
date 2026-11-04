// app/src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import safeStorage from '../lib/storage';
import { login, getMe } from '../services/auth';
import { listBusinesses, createBusiness } from '../services/businesses';
import { User, Business } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  businesses: Business[];
  currentBusiness: Business | null;
  loading: boolean;
  signInWithOtp: (phone: string, otp: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  addBusiness: (b: Omit<Business, 'id' | 'owner_id'>) => Promise<Business>;
  switchBusiness: (id: string) => void;
  refreshBusinesses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const t = await safeStorage.getItem('token');
        if (t) {
          const u = await getMe(t);
          setUser(u);
          setToken(t);
          const bs = await listBusinesses(u.id);
          setBusinesses(bs);
          if (bs.length) setCurrentBusiness(bs[0]);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signInWithOtp = async (phone: string, otp: string): Promise<boolean> => {
    if (otp !== '123456') return false;
    const res = await login(phone + '@mock.com', otp);
    const loggedUser = { ...res.user, phone: phone || res.user.phone };
    setUser(loggedUser);
    setToken(res.token);
    await safeStorage.setItem('token', res.token);
    const bs = await listBusinesses(loggedUser.id);
    setBusinesses(bs);
    if (bs.length) setCurrentBusiness(bs[0]);
    return true;
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await login(email, password);
      setUser(res.user);
      setToken(res.token);
      await safeStorage.setItem('token', res.token);
      const bs = await listBusinesses(res.user.id);
      setBusinesses(bs);
      if (bs.length) setCurrentBusiness(bs[0]);
      return true;
    } catch (e) {
      return false;
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    setBusinesses([]);
    setCurrentBusiness(null);
    await safeStorage.removeItem('token');
  };

  const addBusiness = async (b: Omit<Business, 'id' | 'owner_id'>) => {
    if (!user) throw new Error('Not logged in');
    const created = await createBusiness({ ...b, owner_id: user.id });
    setBusinesses((prev) => [...prev, created]);
    setCurrentBusiness(created);
    return created;
  };

  const switchBusiness = (id: string) => {
    const b = businesses.find((x) => x.id === id);
    if (b) setCurrentBusiness(b);
  };

  const refreshBusinesses = async () => {
    if (!user) return;
    const bs = await listBusinesses(user.id);
    setBusinesses(bs);
    if (!currentBusiness && bs.length) setCurrentBusiness(bs[0]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        businesses,
        currentBusiness,
        loading,
        signInWithOtp,
        signInWithEmail,
        signOut,
        addBusiness,
        switchBusiness,
        refreshBusinesses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
