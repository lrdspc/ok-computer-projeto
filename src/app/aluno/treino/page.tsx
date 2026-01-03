'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Usuario, Aluno, Treino, TreinoExercicio } from '@/types';
import { Play, Pause, SkipForward, Volume2, VolumeX, Check, Clock, RotateCcw, Calendar } from 'lucide-react';

interface WorkoutState {
  isPlaying: boolean;
  currentExerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  restTimeLeft: number;
  workoutStartTime: Date | null;
  completedSets: Set<string>;
  totalReps: number;
}

export default function WorkoutPlayerPage() {
  const router = useRouter();
  const [user, setUser] = useState<Usuario | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treino, setTreino] = useState<Treino | null>(null);
  const [exercicios, setExercicios] = useState<TreinoExercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [workoutState, setWorkoutState] = useState<WorkoutState>({
    isPlaying: false,
    currentExerciseIndex: 0,
    currentSet: 1,
    isResting: false,
    restTimeLeft: 0,
    workoutStartTime: null,
    completedSets: new Set(),
    totalReps: 0,
  });

  const restIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadWorkoutData();
    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (workoutState.isResting && workoutState.restTimeLeft > 0) {
      restIntervalRef.current = setInterval(() => {
        setWorkoutState(prev => ({
          ...prev,
          restTimeLeft: prev.restTimeLeft - 1,
        }));
      }, 1000);
    } else if (workoutState.restTimeLeft === 0 && workoutState.isResting) {
      // Rest finished
      setWorkoutState(prev => ({
        ...prev,
        isResting: false,
      }));
      playSound('restEnd');
      speak('Descanso finalizado! Próxima série.');
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current);
      }
    };
  }, [workoutState.isResting, workoutState.restTimeLeft]);

  async function loadWorkoutData() {
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

        if (treinoData) {
          setTreino(treinoData);
          const allExercises = treinoData.dias?.[0]?.exercicios || [];
          setExercicios([...allExercises].sort((a: TreinoExercicio, b: TreinoExercicio) => a.sequencia - b.sequencia));
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    } finally {
      setLoading(false);
    }
  }

  function playSound(type: 'start' | 'complete' | 'restEnd') {
    if (!audioEnabled) return;
    
    // Create audio context for sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
      case 'start':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        break;
      case 'complete':
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.5;
        break;
      case 'restEnd':
        oscillator.frequency.value = 600;
        gainNode.gain.value = 0.4;
        break;
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  }

  function speak(text: string) {
    if (!audioEnabled || 'speechSynthesis' in window === false) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
  }

  function handlePlayPause() {
    if (!workoutState.workoutStartTime) {
      setWorkoutState(prev => ({
        ...prev,
        workoutStartTime: new Date(),
      }));
    }

    setWorkoutState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying,
    }));

    if (!workoutState.isPlaying) {
      playSound('start');
      const currentExercise = exercicios[workoutState.currentExerciseIndex];
      speak(`Série ${workoutState.currentSet} de ${currentExercise?.series || 1} - ${currentExercise?.exercicio?.nome || 'Exercício'} - ${currentExercise?.repeticoes || 0} repetições`);
    }
  }

  function handleCompleteSet() {
    const currentExercise = exercicios[workoutState.currentExerciseIndex];
    if (!currentExercise) return;

    const setKey = `${workoutState.currentExerciseIndex}-${workoutState.currentSet}`;
    const newCompletedSets = new Set(workoutState.completedSets);
    newCompletedSets.add(setKey);

    playSound('complete');
    speak('Série completada!');

    if (workoutState.currentSet >= currentExercise.series) {
      // Exercise completed
      if (workoutState.currentExerciseIndex >= exercicios.length - 1) {
        // Workout completed
        handleCompleteWorkout();
        return;
      }

      // Next exercise
      setWorkoutState(prev => ({
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        currentSet: 1,
        completedSets: newCompletedSets,
        isPlaying: false,
      }));
    } else {
      // Next set
      setWorkoutState(prev => ({
        ...prev,
        currentSet: prev.currentSet + 1,
        completedSets: newCompletedSets,
        isResting: true,
        restTimeLeft: currentExercise.tempo_descanso_segundos || 90,
        isPlaying: false,
      }));

      speak(`Bom trabalho! Descanse ${currentExercise.tempo_descanso_segundos || 90} segundos.`);
    }
  }

  function handleSkipExercise() {
    if (workoutState.currentExerciseIndex >= exercicios.length - 1) {
      handleCompleteWorkout();
      return;
    }

    setWorkoutState(prev => ({
      ...prev,
      currentExerciseIndex: prev.currentExerciseIndex + 1,
      currentSet: 1,
      isPlaying: false,
      isResting: false,
    }));
  }

  async function handleCompleteWorkout() {
    if (!aluno || !treino) return;

    // Save workout to history
    const workoutDuration = workoutState.workoutStartTime 
      ? Math.floor((Date.now() - workoutState.workoutStartTime.getTime()) / 60000)
      : 0;

    const { error } = await supabase
      .from('historico_treinos')
      .insert({
        aluno_id: aluno.id,
        treino_id: treino.id,
        duracao_minutos: workoutDuration,
        completo: true,
      });

    if (error) {
      console.error('Error saving workout:', error);
    }

    speak('Parabéns! Treino completado com sucesso!');
    router.push('/aluno/dashboard');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!treino || exercicios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <Calendar className="w-16 h-16 text-text-secondary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">
            Nenhum treino hoje
          </h2>
          <p className="text-text-secondary mb-6">
            Descanse ou converse com seu personal sobre o próximo treino.
          </p>
          <button
            onClick={() => router.push('/aluno/dashboard')}
            className="btn-primary"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentExercise = exercicios[workoutState.currentExerciseIndex];
  const progress = ((workoutState.currentExerciseIndex + (workoutState.currentSet / currentExercise?.series)) / exercicios.length) * 100;

  return (
    <div className="min-h-screen bg-bg-dark">
      {/* Header */}
      <div className="bg-bg-surface border-b border-border sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">{treino.nome}</h1>
              <p className="text-sm text-text-secondary">
                Exercício {workoutState.currentExerciseIndex + 1} de {exercicios.length}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="p-2 text-text-secondary hover:text-primary transition-colors"
              >
                {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={() => router.push('/aluno/dashboard')}
                className="text-text-secondary hover:text-primary transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Exercise */}
        <div className="card-neon mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">
              {currentExercise?.exercicio?.nome}
            </h2>
            <p className="text-lg text-text-secondary">
              Série {workoutState.currentSet} de {currentExercise?.series || 1} • {currentExercise?.repeticoes || 0} repetições
            </p>
            {currentExercise?.carga_kg && (
              <p className="text-primary font-medium mt-2">
                {currentExercise.carga_kg} kg
              </p>
            )}
          </div>

          {/* Exercise Image/GIF */}
          {currentExercise?.exercicio?.gif_url && (
            <div className="mb-8 flex justify-center">
              <img
                src={currentExercise.exercicio.gif_url}
                alt={currentExercise.exercicio.nome}
                className="max-w-xs rounded-lg"
              />
            </div>
          )}

          {/* Instructions */}
          {currentExercise?.anotacoes && (
            <div className="mb-8 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-text-primary">
                <strong>Instruções do personal:</strong> {currentExercise.anotacoes}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col items-center space-y-6">
            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              className="w-24 h-24 rounded-full bg-primary hover:bg-primary-dark flex items-center justify-center transition-all duration-200 transform hover:scale-105"
            >
              {workoutState.isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white ml-1" />
              )}
            </button>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handleCompleteSet}
                disabled={!workoutState.isPlaying}
                className="btn-success flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                <span>Completar série</span>
              </button>

              <button
                onClick={handleSkipExercise}
                className="text-text-secondary hover:text-primary transition-colors flex items-center space-x-2"
              >
                <SkipForward className="w-5 h-5" />
                <span>Pular</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rest Timer */}
        {workoutState.isResting && (
          <div className="card-neon mb-8 p-8 text-center">
            <h3 className="text-2xl font-bold text-text-primary mb-4">
              ⏱️ Descanso
            </h3>
            <div className="text-6xl font-bold text-primary mb-4">
              {Math.floor(workoutState.restTimeLeft / 60)}:{(workoutState.restTimeLeft % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-text-secondary">
              Prepare-se para a próxima série
            </p>
            <button
              onClick={() => setWorkoutState(prev => ({ ...prev, restTimeLeft: 0 }))}
              className="mt-4 text-primary hover:text-primary-dark transition-colors"
            >
              Pular descanso
            </button>
          </div>
        )}

        {/* Exercise List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Próximos exercícios
          </h3>
          <div className="space-y-3">
            {exercicios.map((exercicio, index) => {
              const isCompleted = index < workoutState.currentExerciseIndex;
              const isCurrent = index === workoutState.currentExerciseIndex;
              
              return (
                <div
                  key={exercicio.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isCompleted
                      ? 'bg-success/20 border border-success/30'
                      : isCurrent
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-bg-dark'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm font-bold text-white ${
                      isCompleted
                        ? 'bg-success'
                        : isCurrent
                        ? 'bg-primary'
                        : 'bg-text-secondary'
                    }">
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div>
                      <p className={`font-medium ${
                        isCompleted || isCurrent ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        {exercicio.exercicio?.nome}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {exercicio.series} × {exercicio.repeticoes}
                      </p>
                    </div>
                  </div>
                  {isCurrent && workoutState.isPlaying && (
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}