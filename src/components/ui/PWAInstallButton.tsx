'use client';

import { useState, useEffect } from 'react';
import { Download, Smartphone, Check, X, Share2, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'menu-card' | 'floating';
}

export default function PWAInstallButton({ variant = 'sidebar' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check if user previously dismissed floating badge
    const dismissed = sessionStorage.getItem('pwa_floating_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check for iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // App installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (isInstalled) {
      alert('Aplikasi Manufaktur sudah terpasang di perangkat Anda.');
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('PWA prompt error:', err);
      }
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('pwa_floating_dismissed', 'true');
  };

  const modalElement = showIOSModal && (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--color-border)] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 text-[var(--color-text-main)]">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a2030] border border-[#2a3040] flex items-center justify-center text-[#c8a870]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#e2e6ed]">Install Aplikasi PWA</h3>
              <p className="text-[0.7rem] text-[#5a6270]">Pasang di Layar Utama HP / Desktop</p>
            </div>
          </div>
          <button onClick={() => setShowIOSModal(false)} className="text-[#5a6270] hover:text-[#e2e6ed] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-[#8899aa] bg-[#0c0f17] p-3.5 rounded-xl border border-[#1e2330]">
          <p className="font-semibold text-[#e2e6ed]">
            {isIOS ? 'Cara Pasang di iPhone / iPad (Safari):' : 'Cara Pasang di Browser:'}
          </p>
          {isIOS ? (
            <>
              <div className="flex items-center gap-2.5 text-[0.75rem]">
                <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#7a8a9a] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Ketuk tombol <strong>Share / Bagikan</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-[#7a8a9a]" /> di Safari.</span>
              </div>
              <div className="flex items-center gap-2.5 text-[0.75rem]">
                <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#7a8a9a] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Pilih <strong>Tambahkan ke Layar Utama</strong> (Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-[#7a8a9a]" />).</span>
              </div>
              <div className="flex items-center gap-2.5 text-[0.75rem]">
                <span className="w-5 h-5 rounded-full bg-[#1a2030] text-[#7a8a9a] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</span>
              </div>
            </>
          ) : (
            <div className="space-y-1.5 text-[0.75rem] text-[#8899aa]">
              <p>1. Di <strong>Google Chrome / Edge</strong>, klik ikon <strong>Install</strong> di sebelah kanan address bar browser.</p>
              <p>2. Atau buka menu browser <strong>(titik tiga ⋮)</strong> &rarr; pilih <strong>Install App / Pasang Aplikasi</strong>.</p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowIOSModal(false)}
          className="w-full py-2.5 bg-[#3d5a80] hover:bg-[#4a6d8c] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
        >
          Mengerti
        </button>
      </div>
    </div>
  );

  // Render for Floating Button (appears on bottom right on all pages if not installed)
  if (variant === 'floating') {
    if (isInstalled || isDismissed) return null;

    return (
      <>
        <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            onClick={() => handleInstallClick()}
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[var(--card-bg)] border border-[var(--color-border)] shadow-xl hover:shadow-2xl hover:border-[#3d5a80] text-[var(--color-text-main)] cursor-pointer transition-all group backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-xl bg-[#1a2838] border border-[#2a3848] text-[#c8a870] flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Download className="w-4 h-4 animate-bounce" />
            </div>
            <div className="pr-1 text-left">
              <p className="text-xs font-bold text-[#e2e6ed] group-hover:text-[#3d5a80] transition-colors leading-tight">
                Install App
              </p>
              <p className="text-[0.65rem] text-[#8899aa] leading-tight mt-0.5">
                Akses PWA Cepat
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              title="Tutup banner"
              className="p-1 rounded-lg text-[#5a6270] hover:text-[#e2e6ed] hover:bg-[#1a2030] transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {modalElement}
      </>
    );
  }

  // Render for Sidebar (Desktop)
  if (variant === 'sidebar') {
    return (
      <>
        <div className="hidden md:block w-full pt-4 mt-auto border-t border-[#1e2330]">
          <button
            type="button"
            onClick={() => handleInstallClick()}
            className={`w-full p-3 rounded-xl transition-all border flex items-center gap-3 text-left group ${
              isInstalled
                ? 'bg-[#121620] border-[#1e2330] text-[#7a8a9a]'
                : 'bg-[var(--card-bg)] hover:bg-[var(--card-hover-bg)] border-[var(--color-border)] hover:border-[#3d5a80] text-[var(--color-text-main)] shadow-sm'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isInstalled 
                ? 'bg-[#1a2030] text-[#6ea87a]' 
                : 'bg-[#1a2838] border border-[#2a3848] text-[#c8a870] group-hover:scale-105'
            }`}>
              {isInstalled ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4 animate-pulse" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#e2e6ed] group-hover:text-[#3d5a80] truncate transition-colors">
                  {isInstalled ? 'Aplikasi Terpasang' : 'Install Aplikasi'}
                </span>
                {!isInstalled && (
                  <span className="px-1.5 py-0.2 bg-[#3d5a80]/20 text-[#c8d4e0] text-[0.55rem] font-black rounded uppercase">
                    PWA
                  </span>
                )}
              </div>
              <p className="text-[0.65rem] text-[#8899aa] truncate">
                {isInstalled ? 'Mode Standalone Aktif' : 'Akses Cepat di Desktop / HP'}
              </p>
            </div>
          </button>
        </div>
        {modalElement}
      </>
    );
  }

  // Render for Menu Card variant (in /master page)
  return (
    <>
      <div 
        onClick={() => handleInstallClick()}
        className={`glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group relative overflow-hidden transition-all duration-200 cursor-pointer border ${
          isInstalled 
            ? 'border-[#1e2330] bg-[#0c0f17] text-[#8899aa]' 
            : 'border-[#1e2330] hover:border-[#3d5a80] text-[var(--color-text-main)] shadow-sm'
        }`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
              isInstalled
                ? 'bg-[#1a2a20] border-[#2a3a30] text-[#6ea87a]'
                : 'bg-[#1a2838] border-[#2a3848] text-[#c8a870] group-hover:scale-105'
            }`}>
              {isInstalled ? <Check className="w-5 h-5" /> : <Download className="w-5 h-5" />}
            </div>
            {!isInstalled && (
              <span className="px-2 py-0.5 rounded-full bg-[#3d5a80]/20 border border-[#3d5a80]/30 text-[#aab8c8] text-[0.65rem] font-extrabold uppercase tracking-wider">
                Install PWA
              </span>
            )}
          </div>
          <h3 className="font-bold text-xs sm:text-sm text-[#e2e6ed] group-hover:text-[#3d5a80] transition-colors">
            {isInstalled ? 'Aplikasi Sudah Terpasang' : 'Install Aplikasi ke HP / Desktop'}
          </h3>
          <p className="text-[0.7rem] text-[#8899aa] mt-1 leading-relaxed">
            {isInstalled 
              ? 'Aplikasi berjalan dalam mode standalone dengan icon di home screen.' 
              : 'Gunakan aplikasi layaknya aplikasi native tanpa bar browser.'}
          </p>
        </div>

        <div className="mt-3 pt-2.5 border-t border-[#1e2330] flex items-center justify-between text-[0.65rem] text-[#7a8a9a]">
          <span>{isInstalled ? '✓ Siap digunakan offline' : 'Klik untuk install'}</span>
          <span className="text-[#c8a870] font-semibold">{isInstalled ? 'Terpasang' : 'Pasang Sekarang →'}</span>
        </div>
      </div>
      {modalElement}
    </>
  );
}
