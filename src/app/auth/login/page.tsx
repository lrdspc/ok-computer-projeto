'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error: signInError } = await signIn(email, password);
    
    if (!signInError && data?.user) {
      // Get user type and redirect
      const response = await fetch('/api/user/type', {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      });
      
      const userType = await response.json();
      
      if (userType.tipo === 'personal') {
        router.push('/personal/dashboard');
      } else {
        router.push('/aluno/dashboard');
      }
    }
    
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-dark px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient">Fitness Pro</h1>
          <p className="mt-2 text-text-secondary">Entre na sua conta</p>
        </div>

        {/* Login Form */}
        <div className="card-neon">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Senha
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-2 pr-10 bg-bg-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-text-secondary" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger/20 border border-danger/30 rounded-lg p-3">
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-bg-surface text-text-secondary">Ou</span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/auth/signup" className="text-primary hover:text-primary-dark transition-colors">
                Criar uma conta
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="card bg-bg-surface/50 border-border/30">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Contas de demonstração:</h3>
          <div className="space-y-2 text-xs text-text-secondary">
            <div>
              <p><strong>Personal:</strong> personal@demo.com / demo123</p>
            </div>
            <div>
              <p><strong>Aluno:</strong> aluno@demo.com / demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}