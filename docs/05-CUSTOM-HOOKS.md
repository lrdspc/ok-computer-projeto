# Custom Hooks - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento descreve todos os custom hooks React utilizados no sistema, sua funcionalidade, assinatura, exemplos de uso e tratamento de erros. Os hooks são organizados por categoria de funcionalidade.

## 2. HOOKS DE PWA (PROGRESSIVE WEB APP)

### 2.1. useTimerWorker

**Arquivo**: `/hooks/useTimerWorker.ts`

Hook para gerenciar um timer preciso usando Web Workers, com fallback para setInterval em navegadores que não suportam Workers.

#### Assinatura

```typescript
interface UseTimerWorkerReturn {
  time: number;           // Tempo restante em segundos
  isRunning: boolean;     // Se o timer está executando
  start: (seconds: number) => void;  // Inicia o timer
  stop: () => void;       // Para o timer
  pause: () => void;      // Pausa o timer (não implementado no exemplo base)
  resume: () => void;     // Retoma o timer (não implementado no exemplo base)
}

function useTimerWorker(onComplete?: () => void): UseTimerWorkerReturn;
```

#### Implementação

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

// Código do Worker como string
const timerWorkerCode = `
  let intervalId = null;
  let remaining = 0;

  self.onmessage = (e) => {
    const { command, seconds } = e.data;

    if (command === 'start') {
      remaining = seconds;
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        remaining--;
        self.postMessage({ type: 'tick', remaining });
        if (remaining <= 0) {
          clearInterval(intervalId);
          intervalId = null;
          self.postMessage({ type: 'complete' });
        }
      }, 1000);
    } else if (command === 'stop') {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      remaining = 0;
    }
  };
`;

export function useTimerWorker(onComplete?: () => void) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Verifica suporte a Web Workers
    if (typeof Worker !== 'undefined') {
      try {
        const blob = new Blob([timerWorkerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const worker = new Worker(url);
        workerRef.current = worker;

        worker.onmessage = (e) => {
          if (e.data.type === 'tick') {
            setTime(e.data.remaining);
          } else if (e.data.type === 'complete') {
            setIsRunning(false);
            onComplete?.();
          }
        };

        worker.onerror = (error) => {
          console.error('Timer Worker Error:', error);
          setIsRunning(false);
          // Fallback para setInterval em caso de erro
          initializeFallback();
        };

        return () => {
          worker.terminate();
          URL.revokeObjectURL(url);
        };
      } catch (error) {
        console.error('Failed to create Web Worker:', error);
        initializeFallback();
      }
    } else {
      // Fallback para navegadores sem suporte a Workers
      console.warn('Web Workers not supported. Falling back to setInterval.');
      initializeFallback();
    }
  }, [onComplete]);

  const initializeFallback = () => {
    // Implementação do fallback com setInterval
    // Esta função seria chamada se Workers não forem suportados
  };

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) {
      console.warn('Timer seconds must be positive');
      return;
    }

    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'start', seconds });
      setTime(seconds);
      setIsRunning(true);
    } else {
      // Fallback: usar setInterval
      setTime(seconds);
      setIsRunning(true);
      
      fallbackIntervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(fallbackIntervalRef.current!);
            setIsRunning(false);
            onComplete?.();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
  }, [onComplete]);

  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'stop' });
    }
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
    setIsRunning(false);
    setTime(0);
  }, []);

  const pause = useCallback(() => {
    // Implementação de pause (necessita ajustes no worker)
    console.warn('Pause functionality not implemented in base version');
  }, []);

  const resume = useCallback(() => {
    // Implementação de resume (necessita ajustes no worker)
    console.warn('Resume functionality not implemented in base version');
  }, []);

  return { time, isRunning, start, stop, pause, resume };
}
```

#### Exemplo de Uso

```typescript
import { useTimerWorker } from '@/hooks/useTimerWorker';
import { useHaptic } from '@/hooks/useHaptic';

