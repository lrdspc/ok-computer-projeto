# Guia de Contexto do Projeto: OKComputer PWA Fitness

Este documento serve como base de conhecimento para o **Gemini** (ou qualquer outra IA de desenvolvimento) entender a estrutura, o progresso e os desafios deste projeto.

## 1. Visão Geral da Stack
O projeto é um **PWA (Progressive Web App)** focado em gerenciamento de treinos para Personal Trainers e Alunos.
- **Frontend**: Next.js 15+ (App Router), TypeScript, Tailwind CSS.
- **Backend/Auth**: Supabase (PostgreSQL + GoTrue).
- **PWA**: `next-pwa` com Service Workers para suporte offline.
- **Deploy**: Vercel.
- **Repositório**: GitHub (`lrdspc/ok-computer-projeto`).

## 2. O que foi feito até agora
1. **Unificação de Fontes**: Integramos a documentação técnica inicial com o código-fonte funcional do PWA.
2. **Correções de Build**:
   - Instalada a dependência faltante `next-pwa`.
   - Corrigidos erros de tipagem em `src/types/database.ts` (adição de propriedades opcionais em `HistoricoTreino` e `Treino`).
   - Corrigidos erros de escopo e importação em `src/app/aluno/treino/page.tsx` (importação do `Calendar` e tipagem de arrays).
   - Ajustada a configuração do cliente Supabase para evitar erros de importação de tipos inexistentes.
3. **Estruturação de Pastas**:
   - `/src`: Código-fonte da aplicação.
   - `/docs`: Documentação técnica, esquemas de banco e este guia.
   - `/public`: Ativos estáticos e manifesto PWA.

## 3. Erros Identificados e Resolvidos
| Erro | Causa | Solução |
| :--- | :--- | :--- |
| `Module not found: next-pwa` | Dependência não listada no `package.json` | `pnpm add next-pwa` |
| `Property 'treino' does not exist` | Interface `HistoricoTreino` incompleta | Atualizada a interface em `database.ts` |
| `Parameter 'a' implicitly has 'any'` | Falta de tipagem em função de sort | Adicionada tipagem explícita `TreinoExercicio` |
| `Cannot find name 'Calendar'` | Componente Lucide não importado | Adicionado import no arquivo de treino |

## 4. Próximos Passos (O que falta)
- **Configuração do Supabase**: É necessário rodar o SQL contido em `docs/03-DATABASE-SCHEMA.md` no painel do Supabase para criar as tabelas e políticas de RLS.
- **Variáveis de Ambiente**: Configurar o arquivo `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Testes de Fluxo**: Validar o fluxo completo de criação de treino pelo Personal e visualização pelo Aluno.

## 5. Instruções para a IA (Gemini)
Ao trabalhar neste projeto, sempre:
1. Respeite a tipagem definida em `src/types/database.ts`.
2. Mantenha o foco em performance PWA (evite pacotes pesados no lado do cliente).
3. Utilize os componentes da pasta `src/components/ui` para manter a consistência visual.
4. Siga o padrão de design "Neon/Dark" definido no `tailwind.config.js`.
