'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Usuario, Aluno, Treino, HistoricoTreino } from '@/types';
import { Play, Calendar, Trophy, Clock, Target, TrendingUp } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AlunoDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treinoHoje, setTreinoHoje] = useState<Treino | null>(null);
  const [historico, setHistorico] = useState<HistoricoTreino[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
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

      if (!userData || userData.tipo !== 'aluno') {
        router.push('/personal/dashboard');
        return;
      }

      setUser(userData);

      // Get aluno data
      const { data: alunoData } = await supabase
        .from('alunos')
        .select('*')
        .eq('usuario_id', userData.id)
        .single();

      if (alunoData) {
        setAluno(alunoData);

        // Get today's workout
        const today = new Date().getDay();
        const { data: treinoData } = await supabase
          .from('treinos')
          .select(`*, dias:treinos_dias(*, exercicios:treinos_exercicios(*, exercicio:exercicios(*)))`)
          .eq('aluno_id', alunoData.id)
          .eq('ativo', true)
          .contains('dias', [{ dia_semana: today }])
          .single();

        setTreinoHoje(treinoData);

        // Get workout history
        const { data: historicoData } = await supabase
          .from('historico_treinos')
          .select(`*, treino:treinos(*)`)
          .eq('aluno_id', alunoData.id)
          .order('data_execucao', { ascending: false })
          .limit(10);

        setHistorico(historicoData || []);

        // Get badges
        const { data: badgesData } = await supabase
          .from('aluno_conquistas')
          .select(`*, conquista:conquistas(*)`)
          .eq('aluno_id', alunoData.id);

        setBadges(badgesData || []);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalTreinos = historico.length;
  const treinosCompletos = historico.filter(h => h.completo).length;
  const diasConsecutivos = calcularDiasConsecutivos(historico);

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
            Pronto para treinar hoje?
          </p>
        </div>

        {/* Today's Workout */}
        {treinoHoje ? (
          <div className="card-neon mb-8 p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-text-primary mb-2">
                  🎯 Seu treino de hoje
                </h2>
                <p className="text-text-secondary mb-4">
                  {treinoHoje.nome} • {treinoHoje.dias?.[0]?.exercicios?.length || 0} exercícios
                </p>
                <div className="flex items-center space-x-4 text-sm text-text-secondary">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>~45 min</span>
                  </div>
                  <div className="flex items-center">
                    <Target className="w-4 h-4 mr-1" />
                    <span>{aluno?.objetivo_principal || 'Condicionamento'}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/aluno/treino')}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Iniciar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card-neon mb-8 p-8 text-center">
            <Calendar className="w-16 h-16 text-text-secondary mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Nenhum treino para hoje
            </h2>
            <p className="text-text-secondary">
              Descanse ou converse com seu personal sobre o próximo treino.
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-warning" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-primary">{totalTreinos}</p>
                <p className="text-sm text-text-secondary">Treinos feitos</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-success" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-primary">{treinosCompletos}</p>
                <p className="text-sm text-text-secondary">Completos</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-primary" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-primary">{diasConsecutivos}</p>
                <p className="text-sm text-text-secondary">Dias seguidos</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-secondary" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-text-primary">{badges.length}</p>
                <p className="text-sm text-text-secondary">Conquistas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Workouts & Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Workouts */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-6">
              Últimos treinos
            </h2>
            
            {historico.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">Nenhum treino realizado ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historico.slice(0, 5).map((hist) => (
                  <div
                    key={hist.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-bg-dark"
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {hist.treino?.nome || 'Treino'}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {format(parseISO(hist.data_execucao), 'dd MMM yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {hist.completo ? (
                        <span className="text-success text-sm font-medium">✓ Completo</span>
                      ) : (
                        <span className="text-warning text-sm font-medium">⚠ Parcial</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-6">
              Suas conquistas
            </h2>
            
            {badges.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                <p className="text-text-secondary">Nenhuma conquista ainda</p>
                <p className="text-sm text-text-secondary mt-1">
                  Complete treinos para desbloquear badges!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {badges.slice(0, 6).map((badge) => (
                  <div
                    key={badge.id}
                    className="text-center p-4 rounded-lg bg-bg-dark border border-success/30"
                  >
                    <div className="text-3xl mb-2">
                      {badge.conquista?.icone_url || '🏆'}
                    </div>
                    <p className="text-sm font-medium text-text-primary">
                      {badge.conquista?.nome}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {format(parseISO(badge.data_conquista), 'dd MMM', { locale: ptBR })}
                    </p>
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

function calcularDiasConsecutivos(historico: HistoricoTreino[]): number {
  if (historico.length === 0) return 0;

  const hoje = new Date();
  let diasConsecutivos = 0;
  let dataAtual = new Date(hoje);

  // Sort workouts by date (most recent first)
  const workoutsOrdenados = historico
    .filter(h => h.completo)
    .sort((a, b) => new Date(b.data_execucao).getTime() - new Date(a.data_execucao).getTime());

  // Check if there's a workout today
  const treinoHoje = workoutsOrdenados.find(h => 
    new Date(h.data_execucao).toDateString() === hoje.toDateString()
  );

  if (!treinoHoje && workoutsOrdenados.length > 0) {
    // Check if last workout was yesterday
    const ultimoTreino = new Date(workoutsOrdenados[0].data_execucao);
    const diasDesdeUltimoTreino = Math.floor(
      (hoje.getTime() - ultimoTreino.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDesdeUltimoTreino > 1) {
      return 0;
    }

    dataAtual = new Date(ultimoTreino);
  }

  // Count consecutive days
  for (let i = 0; i < workoutsOrdenados.length; i++) {
    const treino = workoutsOrdenados[i];
    const dataTreino = new Date(treino.data_execucao);
    const diasDiferenca = Math.floor(
      (dataAtual.getTime() - dataTreino.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diasDiferenca === 0 || (diasConsecutivos === 0 && diasDiferenca === 1)) {
      diasConsecutivos++;
      dataAtual = new Date(dataTreino);
      dataAtual.setDate(dataAtual.getDate() - 1);
    } else if (diasDiferenca > 1) {
      break;
    }
  }

  return diasConsecutivos;
}