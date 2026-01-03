'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Usuario, Aluno, Treino } from '@/types';
import { Users, Dumbbell, TrendingUp, MessageSquare, Plus, UserPlus, Calendar } from 'lucide-react';

export default function PersonalDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }

      // Get user profile
      const { data: userData } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_id', session.user.id)
        .single();

      if (!userData || userData.tipo !== 'personal') {
        router.push('/aluno/dashboard');
        return;
      }

      setUser(userData);

      // Get alunos
      const { data: alunosData } = await supabase
        .from('alunos')
        .select(`*, usuario:usuarios(*)`)
        .eq('personal_id', userData.id);

      setAlunos(alunosData || []);

      // Get treinos
      const { data: treinosData } = await supabase
        .from('treinos')
        .select(`*, aluno:alunos(*, usuario:usuarios(*))`)
        .eq('personal_id', userData.id)
        .order('criado_em', { ascending: false })
        .limit(10);

      setTreinos(treinosData || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const alunosAtivos = alunos.filter(aluno => {
    const lastWorkout = treinos.find(t => t.aluno_id === aluno.id);
    if (!lastWorkout) return false;
    
    const daysSinceLastWorkout = Math.floor(
      (Date.now() - new Date(lastWorkout.criado_em).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastWorkout <= 7;
  }).length;

  const taxaAdesao = alunos.length > 0 ? Math.round((alunosAtivos / alunos.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">
            Olá{user?.nome && `, ${user.nome.split(' ')[0]}`}!
          </h1>
          <p className="mt-2 text-text-secondary">
            Pronto para treinar seus alunos?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-neon">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">
                    Total de Alunos
                  </dt>
                  <dd className="text-2xl font-bold text-text-primary">
                    {alunos.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-neon">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">
                    Alunos Ativos
                  </dt>
                  <dd className="text-2xl font-bold text-text-primary">
                    {alunosAtivos}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-neon">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Dumbbell className="w-8 h-8 text-secondary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">
                    Treinos Criados
                  </dt>
                  <dd className="text-2xl font-bold text-text-primary">
                    {treinos.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="card-neon">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-warning" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-text-secondary truncate">
                    Taxa de Adesão
                  </dt>
                  <dd className="text-2xl font-bold text-text-primary">
                    {taxaAdesao}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => router.push('/personal/alunos/novo')}
            className="card-neon hover:border-primary/80 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <UserPlus className="w-12 h-12 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-medium">Novo Aluno</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/personal/criar-treino')}
            className="card-neon hover:border-primary/80 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Plus className="w-12 h-12 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-medium">Criar Treino</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/personal/biblioteca')}
            className="card-neon hover:border-primary/80 transition-all duration-300 group"
          >
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <Dumbbell className="w-12 h-12 text-success mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-lg font-medium">Biblioteca</p>
              </div>
            </div>
          </button>
        </div>

        {/* Recent Alunos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Meus Alunos</h2>
              <button
                onClick={() => router.push('/personal/alunos')}
                className="text-primary hover:text-primary-dark transition-colors text-sm"
              >
                Ver todos
              </button>
            </div>
            
            {alunos.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">Nenhum aluno cadastrado</p>
                <button
                  onClick={() => router.push('/personal/alunos/novo')}
                  className="mt-3 text-primary hover:text-primary-dark transition-colors"
                >
                  Adicionar primeiro aluno
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {alunos.slice(0, 5).map((aluno) => (
                  <div
                    key={aluno.id}
                    onClick={() => router.push(`/personal/alunos/${aluno.id}`)}
                    className="flex items-center p-3 rounded-lg hover:bg-bg-dark transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-medium">
                        {aluno.usuario?.nome?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-text-primary">
                        {aluno.usuario?.nome}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {aluno.objetivo_principal || 'Sem objetivo definido'}
                      </p>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {new Date(aluno.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-text-primary">Treinos Recentes</h2>
              <button
                onClick={() => router.push('/personal/criar-treino')}
                className="text-primary hover:text-primary-dark transition-colors text-sm"
              >
                Criar novo
              </button>
            </div>
            
            {treinos.length === 0 ? (
              <div className="text-center py-8">
                <Dumbbell className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">Nenhum treino criado</p>
                <button
                  onClick={() => router.push('/personal/criar-treino')}
                  className="mt-3 text-primary hover:text-primary-dark transition-colors"
                >
                  Criar primeiro treino
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {treinos.slice(0, 5).map((treino) => (
                  <div
                    key={treino.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-bg-dark transition-colors"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {treino.nome}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {treino.aluno?.usuario?.nome}
                      </p>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {new Date(treino.criado_em).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}