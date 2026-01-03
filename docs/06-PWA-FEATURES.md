# Features PWA - Sistema de Gerenciamento de Treinos

## 1. VISÃO GERAL

Este documento descreve em detalhes todas as funcionalidades Progressive Web App (PWA) implementadas no sistema, incluindo Service Worker, Web App Manifest, APIs modernas do navegador e estratégias de cache.

## 2. SERVICE WORKER

### 2.1. Configuração do Service Worker

**Arquivo**: `/public/service-worker.js`

O Service Worker é gerado automaticamente pelo `next-pwa` e estendido com configurações customizadas.

```javascript
// public/service-worker.js

import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { 
  CacheFirst, 
  NetworkFirst, 
  StaleWhileRevalidate,
  NetworkOnly
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { RangeRequestsPlugin } from 'workbox-range-requests';

// Precache de assets estáticos (gerado pelo next-pwa)
precacheAndRoute(self.__WB_MANIFEST);

// Cache First: Imagens, fontes e vídeos
registerRoute(
  ({ request }) => 
    request.destination === 'image' || 
    request.destination === 'font' ||
    request.destination === 'video',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        purgeOnQuotaError: true,
      }),
      new RangeRequestsPlugin(), // Suporte para vídeos
    ],
  })
);

// Network First: APIs do Supabase
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 10 * 60, // 10 minutos
      }),
    ],
  })
);

// Stale While Revalidate: HTML, CSS e JS
registerRoute(
  ({ request }) => 
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'content-cache',
  })
);

// Network Only: Autenticação e WebSocket
registerRoute(
  ({ url }) => 
    url.pathname.includes('/auth') ||
    url.protocol === 'ws:' ||
    url.protocol === 'wss:',
  new NetworkOnly()
);

// Background Sync para sincronização offline
const bgSyncPlugin = new BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60, // 24 horas
});

registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

// Mensagens do Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});
```

### 2.2. Registro do Service Worker

**Arquivo**: `/app/layout.tsx`

```typescript
import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
```

## 3. WEB APP MANIFEST

### 3.1. Manifest.json Completo

**Arquivo**: `/public/manifest.json`

```json
{
  "name": "Sistema de Treinos - Personal Trainer",
  "short_name": "Treinos PT",
  "description": "App profissional de gerenciamento de treinos com timer preciso, avaliação física e sincronização offline",
  "id": "/",
  "start_url": "/",
  "scope": "/",
  "display_override": [
    "window-controls-overlay",
    "minimal-ui",
    "standalone"
  ],
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#1f2937",
  "background_color": "#ffffff",
  "lang": "pt-BR",
  "dir": "ltr",
  "categories": [
    "health",
    "fitness",
    "sports",
    "lifestyle"
  ],
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "screenshots": [
    {
      "src": "/splash/splash-540x720.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Player de Treino"
    },
    {
      "src": "/splash/splash-1024x768.png",
      "sizes": "1024x768",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard do Personal Trainer"
    }
  ],
  "shortcuts": [
    {
      "name": "Iniciar Treino de Hoje",
      "short_name": "Treino",
      "description": "Comece o treino programado para hoje",
      "url": "/workout/today",
      "icons": [
        {
          "src": "/icons/workout-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Biblioteca de Exercícios",
      "short_name": "Exercícios",
      "description": "Acesse sua biblioteca de exercícios",
      "url": "/exercises",
      "icons": [
        {
          "src": "/icons/exercises-96.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    }
  ],
  "prefer_related_applications": false,
  "related_applications": [],
  "edge_side_panel": {
    "preferred_width": 400
  },
  "launch_handler": {
    "client_mode": "navigate-existing"
  }
}
```

### 3.2. Meta Tags PWA

**Arquivo**: `/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: 'Sistema de Treinos - Personal Trainer',
  description: 'App profissional de gerenciamento de treinos com timer preciso, avaliação física e sincronização offline',
  manifest: '/manifest.json',
  themeColor: '#1f2937',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Treinos PT',
  },
  icons: {
    apple: [
      {
        url: '/icons/apple-touch-icon.png',
        sizes: '180x180',
      },
    ],
    icon: [
      {
        url: '/icons/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/icons/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-title': 'Treinos PT',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};
```

## 4. FUNCIONALIDADES OFFLINE

### 4.1. IndexedDB para Armazenamento Offline

