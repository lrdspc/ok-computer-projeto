# Prompts para Geração de Código - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento contém prompts otimizados para geração de código utilizando Inteligência Artificial (GitHub Copilot, ChatGPT, Claude, etc.). Os prompts são organizados por tipo de funcionalidade e seguem as convenções do projeto.

## 2. CONVENÇÕES DO PROJETO

### 2.1. Padrões de Código

- **TypeScript**: Todo código deve ser tipado
- **React 18.3+**: Hooks, Server Components
- **Next.js 15.1**: App Router
- **Tailwind CSS**: Classes utilitárias
- **shadcn/ui**: Componentes de UI
- **Zustand**: Gerenciamento de estado
- **Supabase**: Backend e banco de dados

### 2.2. Estrutura de Arquivos

```
Component: /components/features/[feature]/ComponentName.tsx
Hook: /hooks/useHookName.ts
API Route: /app/api/[endpoint]/route.ts
Page: /app/(app)/[page]/page.tsx
Type: /types/[domain].ts
Util: /lib/utils.ts
```

## 3. PROMPTS PARA COMPONENTES

### 3.1. Componente de Formulário

```prompt
Crie um componente React TypeScript para um formulário de criação de exercícios com as seguintes características:

Requisitos:
- Nome do exercício (obrigatório, mínimo 3 caracteres)
- Descrição (opcional, máximo 500 caracteres)
- Grupos musculares (checkboxes: peito, costas, ombros, bíceps, tríceps, quadríceps, hamstrings, glúteos, panturrilha, abdômen)
- Dificuldade (select: iniciante, intermediário, avançado)
- Equipamento (select: none, dumbbell, barbell, machine, cable, band, bodyweight)
- Upload de imagem (opcional)
- Botões: Salvar, Cancelar

Validações:
- Use React Hook Form com Zod
- Mostre erros inline
- Desabilite botão de submit durante envio
- Feedback visual de sucesso/erro

Estilo:
- Use shadcn/ui components (Form, Input, Select, Checkbox, Button)
- Layout responsivo com Tailwind CSS
- Card container com padding adequado

Props:
- onSubmit: (data: ExerciseFormData) => void
- isLoading?: boolean
- initialData?: Partial<ExerciseFormData>

Exemplo de uso:
<ExerciseForm onSubmit={handleSubmit} isLoading={isLoading} />
```

### 3.2. Componente de Dashboard

```prompt
Crie um componente de dashboard para personal trainers com as seguintes seções:

Layout:
- Header com saudação e avatar do usuário
- Cards de estatísticas rápidas (4 colunas em desktop, 2 em mobile):
  - Total de alunos ativos
  - Treinos criados este mês
  - Sessões completadas hoje
  - Taxa de retenção (30 dias)
- Gráfico de progresso dos alunos (últimos 30 dias)
- Lista de atividades recentes
- Calendário com treinos agendados

Dados:
- Use React Query para buscar dados
- Skeleton loading enquanto carrega
- Tratamento de erro com retry
- Cache de 5 minutos

Gráfico:
- Use Recharts ou Chart.js
- Tipo: área empilhada
- Dados: peso, % gordura, massa magra
- Tooltip interativo

Atividades:
- Avatar do aluno
- Nome e ação
- Timestamp relativo ("há 2 horas")
- Badge de status

Estilo:
- Grid layout responsivo
- Cards com sombra suave
- Cores do tema (primary, secondary)
- Animações suaves com framer-motion
```

### 3.3. Componente de Timer

