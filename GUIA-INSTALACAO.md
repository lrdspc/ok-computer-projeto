# 🚀 Guia Rápido de Instalação - PWA Fitness

## Comece em 5 minutos!

### 1. Preparação (1 minuto)

Certifique-se de ter:
- ✅ Node.js 18+ instalado
- ✅ Conta no GitHub
- ✅ Conta no Supabase (grátis)

### 2. Criar projeto no Supabase (2 minutos)

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Preencha:
   - Nome: `pwa-fitness`
   - Senha do banco: Guarde em local seguro!
4. Aguarde a criação (1-2 minutos)

### 3. Configurar banco de dados (1 minuto)

1. No dashboard do projeto, clique em **SQL Editor**
2. Cole TODO o conteúdo do arquivo `schema.sql` (copie do README.md)
3. Clique em **RUN**
4. Pronto! Tabelas criadas ✅

### 4. Obter credenciais (30 segundos)

1. Vá para **Settings** → **API**
2. Copie:
   - Project URL
   - Anon/Public Key

### 5. Instalar e rodar (30 segundos)

```bash
# Clone o projeto
git clone https://github.com/seu-usuario/pwa-fitness.git
cd pwa-fitness

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env.local
```

Edite `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

```bash
# Rode o projeto
npm run dev
```

### 6. Acesse! 🎉

Abra [http://localhost:3000](http://localhost:3000)

---

## Primeiros Passos

### Criar conta de demonstração

1. Clique em **Cadastrar**
2. Escolha **Personal Trainer**
3. Use:
   - Nome: Personal Demo
   - Email: personal@demo.com
   - Senha: demo123
4. Faça login

### Adicionar primeiro aluno

1. Vá para **Meus Alunos**
2. Clique em **Novo Aluno**
3. Preencha os dados
4. Salve

### Criar primeiro treino

1. Vá para **Criar Treino**
2. Selecione o aluno
3. Adicione exercícios da biblioteca
4. Salve e compartilhe

---

## Deploy na Vercel (2 minutos)

1. Vá para [vercel.com](https://vercel.com)
2. Importe seu repositório do GitHub
3. Configure as variáveis de ambiente (igual ao .env.local)
4. Clique em **Deploy**
5. Pronto! 🚀

---

## Dúvidas?

### Erros comuns

**"Failed to fetch"**
- Verifique se as credenciais do Supabase estão corretas
- Verifique se o RLS está ativado

**"Permission denied"**
- Execute todo o SQL do schema
- Verifique se as políticas RLS foram criadas

**"Module not found"**
- Execute `npm install` novamente
- Delete `node_modules` e `package-lock.json`

---

## Suporte

- 📧 Email: seu-email@example.com
- 💬 Discord: [seu-discord]
- 📖 Documentação: README.md

**Boa sorte com seu PWA Fitness! 💪**