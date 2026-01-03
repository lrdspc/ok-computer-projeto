# Project Brief - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO EXECUTIVA

### 1.1. Declaração de Visão

O **Sistema PWA de Gerenciamento de Treinos - Personal Trainer e Alunos** é uma plataforma revolucionária projetada para transformar a experiência de treinamento físico profissional. Nossa visão é criar uma solução tecnológica que elimine as barreiras entre personal trainers e alunos, proporcionando uma experiência de usuário impecável mesmo em condições adversas de conectividade.

### 1.2. Posicionamento Estratégico

Esta aplicação se posiciona como a solução definitiva para profissionais de educação física que necessitam de:
- **Confiabilidade Extrema**: Funcionamento 100% offline com sincronização automática
- **Precisão Cirúrgica**: Timer com erro máximo de 1 segundo a cada 10 minutos
- **Engajamento Máximo**: Feedback háptico, sonoro e notificações push inteligentes
- **Experiência Profissional**: Interface instalável em dispositivos iOS, Android e Desktop

### 1.3. Diferenciais Competitivos

| Característica | Nossa Solução | Concorrentes |
|----------------|---------------|--------------|
| Funcionamento Offline | 100% funcional | Limitado/Indisponível |
| Timer Preciso | Web Workers (±1s/10min) | setInterval (±30s/10min) |
| Wake Lock | API Nativa + Fallback | Não implementado |
| Feedback Háptico | Android + iOS | Apenas Android |
| Sincronização | Background Sync Manual | Automática/Transparente |
| PWA Instalável | iOS, Android, Desktop | Apenas Android/Chrome |

## 2. OBJETIVOS E SUCESSO

### 2.1. Objetivos Primários

1. **OBJ-001**: Criar um PWA robusto com funcionamento 100% offline
2. **OBJ-002**: Implementar timer preciso com Web Workers e Wake Lock
3. **OBJ-003**: Sincronização automática de dados em background
4. **OBJ-004**: Avaliação física automatizada com cálculos antropométricos
5. **OBJ-005**: Experiência de usuário impecável em todas as plataformas

### 2.2. Indicadores de Sucesso (KPIs)

| KPI | Meta | Como Medir |
|-----|------|------------|
| Performance Score (Lighthouse) | >90 | Lighthouse CI |
| Taxa de Instalação PWA | >40% | Analytics |
| Usuários Ativos Mensais | 1.000+ | Supabase Analytics |
| Taxa de Retenção (30 dias) | >60% | Mixpanel/Segment |
| Tempo Médio de Sessão | >25 min | Analytics |
| Erros por Sessão | <0.5% | Sentry |
| Cobertura de Testes | >80% | Vitest Coverage |

### 2.3. Objetivos Secundários

1. **OBJ-SEC-001**: Alcançar Core Web Vitals excepcionais
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

2. **OBJ-SEC-002**: Manter orçamento de performance
   - Bundle inicial < 500KB
   - TTI < 3s em 3G lento

3. **OBJ-SEC-003**: Garantir acessibilidade WCAG 2.1 AA

## 3. PERSONAS

### 3.1. PERSONA 1: Personal Trainer (PT)

**Dados Demográficos:**
- **Nome**: Carlos Silva
- **Idade**: 32 anos
- **Profissão**: Personal Trainer
- **Localização**: São Paulo, SP
- **Renda**: R$ 8.000 - R$ 15.000/mês

**História e Motivações:**
Carlos é um personal trainer experiente com 8 anos de atuação. Atende 25 alunos regularmente e está sempre buscando formas de otimizar seu tempo e melhorar o acompanhamento dos alunos. Sua maior frustração é não conseguir monitorar se os alunos estão executando os treinos corretamente quando treinam sozinhos.

**Objetivos:**
- Monitorar o progresso dos alunos em tempo real
- Criar treinos personalizados rapidamente
- Reduzir tempo gasto em tarefas administrativas
- Manter alunos engajados e motivados

**Frustrações:**
- Apps existentes travam ou não funcionam offline
- Timer impreciso prejudica o ritmo do treino
- Dificuldade para acompanhar alunos remotamente