```prompt
Crie um componente de timer de exercício com precisão para treinos:

Funcionalidades:
- Contador regressivo com display grande (mm:ss)
- Botões: Play, Pause, Reset
- Som de alerta ao final (opcional)
- Vibração háptica (se suportado)
- Previne sleep da tela durante execução
- Fallback para setInterval se Web Workers não suportado

Precisão:
- Use Web Workers para evitar drift do timer
- Erro máximo de 1 segundo a cada 10 minutos
- Sincroniza com tempo real do sistema

Interface:
- Display digital estilo LED (font-mono)
- Botões grandes e fáceis de clicar
- Indicador visual de estado (rodando/pausado)
- Progresso circular opcional

Hooks:
- useTimerWorker para lógica do timer
- useWakeLock para manter tela ativa
- useHaptic para feedback

Props:
- duration: number (segundos)
- onComplete?: () => void
- onTick?: (remaining: number) => void
- showControls?: boolean
- size?: 'sm' | 'md' | 'lg'

Estado visual:
- Verde quando rodando
- Amarelo quando pausado
- Piscar nos últimos 10 segundos
```

## 4. PROMPTS PARA HOOKS

### 4.1. Hook de Autenticação

```prompt
Crie um hook customizado useAuth para gerenciar autenticação:

Funcionalidades:
- Login com email/senha
- Logout
- Registro de novo usuário
- Recuperação de senha
- Verificação de email
- Atualização de perfil
- Status de autenticação (loading, error, user)
- Persistência de sessão

Estado:
- user: User | null
- isLoading: boolean
- isAuthenticated: boolean
- error: Error | null

Métodos:
- login(email: string, password: string): Promise<void>
- logout(): Promise<void>
- register(data: RegisterData): Promise<void>
- resetPassword(email: string): Promise<void>
- updateProfile(data: UpdateProfileData): Promise<void>

Integração:
- Use Supabase Auth
- Salve estado no Zustand
- Atualize automaticamente quando sessão mudar
- Limpe dados ao deslogar

Exemplo de uso:
const { user, login, logout, isLoading } = useAuth();
```

### 4.2. Hook de Armazenamento Offline

```prompt
Crie um hook useOfflineStorage para gerenciar dados offline:

Funcionalidades:
- Salvar dados no IndexedDB
- Buscar dados do IndexedDB
- Sincronizar com Supabase quando online
- Fila de sincronização
- Gerenciar conflitos
- Limpar dados antigos

Métodos:
- saveWorkoutSession(data: WorkoutSession): Promise<void>
- getWorkoutSessions(): Promise<WorkoutSession[]>
- addToSyncQueue(type: string, data: any): Promise<void>
- processSyncQueue(): Promise<void>
- clearOldData(olderThan: Date): Promise<void>

Eventos:
- Detecta mudança de status online/offline
- Processa fila ao voltar online
- Retry automático em caso de falha

IndexedDB Schema:
- workout-sessions (com sync status)
- sync-queue (com retry count)
- user-data (cache local)

Configuração:
- Use biblioteca idb
- Schema versionado
- Índices para performance

Exemplo de uso:
const { saveWorkoutSession, processSyncQueue } = useOfflineStorage();
```

### 4.3. Hook de Notificações

```prompt
Crie um hook useNotifications para gerenciar notificações push:

Funcionalidades:
- Solicitar permissão de notificação
- Inscrever usuário para notificações
- Enviar notificação local
- Configurar preferências
- Cancelar inscrição

Permissões:
- Detecta suporte do navegador
- Solicita permissão se necessário
- Trata casos de bloqueio

Métodos:
- requestPermission(): Promise<NotificationPermission>
- subscribe(): Promise<PushSubscription | null>
- unsubscribe(): Promise<void>
- showNotification(title: string, options?: NotificationOptions): void
- updatePreferences(preferences: NotificationPreferences): Promise<void>

Integração:
- Use Service Worker
- VAPID keys para autenticação
- Supabase para salvar subscriptions
- Web Push API

Tipos de notificações:
- Lembrete de treino
- Nova avaliação disponível
- Mensagem do personal trainer
- Meta alcançada

Exemplo de uso:
const { subscribe, showNotification } = useNotifications();
```

## 5. PROMPTS PARA API ROUTES

### 5.1. API de Webhook

