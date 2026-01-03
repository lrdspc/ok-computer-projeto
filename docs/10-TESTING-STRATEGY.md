# Estratégia de Testes - Sistema PWA de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento define a estratégia completa de testes para o sistema, incluindo tipos de testes, ferramentas, metas de cobertura e melhores práticas para garantir a qualidade e confiabilidade da aplicação.

## 2. OBJETIVOS DE TESTE

### 2.1. Metas Principais

| Objetivo | Meta | Métrica |
|----------|------|---------|
| Cobertura de Código | ≥ 80% | Istanbul/NYC |
| Taxa de Defeitos | < 5% | Bugs por sprint |
| Tempo de Execução | < 5 min | CI/CD pipeline |
| Performance | Lighthouse > 90 | Lighthouse CI |
| Acessibilidade | WCAG 2.1 AA | axe-core |

### 2.2. Pirâmide de Testes

```
        /\
       /E2E\
      /------\
     /  /\    \
    /  /  \   \
   /Integration\
  /------------\
 /  /\    /\   \
/  /  \  /  \  \
/   Unit Tests   \
/________________\
```

- **70% Unit Tests**: Testes rápidos e isolados
- **20% Integration Tests**: Testes de integração entre componentes
- **10% E2E Tests**: Testes end-to-end de fluxos críticos

## 3. TIPOS DE TESTES

### 3.1. Testes Unitários

#### 3.1.1. Objetivo
Testar unidades individuais de código (funções, componentes, hooks) de forma isolada.

#### 3.1.2. Ferramentas
- **Vitest**: Runner de testes
- **React Testing Library**: Testes de componentes React
- **@testing-library/user-event**: Simulação de eventos do usuário
- **@testing-library/jest-dom**: Matchers customizados

#### 3.1.3. Estrutura de Testes

```typescript
// __tests__/hooks/useTimerWorker.test.ts
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTimerWorker } from '@/hooks/useTimerWorker';

describe('useTimerWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start timer with correct initial time', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimerWorker(onComplete));

    act(() => {
      result.current.start(60);
    });

    expect(result.current.time).toBe(60);
    expect(result.current.isRunning).toBe(true);
  });

  it('should call onComplete when timer finishes', async () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimerWorker(onComplete));

    act(() => {
      result.current.start(1);
    });

    // Avança tempo
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(onComplete).toHaveBeenCalled();
  });

  it('should handle Web Worker fallback', () => {
    // Mock Worker como undefined
    const OriginalWorker = global.Worker;
    global.Worker = undefined as any;

    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimerWorker(onComplete));

    act(() => {
      result.current.start(5);
    });

    expect(result.current.isRunning).toBe(true);
    expect(console.warn).toHaveBeenCalledWith('Web Workers not supported. Falling back to setInterval.');

    // Restaura Worker
    global.Worker = OriginalWorker;
  });
});
```

#### 3.1.4. Exemplos de Testes Unitários

**Teste de Componente:**

```typescript
// __tests__/components/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect } from 'vitest';
import { LoginForm } from '@/components/features/auth/LoginForm';
import { supabase } from '@/lib/supabase/client';

// Mock do Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginForm', () => {
  it('renders form fields', () => {
    render(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('shows validation errors for invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /entrar/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(await screen.findByText(/email válido/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
    mockSignIn.mockResolvedValueOnce({
      data: { user: { id: '123', email: 'test@example.com' }, session: null },
      error: null,
    });
    
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/senha/i), 'password123');
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });
});
```

### 3.2. Testes de Integração

#### 3.2.1. Objetivo
Testar a integração entre múltiplos componentes e serviços.

#### 3.2.2. Ferramentas
- **Vitest**: Runner de testes
- **MSW (Mock Service Worker)**: Mock de APIs
- **@testing-library/react**: Renderização de componentes

#### 3.2.3. Mock de APIs

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  // Mock Supabase Auth
  http.post('*/auth/v1/token', ({ request }) => {
    return HttpResponse.json({
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      user: {
        id: '123',
        email: 'test@example.com',
        user_metadata: {
          full_name: 'Test User',
          user_type: 'student',
        },
      },
    });
  }),

  // Mock Queries
  http.get('*/rest/v1/users', ({ request }) => {
    return HttpResponse.json([
      {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        user_type: 'student',
      },
    ]);
  }),

  // Mock Realtime
  http.get('*/realtime/v1/websocket', () => {
    return new HttpResponse(null, { status: 101 });
  }),
];