**Necessidades Técnicas:**
- Interface responsiva e rápida
- Criação de treinos com drag-and-drop
- Relatórios detalhados de progresso
- Notificações de atividades dos alunos

### 3.2. PERSONA 2: Aluno (Praticante)

**Dados Demográficos:**
- **Nome**: Marina Santos
- **Idade**: 28 anos
- **Profissão**: Analista de Marketing
- **Localização**: São Paulo, SP
- **Renda**: R$ 5.000 - R$ 8.000/mês

**História e Motivações:**
Marina é uma profissional ocupada que treina 4x por semana antes do trabalho. Contratou um personal trainer para ter resultados mais eficientes. Precisa de um app confiável que funcione mesmo na academia com sinal de internet ruim.

**Objetivos:**
- Executar treinos corretamente sem depender do personal
- Manter-se motivada durante os exercícios
- Acompanhar seu progresso de forma visual
- Não perder tempo com app travando

**Frustrações:**
- Apps que travam no meio do treino
- Timer que atrasa ou adianta
- Não conseguir ver o exercício correto
- Perder progresso quando a internet cai

**Necessidades Técnicas:**
- App 100% offline
- Timer preciso com feedback claro
- Vídeos e imagens dos exercícios
- Sincronização automática dos dados

## 4. CASOS DE USO PRINCIPAIS

### 4.1. UC-001: Criar e Atribuir Treino

**Ator Principal**: Personal Trainer
**Pré-condições**: PT está autenticado, possui alunos cadastrados
**Pós-condições**: Treino criado e atribuído ao(s) aluno(s)

**Fluxo Principal:**
1. PT acessa "Criar Novo Treino"
2. Seleciona exercícios da biblioteca (drag-and-drop)
3. Configura séries, repetições, descanso e peso sugerido
4. Visualiza preview do treino
5. Seleciona alunos para atribuir
6. Define data de início
7. Confirma e salva treino

**Fluxo Alternativo:**
- 3a. PT pode duplicar treino existente
- 5a. PT pode salvar como rascunho

### 4.2. UC-002: Executar Treino

**Ator Principal**: Aluno
**Pré-condições**: Aluno tem treino atribuído para o dia
**Pós-condições**: Treino executado e dados salvos

**Fluxo Principal:**
1. Aluno acessa "Iniciar Treino de Hoje"
2. Visualiza exercícios do treino
3. Seleciona primeiro exercício
4. Executa série conforme instruções
5. Clica "Série Completa" (feedback háptico)
6. Timer de descanso inicia automaticamente
7. Repete até completar todas as séries
8. Passa para próximo exercício
9. Ao final, visualiza resumo do treino
10. Dados são salvos e enfileirados para sincronização

### 4.3. UC-003: Avaliação Física

**Ator Principal**: Personal Trainer
**Pré-condições**: Aluno cadastrado
**Pós-condições**: Avaliação registrada e cálculos automáticos executados

**Fluxo Principal:**
1. PT acessa perfil do aluno
2. Seleciona "Nova Avaliação"
3. Insere dados: peso, altura, % gordura, medidas
4. Sistema calcula automaticamente IMC, massa magra, etc.
5. PT visualiza comparação com avaliação anterior
6. Confirma e salva avaliação

## 5. ROADMAP DO PROJETO

### 5.1. Fase 1: MVP (3 meses)

**Sprint 1-2 (Semanas 1-4): Fundação**
- [ ] Setup do projeto Next.js 15.1 + TypeScript
- [ ] Configuração do Supabase + tabelas básicas
- [ ] Autenticação com Supabase Auth
- [ ] Layout base e componentes UI
- [ ] Setup do PWA (manifest, service worker)

**Sprint 3-4 (Semanas 5-8): Core Features**
- [ ] CRUD de exercícios
- [ ] Criação de treinos
- [ ] Atribuição de treinos a alunos
- [ ] Tela de execução de treino básica
- [ ] Timer com Web Workers

