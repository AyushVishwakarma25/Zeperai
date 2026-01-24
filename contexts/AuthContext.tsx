import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authService, AuthSession } from '../services/authService';
import { UserProfileData } from '../services/userService';

interface AuthContextType {
  session: AuthSession | null;
  user: UserProfileData | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthSession>;
  signUp: (name: string, email: string, password: string) => Promise<AuthSession>;
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
    const checkSession = async () => {
      try {
        const currentSession = await authService.getSession();
        if (isMounted && currentSession) {
          setSession(currentSession);
          setUser(currentSession.user);
        }
      } catch (e) {
        console.error("Failed to get session on load", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkSession();

    const { unsubscribe } = authService.subscribe((event, session) => {
        if (isMounted) {
            setSession(session);
            setUser(session ? session.user : null);
        }
    });

    return () => {
        isMounted = false;
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

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
  }, []);


  const value = { session, user, isLoading, signIn, signUp, signOut, setUser };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