function RestTimer({ duration }: { duration: number }) {
  const { play } = useHaptic();
  const { time, isRunning, start, stop } = useTimerWorker(() => {
    play('heavy'); // Feedback háptico ao completar
    onRestComplete();
  });

  useEffect(() => {
    start(duration);
    return () => stop();
  }, [duration, start, stop]);

  return (
    <div>
      <h2>Tempo de Descanso</h2>
      <div className="text-4xl font-mono">{formatTime(time)}</div>
      <button onClick={stop} disabled={!isRunning}>
        Pular Descanso
      </button>
    </div>
  );
}
```

### 2.2. useWakeLock

**Arquivo**: `/hooks/useWakeLock.ts`

Hook para gerenciar o Wake Lock da tela, mantendo a tela ativa durante os treinos.

#### Assinatura

```typescript
interface UseWakeLockReturn {
  request: () => Promise<void>;    // Solicita wake lock
  release: () => Promise<void>;    // Libera wake lock
  isActive: boolean;               // Se o wake lock está ativo
  isSupported: boolean;            // Se a API é suportada
}

function useWakeLock(): UseWakeLockReturn;
```

#### Implementação

```typescript
import { useState, useEffect, useRef, useCallback } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Verifica suporte à API
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const request = useCallback(async () => {
    if (!isSupported) {
      console.warn('Screen Wake Lock API not supported.');
      return;
    }

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
      
      console.log('Wake Lock is active.');
    } catch (err: any) {
      console.error(`Wake Lock Error: ${err.name}, ${err.message}`);
      setIsActive(false);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
        console.log('Wake Lock has been released.');
      } catch (err) {
        console.error('Error releasing wake lock:', err);
      }
    }
  }, []);

  // Reativa wake lock quando a aba volta ao foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        release();
      }
    };
  }, [request, release]);

  return { 
    request, 
    release, 
    isActive, 
    isSupported 
  };
}
```

#### Exemplo de Uso

```typescript
import { useWakeLock } from '@/hooks/useWakeLock';

function WorkoutPlayer() {
  const { request, release, isActive, isSupported } = useWakeLock();

  useEffect(() => {
    // Solicita wake lock quando o treino começa
    request();
    
    // Libera quando o componente desmonta
    return () => {
      release();
    };
  }, [request, release]);

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
        ⚠️ Seu dispositivo não suporta bloqueio de tela. 
        Mantenha a tela ativa manualmente durante o treino.
      </div>
    );
  }

  return (
    <div>
      <h1>Treino em Andamento</h1>
      <div className={`text-sm ${isActive ? 'text-green-600' : 'text-red-600'}`}>
        Tela {isActive ? 'ativa' : 'desbloqueada'}
      </div>
      {/* Conteúdo do treino */}
    </div>
  );
}
```

### 2.3. useHaptic

**Arquivo**: `/hooks/useHaptic.ts`

Hook para fornecer feedback háptico (vibração) com fallback para iOS.

#### Assinatura

```typescript
type HapticPattern = 'light' | 'medium' | 'heavy';

interface UseHapticReturn {
  play: (pattern: HapticPattern) => void;  // Executa padrão de vibração
  isSupported: boolean;                    // Se a API é suportada
}

function useHaptic(): UseHapticReturn;
```

#### Implementação

```typescript
import { useState, useCallback, useEffect } from 'react';