```prompt
Crie uma API Route para receber webhooks do Supabase (Realtime):

Endpoint: POST /api/webhooks/supabase

Funcionalidades:
- Verificar assinatura do webhook (segurança)
- Processar diferentes tipos de eventos
- Filtros por tabela e operação
- Rate limiting
- Retry em caso de falha

Eventos:
- INSERT em workout_sessions → notificar personal trainer
- UPDATE em assessments → atualizar cache
- DELETE em exercises → limpar referências

Validação:
- Verificar header X-Supabase-Signature
- Validar payload structure
- Rate limit por IP

Processamento:
- Parse do payload
- Identificar tipo de evento
- Chamar handler apropriado
- Log de sucesso/erro

Resposta:
- 200: Sucesso
- 400: Bad request
- 401: Unauthorized
- 429: Rate limited
- 500: Server error

Exemplo de payload:
{
  type: 'INSERT',
  table: 'workout_sessions',
  record: { id: '123', ... },
  schema: 'app'
}
```

### 5.2. API de Export

```prompt
Crie uma API Route para exportar dados do usuário:

Endpoint: GET /api/export/:userId

Funcionalidades:
- Exportar todos os dados do usuário (LGPD)
- Formato JSON ou PDF
- Autenticação e autorização
- Rate limiting

Dados a exportar:
- Perfil do usuário
- Treinos atribuídos
- Sessões completadas
- Avaliações físicas
- Progresso histórico

Autenticação:
- Verificar JWT token
- Usuário só pode exportar próprios dados
- Personal trainer pode exportar dados dos alunos

Processamento:
- Coletar dados de múltiplas tabelas
- Formatar estrutura hierárquica
- Gerar arquivo (JSON/PDF)
- Upload para storage temporário
- Retornar URL de download

Formato JSON:
{
  user: { ... },
  workouts: [...],
  assessments: [...],
  sessions: [...],
  exportedAt: "2025-01-01T00:00:00Z"
}

Headers:
- Content-Type: application/json
- Content-Disposition: attachment; filename="user-data.json"
```

## 6. PROMPTS PARA BANCO DE DADOS

### 6.1. Migration de Nova Tabela

```prompt
Crie uma migration SQL para adicionar tabela de conquistas (achievements):

Tabela: app.achievements

Colunas:
- id: UUID, PK, default uuid_generate_v4()
- user_id: UUID, FK para app.users, not null
- achievement_type: text, not null (enum: 'first_workout', 'streak_7_days', 'weight_goal', etc)
- title: text, not null
- description: text
- icon_url: text
- earned_at: timestamptz, not null, default now()
- metadata: jsonb (dados adicionais da conquista)

Constraints:
- FK para app.users(id) on delete cascade
- Unique constraint (user_id, achievement_type)
- Check constraint para achievement_type válido

Índices:
- user_id
- achievement_type
- earned_at

RLS:
- Usuário pode ver próprias conquistas
- Personal trainer pode ver conquistas dos alunos

Trigger:
- Ao inserir, verificar se conquista já existe
- Se sim, ignorar (não duplicar)

Exemplo de dados:
{
  id: 'uuid',
  user_id: 'user-123',
  achievement_type: 'first_workout',
  title: 'Primeira Sessão',
  description: 'Parabéns por completar seu primeiro treino!',
  icon_url: 'https://...',
  earned_at: '2025-01-01T10:00:00Z',
  metadata: { workout_id: 'workout-456' }
}
```

### 6.2. Edge Function

