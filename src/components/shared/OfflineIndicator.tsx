'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShow(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShow(true);
    };

    // Set initial state
    setIsOnline(navigator.onLine);
    setShow(!navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Hide after 5 seconds if offline
    if (!navigator.onLine) {
      setTimeout(() => setShow(false), 5000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline || !show) return null;

  return (
    <div className="offline-indicator show">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span>Modo offline ativado</span>
      </div>
    </div>
  );
}