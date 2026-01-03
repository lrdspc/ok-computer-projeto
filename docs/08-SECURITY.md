# Análise de Segurança - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento apresenta uma análise completa de segurança do sistema, cobrindo autenticação, autorização, proteção de dados, prevenção de ataques e conformidade com regulamentações.

## 2. AMENÇAS E RISCOS

### 2.1. Matriz de Riscos

| Risco | Probabilidade | Impacto | Severidade | Mitigação |
|-------|---------------|---------|------------|-----------|
| Ataque de Força Bruta | Média | Alto | Alto | Rate limiting, 2FA |
| SQL Injection | Baixa | Crítico | Alto | Supabase ORM, RLS |
| XSS | Média | Alto | Alto | CSP, Input sanitization |
| CSRF | Baixa | Alto | Médio | JWT, SameSite cookies |
| Data Breach | Baixa | Crítico | Alto | Encriptação, RLS |
| DDoS | Média | Médio | Médio | Cloudflare, Rate limiting |
| Man-in-the-Middle | Baixa | Alto | Médio | HTTPS, HSTS |
| Session Hijacking | Média | Alto | Alto | Secure cookies, JWT |

### 2.2. Classificação de Dados

| Tipo | Sensibilidade | Exemplos | Proteção |
|------|---------------|----------|----------|
| Público | Baixa | Nomes de exercícios, imagens | Nenhuma |
| Interno | Média | Estatísticas agregadas | Autenticação |
| Confidencial | Alta | Dados pessoais, email | Encriptação, RLS |
| Sensível | Crítica | Senhas, tokens JWT | Hashing, HTTPS |

## 3. AUTENTICAÇÃO

### 3.1. JWT (JSON Web Tokens)

#### 3.1.1. Estrutura do Token

```typescript
interface JWTPayload {
  iss: string;        // Issuer (Supabase)
  sub: string;        // Subject (User ID)
  aud: string;        // Audience (authenticated)
  exp: number;        // Expiration Time (1 hora)
  iat: number;        // Issued At
  email: string;      // User Email
  phone?: string;     // User Phone
  user_metadata: {
    full_name: string;
    user_type: 'trainer' | 'student';
    avatar_url?: string;
  };
}
```

#### 3.1.2. Configuração do Token

```typescript
// lib/supabase/client.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Proof Key for Code Exchange
  },
  global: {
    headers: {
      'x-application-name': 'treinos-pt',
    },
  },
});
```

#### 3.1.3. Refresh Token Strategy

```typescript
// lib/auth/refresh-token.ts
import { supabase } from '@/lib/supabase/client';

class TokenManager {
  private refreshTimer: NodeJS.Timeout | null = null;

  async refreshToken(): Promise<void> {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Token refresh failed:', error);
      await this.handleRefreshFailure();
      return;
    }

    if (data.session) {
      this.scheduleNextRefresh(data.session.expires_in);
    }
  }

  private scheduleNextRefresh(expiresIn: number): void {
    // Refresh 5 minutos antes da expiração
    const refreshTime = (expiresIn - 300) * 1000;
    
    this.refreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  private async handleRefreshFailure(): Promise<void> {
    // Salva dados offline antes de redirecionar
    await saveCurrentWorkoutProgress();
    
    // Redireciona para login
    window.location.href = '/login?session=expired';
  }

  cleanup(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
  }
}

export const tokenManager = new TokenManager();
```

### 3.2. Multi-Factor Authentication (MFA)

```typescript
// lib/auth/mfa.ts

export class MFAManager {
  async enrollTOTP(userId: string): Promise<{ qrCode: string; secret: string }> {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) throw error;

    return {
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
  }

  async verifyTOTP(factorId: string, code: string): Promise<void> {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) throw error;
  }

  async listFactors(userId: string): Promise<any[]> {
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) throw error;
    
    return data.all || [];
  }

  async unenrollFactor(factorId: string): Promise<void> {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    
    if (error) throw error;
  }
}
```

### 3.3. Rate Limiting de Autenticação

