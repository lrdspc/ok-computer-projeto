export interface Usuario {
  id: string;
  auth_id: string;
  email: string;
  nome: string;
  tipo: 'personal' | 'aluno';
  foto_url?: string;
  telefone?: string;
  created_at: string;
  updated_at: string;
}

export interface Aluno {
  id: string;
  usuario_id: string;
  personal_id: string;
  altura_cm?: number;
  peso_kg?: number;
  idade?: number;
  sexo?: string;
  objetivo_principal?: string;
  historico_lesoes?: string;
  limitacoes?: string;
  criado_em: string;
  updated_at: string;
  usuario?: Usuario;
}

export interface AvaliacaoFisica {
  id: string;
  aluno_id: string;
  data: string;
  peso_kg?: number;
  altura_cm?: number;
  peito_cm?: number;
  cintura_cm?: number;
  quadril_cm?: number;
  braco_cm?: number;
  coxa_cm?: number;
  panturrilha_cm?: number;
  percentual_gordura?: number;
  anotacoes?: string;
  foto_url?: string;
  created_at: string;
}

export interface Exercicio {
  id: string;
  nome: string;
  categoria: string;
  descricao?: string;
  forma_execucao?: string;
  musculos_envolvidos?: string[];
  equipamentos_necessarios?: string[];
  gif_url?: string;
  video_url?: string;
  criado_por?: string;
  eh_customizado: boolean;
  created_at: string;
}

export interface Treino {
  id: string;
  aluno_id: string;
  personal_id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  ativo: boolean;
  criado_em: string;
  updated_at: string;
  dias?: TreinoDia[];
  aluno?: Aluno;
}

export interface TreinoDia {
  id: string;
  treino_id: string;
  dia_semana: number;
  sequencia: number;
  created_at: string;
  exercicios?: TreinoExercicio[];
}

export interface TreinoExercicio {
  id: string;
  treino_dia_id: string;
  exercicio_id: string;
  exercicio?: Exercicio;
  series: number;
  repeticoes: number;
  carga_kg?: number;
  tempo_descanso_segundos?: number;
  anotacoes?: string;
  sequencia: number;
  created_at: string;
}

export interface HistoricoTreino {
  id: string;
  aluno_id: string;
  treino_id: string;
  data_execucao: string;
  duracao_minutos?: number;
  completo: boolean;
  anotacoes?: string;
  created_at: string;
  exercicios?: HistoricoExercicio[];
  treino?: {
    nome: string;
  };
}

export interface HistoricoExercicio {
  id: string;
  historico_treino_id: string;
  exercicio_id: string;
  serie: number;
  repeticoes_realizadas: number;
  carga_kg_realizada?: number;
  tempo_descanso_real_segundos?: number;
  completo: boolean;
  anotacoes?: string;
  created_at: string;
  exercicio?: Exercicio;
}

export interface Mensagem {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  arquivo_url?: string;
  lida: boolean;
  created_at: string;
  remetente?: Usuario;
}

export interface Conquista {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  icone_url?: string;
  criterio_tipo: string;
  criterio_valor?: number;
  created_at: string;
}

export interface AlunoConquista {
  id: string;
  aluno_id: string;
  conquista_id: string;
  data_conquista: string;
  conquista?: Conquista;
}