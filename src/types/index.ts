export * from './database';

export interface UserSession {
  user: {
    id: string;
    email: string;
    nome: string;
    tipo: 'personal' | 'aluno';
    foto_url?: string;
  } | null;
}

export interface WorkoutPlayerState {
  isPlaying: boolean;
  currentExerciseIndex: number;
  currentSet: number;
  currentReps: number;
  isResting: boolean;
  restTimeLeft: number;
  workoutStartTime: Date | null;
  completedSets: Set<string>;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
}

export interface Stats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalWeight: number;
  streakDays: number;
  averageAdherence: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  read: boolean;
}