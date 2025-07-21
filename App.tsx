
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Page, AppState, Category, Product, SaleReport, SaleItem, Worker, AuditReport, TransactionLogEntry } from './types';
import { PAGES } from './constants';
import { getInitialState } from './state';
import { DataContext } from './context';
import PosPage from './pages/PosPage';
import InventoryPage from './pages/InventoryPage';
import ReportsPage from './pages/ReportsPage';
import ConfigPage from './pages/ConfigPage';
import PurchasesPage from './pages/PurchasesPage';
import WorkersPage from './pages/WorkersPage';
import AIAssistantPage from './pages/AIAssistantPage';
import LoginPage from './pages/LoginPage';
import { PayrollPage } from './pages/PayrollPage';
import { Button, Icon } from './components/ui';

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


const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>(Page.POS);
  const [state, setState] = useState<AppState>(loadAndMigrateState);
  const [currentUser, setCurrentUser] = useState<Worker | null>(null);
  const [notification, setNotification] = useState<{ title: string; message: string; isError: boolean; visible: boolean } | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
  }, []);

  const handleLoginSuccess = (worker: Worker) => {
    setCurrentUser(worker);
    setActivePage(Page.POS); // Default page after login
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
        setActivePage(shortcutMap[e.key]);
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
    setActivePage,
    currentUser,
    logout: handleLogout,
  }), [state, showNotification, setActivePage, currentUser, handleLogout]);

  const renderPage = () => {
    switch (activePage) {
      case Page.POS: return <PosPage />;
      case Page.Purchases: return <PurchasesPage />;
      case Page.Inventory: return <InventoryPage />;
      case Page.Reports: return <ReportsPage />;
      case Page.Payroll: return <PayrollPage />;
      case Page.Workers: return <WorkersPage />;
      case Page.AI: return <AIAssistantPage />;
      case Page.Config: return <ConfigPage />;
      default: return <PosPage />;
    }
  };

  if (!currentUser) {
    return (
      <DataContext.Provider value={contextValue}>
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      </DataContext.Provider>
    );
  }

  return (
    <DataContext.Provider value={contextValue}>
      <div className="flex flex-col min-h-screen bg-dark-bg">
        <header className="bg-primary shadow-lg sticky top-0 z-40 p-4 lg:px-6 lg:py-0 lg:h-auto lg:min-h-[70px] flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-0">
          <div className="flex items-center gap-4">
            <Icon name="fa-cash-register" className="text-accent text-3xl" />
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-white">
                Sistema Izanagi <span className="text-xs bg-accent text-white font-bold py-1 px-2 rounded-full ml-1">CUP</span>
              </h1>
              <span className="text-xs mt-1 text-accent/80 italic font-medium drop-shadow-sm" style={{letterSpacing: '0.5px'}}>Creado por Isarias</span>
            </div>
          </div>
          {/* Botón hamburguesa solo en móvil */}
          <button className="lg:hidden flex items-center px-3 py-2 border rounded text-accent border-accent focus:outline-none" onClick={() => setDrawerOpen(true)} aria-label="Abrir menú">
            <span className="sr-only">Abrir menú</span>
            <svg className="fill-current h-6 w-6" viewBox="0 0 20 20"><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
          </button>
          {/* Menú de navegación normal en desktop */}
          <div className="hidden lg:flex items-center gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-white bg-black/20 px-4 py-2 rounded-lg">
                      <Icon name="fa-wallet" className="text-accent text-lg" />
                      <div>
                          <span className="text-xs text-gray-400 block">Saldo Inversión</span>
                          <span className="font-semibold text-base">{state.investmentBalance.toFixed(2)} CUP</span>
                      </div>
                  </div>
                   <div className="flex items-center gap-3 text-white bg-black/20 px-4 py-2 rounded-lg">
                      <Icon name="fa-users" className="text-accent text-lg" />
                      <div>
                          <span className="text-xs text-gray-400 block">Fondo de Pago</span>
                          <span className="font-semibold text-base">{state.workerPayoutBalance.toFixed(2)} CUP</span>
                      </div>
                  </div>
              </div>

              {currentUser && (
                <div className="flex items-center gap-3 bg-black/20 px-4 py-2 rounded-lg">
                    <Icon name="fa-user-circle" className="text-accent text-xl" />
                    <div>
                        <span className="text-xs text-gray-400 block">{currentUser.role}</span>
                        <span className="font-semibold text-base">{currentUser.name}</span>
                    </div>
                    <Button variant="icon" className="bg-danger/30 hover:bg-danger/60 !w-9 !h-9" onClick={handleLogout} title="Cerrar Sesión">
                        <Icon name="fa-sign-out-alt" />
                    </Button>
                </div>
              )}

              <nav>
                <ul className="flex flex-wrap justify-center items-center gap-2">
                  {PAGES.map(({ id, label, icon, shortcut }) => (
                    <li key={id}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActivePage(id); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${activePage === id ? 'bg-black/20 text-white' : 'text-gray-300 hover:bg-black/20 hover:text-white'}`}
                      >
                        <Icon name={icon} />
                        {label}
                        {shortcut && <small className="hidden md:inline text-gray-400">({shortcut})</small>}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
          </div>
        </header>
        {/* Drawer lateral para móvil */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="bg-primary w-64 max-w-[80vw] h-full shadow-2xl flex flex-col p-6 gap-6 animate-slide-in">
              <button className="self-end text-accent text-2xl mb-4" onClick={() => setDrawerOpen(false)} aria-label="Cerrar menú">&times;</button>
              <nav>
                <ul className="flex flex-col gap-4">
                  {PAGES.map(({ id, label, icon, shortcut }) => (
                    <li key={id}>
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); setActivePage(id); setDrawerOpen(false); }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-lg transition-colors duration-200 ${activePage === id ? 'bg-accent/80 text-primary' : 'text-white hover:bg-accent/30 hover:text-primary'}`}
                      >
                        <Icon name={icon} />
                        {label}
                        {shortcut && <small className="ml-2 text-gray-400">({shortcut})</small>}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <style>{`
              @keyframes slide-in {
                from { transform: translateX(-100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
              }
              .animate-slide-in { animation: slide-in 0.3s cubic-bezier(.4,0,.2,1) forwards; }
            `}</style>
          </div>
        )}
        <main className="flex-1 p-2 sm:p-4 lg:p-8 max-w-screen-2xl w-full mx-auto space-y-4">
          {renderPage()}
        </main>
        
        {notification?.visible && (
            <div className={`fixed top-24 right-5 w-80 rounded-lg shadow-2xl p-4 text-white z-50 transition-transform duration-300 transform ${notification.visible ? 'translate-x-0' : 'translate-x-full'} bg-dark-card backdrop-blur-lg border-l-4 ${notification.isError ? 'border-danger' : 'border-success'}`}>
                <p className="font-bold">{notification.title}</p>
                <p className="text-sm text-gray-300">{notification.message}</p>
            </div>
        )}

        <footer className="bg-primary text-center p-4 text-sm text-gray-400">
          <p>Sistema de Ventas Izanagi v8.2 (Estable) &copy; {new Date().getFullYear()} - Todos los datos se guardan en su navegador.</p>
        </footer>
      </div>
    </DataContext.Provider>
  );
};

export default App;
