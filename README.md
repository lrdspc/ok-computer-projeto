# PWA Fitness - Personal & Aluno

> Plataforma completa para personal trainers gerenciarem alunos, treinos, progresso e gamificação com offline-first

## 🚀 Funcionalidades

### Para Personal Trainers
- ✅ Dashboard com estatísticas em tempo real
- ✅ Gestão completa de alunos (CRUD)
- ✅ Criador visual de treinos
- ✅ Biblioteca de 200+ exercícios pré-configurados
- ✅ Avaliação física com fotos e medidas
- ✅ Chat em tempo real com alunos
- ✅ Relatórios de progresso e KPIs
- ✅ Export de relatórios em PDF

### Para Alunos
- ✅ Dashboard com treino do dia destacado
- ✅ Player de treino com instruções por voz
- ✅ Bips sonoros para séries e descanso
- ✅ Execução offline completa
- ✅ Histórico de treinos visual
- ✅ Progresso com gráficos e fotos
- ✅ Sistema de gamificação (badges/conquistas)
- ✅ Chat com personal trainer
- ✅ Notificações push

## 🛠️ Stack Tecnológica

```
Frontend:
├── Next.js 15 (App Router, Server Components)
├── React 18+
├── TypeScript
├── Tailwind CSS
├── Shadcn/UI Components
├── Framer Motion (animações)
└── PWA: Service Worker + Manifest

Backend:
├── Supabase (PostgreSQL gerenciado)
├── Supabase Auth
├── Supabase Realtime (WebSocket)
├── Supabase Storage
└── Row Level Security (RLS)

Deployment:
├── Vercel (frontend)
├── GitHub (versionamento)
└── Supabase (backend)
```

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuito)

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/pwa-fitness.git
cd pwa-fitness
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure o Supabase**
   - Crie um projeto no [Supabase](https://supabase.com)
   - Vá para SQL Editor e execute o schema abaixo
   - Copie as credenciais (URL e Anon Key)

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. **Execute as migrations do banco de dados**

Execute este SQL no Supabase SQL Editor:

```sql
-- USUARIOS
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('personal', 'aluno')),
  foto_url VARCHAR(500),
  telefone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ALUNOS
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES public.usuarios(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.usuarios(id),
  altura_cm DECIMAL(5,2),
  peso_kg DECIMAL(6,2),
  idade INT,
  sexo CHAR(1),
  objetivo_principal VARCHAR(100),
  historico_lesoes TEXT,
  limitacoes TEXT,
  criado_em TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AVALIACOES FISICAS
CREATE TABLE public.avaliacoes_fisicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  data TIMESTAMP DEFAULT NOW(),
  peso_kg DECIMAL(6,2),
  altura_cm DECIMAL(5,2),
  peito_cm DECIMAL(5,2),
  cintura_cm DECIMAL(5,2),
  quadril_cm DECIMAL(5,2),
  braco_cm DECIMAL(5,2),
  coxa_cm DECIMAL(5,2),
  panturrilha_cm DECIMAL(5,2),
  percentual_gordura DECIMAL(5,2),
  anotacoes TEXT,
  foto_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXERCICIOS
CREATE TABLE public.exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  categoria VARCHAR(100),
  descricao TEXT,
  forma_execucao TEXT,
  musculos_envolvidos TEXT[],
  equipamentos_necessarios TEXT[],
  gif_url VARCHAR(500),
  video_url VARCHAR(500),
  criado_por UUID REFERENCES public.usuarios(id),
  eh_customizado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TREINOS
CREATE TABLE public.treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  personal_id UUID NOT NULL REFERENCES public.usuarios(id),
  nome VARCHAR(255),
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TREINOS DIAS
CREATE TABLE public.treinos_dias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
  dia_semana INT,
  sequencia INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TREINOS EXERCICIOS
CREATE TABLE public.treinos_exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_dia_id UUID NOT NULL REFERENCES public.treinos_dias(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES public.exercicios(id),
  series INT,
  repeticoes INT,
  carga_kg DECIMAL(6,2),
  tempo_descanso_segundos INT DEFAULT 90,
  anotacoes TEXT,
  sequencia INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HISTORICO TREINOS
CREATE TABLE public.historico_treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  treino_id UUID NOT NULL REFERENCES public.treinos(id),
  data_execucao TIMESTAMP DEFAULT NOW(),
  duracao_minutos INT,
  completo BOOLEAN DEFAULT FALSE,
  anotacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- HISTORICO EXERCICIOS
CREATE TABLE public.historico_exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historico_treino_id UUID NOT NULL REFERENCES public.historico_treinos(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES public.exercicios(id),
  serie INT,
  repeticoes_realizadas INT,
  carga_kg_realizada DECIMAL(6,2),
  tempo_descanso_real_segundos INT,
  completo BOOLEAN DEFAULT FALSE,
  anotacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- MENSAGENS (Chat)
CREATE TABLE public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID NOT NULL REFERENCES public.usuarios(id),
  destinatario_id UUID NOT NULL REFERENCES public.usuarios(id),
  conteudo TEXT,
  arquivo_url VARCHAR(500),
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONQUISTAS/BADGES
CREATE TABLE public.conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  icone_url VARCHAR(500),
  criterio_tipo VARCHAR(100),
  criterio_valor INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONQUISTAS DO ALUNO
CREATE TABLE public.aluno_conquistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  conquista_id UUID NOT NULL REFERENCES public.conquistas(id),
  data_conquista TIMESTAMP DEFAULT NOW(),
  criado_em TIMESTAMP DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_fisicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_dias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aluno_conquistas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Usuários veem seu próprio perfil" ON public.usuarios FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "Personal vê seus alunos" ON public.alunos FOR SELECT USING (personal_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));
CREATE POLICY "Alunos veem seus próprios dados" ON public.alunos FOR SELECT USING (usuario_id = (SELECT id FROM usuarios WHERE auth_id = auth.uid()));
CREATE POLICY "Mensagens só entre remetente e destinatário" ON public.mensagens FOR ALL USING (
  auth.uid() IN (
    SELECT auth_id FROM usuarios WHERE id IN (remetente_id, destinatario_id)
  )
);

-- Inserir exercícios padrão
INSERT INTO public.exercicios (nome, categoria, descricao, musculos_envolvidos, equipamentos_necessarios, gif_url) VALUES
('Supino Reto', 'peito', 'Supino com barra em banco reto', ARRAY['peito', 'tríceps', 'ombros'], ARRAY['barra', 'banco'], 'https://example.com/supino.gif'),
('Agachamento Livre', 'pernas', 'Agachamento com barra nas costas', ARRAY['quadríceps', 'glúteos', 'posterior'], ARRAY['barra'], 'https://example.com/agachamento.gif'),
('Rosca Direta', 'braços', 'Rosca com halteres em pé', ARRAY['bíceps'], ARRAY['halteres'], 'https://example.com/rosca.gif'),
('Remada Curvada', 'costas', 'Remada com barra inclinada', ARRAY['dorsal', 'bíceps', 'romboides'], ARRAY['barra'], 'https://example.com/remada.gif'),
('Desenvolvimento', 'ombros', 'Desenvolvimento com halteres', ARRAY['deltoides', 'tríceps'], ARRAY['halteres'], 'https://example.com/desenvolvimento.gif');

-- Inserir conquistas padrão
INSERT INTO public.conquistas (codigo, nome, descricao, icone_url, criterio_tipo, criterio_valor) VALUES
('primeira_sessao', 'Primeira Sessão', 'Complete seu primeiro treino', '🎯', 'treinos_completos', 1),
('semana_completa', 'Semana Completa', 'Treine 7 dias seguidos', '🔥', 'dias_consecutivos', 7),
('trinta_dias', '30 Dias', 'Complete 30 dias de treino', '💪', 'treinos_completos', 30),
('cem_reps', '1000 Repetições', 'Complete 1000 repetições no total', '🔢', 'repeticoes_totais', 1000);
```

6. **Execute o projeto**
```bash
npm run dev
# ou
yarn dev
```

7. **Acesse o projeto**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🎯 Como Usar

### Como Personal Trainer
1. Cadastre-se como Personal Trainer
2. Adicione seus alunos
3. Crie avaliações físicas para cada aluno
4. Crie treinos personalizados
5. Acompanhe o progresso dos alunos
6. Comunique-se via chat

### Como Aluno
1. Cadastre-se como Aluno
2. Aguarde seu personal criar seu treino
3. Acesse seu treino do dia
4. Execute com auxílio do player
5. Acompanhe seu progresso
6. Converse com seu personal

## 📱 Instalação como PWA

### Android (Chrome)
1. Abra o site no Chrome
2. Toque no ícone de instalação na barra de endereço
3. Confirme a instalação

### iOS (Safari)
1. Abra o site no Safari
2. Toque em Compartilhar
3. Toque em "Adicionar à Tela Inicial"
4. Confirme

### Desktop (Chrome/Edge)
1. Abra o site
2. Clique no ícone de instalação no canto superior direito
3. Confirme a instalação

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes E2E
npm run test:e2e

# Testar PWA
npm run build
npm start
```

## 🚀 Deploy

### Vercel (Recomendado)
1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Outras plataformas
- Netlify
- Firebase Hosting
- AWS Amplify

## 📊 Performance

- **LCP**: < 2.5s
- **FID**: < 100ms  
- **CLS**: < 0.1
- **Lighthouse Score**: 90+
- **Bundle Size**: < 500KB

## 🔒 Segurança

- HTTPS obrigatório
- JWT tokens com expiration
- Row Level Security (RLS)
- XSS prevention
- CORS configurado
- Input validation

## 📈 Analytics

- Web Vitals monitoring
- User engagement tracking
- Error tracking (Sentry)
- Performance monitoring

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Autor

**Seu Nome** - [@seu-usuario](https://github.com/seu-usuario)

## 🙏 Agradecimentos

- [Supabase](https://supabase.com) - Backend as a Service
- [Next.js](https://nextjs.org) - React Framework
- [Tailwind CSS](https://tailwindcss.com) - CSS Framework
- [Vercel](https://vercel.com) - Hosting Platform

---

Feito com ❤️ por [Seu Nome]