```prompt
Crie uma Edge Function para processar vídeos de exercícios:

Endpoint: POST /functions/process-video

Entrada:
{
  videoUrl: string,    // URL do vídeo no Supabase Storage
  exerciseId: string,  // ID do exercício
  userId: string       // ID do usuário
}

Processamento:
1. Download do vídeo
2. Extrair thumbnail (frame no segundo 2)
3. Detectar duração do vídeo
4. Verificar formato e codec
5. Gerar preview (primeiros 5 segundos)
6. Converter para formatos compatíveis (se necessário)
7. Upload dos arquivos processados
8. Atualizar exercício no banco

Bibliotecas:
- Use FFmpeg.wasm ou similar
- Sharp para processamento de imagens
- Supabase JS para upload

Formatos de saída:
- Thumbnail: JPG, 300x200px
- Preview: MP4, 5 segundos, 720p
- Vídeo principal: MP4, H.264, 1080p (se não for)

Validações:
- Tamanho máximo: 50MB
- Formatos aceitos: MP4, MOV, AVI
- Duração máxima: 5 minutos
- Resolução mínima: 720p

Resposta de sucesso:
{
  success: true,
  data: {
    thumbnailUrl: 'https://...',
    previewUrl: 'https://...',
    duration: 125, // segundos
    processedAt: '2025-01-01T00:00:00Z'
  }
}

Erros:
- 400: Invalid input
- 413: File too large
- 415: Unsupported format
- 500: Processing error
```

## 7. PROMPTS PARA TESTES

### 7.1. Teste Unitário

```prompt
Crie testes unitários para o hook useTimerWorker:

Testes a cobrir:
1. Inicia timer com tempo correto
2. Chama callback ao completar
3. Pausa e retoma corretamente
4. Lida com múltiplos start/stop
5. Fallback para setInterval quando Web Workers não suportado
6. Cleanup ao desmontar componente
7. Tratamento de erros

Use Vitest e React Testing Library

Mock:
- Worker global
- setInterval/setTimeout
- console.warn

Estrutura:
describe('useTimerWorker', () => {
  beforeEach(() => { ... })
  afterEach(() => { ... })
  
  it('should start timer with correct initial time', () => { ... })
  it('should call onComplete when timer finishes', async () => { ... })
  it('should handle pause and resume', () => { ... })
  it('should handle multiple start/stop calls', () => { ... })
  it('should fallback to setInterval when Worker not supported', () => { ... })
  it('should cleanup on unmount', () => { ... })
  it('should handle errors gracefully', () => { ... })
})

Expectativas:
- Use vi.fn() para mocks
- Use act() para atualizações de estado
- Verifique valores exatos de tempo
- Teste comportamento assíncrono
```

### 7.2. Teste E2E

```prompt
Crie testes E2E para o fluxo completo de treino:

Cenário: Aluno completa treino do início ao fim

Passos:
1. Login do aluno
2. Navegar para dashboard
3. Clicar em "Iniciar Treino de Hoje"
4. Verificar player de treino
5. Completar todas as séries de todos os exercícios
6. Aguardar timers de descanso
7. Verificar resumo final

Validações:
- Cada exercício aparece na ordem correta
- Timer funciona corretamente
- Progresso é atualizado
- Dados são salvos
- Notificação de conclusão aparece

Configurações:
- Use Playwright
- Mock dados do Supabase
- Teste em múltiplos navegadores
- Teste offline também

Dados de teste:
- Usuário: student@example.com / password123
- Treino: "Treino A - Peito e Tríceps"
- Exercícios: 3 exercícios, 3 séries cada
- Descanso: 60 segundos entre séries

Asserções:
- URL muda corretamente
- Elementos estão visíveis
- Timer decrementa
- Botões são clicáveis
- Resumo mostra estatísticas corretas
```

## 8. PROMPTS PARA PERFORMANCE

### 8.1. Otimização de Componente

```prompt
Otimize o componente WorkoutCard para melhor performance:

Problemas atuais:
- Re-renderiza desnecessariamente
- Não memoiza cálculos pesados
- Imagens não são otimizadas

Requisitos:
1. Use React.memo para evitar re-renders
2. Use useMemo para cálculos de estatísticas
3. Use useCallback para funções de evento
4. Implemente lazy loading de imagens
5. Adicione placeholder para imagens
6. Otimize bundle com code splitting

Código atual:
export function WorkoutCard({ workout, onStart, variant = 'student' }) {
  const totalVolume = workout.exercises.reduce((total, ex) => {
    return total + (ex.sets * ex.reps * ex.suggested_weight_kg)
  }, 0)
  
  return (
    <Card>
      <img src={workout.thumbnail} />
      <h3>{workout.name}</h3>
      <p>Volume: {totalVolume}kg</p>
      <button onClick={() => onStart(workout.id)}>Iniciar</button>
    </Card>
  )
}

Melhorias necessárias:
- Memoize totalVolume
- Lazy load imagem
- Memoize onStart handler
- Adicione prop types
- Use Image do Next.js

Retorne o código otimizado com explicações.
```