**Arquivo**: `/supabase/functions/rate-limit-auth/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// Store de tentativas (em produção, usar Redis)
const attempts = new Map<string, { count: number; resetAt: number }>();

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const clientIP = req.headers.get('x-forwarded-for') || 
                   req.headers.get('x-real-ip') || 
                   'unknown';

  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxAttempts = 5;

  // Verifica tentativas anteriores
  const clientAttempts = attempts.get(clientIP);
  
  if (clientAttempts) {
    if (now < clientAttempts.resetAt) {
      if (clientAttempts.count >= maxAttempts) {
        return new Response(
          JSON.stringify({ 
            error: 'Muitas tentativas. Tente novamente mais tarde.' 
          }),
          { 
            status: 429, 
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((clientAttempts.resetAt - now) / 1000)
            } 
          }
        );
      }
      
      // Incrementa tentativa
      clientAttempts.count++;
    } else {
      // Reset da janela
      attempts.set(clientIP, { count: 1, resetAt: now + windowMs });
    }
  } else {
    // Primeira tentativa
    attempts.set(clientIP, { count: 1, resetAt: now + windowMs });
  }

  // Processa a requisição de login...
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## 4. AUTORIZAÇÃO

### 4.1. Row Level Security (RLS)

Todas as tabelas sensíveis possuem RLS habilitado:

```sql
-- Exemplo para tabela de exercícios
ALTER TABLE app.exercises ENABLE ROW LEVEL SECURITY;

-- Política: usuários só podem ver exercícios do seu trainer
CREATE POLICY "Students can view trainer exercises" ON app.exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM app.trainer_students 
            WHERE student_id = auth.uid() 
            AND trainer_id = app.exercises.trainer_id
            AND status = 'active'
        )
    );
```

### 4.2. Hierarquia de Permissões

```typescript
// lib/auth/permissions.ts

export enum Permission {
  // Personal Trainer
  CREATE_WORKOUT = 'create:workout',
  UPDATE_WORKOUT = 'update:workout',
  DELETE_WORKOUT = 'delete:workout',
  ASSIGN_WORKOUT = 'assign:workout',
  CREATE_EXERCISE = 'create:exercise',
  UPDATE_EXERCISE = 'update:exercise',
  DELETE_EXERCISE = 'delete:exercise',
  VIEW_STUDENTS = 'view:students',
  CREATE_ASSESSMENT = 'create:assessment',
  UPDATE_ASSESSMENT = 'update:assessment',
  
  // Student
  VIEW_OWN_WORKOUTS = 'view:own_workouts',
  START_WORKOUT = 'start:workout',
  COMPLETE_WORKOUT = 'complete:workout',
  VIEW_OWN_ASSESSMENTS = 'view:own_assessments',
  UPDATE_OWN_PROFILE = 'update:own_profile',
}

export class PermissionManager {
  static hasPermission(userType: 'trainer' | 'student', permission: Permission): boolean {
    const trainerPermissions = [
      Permission.CREATE_WORKOUT,
      Permission.UPDATE_WORKOUT,
      Permission.DELETE_WORKOUT,
      Permission.ASSIGN_WORKOUT,
      Permission.CREATE_EXERCISE,
      Permission.UPDATE_EXERCISE,
      Permission.DELETE_EXERCISE,
      Permission.VIEW_STUDENTS,
      Permission.CREATE_ASSESSMENT,
      Permission.UPDATE_ASSESSMENT,
    ];

    const studentPermissions = [
      Permission.VIEW_OWN_WORKOUTS,
      Permission.START_WORKOUT,
      Permission.COMPLETE_WORKOUT,
      Permission.VIEW_OWN_ASSESSMENTS,
      Permission.UPDATE_OWN_PROFILE,
    ];

    if (userType === 'trainer') {
      return trainerPermissions.includes(permission);
    } else {
      return studentPermissions.includes(permission);
    }
  }

