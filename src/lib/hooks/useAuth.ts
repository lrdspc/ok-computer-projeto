import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Usuario } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await fetchUserData(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function getUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await fetchUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setError('Erro ao carregar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserData(userId: string) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Erro ao carregar dados do usuário');
    }
  }

  async function signIn(email: string, password: string) {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        await fetchUserData(data.user.id);
      }
      
      return { data, error: null };
    } catch (error: any) {
      setError(error.message);
      return { data: null, error };
    }
  }

  async function signUp(email: string, password: string, nome: string, tipo: 'personal' | 'aluno') {
    try {
      setError(null);
      
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create user profile
        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .insert({
            auth_id: authData.user.id,
            email,
            nome,
            tipo,
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // If user is aluno, create aluno record
        if (tipo === 'aluno') {
          const { error: alunoError } = await supabase
            .from('alunos')
            .insert({
              usuario_id: profileData.id,
              personal_id: profileData.id, // Will be updated when personal assigns
            });

          if (alunoError) throw alunoError;
        }

        setUser(profileData);
      }

      return { data: authData, error: null };
    } catch (error: any) {
      setError(error.message);
      return { data: null, error };
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      return { error: null };
    } catch (error: any) {
      setError(error.message);
      return { error };
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshUser: () => user && fetchUserData(user.auth_id),
  };
}