**Arquivo**: `/lib/offline/db.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  'workout-sessions': {
    key: string;
    value: {
      id: string;
      userId: string;
      workoutId: string;
      startedAt: string;
      completedAt?: string;
      exercises: ExerciseSession[];
      syncStatus: 'pending' | 'synced' | 'failed';
      lastModified: string;
    };
    indexes: { 
      'by-user': string;
      'by-sync-status': string;
    };
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
      error?: string;
    };
    indexes: { 
      'by-tag': string;
      'by-user': string;
      'by-status': string;
    };
  };
  
  'cache-data': {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      ttl: number;
    };
    indexes: { 'by-timestamp': number };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

export function getOfflineDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>('treinos-offline', 1, {
      upgrade(db) {
        // Sessões de treino
        const sessionStore = db.createObjectStore('workout-sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-user', 'userId');
        sessionStore.createIndex('by-sync-status', 'syncStatus');

        // Fila de sincronização
        const syncStore = db.createObjectStore('sync-queue', { 
          autoIncrement: true, 
          keyPath: 'id' 
        });
        syncStore.createIndex('by-tag', 'tag');
        syncStore.createIndex('by-user', 'userId');
        syncStore.createIndex('by-status', 'status');

        // Cache de dados
        const cacheStore = db.createObjectStore('cache-data', { keyPath: 'key' });
        cacheStore.createIndex('by-timestamp', 'timestamp');
      },
      blocked() {
        console.warn('Database upgrade blocked');
      },
      blocking() {
        console.warn('Database upgrade needed, blocking older versions');
      },
    });
  }
  return dbPromise;
}

// Funções auxiliares
export async function saveWorkoutSession(sessionData: any) {
  const db = await getOfflineDB();
  const userId = await getCurrentUserId();
  
  await db.put('workout-sessions', {
    ...sessionData,
    userId,
    lastModified: new Date().toISOString(),
  });
}

export async function getPendingSyncItems() {
  const db = await getOfflineDB();
  return db.getAllFromIndex('sync-queue', 'by-status', 'pending');
}

export async function markSyncItemProcessed(id: number, status: 'completed' | 'failed', error?: string) {
  const db = await getOfflineDB();
  const item = await db.get('sync-queue', id);
  
  if (item) {
    await db.put('sync-queue', {
      ...item,
      status,
      error,
      retryCount: item.retryCount + 1,
    });
  }
}
```

### 4.2. Background Sync API

**Arquivo**: `/lib/offline/background-sync.ts`

```typescript
interface SyncItem {
  id: number;
  tag: string;
  data: any;
  retryCount: number;
  createdAt: string;
}

class BackgroundSyncManager {
  private isSupported = 'serviceWorker' in navigator && 'sync' in window;

  async register(tag: string, data: any): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Background Sync not supported');
      return false;
    }

    try {
      // Salva dados no IndexedDB
      await this.saveToQueue(tag, data);
      
      // Registra sync no Service Worker
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      
      console.log('Background sync registered:', tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  private async saveToQueue(tag: string, data: any) {
    const db = await getOfflineDB();
    const userId = await getCurrentUserId();
    
    await db.add('sync-queue', {
      userId,
      tag,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    });
  }

  async processPendingSyncs(): Promise<void> {
    const db = await getOfflineDB();
    const pendingItems = await db.getAllFromIndex('sync-queue', 'by-status', 'pending');
    
    for (const item of pendingItems) {
      await this.processSyncItem(item);
    }
  }

  private async processSyncItem(item: SyncItem): Promise<void> {
    try {
      const result = await this.executeSync(item.tag, item.data);
      
      if (result.success) {
        await this.markAsCompleted(item.id);
      } else {
        await this.handleSyncError(item, result.error);
      }
    } catch (error) {
      await this.handleSyncError(item, error as Error);
    }
  }

  private async executeSync(tag: string, data: any): Promise<{ success: boolean; error?: Error }> {
    switch (tag) {
      case 'workout-session':
        return this.syncWorkoutSession(data);
      case 'assessment':
        return this.syncAssessment(data);
      case 'exercise':
        return this.syncExercise(data);
      default:
        return { success: false, error: new Error(`Unknown sync tag: ${tag}`) };
    }
  }

  private async syncWorkoutSession(data: any): Promise<{ success: boolean; error?: Error }> {
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .insert(data);
      
      return { success: !error, error };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  private async handleSyncError(item: SyncItem, error: Error): Promise<void> {
    const maxRetries = 3;
    
    if (item.retryCount < maxRetries) {
      // Reagendar para tentar novamente
      await this.rescheduleSync(item);
    } else {
      // Marcar como falhado
      await this.markAsFailed(item.id, error.message);
      console.error('Sync failed after max retries:', error);
    }
  }

  private async rescheduleSync(item: SyncItem): Promise<void> {
    const db = await getOfflineDB();
    await db.put('sync-queue', {
      ...item,
      retryCount: item.retryCount + 1,
      createdAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutos
    });
  }

  private async markAsCompleted(id: number): Promise<void> {
    const db = await getOfflineDB();
    const item = await db.get('sync-queue', id);
    if (item) {
      await db.put('sync-queue', { ...item, status: 'completed' });
    }
  }

  private async markAsFailed(id: number, error: string): Promise<void> {
    const db = await getOfflineDB();
    const item = await db.get('sync-queue', id);
    if (item) {
      await db.put('sync-queue', { 
        ...item, 
        status: 'failed', 
        error 
      });
    }
  }
}

export const backgroundSync = new BackgroundSyncManager();
```

