'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandalone = (window.navigator as any).standalone === true;

    if (isIOSDevice && !isInStandalone) {
      setIsIOS(true);
      setShowPrompt(true);
    }

    // Handle PWA install prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowPrompt(false);
      return;
    }

    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }
      
      window.deferredPrompt = null;
    }
    
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="pwa-install-prompt show">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Download className="w-5 h-5" />
          <div>
            <p className="font-medium">
              {isIOS 
                ? '📲 Toque em Compartilhar e depois "Adicionar à Tela Inicial"' 
                : 'Instale o app para melhor experiência'
              }
            </p>
            {!isIOS && (
              <p className="text-sm opacity-90">Funciona offline e sem URL!</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstallClick}
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            {isIOS ? 'Entendi' : 'Instalar'}
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}