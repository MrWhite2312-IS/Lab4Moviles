import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_URL } from '@/constants/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl?: string;
  profilePhotoLocked: boolean;
  memberSince: string;
  authProvider: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: (idToken: string, photoUrl?: string | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapResponse(data: any): { token: string; user: AuthUser } {
  return {
    token: data.token,
    user: {
      id: data.id,
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profilePhotoUrl: data.profilePhotoUrl ?? undefined,
      profilePhotoLocked: data.profilePhotoLocked,
      memberSince: data.memberSince,
      authProvider: data.authProvider,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      console.log('[Auth] Restaurando sesión desde SecureStore...');
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);
      if (storedToken && storedUser) {
        console.log('[Auth] Sesión encontrada:', JSON.parse(storedUser).username);
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        console.log('[Auth] Sin sesión guardada.');
      }
      setIsLoading(false);
    })();
  }, []);

  const saveSession = async (t: string, u: AuthUser) => {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const signIn = useCallback(async (identifier: string, password: string) => {
    console.log(`[Auth] Login → ${API_URL}/auth/login | identifier: ${identifier}`);
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    console.log(`[Auth] Login response ${res.status}:`, data);
    if (!res.ok) throw new Error(data.message ?? 'Error al iniciar sesión.');
    const { token: t, user: u } = mapResponse(data);
    await saveSession(t, u);
    console.log('[Auth] Sesión guardada para:', u.username);
  }, []);

  const signUp = useCallback(async (payload: RegisterData) => {
    console.log(`[Auth] Register → ${API_URL}/auth/register | email: ${payload.email}`);
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log(`[Auth] Register response ${res.status}:`, data);
    if (!res.ok) throw new Error(data.message ?? 'Error al registrarse.');
    const { token: t, user: u } = mapResponse(data);
    await saveSession(t, u);
    console.log('[Auth] Sesión guardada para:', u.username);
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string, photoUrl?: string | null) => {
    console.log(`[Auth] Google Login → ${API_URL}/auth/google | photo: ${photoUrl ?? '(none)'}`);
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, photoUrl }),
    });
    const data = await res.json();
    console.log(`[Auth] Google Login response ${res.status}:`, data);
    if (!res.ok) throw new Error(data.message ?? 'Error al iniciar sesión con Google.');
    const { token: t, user: u } = mapResponse(data);
    await saveSession(t, u);
    console.log('[Auth] Sesión Google guardada para:', u.username);
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Cerrando sesión...');
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
    setUser(null);
    console.log('[Auth] Sesión eliminada.');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