export const server = setupServer(...handlers);
```

#### 3.2.4. Setup dos Testes

```typescript
// __tests__/setup.ts
import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { server } from './mocks/handlers';

// Inicia MSW
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Limpa após cada teste
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Fecha server
afterAll(() => {
  server.close();
});
```

#### 3.2.5. Exemplo de Teste de Integração

```typescript
// __tests__/integration/workout-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from '@/app/(app)/dashboard/page';
import { WorkoutPlayer } from '@/app/(app)/workout/player/[id]/page';

describe('Workout Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('completes full workout flow', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workout/player/:id" element={<WorkoutPlayer />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Aguarda carregar dashboard
    await waitFor(() => {
      expect(screen.getByText(/treinos de hoje/i)).toBeInTheDocument();
    });

    // Clica no treino de hoje
    const startButton = await screen.findByRole('button', { name: /iniciar treino/i });
    await user.click(startButton);

    // Verifica redirecionamento para player
    await waitFor(() => {
      expect(screen.getByText(/exercício 1 de/i)).toBeInTheDocument();
    });

    // Completa primeira série
    const completeButton = screen.getByRole('button', { name: /completar série/i });
    await user.click(completeButton);

    // Verifica timer de descanso
    expect(screen.getByText(/tempo de descanso/i)).toBeInTheDocument();
  });
});
```

### 3.3. Testes End-to-End (E2E)

#### 3.3.1. Objetivo
Testar fluxos completos do usuário em um ambiente real.

#### 3.3.2. Ferramentas
- **Playwright**: Testes E2E
- **@playwright/test**: Runner de testes

#### 3.3.3. Configuração

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### 3.3.4. Exemplo de Teste E2E

```typescript
// e2e/workout-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Workout E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login antes de cada teste
    await page.goto('/login');
    await page.fill('[name="email"]', 'student@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('student can complete a workout', async ({ page }) => {
    // Verifica dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Clica em "Iniciar Treino de Hoje"
    await page.click('button:has-text("Iniciar Treino")');
    await page.waitForURL('/workout/player/*');
    
    // Verifica se está no player
    await expect(page.locator('h1')).toContainText('Treino');
    
    // Completa séries
    for (let set = 1; set <= 3; set++) {
      // Verifica exercício atual
      await expect(page.locator('[data-testid="current-exercise"]')).toBeVisible();
      
      // Clica em "Completar Série"
      await page.click('button:has-text("Completar Série")');
      
      // Se não for a última série, aguarda descanso
      if (set < 3) {
        await expect(page.locator('[data-testid="rest-timer"]')).toBeVisible();
        await page.click('button:has-text("Pular Descanso")');
      }
    }
    
    // Verifica resumo do treino
    await expect(page.locator('h2')).toContainText('Treino Concluído');
    await expect(page.locator('[data-testid="workout-summary"]')).toBeVisible();
  });

  test('timer continues in background', async ({ page }) => {
    await page.click('button:has-text("Iniciar Treino")');
    
    // Inicia exercício
    await page.click('button:has-text("Iniciar")');
    
    // Simula tempo de execução
    await page.waitForTimeout(2000);
    
    // Completa série
    await page.click('button:has-text("Completar Série")');
    
    // Verifica se o tempo foi registrado
    const durationElement = page.locator('[data-testid="exercise-duration"]');
    await expect(durationElement).toContainText(/2/);
  });

  test('app works offline', async ({ page, context }) => {
    // Carrega treino online primeiro
    await page.click('button:has-text("Iniciar Treino")');
    await page.waitForLoadState('networkidle');
    
    // Simula offline
    await context.setOffline(true);
    
    // Recarrega página
    await page.reload();
    
    // Verifica se ainda funciona
    await expect(page.locator('[data-testid="current-exercise"]')).toBeVisible();
    
    // Volta online
    await context.setOffline(false);
  });
});
```

### 3.4. Testes de Performance

#### 3.4.1. Lighthouse CI

**Arquivo**: `/lighthouserc.js`

```javascript
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000/', 'http://localhost:3000/dashboard'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### 3.4.2. Teste de Carga

