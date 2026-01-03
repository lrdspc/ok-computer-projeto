'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { User, LogOut, Menu, X } from 'lucide-react';

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          fetchUserData(session.user.id);
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
    }
  }

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  if (loading) {
    return (
      <header className="bg-bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-xl font-bold text-gradient">Fitness Pro</div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div 
              className="text-xl font-bold text-gradient cursor-pointer"
              onClick={() => router.push('/')}
            >
              Fitness Pro
            </div>
          </div>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex space-x-8">
              {user.tipo === 'personal' ? (
                <>
                  <a href="/personal/dashboard" className="text-text-secondary hover:text-primary transition-colors">
                    Dashboard
                  </a>
                  <a href="/personal/alunos" className="text-text-secondary hover:text-primary transition-colors">
                    Alunos
                  </a>
                  <a href="/personal/criar-treino" className="text-text-secondary hover:text-primary transition-colors">
                    Criar Treino
                  </a>
                  <a href="/personal/biblioteca" className="text-text-secondary hover:text-primary transition-colors">
                    Biblioteca
                  </a>
                </>
              ) : (
                <>
                  <a href="/aluno/dashboard" className="text-text-secondary hover:text-primary transition-colors">
                    Dashboard
                  </a>
                  <a href="/aluno/treino" className="text-text-secondary hover:text-primary transition-colors">
                    Meu Treino
                  </a>
                  <a href="/aluno/historico" className="text-text-secondary hover:text-primary transition-colors">
                    Histórico
                  </a>
                  <a href="/aluno/progresso" className="text-text-secondary hover:text-primary transition-colors">
                    Progresso
                  </a>
                </>
              )}
            </nav>
          )}

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">{user.nome}</div>
                    <div className="text-xs text-text-secondary">
                      {user.tipo === 'personal' ? 'Personal Trainer' : 'Aluno'}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-text-secondary hover:text-danger transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  className="md:hidden p-2 text-text-secondary hover:text-primary"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <a href="/auth/login" className="text-text-secondary hover:text-primary transition-colors">
                  Entrar
                </a>
                <a href="/auth/signup" className="btn-primary">
                  Cadastrar
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && user && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-2">
              {user.tipo === 'personal' ? (
                <>
                  <a href="/personal/dashboard" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Dashboard
                  </a>
                  <a href="/personal/alunos" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Alunos
                  </a>
                  <a href="/personal/criar-treino" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Criar Treino
                  </a>
                  <a href="/personal/biblioteca" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Biblioteca
                  </a>
                  <a href="/personal/chat" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Chat
                  </a>
                </>
              ) : (
                <>
                  <a href="/aluno/dashboard" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Dashboard
                  </a>
                  <a href="/aluno/treino" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Meu Treino
                  </a>
                  <a href="/aluno/historico" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Histórico
                  </a>
                  <a href="/aluno/progresso" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Progresso
                  </a>
                  <a href="/aluno/chat" className="block px-3 py-2 text-text-secondary hover:text-primary transition-colors">
                    Chat
                  </a>
                </>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <button
                  onClick={() => {
                    handleSignOut();
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-danger hover:bg-danger/10 rounded transition-colors"
                >
                  Sair
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}