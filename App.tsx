
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Page, AppState, Category, Product, SaleReport, SaleItem, Worker, AuditReport, TransactionLogEntry } from './types';
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
import { Icon } from './components/ui';
import MobileNavDrawer from './components/MobileNavDrawer';

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
        <header className="bg-primary shadow-lg sticky top-0 z-40 p-2 flex flex-row items-center justify-between gap-2 min-h-[56px]">
          <MobileNavDrawer
            activePage={activePage}
            setActivePage={(page: string) => {
              if (page !== activePage) setActivePage(page as Page);
            }}
            currentUser={currentUser ? { name: currentUser.name, role: currentUser.role } : null}
            onLogout={handleLogout}
          />
          {/* Logo y título */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Icon name="fa-cash-register" className="text-accent text-xl flex-shrink-0" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-semibold text-white truncate">
                Izanagi <span className="text-xs bg-accent text-primary font-bold py-0.5 px-2 rounded-full ml-1">CUP</span>
              </h1>
              <span className="text-[10px] mt-0.5 text-accent/80 italic font-medium drop-shadow-sm hidden sm:block" style={{letterSpacing: '0.5px'}}>by Isarias</span>
            </div>
          </div>
          {/* Info usuario y saldos en móvil */}
          <div className="flex flex-col items-end gap-0.5 text-right flex-shrink-0 min-w-[110px]">
            <div className="flex items-center gap-1">
              <Icon name="fa-wallet" className="text-accent text-base" />
              <span className="text-[11px] text-white font-bold">{state.investmentBalance.toFixed(2)} CUP</span>
            </div>
            <div className="flex items-center gap-1">
              <Icon name="fa-users" className="text-accent text-base" />
              <span className="text-[11px] text-white font-bold">{state.workerPayoutBalance.toFixed(2)} CUP</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Icon name="fa-user-circle" className="text-accent text-sm" />
              <span className="text-[11px] text-white font-semibold truncate max-w-[60px]">{currentUser?.name}</span>
              <span className="text-[9px] text-gray-300 font-medium">{currentUser?.role}</span>
            </div>
          </div>
        </header>
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