```typescript
// __tests__/performance/load-test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('dashboard loads under 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3 segundos
  });

  test('workout player interactive in 2 seconds', async ({ page }) => {
    await page.goto('/workout/player/123');
    
    const startTime = Date.now();
    await page.waitForSelector('button:has-text("Iniciar")');
    
    const interactiveTime = Date.now() - startTime;
    expect(interactiveTime).toBeLessThan(2000); // 2 segundos
  });
});
```

## 4. FERRAMENTAS DE TESTE

### 4.1. Configuração do Vitest

**Arquivo**: `/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock*',
        '**/*.stories.*',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

### 4.2. Configuração do Playwright

```bash
# Instala Playwright
npm install --save-dev @playwright/test

# Instala navegadores
npx playwright install

# Instala navegadores específicos
npx playwright install chromium firefox webkit
```

### 4.3. Scripts de Teste

**Arquivo**: `/package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:ci": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:lighthouse": "lhci autorun",
    "test:all": "npm run test:ci && npm run test:e2e"
  }
}
```

## 5. ESTRATÉGIA DE MOCKING

### 5.1. Mock de Dependências Externas

```typescript
// __tests__/mocks/supabase.ts
import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(),
      single: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
};

// Mock do módulo
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));
```

### 5.2. Mock de Hooks Customizados

```typescript
// __tests__/mocks/hooks.ts
import { vi } from 'vitest';

vi.mock('@/hooks/useTimerWorker', () => ({
  useTimerWorker: (onComplete?: () => void) => ({
    time: 60,
    isRunning: false,
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({
    request: vi.fn(),
    release: vi.fn(),
    isActive: false,
    isSupported: true,
  }),
}));
```

### 5.3. Mock de Dados

```typescript
// __tests__/fixtures/workout.ts
export const mockWorkout = {
  id: 'workout-123',
  name: 'Treino A - Peito e Tríceps',
  description: 'Treino focado em peito e tríceps',
  difficulty: 'intermediário' as const,
  estimated_duration_minutes: 60,
  exercises: [
    {
      id: 'exercise-1',
      name: 'Supino Reto',
      description: 'Exercício para peito',
      muscle_groups: ['peito', 'tríceps'],
      difficulty: 'intermediário' as const,
      order: 1,
      sets: 4,
      reps: '8-12',
      rest_time_seconds: 90,
      suggested_weight_kg: 60,
      video_urls: ['https://example.com/video1.mp4'],
    },
    {
      id: 'exercise-2',
      name: 'Crucifixo',
      description: 'Exercício para peito',
      muscle_groups: ['peito'],
      difficulty: 'intermediário' as const,
      order: 2,
      sets: 3,
      reps: '12-15',
      rest_time_seconds: 60,
      suggested_weight_kg: 20,
      video_urls: ['https://example.com/video2.mp4'],
    },
  ],
};

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  user_type: 'student' as const,
  profile_photo_url: 'https://example.com/avatar.jpg',
};
```

## 6. TESTES DE ACESSIBILIDADE

### 6.1. Configuração do axe-core

```typescript
// __tests__/utils/a11y.ts
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

export async function testAccessibility(container: HTMLElement) {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
```

### 6.2. Teste de Acessibilidade

```typescript
// __tests__/components/LoginForm.a11y.test.tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { LoginForm } from '@/components/features/auth/LoginForm';

describe('LoginForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<LoginForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels', () => {
    const { getByLabelText } = render(<LoginForm />);
    
    expect(getByLabelText(/email/i)).toBeInTheDocument();
    expect(getByLabelText(/senha/i)).toBeInTheDocument();
  });

  it('should be keyboard navigable', async () => {
    const { getByLabelText, getByRole } = render(<LoginForm />);
    
    const emailInput = getByLabelText(/email/i);
    const passwordInput = getByLabelText(/senha/i);
    const submitButton = getByRole('button', { name: /entrar/i });
    
    // Tab navegação
    emailInput.focus();
    expect(document.activeElement).toBe(emailInput);
    
    // Próximo campo
    await userEvent.tab();
    expect(document.activeElement).toBe(passwordInput);
    
    // Próximo botão
    await userEvent.tab();
    expect(document.activeElement).toBe(submitButton);
  });
});
```

## 7. TESTES DE SEGURANÇA

### 7.1. Testes de Segurança

```typescript
// __tests__/security/xss.test.ts
import { render } from '@testing-library/react';
import { escapeHtml } from '@/lib/security/sanitization';

