'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { Eye, EyeOff, Loader2, User, Dumbbell } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const { signUp, error } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    tipo: 'aluno' as 'personal' | 'aluno',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { data, error: signUpError } = await signUp(
      formData.email,
      formData.password,
      formData.nome,
      formData.tipo
    );
    
    if (!signUpError) {
      // Redirect based on user type
      if (formData.tipo === 'personal') {
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
          <p className="mt-2 text-text-secondary">Crie sua conta</p>
        </div>

        {/* Signup Form */}
        <div className="card-neon">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-text-primary">
                Nome completo
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="mt-1 block w-full px-3 py-2 bg-bg-dark border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Tipo de conta
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'aluno' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.tipo === 'aluno'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Aluno</p>
                  <p className="text-xs text-text-secondary">Receber treinos</p>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, tipo: 'personal' })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.tipo === 'personal'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Dumbbell className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">Personal</p>
                  <p className="text-xs text-text-secondary">Criar treinos</p>
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
                'Criar conta'
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
              <Link href="/auth/login" className="text-primary hover:text-primary-dark transition-colors">
                Já tem uma conta? Entrar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}