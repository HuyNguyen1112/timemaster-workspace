import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, UserData } from '../services/auth.service';
import { setUnauthorizedCallback } from '../services/api.service';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: UserData | null;
  signIn: (email: string, passwordHash: string) => Promise<void>;
  signUp: (fullName: string, email: string, passwordHash: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStorageData();
    setUnauthorizedCallback(signOut);
  }, []);

  async function loadStorageData() {
    try {
      const info = await authService.getUserInfo();
      if (info) {
        setUser(info);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, passwordHash: string) {
    const userData = await authService.login(email, passwordHash);
    setUser(userData);
    setIsAuthenticated(true);
  }

  async function signUp(fullName: string, email: string, passwordHash: string) {
    const userData = await authService.register(fullName, email, passwordHash);
    setUser(userData);
    setIsAuthenticated(true);
  }

  async function signOut() {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signUp, signOut }}>
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
