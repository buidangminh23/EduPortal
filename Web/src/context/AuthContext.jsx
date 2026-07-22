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
          
          // Legacy session compatibility: Write userSession in localStorage for older components
          const legacySession = {
            username: prof.email.split('@')[0],
            role: prof.role,
            displayName: prof.full_name,
            avatarUrl: prof.avatar_url,
            class: prof.role === 'student' ? '12A1' : null,
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