  static canAccessResource(userId: string, resourceOwnerId: string): boolean {
    return userId === resourceOwnerId;
  }
}
```

### 4.3. Middleware de Autorização

```typescript
// lib/auth/middleware.ts

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function authorizeRequest(
  request: NextRequest,
  requiredPermission?: Permission
): Promise<{ user: User | null; error?: string }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  // Verifica permissão se especificada
  if (requiredPermission) {
    const userType = user.user_metadata?.user_type as 'trainer' | 'student';
    
    if (!PermissionManager.hasPermission(userType, requiredPermission)) {
      return { user: null, error: 'Forbidden' };
    }
  }

  return { user };
}

// Uso em API Route
export async function GET(request: NextRequest) {
  const { user, error } = await authorizeRequest(request, Permission.VIEW_OWN_WORKOUTS);
  
  if (error) {
    return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });
  }

  // Processa a requisição...
}
```

## 5. PROTEÇÃO DE DADOS

### 5.1. Encriptação

#### 5.1.1. Encriptação em Trânsito

Todas as comunicações utilizam HTTPS/TLS:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};
```

#### 5.1.2. Encriptação em Repouso

Senhas são hasheadas com bcrypt:

```typescript
// Supabase Auth já utiliza bcrypt por padrão
// Não é necessário implementar hashing manual
```

### 5.2. Máscara de Dados Sensíveis

```typescript
// lib/security/data-masking.ts

export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.slice(-1);
  return `${maskedUsername}@${domain}`;
}

export function maskPhone(phone: string): string {
  return phone.replace(/\d(?=\d{4})/g, '*');
}

export function maskDocument(document: string): string {
  return document.replace(/\d(?=\d{2})/g, '*');
}

// Uso em logs
console.log('User email:', maskEmail(user.email)); // u***r@example.com
```

### 5.3. Sanitização de Inputs

```typescript
// lib/security/sanitization.ts

import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeFilename(filename: string): string {
  // Remove caracteres perigosos
  return filename.replace(/[<>:"/\\|?*]/g, '_');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  // Valida formato BR: +55 11 99999-9999
  const phoneRegex = /^\+55\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
  return phoneRegex.test(phone);
}
```

## 6. PREVENÇÃO DE ATAQUES

### 6.1. Content Security Policy (CSP)

**Arquivo**: `/next.config.js`

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};
```

### 6.2. Proteção CSRF

```typescript
// lib/security/csrf.ts

export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(): string {
    return crypto.randomUUID();
  }

  static validateToken(token: string, sessionToken: string): boolean {
    return token === sessionToken;
  }

  static middleware(request: Request): boolean {
    const token = request.headers.get('x-csrf-token');
    const sessionToken = getSessionToken(request);
    
    if (!token || !sessionToken) {
      return false;
    }
    
    return this.validateToken(token, sessionToken);
  }
}

// Uso em API Route
export async function POST(request: Request) {
  if (!CSRFProtection.middleware(request)) {
    return new Response('CSRF token invalid', { status: 403 });
  }
  
  // Processa a requisição...
}
```

### 6.3. Proteção XSS

```typescript
// lib/security/xss-protection.ts

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export function stripScripts(html: string): string {
  const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return html.replace(scriptRegex, '');
}

// Componente seguro para renderizar texto
export function SafeText({ text }: { text: string }) {
  const escapedText = escapeHtml(text);
  return <span dangerouslySetInnerHTML={{ __html: escapedText }} />;
}
```

### 6.4. Proteção SQL Injection

O uso do Supabase ORM já previne SQL injection:

```typescript
// ✅ Seguro - Supabase ORM
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('email', userInputEmail); // Input é sanitizado automaticamente

// ❌ Inseguro - Nunca fazer isso
const query = `SELECT * FROM users WHERE email = '${userInputEmail}'`;
```

### 6.5. Rate Limiting

```typescript
// lib/security/rate-limiter.ts

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests: boolean;
}

class RateLimiter {
  private attempts = new Map<string, { count: number; resetAt: number }>();

  constructor(private config: RateLimitConfig) {}

