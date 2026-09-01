
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { authService, AuthSession } from '../services/authService.js';
import { UserProfileData } from '../services/userService.js';

interface AuthContextType {
  session: AuthSession | null;
  user: UserProfileData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (name: string, email: string, password: string) => Promise<AuthSession>;
  signInWithGoogle: () => Promise<void>;
  signInWithOtp: (email: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfileData | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;

    // SAFETY TIMEOUT: If auth check takes more than 4 seconds, force stop loading.
    // This prevents being stuck on splash screen if Supabase is unreachable.
    const safetyTimer = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("Auth initialization timed out. Proceeding to login.");
        setIsLoading(false);
      }
    }, 4000);

    const initializeAuth = async () => {
      try {
        const currentSession = await authService.getSession();
        if (isMounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
          } else {
            setUser(null);
          }
        }
      } catch (e) {
        console.warn("Auth initialization error:", e);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) {
            clearTimeout(safetyTimer);
            setIsLoading(false);
        }
      }
    };
    
    initializeAuth();

    const { unsubscribe } = authService.subscribe((event, authSession) => {
        if (isMounted) {
            if (authSession) {
                setSession(authSession);
                setUser(authSession.user);
                setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setUser(null);
                setIsLoading(false);
            }
        }
    });

    return () => {
        isMounted = false;
        clearTimeout(safetyTimer);
        unsubscribe();
    }
  }, []);
  
  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authService.signInWithPassword(email, password);
    setSession(session);
    setUser(session.user);
    return session;
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    const session = await authService.signUpWithPassword(name, email, password);
    setSession(session);
    setUser(session.user);
    return session;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    await authService.signInWithGoogle();
  }, []);

  const signInWithOtp = useCallback(async (email: string) => {
    await authService.signInWithOtp(email);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPasswordForEmail(email);
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signIn, signUp, signInWithGoogle, signInWithOtp, resetPassword, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