### 4.3. Listener de Sync no Service Worker

**Arquivo**: `/public/service-worker.js`

```javascript
// Listener para eventos de sincronização
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  event.waitUntil(handleBackgroundSync(event.tag));
});

async function handleBackgroundSync(tag) {
  try {
    // Abre o banco de dados IndexedDB
    const db = await openDB('treinos-offline', 1);
    
    // Busca itens pendentes
    const pendingItems = await db.getAllFromIndex('sync-queue', 'by-status', 'pending');
    
    for (const item of pendingItems) {
      if (item.tag === tag) {
        await processSyncItem(item);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
    // Rejeita a sincronização para tentar novamente
    throw error;
  }
}
```

## 5. APIS MODERNAS DO NAVEGADOR

### 5.1. Wake Lock API

**Arquivo**: `/hooks/useWakeLock.ts` (já documentado em CUSTOM-HOOKS.md)

### 5.2. Vibration API

**Arquivo**: `/hooks/useHaptic.ts` (já documentado em CUSTOM-HOOKS.md)

### 5.3. Web Share API

**Arquivo**: `/components/features/workout/ShareWorkout.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ShareWorkoutProps {
  workout: {
    id: string;
    name: string;
    description: string;
    exercises: any[];
  };
}

export function ShareWorkout({ workout }: ShareWorkoutProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!navigator.share) {
      toast({
        title: 'Compartilhamento não suportado',
        description: 'Seu navegador não suporta compartilhamento nativo.',
        variant: 'destructive',
      });
      return;
    }

    setIsSharing(true);

    try {
      await navigator.share({
        title: `Treino: ${workout.name}`,
        text: `${workout.description}\n\nExercícios: ${workout.exercises.length}`,
        url: `${window.location.origin}/workout/${workout.id}`,
      });

      toast({
        title: 'Treino compartilhado com sucesso!',
      });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: 'Erro ao compartilhar',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (!navigator.share) {
    return null; // Não renderiza o botão se não suportado
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      disabled={isSharing}
      className="flex items-center gap-2"
    >
      <Share2 className="h-4 w-4" />
      {isSharing ? 'Compartilhando...' : 'Compartilhar'}
    </Button>
  );
}
```

### 5.4. Badging API

**Arquivo**: `/lib/pwa/badging.ts`

```typescript
class BadgingManager {
  private isSupported = 'setAppBadge' in navigator;

  async setBadge(count: number): Promise<void> {
    if (!this.isSupported) {
      console.warn('Badging API not supported');
      return;
    }

    try {
      await navigator.setAppBadge(count);
      console.log(`Badge set to: ${count}`);
    } catch (error) {
      console.error('Failed to set badge:', error);
    }
  }

  async clearBadge(): Promise<void> {
    if (!this.isSupported) {
      console.warn('Badging API not supported');
      return;
    }

    try {
      await navigator.clearAppBadge();
      console.log('Badge cleared');
    } catch (error) {
      console.error('Failed to clear badge:', error);
    }
  }

  async setUnreadWorkouts(count: number): Promise<void> {
    await this.setBadge(count);
  }

  async clearUnreadWorkouts(): Promise<void> {
    await this.clearBadge();
  }
}

export const badging = new BadgingManager();
```

### 5.5. File System Access API

**Arquivo**: `/components/features/reports/ExportReport.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { generateReport } from '@/lib/reports/generator';

interface ExportReportProps {
  studentId: string;
  reportType: 'assessment' | 'workout' | 'progress';
}

export function ExportReport({ studentId, reportType }: ExportReportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const reportData = await generateReport(studentId, reportType);
      const blob = new Blob([reportData.content], { 
        type: 'application/pdf' 
      });

      if ('showSaveFilePicker' in window) {
        // Usa File System Access API se disponível
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: `relatorio-${reportType}-${studentId}.pdf`,
          types: [{
            description: 'PDF Document',
            accept: { 'application/pdf': ['.pdf'] },
          }],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback: download tradicional
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportType}-${studentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      // Tratar erro...
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exportando...' : 'Exportar PDF'}
    </Button>
  );
}
```

