import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({});
  const authResolved = useRef(false);
  const profileFetchInProgress = useRef(false);

  const fetchProfile = useCallback(async (userId) => {
    // Prevent duplicate concurrent fetches
    if (profileFetchInProgress.current) return;
    profileFetchInProgress.current = true;
    
    try {
      setIsLoadingProfile(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch failed:', error);
      }

      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setIsLoadingProfile(false);
      profileFetchInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Safety timeout — if auth hasn't resolved in 10 seconds, force loading to false
    const safetyTimer = setTimeout(() => {
      if (isMounted && !authResolved.current) {
        console.warn('Auth loading safety timeout reached — forcing resolution');
        authResolved.current = true;
        setIsLoadingAuth(false);
        setIsLoadingProfile(false);
        profileFetchInProgress.current = false;
      }
    }, 10000);

    // Listen for auth state changes (login, logout, token refresh, initial session)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          
          // Mark auth as resolved BEFORE fetching profile
          authResolved.current = true;
          setIsLoadingAuth(false);
          
          // Fetch profile separately — isLoadingProfile tracks this
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsAuthenticated(false);
          authResolved.current = true;
          setIsLoadingAuth(false);
          setIsLoadingProfile(false);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user);
        } else if (event === 'INITIAL_SESSION' && !session) {
          // No existing session
          authResolved.current = true;
          setIsLoadingAuth(false);
          setIsLoadingProfile(false);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // onAuthStateChange will fire SIGNED_IN and handle profile fetch
      return data;
    } catch (error) {
      setAuthError({ type: 'login_failed', message: error.message });
      throw error;
    }
  };

  const signUp = async (email, password, metadata = {}) => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      setAuthError({ type: 'signup_failed', message: error.message });
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    } catch (error) {
      setAuthError({ type: 'oauth_failed', message: error.message });
      throw error;
    }
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
      if (shouldRedirect) {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/admin';
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      return true;
    } catch (error) {
      setAuthError({ type: 'reset_failed', message: error.message });
      throw error;
    }
  };

  // Manually re-check the session (used by checkAppState)
  const checkSession = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        setAuthError({ type: 'session_error', message: error.message });
        setIsLoadingAuth(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        await fetchProfile(session.user.id);
      }

      setIsLoadingAuth(false);
    } catch (error) {
      setAuthError({ type: 'unknown', message: error.message });
      setIsLoadingAuth(false);
    }
  };

  // Check if current user is admin
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isAuthenticated,
      isLoadingAuth,
      isLoadingProfile,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      isAdmin,
      login,
      signUp,
      loginWithGoogle,
      logout,
      navigateToLogin,
      resetPassword,
      checkAppState: checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