  async checkLimit(identifier: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const clientAttempts = this.attempts.get(identifier);

    if (clientAttempts) {
      if (now < clientAttempts.resetAt) {
        if (clientAttempts.count >= this.config.maxRequests) {
          return {
            allowed: false,
            retryAfter: Math.ceil((clientAttempts.resetAt - now) / 1000),
          };
        }
        clientAttempts.count++;
      } else {
        // Reset da janela
        this.attempts.set(identifier, { 
          count: 1, 
          resetAt: now + this.config.windowMs 
        });
      }
    } else {
      // Primeira tentativa
      this.attempts.set(identifier, { 
        count: 1, 
        resetAt: now + this.config.windowMs 
      });
    }

    return { allowed: true };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now >= value.resetAt) {
        this.attempts.delete(key);
      }
    }
  }
}

// Configurações específicas
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100,
  skipSuccessfulRequests: false,
});

export const authRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  maxRequests: 5,
  skipSuccessfulRequests: true,
});
```

### 6.6. Proteção contra Brute Force

```typescript
// lib/security/brute-force-protection.ts

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockUntil: number | null;
}

class BruteForceProtection {
  private attempts = new Map<string, LoginAttempt>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_TIME = 15 * 60 * 1000; // 15 minutos
  private readonly WINDOW_TIME = 60 * 60 * 1000; // 1 hora

  recordAttempt(identifier: string, success: boolean): void {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (success) {
      // Reset em caso de sucesso
      this.attempts.delete(identifier);
      return;
    }

    if (attempt) {
      // Verifica se é dentro da janela
      if (now - attempt.lastAttempt < this.WINDOW_TIME) {
        attempt.count++;
        attempt.lastAttempt = now;

        // Bloqueia se atingiu o limite
        if (attempt.count >= this.MAX_ATTEMPTS) {
          attempt.lockUntil = now + this.LOCK_TIME;
        }
      } else {
        // Reset da janela
        this.attempts.set(identifier, {
          count: 1,
          lastAttempt: now,
          lockUntil: null,
        });
      }
    } else {
      // Primeira tentativa
      this.attempts.set(identifier, {
        count: 1,
        lastAttempt: now,
        lockUntil: null,
      });
    }
  }

  isLocked(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || !attempt.lockUntil) {
      return false;
    }

    const now = Date.now();
    
    if (now >= attempt.lockUntil) {
      // Lock expirou
      this.attempts.delete(identifier);
      return false;
    }

    return true;
  }

  getLockTimeRemaining(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || !attempt.lockUntil) {
      return 0;
    }

    const now = Date.now();
    return Math.max(0, attempt.lockUntil - now);
  }
}

export const bruteForceProtection = new BruteForceProtection();
```

## 7. MONITORAMENTO E LOGGING

### 7.1. Configuração do Sentry

**Arquivo**: `/lib/monitoring/sentry.ts`

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Error filtering
  beforeSend(event) {
    // Filtra erros conhecidos
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.type === 'ChunkLoadError') {
        return null; // Ignora erros de chunk
      }
    }
    
    return event;
  },
  
  // Context enrichment
  beforeSend(event, hint) {
    // Adiciona informações do usuário
    if (typeof window !== 'undefined') {
      const user = getCurrentUser();
      if (user) {
        event.user = {
          id: user.id,
          email: user.email,
          username: user.full_name,
        };
      }
    }
    
    return event;
  },
});
```

### 7.2. Auditoria de Segurança

```typescript
// lib/security/audit.ts

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export class SecurityAudit {
  async logAction(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void> {
    const auditLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    // Envia para Supabase (tabela separada)
    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Failed to write audit log:', error);
    }

    // Também envia para Sentry em caso de falha
    if (!log.success) {
      Sentry.captureException(new Error(log.error || 'Security audit failure'), {
        extra: auditLog,
      });
    }
  }

  async logLogin(userId: string, success: boolean, metadata?: any): Promise<void> {
    await this.logAction({
      userId,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      success,
      metadata,
    });
  }

  async logDataAccess(
    userId: string, 
    resource: string, 
    resourceId: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'ACCESS',
      resource: `${resource}:${resourceId}`,
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      success: true,
    });
  }

  async logPermissionDenied(
    userId: string,
    action: string,
    resource: string,
    reason: string
  ): Promise<void> {
    await this.logAction({
      userId,
      action: 'DENIED',
      resource,
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      success: false,
      error: reason,
    });
  }
}

export const securityAudit = new SecurityAudit();
```