export function useHaptic() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Verifica suporte à Vibration API
    if ('vibrate' in navigator) {
      setIsSupported(true);
    }
  }, []);

  const play = useCallback((pattern: 'light' | 'medium' | 'heavy') => {
    if (!isSupported) {
      // Fallback para iOS: usar overlay visual
      createVisualFeedback(pattern);
      return;
    }

    const patterns = {
      light: [10],      // 10ms
      medium: [20],     // 20ms
      heavy: [50],      // 50ms
    };

    try {
      navigator.vibrate(patterns[pattern]);
    } catch (error) {
      console.error('Vibration failed:', error);
      createVisualFeedback(pattern);
    }
  }, [isSupported]);

  const createVisualFeedback = (pattern: 'light' | 'medium' | 'heavy') => {
    // Cria overlay que pisca em vez de alterar background do body
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${pattern === 'light' ? 'rgba(255,255,255,0.1)' : 
                   pattern === 'medium' ? 'rgba(255,255,255,0.2)' : 
                   'rgba(255,255,255,0.3)'};
      pointer-events: none;
      z-index: 9999;
      animation: flash 0.3s ease-in-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes flash {
        0%, 100% { opacity: 0; }
        50% { opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
    
    setTimeout(() => {
      document.body.removeChild(overlay);
      document.head.removeChild(style);
    }, 300);
  };

  return { play, isSupported };
}
```

#### Exemplo de Uso

```typescript
import { useHaptic } from '@/hooks/useHaptic';

function ExerciseButton() {
  const { play, isSupported } = useHaptic();

  const handlePress = () => {
    play('medium'); // Feedback háptico ao pressionar
    onExerciseComplete();
  };

  return (
    <button 
      onClick={handlePress}
      className="px-6 py-3 bg-blue-500 text-white rounded-lg"
    >
      Completar Série
      {!isSupported && (
        <span className="text-xs ml-2">(sem vibração)</span>
      )}
    </button>
  );
}
```

### 2.4. useBackgroundSync

**Arquivo**: `/hooks/useBackgroundSync.ts`

Hook para registrar sincronização em background usando Background Sync API.

#### Assinatura

```typescript
interface UseBackgroundSyncReturn {
  registerSync: (tag: string, data: any) => Promise<boolean>;
  isSupported: boolean;
}

function useBackgroundSync(): UseBackgroundSyncReturn;
```

#### Implementação

```typescript
import { useState, useEffect, useCallback } from 'react';
import { useOfflineStorage } from './useOfflineStorage';

export function useBackgroundSync() {
  const [isSupported, setIsSupported] = useState(false);
  const { addToSyncQueue } = useOfflineStorage();

  useEffect(() => {
    if ('serviceWorker' in navigator && 'sync' in window) {
      setIsSupported(true);
    }
  }, []);

  const registerSync = useCallback(async (tag: string, data: any) => {
    if (!isSupported) {
      console.warn('Background Sync not supported');
      return false;
    }

    try {
      // Salva dados no IndexedDB para sincronização
      await addToSyncQueue(tag, data);

      // Registra sync no Service Worker
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);

      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }, [isSupported, addToSyncQueue]);

  return { registerSync, isSupported };
}
```

#### Exemplo de Uso

```typescript
import { useBackgroundSync } from '@/hooks/useBackgroundSync';

function WorkoutCompleteButton() {
  const { registerSync } = useBackgroundSync();

  const handleCompleteWorkout = async (workoutData: any) => {
    // Salva localmente primeiro
    await saveWorkoutLocally(workoutData);
    
    // Registra para sincronização em background
    const success = await registerSync('workout-complete', workoutData);
    
    if (success) {
      console.log('Treino será sincronizado quando online');
    } else {
      console.log('Sincronização manual necessária');
    }
  };

  return (
    <button onClick={() => handleCompleteWorkout(workoutData)}>
      Finalizar Treino
    </button>
  );
}
```

### 2.5. useOfflineStorage

**Arquivo**: `/hooks/useOfflineStorage.ts`

Hook para abstrair a interação com IndexedDB usando a biblioteca `idb`.

#### Assinatura

```typescript
interface UseOfflineStorageReturn {
  saveSession: (sessionData: any) => Promise<void>;
  getSession: (sessionId: string) => Promise<any>;
  addToSyncQueue: (tag: string, data: any) => Promise<void>;
  getSyncQueue: () => Promise<any[]>;
  clearSyncQueue: () => Promise<void>;
  saveUserData: (userId: string, data: any) => Promise<void>;
  getUserData: (userId: string) => Promise<any>;
}

function useOfflineStorage(): UseOfflineStorageReturn;
```

#### Implementação

```typescript
import { useCallback } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Schema do banco de dados
interface MyDB extends DBSchema {
  'workout-sessions': {
    key: string;
    value: {
      id: string;
      userId: string;
      workoutId: string;
      startedAt: string;
      completedAt?: string;
      exercises: any[];
      syncStatus: 'pending' | 'synced';
    };
    indexes: { 'by-user': string };
  };
  'sync-queue': {
    key: number;
    value: {
      id?: number;
      userId: string;
      tag: string;
      data: any;
      createdAt: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      retryCount: number;
    };
    indexes: { 'by-tag': string; 'by-user': string };
  };
  'user-data': {
    key: string;
    value: {
      userId: string;
      profile: any;
      preferences: any;
      lastSync: string;
    };
    indexes: { 'by-user': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MyDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>('treinos-db', 1, {
      upgrade(db) {
        // Store para sessões de treino
        const sessionStore = db.createObjectStore('workout-sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-user', 'userId');

        // Store para fila de sincronização
        const syncStore = db.createObjectStore('sync-queue', { autoIncrement: true, keyPath: 'id' });
        syncStore.createIndex('by-tag', 'tag');
        syncStore.createIndex('by-user', 'userId');

        // Store para dados do usuário
        const userStore = db.createObjectStore('user-data', { keyPath: 'userId' });
        userStore.createIndex('by-user', 'userId');
      },
    });
  }
  return dbPromise;
}

export function useOfflineStorage() {
  const saveSession = useCallback(async (sessionData: any) => {
    const db = await getDb();
    await db.put('workout-sessions', {
      ...sessionData,
      syncStatus: 'pending',
    });
  }, []);

  const getSession = useCallback(async (sessionId: string) => {
    const db = await getDb();
    return db.get('workout-sessions', sessionId);
  }, []);

  const addToSyncQueue = useCallback(async (tag: string, data: any) => {
    const db = await getDb();
    const userId = await getCurrentUserId(); // Implementar esta função
    
    await db.add('sync-queue', {
      userId,
      tag,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
  }, []);

  const getSyncQueue = useCallback(async () => {
    const db = await getDb();
    return db.getAllFromIndex('sync-queue', 'by-status', 'pending');
  }, []);

  const clearSyncQueue = useCallback(async () => {
    const db = await getDb();
    const tx = db.transaction('sync-queue', 'readwrite');
    await tx.objectStore('sync-queue').clear();
    await tx.done;
  }, []);

  const saveUserData = useCallback(async (userId: string, data: any) => {
    const db = await getDb();
    await db.put('user-data', {
      userId,
      ...data,
      lastSync: new Date().toISOString(),
    });
  }, []);

  const getUserData = useCallback(async (userId: string) => {
    const db = await getDb();
    return db.get('user-data', userId);
  }, []);

  return {
    saveSession,
    getSession,
    addToSyncQueue,
    getSyncQueue,
    clearSyncQueue,
    saveUserData,
    getUserData,
  };
}

// Função auxiliar para obter ID do usuário atual
async function getCurrentUserId(): Promise<string> {
  // Implementar lógica para obter ID do usuário logado
  // Pode usar Zustand, localStorage, ou outro método
  return 'current-user-id';
}
```

#### Exemplo de Uso

```typescript
import { useOfflineStorage } from '@/hooks/useOfflineStorage';

function WorkoutSession() {
  const { saveSession, addToSyncQueue } = useOfflineStorage();

  const handleCompleteWorkout = async (sessionData: any) => {
    // Salva sessão localmente
    await saveSession(sessionData);
    
    // Adiciona à fila de sincronização
    await addToSyncQueue('workout-session', sessionData);
    
    console.log('Sessão salva offline e agendada para sincronização');
  };

  return (
    <div>
      {/* Conteúdo do treino */}
      <button onClick={() => handleCompleteWorkout(workoutData)}>
        Finalizar Treino
      </button>
    </div>
  );
}
```

## 3. HOOKS DE DADOS

### 3.1. useSupabase

**Arquivo**: `/hooks/useSupabase.ts`

Hook para acessar o cliente Supabase com tipos TypeScript.

#### Assinatura

```typescript
interface UseSupabaseReturn {
  supabase: SupabaseClient<Database>;
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

function useSupabase(): UseSupabaseReturn;
```

#### Implementação

```typescript
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function useSupabase() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Obtém sessão atual
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setUser(session?.user ?? null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { supabase, user, isLoading, error };
}
```

#### Exemplo de Uso

```typescript
import { useSupabase } from '@/hooks/useSupabase';

function UserProfile() {
  const { supabase, user, isLoading } = useSupabase();

  if (isLoading) return <div>Carregando...</div>;
  if (!user) return <div>Usuário não autenticado</div>;

  const updateProfile = async (data: any) => {
    const { error } = await supabase
      .from('users')
      .update(data)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  return (
    <div>
      <h1>Bem-vindo, {user.email}</h1>
      {/* Formulário de perfil */}
    </div>
  );
}
```

### 3.2. useWorkoutData

**Arquivo**: `/hooks/useWorkoutData.ts`

Hook para buscar e gerenciar dados de treinos com React Query.

#### Assinatura

```typescript
interface UseWorkoutDataReturn {
  workouts: Workout[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

function useWorkoutData(userId: string): UseWorkoutDataReturn;
```

#### Implementação

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useWorkoutData(userId: string) {
  const queryClient = useQueryClient();

  // Busca treinos do usuário
  const { data: workouts, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('trainer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para criar treino
  const createWorkout = useMutation({
    mutationFn: async (workoutData: any) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert(workoutData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache e refetch
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] });
    },
  });

  return {
    workouts,
    isLoading,
    isError,
    error,
    refetch,
    createWorkout,
  };
}
```

#### Exemplo de Uso

```typescript
import { useWorkoutData } from '@/hooks/useWorkoutData';

function WorkoutList() {
  const { workouts, isLoading, isError, error } = useWorkoutData(userId);

  if (isLoading) return <div>Carregando treinos...</div>;
  if (isError) return <div>Erro: {error?.message}</div>;

  return (
    <div>
      {workouts?.map((workout) => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

## 4. HOOKS DE UI/UX

### 4.1. useMediaQuery

**Arquivo**: `/hooks/useMediaQuery.ts`

Hook para detectar media queries e responsividade.

#### Assinatura

```typescript
function useMediaQuery(query: string): boolean;
```

#### Implementação

```typescript
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Define estado inicial
    setMatches(media.matches);

    // Listener para mudanças
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Adiciona listener
    if (media.addEventListener) {
      media.addEventListener('change', handler);
    } else {
      // Fallback para navegadores antigos
      media.addListener(handler as any);
    }

    // Cleanup
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener('change', handler);
      } else {
        media.removeListener(handler as any);
      }
    };
  }, [query]);

  return matches;
}
```

#### Exemplo de Uso

```typescript
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ResponsiveComponent() {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <div>
      {isMobile && <MobileLayout />}
      {isTablet && <TabletLayout />}
      {isDesktop && <DesktopLayout />}
    </div>
  );
}
```

### 4.2. useDebounce

**Arquivo**: `/hooks/useDebounce.ts`

Hook para debounce de valores, útil para buscas e inputs.

#### Assinatura

```typescript
function useDebounce<T>(value: T, delay: number): T;
```

#### Implementação

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### Exemplo de Uso

```typescript
import { useDebounce } from '@/hooks/useDebounce';

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Buscar exercícios..."
    />
  );
}
```

## 5. HOOKS DE UTILIDADE

### 5.1. useLocalStorage

**Arquivo**: `/hooks/useLocalStorage.ts`

Hook para gerenciar estado no localStorage com sincronização entre abas.

#### Assinatura

```typescript
function useLocalStorage<T>(
  key: string, 
  initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>];