### 8.2. Query Optimization

```prompt
Otimize esta query Supabase para melhor performance:

Query atual:
const { data, error } = await supabase
  .from('workout_sessions')
  .select(`
    *,
    assignment:workout_assignments(
      workout:workouts(*),
      student:users(*)
    ),
    session_entries(*)
  `)
  .eq('assignment.student_id', studentId)
  .order('started_at', { ascending: false })

Problemas:
- Seleciona todos os campos (*)
- Múltiplos joins aninhados
- Sem limite de resultados
- Sem índices apropriados

Melhorias:
1. Selecione apenas campos necessários
2. Limite resultados (paginação)
3. Adicione índices no banco
4. Use count estimado
5. Considere materialized view

Forneça:
- Query otimizada
- Índices necessários
- Schema de view se aplicável
- Explicação das melhorias
```

## 9. DICAS PARA USO EFETIVO

### 9.1. Contexto é Importante

Sempre inclua:
- Tipo de arquivo (componente, hook, etc.)
- Framework e versão (Next.js 15.1, React 18.3)
- Bibliotecas em uso (shadcn/ui, Supabase)
- Padrões do projeto (TypeScript, Tailwind)

### 9.2. Iteração

Se o resultado não for perfeito:
1. Peça ajustes específicos
2. Forneça exemplos do código atual
3. Explique o problema encontrado
4. Solicite alternativas

### 9.3. Verificação

Sempre revise:
- Tipos TypeScript estão corretos
- Imports estão completos
- Lógica faz sentido
- Segue convenções do projeto
- Não introduz vulnerabilidades

### 9.4. Personalização

Adapte os prompts para:
- Seu estilo de código
- Padrões da equipe
- Requisitos específicos do projeto
- Nível de detalhe desejado

## 10. EXEMPLOS COMPLETOS

### 10.1. Componente Completo

```prompt
Crie um componente completo de lista de exercícios com:

1. Header com título e botão "Novo Exercício"
2. Filtros laterais (musculatura, dificuldade, equipamento)
3. Grid de cards responsivo
4. Paginação
5. Ordenação
6. Busca em tempo real
7. Loading skeleton
8. Empty state
9. Error state

Use:
- Next.js 15.1 App Router
- TypeScript
- shadcn/ui components
- Tailwind CSS
- React Query para dados
- Zustand para estado global
- Debounce para busca

Props:
- trainerId: string
- onExerciseSelect?: (exercise: Exercise) => void
- selectable?: boolean

Código completo com tipos, hooks, e estilos.
```

### 10.2. Hook Completo

```prompt
Crie um hook completo useWorkoutManager:

Funcionalidades:
- CRUD de treinos
- Atribuir a alunos
- Clonar treinos
- Arquivar/desarquivar
- Busca e filtros
- Paginação

Estado:
- workouts: Workout[]
- totalCount: number
- isLoading: boolean
- error: Error | null
- filters: WorkoutFilters
- pagination: PaginationState

Métodos:
- createWorkout(data: CreateWorkoutData): Promise<Workout>
- updateWorkout(id: string, data: UpdateWorkoutData): Promise<Workout>
- deleteWorkout(id: string): Promise<void>
- assignWorkout(workoutId: string, studentIds: string[]): Promise<void>
- cloneWorkout(id: string): Promise<Workout>
- searchWorkouts(query: string): Promise<void>
- setFilters(filters: Partial<WorkoutFilters>): void
- setPage(page: number): void

Integrações:
- Supabase para CRUD
- React Query para cache
- Zustand para estado
- Realtime subscriptions

Código completo com tipos, validações, e tratamento de erros.
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Desenvolvimento