**Sprint 5-6 (Semanas 9-12): PWA + Sincronização**
- [ ] Implementação do IndexedDB
- [ ] Background Sync API
- [ ] Wake Lock API
- [ ] Vibration API + fallback iOS
- [ ] Testes e ajustes finais

### 5.2. Fase 2: Melhorias (2 meses)

**Sprint 7-8 (Semanas 13-16): Avaliações e Relatórios**
- [ ] Módulo de avaliações físicas
- [ ] Cálculos antropométricos (Edge Functions)
- [ ] Gráficos de progresso
- [ ] Relatórios para personal trainers

**Sprint 9-10 (Semanas 17-20): Engajamento**
- [ ] Notificações Push
- [ ] Sistema de conquistas
- [ ] Compartilhamento de progresso
- [ ] Integração com wearables (pesquisa)

### 5.3. Fase 3: Escala (2 meses)

**Sprint 11-12 (Semanas 21-24): Analytics e Performance**
- [ ] Dashboard administrativo
- [ ] Analytics avançado
- [ ] Otimizações de performance
- [ ] Testes A/B

## 6. REQUISITOS NÃO-FUNCIONAIS

### 6.1. Performance

| Métrica | Meta | Ferramenta de Medida |
|---------|------|---------------------|
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| TTI | < 3s (3G) | WebPageTest |
| Bundle Size | < 500KB | Bundle Analyzer |

### 6.2. Segurança

- Autenticação JWT com refresh tokens
- Row Level Security (RLS) em todas as tabelas
- Rate limiting: 100 req/min por IP
- Criptografia de dados sensíveis
- CSP headers adequados

### 6.3. Compatibilidade

| Navegador | Versão Mínima |
|-----------|---------------|
| Chrome | 90+ |
| Safari | 14+ |
| Firefox | 90+ |
| Edge | 91+ |

### 6.4. Acessibilidade

- WCAG 2.1 nível AA
- Contraste mínimo 4.5:1
- Navegação por teclado completa
- Suporte a leitores de tela
- Testes automatizados com Axe

## 7. RISCOS E MITIGAÇÃO

### 7.1. Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Incompatibilidade PWA iOS | Média | Alto | Fallbacks robustos, testes extensivos |
| Timer impreciso | Baixa | Alto | Web Workers + validação contínua |
| Sincronização falha | Média | Alto | Fila de sync + retry automático |
| Supabase indisponível | Baixa | Médio | Modo offline completo |

### 7.2. Riscos de Negócio

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Concorrência grande | Alta | Médio | Foco em PWA + offline |
| Adoção lenta | Média | Alto | Onboarding simplificado |
| Retenção baixa | Média | Alto | Gamificação + engajamento |

## 8. CRITÉRIOS DE ACEITAÇÃO

### 8.1. MVP Completo

- [ ] Usuário consegue se cadastrar como PT ou Aluno
- [ ] PT consegue criar treino e atribuir a aluno
- [ ] Aluno consegue executar treino completamente offline
- [ ] Timer funciona com precisão de ±1s a cada 10min
- [ ] Dados sincronizam automaticamente quando online
- [ ] App é instalável em iOS, Android e Desktop
- [ ] Lighthouse Score > 90 em todas as categorias
- [ ] Cobertura de testes > 80%

### 8.2. Critérios Técnicos

- [ ] Zero erros críticos em produção (Sentry)
- [ ] LCP < 2.5s em dispositivos móveis
- [ ] Funcionamento 100% sem internet
- [ ] Wake Lock ativo durante treinos
- [ ] Feedback háptico em todas as plataformas
- [ ] RLS implementada em todas as tabelas

## 9. REFERÊNCIAS E INSPIRAÇÕES

### 9.1. Aplicações de Referência

- **Strava**: Sincronização offline e online
- **Notion**: Interface limpa e colaborativa
- **Linear**: Performance e UX polida
- **Spotify**: PWA instalável e confiável

### 9.2. Diretrizes de Design

- **Material Design 3**: Sistema de design
- **Human Interface Guidelines**: iOS considerations
- **Fluent Design**: Windows/desktop patterns

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Desenvolvimento
