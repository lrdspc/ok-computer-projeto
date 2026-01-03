# Guia de Configuração e Deploy - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento fornece instruções completas para configuração do ambiente de desenvolvimento, preparação para produção e deploy do sistema PWA de Gerenciamento de Treinos.

## 2. PRÉ-REQUISITOS

### 2.1. Software Necessário

| Software | Versão Mínima | Download |
|----------|---------------|----------|
| Node.js | 22.x | [nodejs.org](https://nodejs.org/) |
| npm | 10.x | Incluído no Node.js |
| Git | 2.x | [git-scm.com](https://git-scm.com/) |
| VS Code | 1.85+ | [code.visualstudio.com](https://code.visualstudio.com/) |
| PostgreSQL | 14.x | [postgresql.org](https://www.postgresql.org/) (opcional, dev) |

### 2.2. Contas Necessárias

- [GitHub](https://github.com/) - Versionamento e CI/CD
- [Vercel](https://vercel.com/) - Deploy do frontend
- [Supabase](https://supabase.com/) - Backend e banco de dados

### 2.3. Extensões do VS Code Recomendadas

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

## 3. CONFIGURAÇÃO DO AMBIENTE LOCAL

### 3.1. Clone do Repositório

```bash
# Clone o repositório
git clone https://github.com/your-org/treinos-pt.git
cd treinos-pt

# Crie branch de desenvolvimento
git checkout -b develop
git push -u origin develop
```

### 3.2. Instalação de Dependências

```bash
# Instala dependências do projeto
npm install

# Verifica se há vulnerabilidades
npm audit

# Instala Husky (git hooks)
npx husky install
```

### 3.3. Configuração do Supabase

#### 3.3.1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com/)
2. Clique em "New Project"
3. Configure:
   - **Name**: treinos-pt
   - **Database Password**: (guarde em local seguro)
   - **Region**: São Paulo (us-east-1)
4. Aguarde a criação (2-3 minutos)

#### 3.3.2. Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.local.example .env.local
```

Edite `.env.local` com as informações do seu projeto:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# VAPID Keys (para notificações push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Sentry (opcional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Environment
NODE_ENV=development
```

#### 3.3.3. Obter Chaves do Supabase

1. Vá para Settings → API
2. Copie:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon public (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role secret (SUPABASE_SERVICE_ROLE_KEY)

#### 3.3.4. Configurar VAPID Keys

```bash
# Gere chaves VAPID para Web Push
npx web-push generate-vapid-keys

# Adicione ao .env.local:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=chave-pública
# VAPID_PRIVATE_KEY=chave-privada
```

### 3.4. Configurar Banco de Dados

#### 3.4.1. Executar Schema SQL

1. Acesse o Dashboard do Supabase
2. Vá para SQL Editor
3. Cole o conteúdo de `/database/schema.sql`
4. Execute (clique em "Run")

#### 3.4.2. Verificar Schema

```sql
-- Verifica se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'app' 
ORDER BY table_name;
```

### 3.5. Configurar Autenticação

#### 3.5.1. Configurar Providers (Opcional)

1. Vá para Authentication → Providers
2. Configure providers desejados (Google, Apple, etc.)
3. Ative "Enable Sign ups"

#### 3.5.2. Configurar Templates de Email

1. Vá para Authentication → Templates
2. Configure templates em português:
   - Confirmação de email
   - Recuperação de senha
   - Mudança de email

### 3.6. Configurar Storage

1. Vá para Storage
2. Crie buckets:
   - `exercise-videos` (publico)
   - `user-avatars` (privado)
   - `assessment-photos` (privado)

### 3.7. Executar Aplicação Local

```bash
# Executa em modo desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

## 4. CONFIGURAÇÃO DO GITHUB

### 4.1. Criar Repositório

1. Acesse [github.com](https://github.com/)
2. Crie novo repositório: `treinos-pt`
3. Deixe público (para Vercel integração gratuita)

### 4.2. Configurar Secrets

Vá para Settings → Secrets and variables → Actions:

```yaml
# Repository secrets
NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: your-anon-key
SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
NEXT_PUBLIC_VAPID_PUBLIC_KEY: your-vapid-public-key
VAPID_PRIVATE_KEY: your-vapid-private-key
NEXT_PUBLIC_SENTRY_DSN: your-sentry-dsn (opcional)
```

### 4.3. Configurar Branch Protection

Vá para Settings → Branches:

- Branch: `main`
- Require pull request reviews before merging: ✓
- Require status checks to pass before merging: ✓
- Include administrators: ✓

## 5. CONFIGURAÇÃO DO VERCEL

### 5.1. Importar Projeto

1. Acesse [vercel.com](https://vercel.com/)
2. Clique em "New Project"
3. Importe do GitHub: `treinos-pt`
4. Configure:
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 5.2. Configurar Environment Variables

Vercel → Project Settings → Environment Variables:

```yaml
# Production
NEXT_PUBLIC_SUPABASE_URL: https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: your-anon-key
NEXT_PUBLIC_APP_URL: https://your-domain.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY: your-vapid-public-key
NEXT_PUBLIC_SENTRY_DSN: your-sentry-dsn

# Preview (usar staging)
NEXT_PUBLIC_SUPABASE_URL: https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY: your-staging-anon-key
NEXT_PUBLIC_APP_URL: https://your-preview-domain.vercel.app

# Development (usar local)
NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY: your-local-anon-key
NEXT_PUBLIC_APP_URL: http://localhost:3000
```

### 5.3. Configurar Domínio Customizado (Opcional)

1. Vá para Project Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### 5.4. Configurar Deploy Hooks

Vercel → Project Settings → Git:

- Production Branch: `main`
- Automatically deploy on push: ✓
- Include GitHub Actions: ✓

## 6. PIPELINE DE CI/CD

### 6.1. GitHub Actions Workflow

**Arquivo**: `/.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test:ci
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Build project
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel (Staging)
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod=false'

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Vercel (Production)
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        vercel-args: '--prod'
```

### 6.2. Configurar Secrets do GitHub Actions

```bash
# Vercel Token
vercel login
vercel whoami
copy token

# Vercel Org ID e Project ID
vercel inspect treinos-pt
```

Adicione ao GitHub Secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 7. AMBIENTES

### 7.1. Estrutura de Ambientes

```
┌─────────────────┐
│   Desenvolvimento │ ← localhost:3000
├─────────────────┤
│     Staging     │ ← preview.vercel.app
├─────────────────┤
│   Produção      │ ← yourdomain.com
└─────────────────┘
```

### 7.2. Configurar Staging

1. Crie projeto separado no Supabase para staging
2. Configure branch `develop` no GitHub
3. Vercel deploy automático da branch `develop`
4. Configure variáveis de ambiente para staging

### 7.3. Promover para Produção

```bash
# 1. Crie PR para main
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Faça ajustes necessários
# 3. Abra PR para main
# 4. Code review
# 5. Merge na main
# 6. Deploy automático para produção
```

## 8. MONITORAMENTO

### 8.1. Configurar Sentry

1. Acesse [sentry.io](https://sentry.io/)
2. Crie projeto: `treinos-pt`
3. Copie DSN
4. Adicione ao `.env.local` e GitHub Secrets

### 8.2. Configurar Analytics

#### 8.2.1. Vercel Analytics

Já incluído automaticamente. Verifique em:
Vercel Dashboard → Analytics

#### 8.2.2. Google Analytics (Opcional)

```typescript
// lib/analytics/google.ts
import { GA_TRACKING_ID } from '@/lib/constants';

export const pageview = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = ({ action, category, label, value }: any) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
```

## 9. BACKUP E RECOVERY

### 9.1. Backup do Banco de Dados

#### 9.1.1. Backup Automático (Supabase)

O Supabase faz backups automáticos diários:
- Retenção: 7 dias (hobby) / 30 dias (pro)
- Ponto de recuperação: Último backup

#### 9.1.2. Backup Manual

```bash
# Usando Supabase CLI
supabase db dump --schema app --data-only > backup.sql

# Usando pg_dump
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --schema=app \
  --file=backup.sql
```

### 9.2. Restore do Banco de Dados

```bash
# Restore usando psql
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup.sql
```

### 9.3. Backup de Assets

Os assets (imagens, vídeos) ficam no Supabase Storage:
- Já possuem redundância
- Para backup extra, sincronize com S3:

```bash
# Sincroniza bucket com S3
aws s3 sync s3://your-backup-bucket/ ./backup/
```

## 10. MANUTENÇÃO

### 10.1. Atualizar Dependências

```bash
# Verifica atualizações
npm outdated

# Atualiza patch versions
npm update

# Atualiza major versions (cuidado!)
npx npm-check-updates -u
npm install

# Testa após atualização
npm run test
npm run build
```

### 10.2. Limpar Cache

```bash
# Next.js cache
rm -rf .next

# npm cache
npm cache clean --force

# Vercel cache (no dashboard)
```

### 10.3. Monitorar Logs

```bash
# Logs locais
npm run dev

# Logs do Vercel
vercel logs treinos-pt

# Logs do Supabase
supabase logs --project-ref your-project
```

## 11. TROUBLESHOOTING

### 11.1. Problemas Comuns

#### 11.1.1. "Module not found"

```bash
# Delete node_modules e reinstale
rm -rf node_modules package-lock.json
npm install
```

#### 11.1.2. "Build failed"

```bash
# Verifica erros de TypeScript
npm run type-check

# Verifica erros de lint
npm run lint

# Limpa cache do Next.js
rm -rf .next
npm run build
```

#### 11.1.3. "Service Worker not registering"

1. Verifique HTTPS (necessário para SW)
2. Verifique console do navegador
3. Verifique se não está em modo incógnito

#### 11.1.4. "Supabase connection failed"

1. Verifique URL e chaves no .env.local
2. Verifique se o projeto está online
3. Verifique firewall/anti-virus

### 11.2. Debug Tools

```bash
# Debug do Next.js
NODE_OPTIONS='--inspect' npm run dev

# Debug do Supabase
supabase start --debug
```

## 12. CHECKLIST DE DEPLOY

### 12.1. Pre-Deploy

- [ ] Código testado localmente
- [ ] Todos os testes passando
- [ ] Build executando sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Secrets configurados no GitHub
- [ ] Schema do banco atualizado
- [ ] Documentação atualizada

### 12.2. Deploy

- [ ] Merge para main
- [ ] Deploy automático executado
- [ ] Health check passando
- [ ] Logs sem erros críticos
- [ ] Monitoramento ativo

### 12.3. Post-Deploy

- [ ] Testar fluxos críticos
- [ ] Verificar performance
- [ ] Confirmar PWA funcionando
- [ ] Testar notificações
- [ ] Verificar analytics

## 13. COMANDOS ÚTEIS

### 13.1. Desenvolvimento

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção local
npm start

# Testes
npm run test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run type-check
```

### 13.2. Supabase

```bash
# Instalar CLI
curl -sSL https://install.supabase.com | bash

# Login
supabase login

# Link projeto
supabase link --project-ref your-project

# Deploy migrations
supabase db push

# Generate types
supabase gen types typescript --project-id your-project > types/supabase.ts
```

### 13.3. Vercel

```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Preview
vercel

# Logs
vercel logs
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de DevOps
