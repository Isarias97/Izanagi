
// Refactor profesional: modularización, lazy loading, comentarios, accesibilidad y performance
import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Page, AppState, Category, Product, SaleReport, SaleItem, Worker, AuditReport, TransactionLogEntry } from './types';
import { getInitialState } from './state';
import { DataContext } from './context';
import { Icon } from './components/ui';
import MobileNavDrawer from './components/MobileNavDrawer';
import PWAInstallPrompt from './components/PWAInstallPrompt';

// Lazy load de páginas principales para performance
const PosPage = lazy(() => import('./pages/PosPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const ConfigPage = lazy(() => import('./pages/ConfigPage'));
const PurchasesPage = lazy(() => import('./pages/PurchasesPage'));
const WorkersPage = lazy(() => import('./pages/WorkersPage'));
const AIAssistantPage = lazy(() => import('./pages/AIAssistantPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage').then(module => ({ default: module.PayrollPage })));


const loadAndMigrateState = (): AppState => {
  try {
    const savedState = localStorage.getItem('izanagi_state');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      const defaults = getInitialState();
      
      const mergedState: AppState = {
        ...defaults,
        ...parsedState,
        config: {
          ...defaults.config,
          ...(parsedState.config ?? {}),
          exchangeRates: {
            ...defaults.config.exchangeRates,
            ...(parsedState.config?.exchangeRates ?? {}),
          },
          inventory: {
            ...defaults.config.inventory,
            ...(parsedState.config?.inventory ?? {}),
          },
        },
        products: (parsedState.products ?? defaults.products).map((p: Product) => ({
          ...p,
          costPrice: p.costPrice ?? 0,
        })),
        categories: (parsedState.categories ?? defaults.categories).map((c: Category) => ({
          ...c,
          icon: c.icon || '📦',
        })),
        reports: (parsedState.reports ?? defaults.reports).map((report: SaleReport) => ({
          ...report,
          soldByWorkerId: report.soldByWorkerId ?? 0,
          items: (report.items ?? []).map((item: SaleItem) => ({
            ...item,
            costPrice: item.costPrice ?? 0,
          })),
        })),
        auditReports: (parsedState.auditReports ?? defaults.auditReports).map((report: AuditReport) => ({
            ...report,
            closedByWorkerId: report.closedByWorkerId ?? 0,
        })),
        purchases: parsedState.purchases ?? defaults.purchases,
        investmentBalance: parsedState.investmentBalance ?? defaults.investmentBalance,
        workerPayoutBalance: parsedState.workerPayoutBalance ?? defaults.workerPayoutBalance,
        transactionLog: (parsedState.transactionLog ?? defaults.transactionLog).map((log: TransactionLogEntry) => ({
            ...log,
            workerId: log.workerId ?? (log.type === 'CASH_SHORTAGE' ? 0 : undefined),
        })),
        workers: parsedState.workers ?? defaults.workers,
        payrollReports: parsedState.payrollReports ?? defaults.payrollReports,
      };
      return mergedState;
    }
    return getInitialState();
  } catch {
    return getInitialState();
  }
};

interface AppRoutesProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  currentUser: Worker | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<Worker | null>>;
  notification: { title: string; message: string; isError: boolean; visible: boolean } | null;
  setNotification: React.Dispatch<React.SetStateAction<{ title: string; message: string; isError: boolean; visible: boolean } | null>>;
  showNotification: (title: string, message: string, isError?: boolean) => void;
  handleLogout: () => void;
  showInstallBanner: boolean;
  setShowInstallBanner: React.Dispatch<React.SetStateAction<boolean>>;
  deferredPrompt: React.MutableRefObject<any>;
  footerVisible: boolean;
  setFooterVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleInstallClick: () => void;
}