### 7.3. Alertas de Segurança

```typescript
// lib/security/alerts.ts

export class SecurityAlertManager {
  private alertThresholds = {
    failedLogins: 10,      // 10 falhas em 5 minutos
    permissionDenials: 20, // 20 negações em 10 minutos
    apiRateLimit: 0.8,     // 80% do limite
  };

  async checkFailedLogins(): Promise<void> {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const { count, error } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'LOGIN')
      .eq('success', false)
      .gte('timestamp', fiveMinutesAgo.toISOString());

    if (error) return;

    if ((count || 0) > this.alertThresholds.failedLogins) {
      await this.sendAlert('HIGH_FAILED_LOGINS', {
        count,
        threshold: this.alertThresholds.failedLogins,
      });
    }
  }

  private async sendAlert(type: string, data: any): Promise<void> {
    // Envia para Slack/Discord
    await fetch(process.env.SECURITY_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Security Alert: ${type}`,
        attachments: [{
          color: 'danger',
          fields: Object.entries(data).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        }],
      }),
    });

    // Envia email para equipe de segurança
    await this.sendSecurityEmail(type, data);
  }

  private async sendSecurityEmail(type: string, data: any): Promise<void> {
    // Implementação do envio de email
  }
}

export const securityAlerts = new SecurityAlertManager();
```

## 8. CONFORMIDADE

### 8.1. LGPD (Lei Geral de Proteção de Dados)

#### 8.1.1. Consentimento do Usuário

```typescript
// lib/lgpd/consent.ts

export interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'marketing' | 'analytics';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

export class ConsentManager {
  async recordConsent(consent: Omit<ConsentRecord, 'timestamp' | 'ipAddress' | 'userAgent'>): Promise<void> {
    const record: ConsentRecord = {
      ...consent,
      timestamp: new Date().toISOString(),
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
    };

    const { error } = await supabase
      .from('user_consents')
      .insert(record);

    if (error) {
      console.error('Failed to record consent:', error);
    }
  }

  async hasConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('userId', userId)
      .eq('consentType', consentType)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return false;
    }

    return data.granted;
  }

  async revokeConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<void> {
    await this.recordConsent({
      userId,
      consentType,
      granted: false,
    });
  }
}

export const consentManager = new ConsentManager();
```

#### 8.1.2. Direitos do Titular

```typescript
// lib/lgpd/data-subject-rights.ts

export class DataSubjectRights {
  async exportUserData(userId: string): Promise<Record<string, any>> {
    // Coleta todos os dados do usuário
    const [userProfile, workouts, assessments, sessions] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('workout_assignments').select('*').eq('student_id', userId),
      supabase.from('assessments').select('*').eq('student_id', userId),
      supabase.from('workout_sessions').select(`
        *,
        assignment:workout_assignments(*)
      `).eq('assignment.student_id', userId),
    ]);

    return {
      profile: userProfile.data,
      workouts: workouts.data,
      assessments: assessments.data,
      sessions: sessions.data,
      exportedAt: new Date().toISOString(),
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Anonimiza dados em vez de deletar (para manter integridade)
    const updates = [
      supabase.from('users').update({
        email: `deleted_${userId}@deleted.com`,
        full_name: 'Deleted User',
        phone: null,
        profile_photo_url: null,
        status: 'deleted',
      }).eq('id', userId),

      // Soft delete em outras tabelas...
    ];

    await Promise.all(updates);
  }

  async anonymizeData(userId: string): Promise<void> {
    // Remove dados pessoais identificáveis
    await supabase.from('users').update({
      full_name: 'Anônimo',
      phone: null,
      email: `anonymous_${crypto.randomUUID()}@anonymous.com`,
    }).eq('id', userId);
  }
}

export const dataSubjectRights = new DataSubjectRights();
```

### 8.2. Política de Privacidade

**Arquivo**: `/public/privacy-policy.md`

```markdown
# Política de Privacidade - Sistema de Treinos PT

