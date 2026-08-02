/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  // Load profile for authenticated user
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      return null;
    }
  };

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      if (session?.user) {
        const u = session.user;
        setUser(u);
        
        const prof = await fetchProfile(u.id);
        if (prof) {
          setProfile(prof);
          setRole(prof.role);
          
          // Legacy session compatibility: Write userSession in localStorage for older components.
          // The class is left empty rather than filled with the demo's 12A1 — a
          // real student's class comes from their enrolment, and inventing one
          // here would put a stranger's class on their own record.
          const legacySession = {
            username: prof.email ? prof.email.split('@')[0] : '',
            role: prof.role,
            displayName: prof.full_name,
            avatarUrl: prof.avatar_url,
            class: prof.class_name ?? null,
            studentId: prof.role === 'student' ? prof.id : null,
            email: prof.email
          };
          localStorage.setItem('userSession', JSON.stringify(legacySession));
        } else {
          setProfile(null);
          setRole('');
        }
      } else {
        setUser(null);
        setProfile(null);
        setRole('');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    return { data, error };
  };

  /**
   * Signs in with a Google credential, verified by Supabase.
   *
   * The token is passed through untouched. Anything that reads it here and
   * acts on what it says is trusting a string the browser handed it; only the
   * side holding Google's public keys can tell a real assertion from a typed
   * one.
   */
  const signInWithGoogleToken = async (credential) => {
    if (!credential) {
      return { data: null, error: { message: 'Google không trả về thông tin đăng nhập.' } };
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential
    });
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    return { error };
  };

  const value = {
    user,
    profile,
    role,
    loading,
    signInWithPassword,
    signInWithGoogleToken,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