const PAGE_TO_PATH: Record<string, string> = {
  POS: '/',
  Purchases: '/compras',
  Inventory: '/inventario',
  Reports: '/reportes',
  Payroll: '/nomina',
  Workers: '/trabajadores',
  AI: '/ai',

  Config: '/config',
};
const PATH_TO_PAGE: Record<string, string> = {
  '/': 'POS',
  '/compras': 'Purchases',
  '/inventario': 'Inventory',
  '/reportes': 'Reports',
  '/nomina': 'Payroll',
  '/trabajadores': 'Workers',
  '/ai': 'AI',

  '/config': 'Config',
};

function AppRoutes({
  state,
  setState,
  currentUser,
  setCurrentUser,
  notification,
  showNotification,
  handleLogout,
  showInstallBanner,
  setShowInstallBanner,
  footerVisible,
  setFooterVisible,
  handleInstallClick,
}: AppRoutesProps) {
  const [activePage, setActivePage] = useState<string>(() => {
    return PATH_TO_PAGE[window.location.pathname] || 'POS';
  });

  // Sincroniza la URL con el estado
  useEffect(() => {
    const path = PAGE_TO_PATH[activePage] || '/';
    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
  }, [activePage]);

  // Atajos de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
    const shortcutMap: Record<string, string> = {
      'F1': 'POS',
      'F2': 'Purchases',
      'F3': 'Inventory',
      'F4': 'Reports',
      'F5': 'Payroll',
      'F6': 'Workers',
      'F7': 'AI',

    };
    if (shortcutMap[e.key] && !isInputFocused) {
        e.preventDefault();
        setActivePage(shortcutMap[e.key]);
    }
  }, []);
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Actualiza activePage al cambiar la URL manualmente
  useEffect(() => {
    const page = PATH_TO_PAGE[window.location.pathname] || 'POS';
    setActivePage(page);
  }, [window.location.pathname]);
  
  const contextValue = useMemo(() => ({
    state,
    setState,
    showNotification,
    setActivePage: (page: string) => setActivePage(page),
    currentUser,
    logout: handleLogout,
  }), [state, showNotification, setActivePage, currentUser, handleLogout]);

  if (!currentUser) {
    return (
      <DataContext.Provider value={contextValue}>
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
          <LoginPage onLoginSuccess={(worker: Worker) => {
            setCurrentUser(worker);
            setActivePage('POS');
            showNotification('¡Bienvenido!', `Has iniciado sesión como ${worker.name}.`);
          }} />
        </Suspense>
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-dark-bg w-full">
        {/* Componente PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {/* Header optimizado */}
        <header className="bg-primary shadow-lg sticky top-0 z-40 p-2 sm:p-3 flex flex-row items-center justify-between gap-2 min-h-[48px] sm:min-h-[56px] w-full max-w-screen-xl mx-auto">
          {/* Logo y título */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon name="fa-cash-register" className="text-accent text-lg sm:text-xl flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold text-white truncate">
                Izanagi <span className="text-[10px] sm:text-xs bg-accent text-primary font-bold py-0.5 px-1.5 sm:px-2 rounded-full ml-1">CUP</span>
              </h1>
              <span className="text-[8px] sm:text-[10px] mt-0.5 text-accent/80 italic font-medium drop-shadow-sm hidden sm:block" style={{letterSpacing: '0.5px'}}>by Isarias</span>
            </div>
          </div>
          
          {/* Info usuario y saldos */}
          <div className="flex flex-col items-end gap-0.5 text-right flex-shrink-0 min-w-[100px] sm:min-w-[110px]">
            <div className="flex items-center gap-1">
              <Icon name="fa-wallet" className="text-accent text-sm sm:text-base" />
              <span className="text-[10px] sm:text-[11px] text-white font-bold">{state.investmentBalance.toFixed(2)} CUP</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="fa-users" className="text-accent text-sm sm:text-base" />
              <span className="text-[10px] sm:text-[11px] text-white font-bold">{state.workerPayoutBalance.toFixed(2)} CUP</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="fa-user-circle" className="text-accent text-xs sm:text-sm" />
              <span className="text-[10px] sm:text-[11px] text-white font-semibold truncate max-w-[50px] sm:max-w-[60px]">{currentUser?.name}</span>
              <span className="text-[8px] sm:text-[9px] text-gray-300 font-medium">{currentUser?.role}</span>
            </div>
          </div>
        </header>

        {/* Navegación móvil */}
        <MobileNavDrawer
          activePage={activePage}
          setActivePage={setActivePage}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Contenido principal optimizado */}
        <main className="flex-1 w-full max-w-screen-xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 lg:py-6">
          <div className="w-full">
            <Routes>
              <Route path="/" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><PosPage /></Suspense>} />
              <Route path="/compras" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><PurchasesPage /></Suspense>} />
              <Route path="/inventario" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><InventoryPage /></Suspense>} />
              <Route path="/reportes" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><ReportsPage /></Suspense>} />
              <Route path="/nomina" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><PayrollPage /></Suspense>} />
              <Route path="/trabajadores" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><WorkersPage /></Suspense>} />
              <Route path="/ai" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><AIAssistantPage /></Suspense>} />

              <Route path="/config" element={<Suspense fallback={<div className="p-4 sm:p-6 text-center text-sm">Cargando...</div>}><ConfigPage /></Suspense>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>

        {/* Notificaciones */}
        {notification?.visible && (
            <div className={`fixed top-24 right-5 w-80 rounded-lg shadow-2xl p-4 text-white z-50 transition-transform duration-300 transform ${notification.visible ? 'translate-x-0' : 'translate-x-full'} bg-dark-card backdrop-blur-lg border-l-4 ${notification.isError ? 'border-danger' : 'border-success'}`}>
                <p className="font-bold">{notification.title}</p>
                <p className="text-sm text-gray-300">{notification.message}</p>
            </div>
        )}

        {/* Footer optimizado */}
        <footer
          className={`bg-primary text-center p-2 sm:p-3 text-xs sm:text-sm text-gray-400 transition-all duration-500 ${footerVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            fixed bottom-0 left-0 w-full z-50 shadow-lg rounded-t-lg sm:rounded-none`}
          style={{fontWeight:'bold',letterSpacing:'0.5px',fontSize:'0.9rem',boxShadow:'0 2px 8px 0 rgba(0,42,143,0.18), 0 1.5px 4px 0 rgba(207,20,43,0.12)',maxWidth:'100vw'}}
        >
          <span className="hidden sm:inline">Sistema de Ventas Izanagi v8.3 (Optimizado) &copy; {new Date().getFullYear()} - Todos los datos se guardan en su navegador.</span>
          <span className="sm:hidden flex items-center justify-center gap-2">
            <span>Creado por Isarias</span>
            <button className="ml-2 px-1.5 py-0.5 rounded bg-accent text-primary font-bold text-[10px] shadow hover:bg-white/90 transition" onClick={()=>setFooterVisible(false)} aria-label="Ocultar pie">Ocultar</button>
          </span>
        </footer>

        {/* Estilos mejorados */}
        <style>{`
          @media (max-width: 640px) {
            footer { font-size: 0.98rem !important; padding: 0.7rem 0.5rem !important; border-radius: 1.2rem 1.2rem 0 0 !important; }
            main { padding-top: 1rem !important; }
          }
          .animate-fade-in { animation: fade-in 0.3s ease; }
          @keyframes fade-in { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: none; } }
        `}</style>
      </div>
    </DataContext.Provider>
  );
}