## 6. ESTRATÉGIAS DE CACHE

### 6.1. Cache First (Cache Primário)

Para assets estáticos que raramente mudam:

```javascript
// Imagens, fontes, vídeos
registerRoute(
  ({ request }) => 
    request.destination === 'image' || 
    request.destination === 'font' ||
    request.destination === 'video',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 150,                    // Max 150 arquivos
        maxAgeSeconds: 30 * 24 * 60 * 60,   // 30 dias
        purgeOnQuotaError: true,            // Remove se ultrapassar quota
      }),
    ],
  })
);
```

### 6.2. Network First (Rede Primária)

Para dados da API que precisam estar atualizados:

```javascript
// APIs do Supabase
registerRoute(
  ({ url }) => url.origin.includes('supabase.co'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,             // Timeout após 5 segundos
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,                   // Max 50 respostas
        maxAgeSeconds: 10 * 60,           // 10 minutos
      }),
    ],
  })
);
```

### 6.3. Stale While Revalidate

Para conteúdo que pode ser mostrado velho enquanto busca novo:

```javascript
// HTML, CSS, JS
registerRoute(
  ({ request }) => 
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'content-cache',
  })
);
```

## 7. INSTALAÇÃO E ATALHOS

### 7.1. Prompt de Instalação

**Arquivo**: `/components/features/pwa/InstallPrompt.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Instalar Aplicativo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Instale o aplicativo para acessar seus treinos offline e receber notificações.
        </p>
        <div className="flex gap-2">
          <Button onClick={handleInstall} className="flex-1">
            Instalar
          </Button>
          <Button variant="outline" onClick={handleDismiss}>
            Depois
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 7.2. Window Controls Overlay (Desktop PWA)

**Arquivo**: `/components/features/pwa/TitleBar.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

export function TitleBar() {
  const [isSupported, setIsSupported] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if ('windowControlsOverlay' in navigator) {
      setIsSupported(true);
      setIsVisible(navigator.windowControlsOverlay.visible);

      navigator.windowControlsOverlay.addEventListener('geometrychange', () => {
        setIsVisible(navigator.windowControlsOverlay.visible);
      });
    }
  }, []);

  if (!isSupported || !isVisible) return null;

  return (
    <div className="drag-region h-8 bg-background border-b flex items-center px-4">
      <h1 className="text-sm font-medium">Treinos PT</h1>
    </div>
  );
}

// CSS para área arrastável
drag-region {
  -webkit-app-region: drag;
  app-region: drag;
}
```

## 8. NOTIFICAÇÕES PUSH

### 8.1. Configuração de Notificações

**Arquivo**: `/lib/push-notifications.ts`

```typescript
class PushNotificationManager {
  private isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      throw new Error('Push notifications not supported');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return null;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Verifica se já existe inscrição
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Cria nova inscrição
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      
      // Salva no servidor
      await this.saveSubscription(subscription);
    }
    
    return subscription;
  }

  private async saveSubscription(subscription: PushSubscription) {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
  }

  async unsubscribeFromPush(): Promise<void> {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      await this.removeSubscription(subscription.endpoint);
    }
  }

  private async removeSubscription(endpoint: string) {
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint }),
    });
  }
}

export const pushNotifications = new PushNotificationManager();
```

### 8.2. Service Worker para Notificações

**Arquivo**: `/public/service-worker.js`

```javascript
// Listener para notificações push
self.addEventListener('push', (event) => {
  console.log('Push received:', event);

  const options = {
    body: 'Você tem um novo treino disponível!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2',
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver Treino',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/xmark.png',
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }

  event.waitUntil(
    self.registration.showNotification('Treinos PT', options)
  );
});