describe('XSS Protection', () => {
  it('escapes HTML entities', () => {
    const malicious = '<script>alert("XSS")</script>';
    const escaped = escapeHtml(malicious);
    expect(escaped).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  it('sanitizes user inputs', () => {
    const { container } = render(
      <div dangerouslySetInnerHTML={{ 
        __html: escapeHtml('<img src=x onerror=alert(1)>') 
      }} />
    );
    
    expect(container.innerHTML).not.toContain('onerror');
  });
});
```

### 7.2. Testes de Rate Limiting

```typescript
// __tests__/api/rate-limit.test.ts
import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('blocks after too many failed login attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Tenta login com senha errada 5 vezes
    for (let i = 0; i < 5; i++) {
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'wrong-password');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);
    }
    
    // 6ª tentativa deve ser bloqueada
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
  });
});
```

## 8. RELATÓRIOS DE TESTE

### 8.1. Cobertura de Código

```bash
# Gera relatório de cobertura
npm run test:coverage

# Abre relatório HTML
open coverage/index.html
```

### 8.2. Relatório de Testes E2E

```bash
# Executa testes E2E
npm run test:e2e

# Abre relatório HTML
open playwright-report/index.html
```

### 8.3. Performance Report

```bash
# Executa Lighthouse CI
npm run test:lighthouse

# Verifica resultados
open .lighthouseci/lhr-*.html
```

## 9. INTEGRAÇÃO CONTÍNUA

### 9.1. GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
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
    
    - name: Run unit tests
      run: npm run test:ci
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  e2e-tests:
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
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30

  lighthouse:
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
    
    - name: Build project
      run: npm run build
    
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli@0.12.x
        lhci autorun
```

## 10. MELHORES PRÁTICAS

### 10.1. Escrever Bons Testes

#### 10.1.1. Princípios FIRST

- **F**ast: Testes devem executar rapidamente
- **I**solated: Cada teste é independente
- **R**epeatable: Mesmos resultados sempre
- **S**elf-validating: Passa ou falha claramente
- **T**imely: Escritos no momento certo

#### 10.1.2. Estrutura AAA

```typescript
it('should calculate total volume correctly', () => {
  // Arrange
  const sets = [
    { reps: 10, weight: 100 },
    { reps: 8, weight: 110 },
    { reps: 6, weight: 120 },
  ];
  
  // Act
  const totalVolume = calculateTotalVolume(sets);
  
  // Assert
  expect(totalVolume).toBe(1000 + 880 + 720);
});
```

### 10.2. Nomenclatura de Testes

```typescript
// ✅ Bom
it('should disable submit button when form is invalid')
it('should show error message for invalid email format')
it('should save workout data to localStorage when offline')

// ❌ Ruim
it('test1')
it('form validation')
it('works correctly')
```

### 10.3. Organização de Testes

```
__tests__/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── utils/
├── integration/
│   ├── api/
│   ├── components/
│   └── workflows/
├── e2e/
│   ├── auth.spec.ts
│   ├── workout.spec.ts
│   └── offline.spec.ts
├── fixtures/
│   ├── users.ts
│   ├── workouts.ts
│   └── exercises.ts
├── mocks/
│   ├── handlers.ts
│   └── server.ts
└── utils/
    ├── render.tsx
    ├── a11y.ts
    └── test-utils.ts
```

## 11. TROUBLESHOOTING

### 11.1. Testes Falhando Apenas no CI

```bash
# Execute com mesmo ambiente do CI
CI=true npm run test:ci

# Debug com verbose
DEBUG=* npm run test:e2e
```

### 11.2. Playwright Não Encontra Elementos

```typescript
// Use data-testid para seletores estáveis
data-testid="submit-button"

// Espere elemento estar pronto
await page.waitForSelector('[data-testid="submit-button"]');

// Use locator em vez de selector
await page.locator('[data-testid="submit-button"]').click();
```

### 11.3. Mock Não Funcionando

```typescript
// Verifique ordem dos mocks
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}));

// Mock antes do import
vi.mock('@/hooks/useTimerWorker');
import { useTimerWorker } from '@/hooks/useTimerWorker';
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de QA