## 1. Informações Coletadas

### 1.1. Dados Pessoais
- Nome completo
- Email
- Telefone
- Data de nascimento
- Foto de perfil

### 1.2. Dados de Saúde
- Peso
- Altura
- Percentual de gordura corporal
- Medidas corporais
- Histórico de treinos

### 1.3. Dados de Uso
- Horários de acesso
- Dispositivo utilizado
- Localização aproximada (IP)

## 2. Uso dos Dados

Os dados são utilizados para:
- Personalizar os treinos
- Acompanhar o progresso
- Enviar notificações
- Melhorar o serviço

## 3. Compartilhamento

Os dados são compartilhados apenas entre:
- Personal Trainer e seus alunos
- Não são vendidos a terceiros

## 4. Direitos dos Usuários

Você tem direito a:
- Acessar seus dados
- Corrigir informações incorretas
- Deletar sua conta
- Exportar seus dados

## 5. Segurança

Implementamos medidas de segurança como:
- Encriptação de dados
- Autenticação segura
- Controle de acesso

## 6. Contato

Para questões sobre privacidade: privacy@treinospt.com
```

## 9. RESPONSABILIDADES DA EQUIPE

### 9.1. Checklist de Segurança

#### 9.1.1. Desenvolvimento

- [ ] Nunca commitar secrets/keys
- [ ] Validar todos os inputs
- [ ] Usar RLS em todas as tabelas
- [ ] Implementar rate limiting
- [ ] Adicionar CSP headers
- [ ] Testar permissões
- [ ] Sanitizar dados exibidos

#### 9.1.2. Deploy

- [ ] Verificar variáveis de ambiente
- [ ] Configurar HTTPS
- [ ] Ativar HSTS
- [ ] Configurar CSP
- [ ] Testar autenticação
- [ ] Verificar logs
- [ ] Configurar alertas

#### 9.1.3. Manutenção

- [ ] Atualizar dependências
- [ ] Revisar logs de segurança
- [ ] Testar backups
- [ ] Auditar permissões
- [ ] Atualizar políticas RLS
- [ ] Revisar alertas

### 9.2. Incident Response Plan

```typescript
// lib/security/incident-response.ts

export class IncidentResponse {
  async handleSecurityIncident(incident: SecurityIncident): Promise<void> {
    // 1. Contenção
    await this.containIncident(incident);
    
    // 2. Investigação
    const investigation = await this.investigate(incident);
    
    // 3. Comunicação
    await this.notifyStakeholders(incident, investigation);
    
    // 4. Remediação
    await this.remediate(incident, investigation);
    
    // 5. Documentação
    await this.documentIncident(incident, investigation);
  }

  private async containIncident(incident: SecurityIncident): Promise<void> {
    switch (incident.type) {
      case 'BREACH':
        await this.revokeAllSessions();
        await this.resetAffectedPasswords();
        break;
      case 'RATE_LIMIT_EXCEEDED':
        await this.blockIP(incident.sourceIP);
        break;
      case 'PERMISSION_ESCALATION':
        await this.revokeUserAccess(incident.userId);
        break;
    }
  }

  private async investigate(incident: SecurityIncident): Promise<InvestigationResult> {
    // Coleta evidências
    const logs = await this.collectLogs(incident);
    const affectedUsers = await this.identifyAffectedUsers(incident);
    
    return {
      logs,
      affectedUsers,
      severity: this.calculateSeverity(incident),
      timeline: this.createTimeline(logs),
    };
  }

  private async notifyStakeholders(
    incident: SecurityIncident, 
    investigation: InvestigationResult
  ): Promise<void> {
    // Notifica equipe de segurança
    await this.sendSecurityAlert(incident, investigation);
    
    // Notifica usuários afetados se necessário
    if (investigation.affectedUsers.length > 0) {
      await this.notifyAffectedUsers(investigation.affectedUsers);
    }
    
    // Notifica autoridades se necessário (LGPD)
    if (investigation.severity === 'CRITICAL') {
      await this.notifyAuthorities(incident);
    }
  }
}
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de Segurança