// Listener para cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/workout/today')
    );
  } else if (event.action === 'close') {
    // Apenas fecha a notificação
    return;
  } else {
    // Ação padrão: abre o app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

## 9. PERFORMANCE E MÉTRICAS

### 9.1. Core Web Vitals

| Métrica | Meta | Estratégia |
|---------|------|------------|
| LCP | < 2.5s | Code splitting, lazy loading, imagens otimizadas |
| FID | < 100ms | Workers, minização de JS, hydration otimizada |
| CLS | < 0.1 | Dimensões fixas, fontes pre-carregadas |
| TTI | < 3s | Bundle otimizado, precaching estratégico |

### 9.2. Lighthouse Score Targets

- **Performance**: 95+
- **Accessibility**: 95+
- **Best Practices**: 95+
- **SEO**: 95+
- **PWA**: 100

### 9.3. Budget de Performance

```json
{
  "budgets": [
    {
      "path": "/*",
      "resourceSizes": [
        {
          "resourceType": "document",
          "budget": 100
        },
        {
          "resourceType": "script",
          "budget": 300
        },
        {
          "resourceType": "image",
          "budget": 500
        },
        {
          "resourceType": "total",
          "budget": 1500
        }
      ]
    }
  ]
}
```

## 10. COMPATIBILIDADE E FALLBACKS

### 10.1. Tabela de Compatibilidade

| Feature | Chrome | Safari | Firefox | Edge | iOS Safari |
|---------|--------|--------|---------|------|------------|
| Service Worker | 45+ | 11.1+ | 44+ | 17+ | 11.3+ |
| Web App Manifest | 39+ | 11.3+ | * | 79+ | 11.3+ |
| Background Sync | 49+ | ❌ | * | 79+ | ❌ |
| Wake Lock API | 84+ | ❌ | ❌ | 84+ | ❌ |
| Vibration API | 32+ | ❌ | 36+ | 79+ | ❌ |
| Web Share API | 61+ | 12.1+ | * | 79+ | 12.2+ |
| File System Access | 86+ | ❌ | ❌ | 86+ | ❌ |

*Requer polyfill ou fallback

### 10.2. Estratégia de Fallbacks

```typescript
// lib/pwa/compatibility.ts

export const PWA_FEATURES = {
  serviceWorker: 'serviceWorker' in navigator,
  webAppManifest: 'manifest' in document.createElement('link'),
  backgroundSync: 'serviceWorker' in navigator && 'sync' in window,
  wakeLock: 'wakeLock' in navigator,
  vibration: 'vibrate' in navigator,
  webShare: 'share' in navigator,
  fileSystemAccess: 'showSaveFilePicker' in window,
  badging: 'setAppBadge' in navigator,
  windowControlsOverlay: 'windowControlsOverlay' in navigator,
};

export function getUnsupportedFeatures(): string[] {
  return Object.entries(PWA_FEATURES)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);
}

export function showCompatibilityWarning(): void {
  const unsupported = getUnsupportedFeatures();
  
  if (unsupported.length > 0) {
    console.warn('PWA features not supported:', unsupported);
    
    // Pode mostrar aviso ao usuário se necessário
    if (process.env.NODE_ENV === 'development') {
      alert(`Recursos PWA não suportados: ${unsupported.join(', ')}`);
    }
  }
}
```

## 11. TESTES DE PWA

### 11.1. Testes de Funcionamento Offline

```typescript
// tests/pwa/offline.spec.ts

describe('PWA Offline Functionality', () => {
  beforeEach(async () => {
    await page.goto('/');
    await page.evaluate(() => window.navigator.serviceWorker.ready);
  });

  test('app works offline', async () => {
    // Simula offline
    await page.setOfflineMode(true);
    
    // Recarrega a página
    await page.reload();
    
    // Verifica se a página carrega
    const title = await page.$('h1');
    expect(title).toBeTruthy();
  });

  test('workout data is available offline', async () => {
    // Primeiro, carrega dados online
    await page.goto('/workout/123');
    
    // Simula offline
    await page.setOfflineMode(true);
    
    // Recarrega
    await page.reload();
    
    // Verifica se dados estão disponíveis
    const workoutTitle = await page.$('[data-testid="workout-title"]');
    expect(workoutTitle).toBeTruthy();
  });
});
```

### 11.2. Testes de Performance

```typescript
// tests/pwa/performance.spec.ts

describe('PWA Performance', () => {
  test('LCP is under 2.5s', async () => {
    await page.goto('/');
    
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });

    expect(lcp).toBeLessThan(2500); // 2.5 segundos
  });

  test('app is installable', async () => {
    const manifest = await page.evaluate(async () => {
      const response = await fetch('/manifest.json');
      return response.json();
    });

    expect(manifest).toMatchObject({
      name: expect.any(String),
      short_name: expect.any(String),
      start_url: '/',
      display: 'standalone',
      icons: expect.arrayContaining([
        expect.objectContaining({
          src: expect.stringContaining('192'),
          sizes: '192x192',
        }),
      ]),
    });
  });
});
```

---

**Documento Version**: 1.0.0  
**Última Atualização**: 2025-01-01  
**Responsável**: Equipe de PWA