// App principal con BrowserRouter
const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadAndMigrateState);
  const [currentUser, setCurrentUser] = useState<Worker | null>(() => {
    const saved = localStorage.getItem('izanagi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [notification, setNotification] = useState<{ title: string; message: string; isError: boolean; visible: boolean } | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true); // Siempre true por defecto
  const deferredPrompt = useRef<any>(null);
  const [footerVisible, setFooterVisible] = useState(true);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // Detectar si la app ya está instalada (PWA)
  useEffect(() => {
    const checkInstalled = () => {
      // iOS
      const isInStandaloneMode = () =>
        'standalone' in window.navigator && (window.navigator as any).standalone;
      // Android/otros
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      setIsAppInstalled(isInStandaloneMode() || isPWA);
    };
    checkInstalled();
    window.addEventListener('appinstalled', checkInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);
    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  // Detectar si es móvil
  const isMobile = /android|iphone|ipad|ipod|opera mini|iemobile|mobile/i.test(navigator.userAgent);

  useEffect(() => {
    try {
      localStorage.setItem('izanagi_state', JSON.stringify(state));
    } catch (error) {
      console.error("Failed to save state to localStorage", error);
    }
  }, [state]);

  const showNotification = useCallback((title: string, message: string, isError = false) => {
    setNotification({ title, message, isError, visible: true });
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, visible: false } : null);
    }, 3500);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('izanagi_user');
  }, []);

  const handleLoginSuccess = (worker: Worker) => {
    setCurrentUser(worker);
    localStorage.setItem('izanagi_user', JSON.stringify(worker));
    showNotification('¡Bienvenido!', `Has iniciado sesión como ${worker.name}.`);
  };
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement;
    const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';

    const shortcutMap: { [key: string]: Page } = {
        'F1': Page.POS,
        'F2': Page.Purchases,
        'F3': Page.Inventory,
        'F4': Page.Reports,
        'F5': Page.Payroll,
        'F6': Page.Workers,
        'F7': Page.AI,
    };

    if (shortcutMap[e.key] && !isInputFocused) {
        e.preventDefault();
        // setActivePage(shortcutMap[e.key]); // REMOVED
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const contextValue = useMemo(() => ({
    state,
    setState,
    showNotification,
    // setActivePage, // REMOVED
    currentUser,
    logout: handleLogout,
  }), [state, showNotification, currentUser, handleLogout]);

  // Banner de instalación PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        setShowInstallBanner(false);
        deferredPrompt.current = null;
      }
    } else {
      alert('La instalación no está disponible en este momento. Intenta refrescar la página o usa el menú del navegador.');
    }
  };

  // Footer flotante y ocultable en móvil
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth <= 640) {
        setFooterVisible(false);
        clearTimeout((window as any)._footerTimeout);
        (window as any)._footerTimeout = setTimeout(() => setFooterVisible(true), 1200);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!currentUser) {
    return (
      <DataContext.Provider value={contextValue}>
        <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
          <LoginPage onLoginSuccess={handleLoginSuccess} />
        </Suspense>
      </DataContext.Provider>
    );
  }

  return (
    <BrowserRouter>
      {/* Banner de instalación PWA solo en móvil y si no está instalada */}
      {isMobile && !isAppInstalled && showInstallBanner && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 animate-fade-in" style={{maxWidth:'95vw'}}>
          <span className="text-lg font-semibold"><i className="fas fa-download mr-2"/>Instala Izanagi en tu móvil</span>
          <button
            className="ml-4 px-4 py-2 rounded-lg bg-accent text-primary font-bold shadow hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleInstallClick}
            disabled={!deferredPrompt.current}
          >
            Instalar
          </button>
          <button className="ml-2 text-white/80 hover:text-white text-xl" aria-label="Cerrar" onClick={()=>setShowInstallBanner(false)}>&times;</button>
          {!deferredPrompt.current && (
            <span className="ml-4 text-xs text-accent bg-black/30 px-2 py-1 rounded">La instalación no está disponible en este momento. Intenta refrescar la página o usa el menú del navegador.</span>
          )}
        </div>
      )}
      <AppRoutes
        state={state}
        setState={setState}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        notification={notification}
        setNotification={setNotification}
        showNotification={showNotification}
        handleLogout={handleLogout}
        showInstallBanner={showInstallBanner}
        setShowInstallBanner={setShowInstallBanner}
        deferredPrompt={deferredPrompt}
        footerVisible={footerVisible}
        setFooterVisible={setFooterVisible}
        handleInstallClick={handleInstallClick}
      />
    </BrowserRouter>
  );
};

export default App;