```

#### Implementação

```typescript
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') {
        return initialValue;
      }
      
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Sincroniza entre abas/janelas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error('Error parsing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}
```

#### Exemplo de Uso

```typescript
import { useLocalStorage } from '@/hooks/useLocalStorage';

function Settings() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');
  const [language, setLanguage] = useLocalStorage('language', 'pt-BR');

  return (
    <div>
      <select value={theme} onChange={(e) => setTheme(e.target.value)}>
        <option value="light">Claro</option>
        <option value="dark">Escuro</option>
      </select>
    </div>
  );
}
```

### 5.2. useOnlineStatus

**Arquivo**: `/hooks/useOnlineStatus.ts`

Hook para detectar status de conexão online/offline.

#### Assinatura

```typescript
interface UseOnlineStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
}

function useOnlineStatus(): UseOnlineStatusReturn;
```

#### Implementação

```typescript
import { useState, useEffect } from 'react';

export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
  };
}
```

#### Exemplo de Uso

```typescript
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

function ConnectionStatus() {
  const { isOnline, isOffline } = useOnlineStatus();

  return (
    <div className={`p-2 rounded ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
      {isOnline ? '🟢 Online' : '🔴 Offline'}
    </div>
  );
}
```

## 6. TRATAMENTO DE ERROS

### 6.1. Estratégia de Error Boundaries

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Enviar para Sentry ou outro serviço de logging
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2>Algo deu errado</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### 6.2. Hook para tratamento de erros assíncronos

```typescript
// hooks/useAsync.ts
import { useState, useCallback } from 'react';

interface UseAsyncReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = true
): UseAsyncReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await asyncFunction(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { data, loading, error, execute };
}
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Frontend
