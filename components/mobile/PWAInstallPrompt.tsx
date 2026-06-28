"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Smartphone,
  Download,
  X,
  Zap,
  Wifi,
  Bell,
  BookOpen,
  Star,
  Shield,
  Sparkles
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallation = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsStandalone(isStandaloneMode || isIOSStandalone);
      setIsInstalled(isStandaloneMode || isIOSStandalone);
    };

    // Check if iOS
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent;
      const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
      setIsIOS(isIOSDevice);
    };

    checkInstallation();
    checkIOS();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 30 seconds if not dismissed before
      setTimeout(() => {
        const installDismissed = localStorage.getItem('pwa-install-dismissed');
        const installCount = parseInt(localStorage.getItem('pwa-install-prompt-count') || '0');
        
        if (!installDismissed && installCount < 3 && !isInstalled) {
          setShowInstallPrompt(true);
          localStorage.setItem('pwa-install-prompt-count', (installCount + 1).toString());
        }
      }, 30000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // Track installation
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'pwa_install', {
          method: 'browser_prompt'
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstalled(true);
      } else {
        console.log('User dismissed the install prompt');
        localStorage.setItem('pwa-install-dismissed', 'true');
      }
      
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const showIOSInstructions = () => {
    setShowInstallPrompt(true);
  };

  // Don't show if already installed or if user dismissed too many times
  if (isInstalled || isStandalone) {
    return null;
  }

  // iOS Install Instructions
  if (isIOS && showInstallPrompt) {
    return (
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              Install EXAMSPHERE
            </DialogTitle>
            <DialogDescription>
              Add EXAMSPHERE to your home screen for a better learning experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="text-sm font-medium">Tap the Share button</p>
                <p className="text-xs text-muted-foreground">Look for the share icon in Safari</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="w-6 h-6 bg-green-600 text-white rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="text-sm font-medium">Select "Add to Home Screen"</p>
                <p className="text-xs text-muted-foreground">Scroll down in the share menu</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="w-6 h-6 bg-purple-600 text-white rounded flex items-center justify-center text-xs font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="text-sm font-medium">Tap "Add"</p>
                <p className="text-xs text-muted-foreground">EXAMSPHERE will be added to your home screen</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInstallPrompt(false)}>
              Maybe Later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Android/Desktop Install Prompt
  if (deferredPrompt && showInstallPrompt) {
    return (
      <Dialog open={showInstallPrompt} onOpenChange={setShowInstallPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">K</span>
              </div>
              Install EXAMSPHERE
            </DialogTitle>
            <DialogDescription>
              Get the full app experience with offline access and push notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Benefits */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Wifi className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">Offline Access</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <Bell className="h-4 w-4 text-green-600" />
                <span className="text-xs font-medium">Push Notifications</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-xs font-medium">Faster Loading</span>
              </div>
              
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium">Native Feel</span>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                What you'll get:
              </h4>
              
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  Access courses even when offline
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="h-3 w-3" />
                  Instant notifications for new content
                </li>
                <li className="flex items-center gap-2">
                  <Star className="h-3 w-3" />
                  Enhanced learning experience
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  Secure and private
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleDismiss}>
              Not Now
            </Button>
            <Button onClick={handleInstallClick} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Install App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Floating install button (subtle prompt)
  if (deferredPrompt && !showInstallPrompt && !localStorage.getItem('pwa-install-dismissed')) {
    return (
      <div className={`fixed bottom-20 right-4 z-40 lg:bottom-4 ${className}`}>
        <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Install EXAMSPHERE</p>
                <p className="text-xs text-muted-foreground">Get the app experience</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setShowInstallPrompt(true)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // iOS floating prompt
  if (isIOS && !isStandalone && !localStorage.getItem('pwa-install-dismissed')) {
    return (
      <div className={`fixed bottom-20 right-4 z-40 lg:bottom-4 ${className}`}>
        <Card className="shadow-lg border-2 border-blue-200 dark:border-blue-800">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Add to Home Screen</p>
                <p className="text-xs text-muted-foreground">For a better experience</p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={showIOSInstructions}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

// Hook for PWA installation status
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const checkInstallation = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      
      setIsInstalled(isStandaloneMode || isIOSStandalone);
    };

    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    checkInstallation();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return { isInstalled, canInstall };
}
