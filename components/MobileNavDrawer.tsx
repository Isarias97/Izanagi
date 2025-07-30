import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Button, Icon } from './ui';
import { useNavigate, useLocation } from 'react-router-dom';

// Configuración de navegación
const NAV_LINKS = [
  { label: 'POS', icon: 'fa-cash-register', page: 'POS', path: '/' },
  { label: 'Compras', icon: 'fa-shopping-bag', page: 'Purchases', path: '/compras' },
  { label: 'Inventario', icon: 'fa-boxes', page: 'Inventory', path: '/inventario' },
  { label: 'Reportes', icon: 'fa-chart-line', page: 'Reports', path: '/reportes' },
  { label: 'Nómina', icon: 'fa-money-check-alt', page: 'Payroll', path: '/nomina' },
  { label: 'Trabajadores', icon: 'fa-users', page: 'Workers', path: '/trabajadores' },
  { label: 'AI', icon: 'fa-robot', page: 'AI', path: '/ai' },
  { label: 'Deudas', icon: 'fa-credit-card', page: 'Debts', path: '/deudas' },
  { label: 'Configuración', icon: 'fa-cog', page: 'Config', path: '/config' },
];

interface MobileNavDrawerProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: { name: string; role: string } | null;
  onLogout: () => void;
}

// Componente de enlace de navegación memoizado
const NavLink: React.FC<{
  link: typeof NAV_LINKS[0];
  isActive: boolean;
  onClick: (page: string, path: string) => void;
  onTouchStart: (e: React.TouchEvent<HTMLButtonElement>) => void;
  isFirst: boolean;
}> = React.memo(({ link, isActive, onClick, onTouchStart, isFirst }) => (
  <li>
    <button
      ref={isFirst ? undefined : undefined}
      className={`
        w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-semibold 
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent 
        active:scale-95 touch-manipulation select-none
        ${isActive 
          ? 'bg-white text-primary shadow-lg transform scale-105' 
          : 'bg-black/10 text-white hover:bg-black/20'
        }
      `}
      onClick={() => onClick(link.page, link.path)}
      aria-current={isActive ? 'page' : undefined}
      onTouchStart={onTouchStart}
      aria-label={`Ir a ${link.label}`}
    >
      <Icon 
        name={link.icon} 
        className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} 
      />
      <span className="truncate whitespace-nowrap overflow-hidden">{link.label}</span>
      {isActive && (
        <div className="ml-auto w-2 h-2 bg-primary rounded-full animate-pulse" />
      )}
    </button>
  </li>
));

// Componente de información del usuario memoizado
const UserInfo: React.FC<{ currentUser: { name: string; role: string } }> = React.memo(({ currentUser }) => (
  <div className="mb-6 flex items-center gap-3 p-4 bg-black/20 rounded-2xl">
    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
      <Icon name="fa-user-circle" className="text-2xl text-accent" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-white text-lg truncate">{currentUser.name}</div>
      <div className="text-sm text-gray-400 truncate">{currentUser.role}</div>
    </div>
  </div>
));

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ 
  activePage, 
  setActivePage, 
  currentUser, 
  onLogout 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLButtonElement>(null);
  const prevBodyOverflow = useRef<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Sincronizar con la ubicación actual
  useEffect(() => {
    const currentPath = location.pathname;
    const currentPage = NAV_LINKS.find(link => link.path === currentPath)?.page || 'POS';
    if (currentPage !== activePage) {
      setActivePage(currentPage);
    }
  }, [location.pathname, activePage, setActivePage]);

  // Manejo de teclado y clics fuera del drawer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleTouchOutside = (e: TouchEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleTouchOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [isOpen]);

  // Manejo del scroll del body
  useEffect(() => {
    if (isOpen) {
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      if (prevBodyOverflow.current !== null) {
        document.body.style.overflow = prevBodyOverflow.current;
      }
    }

    return () => {
      if (prevBodyOverflow.current !== null) {
        document.body.style.overflow = prevBodyOverflow.current;
      }
    };
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  // Handlers memoizados
  const handleOpen = useCallback(() => {
    setIsAnimating(true);
    setIsOpen(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(true);
    setIsOpen(false);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [isOpen, handleOpen, handleClose]);

  // Feedback táctil mejorado
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.classList.add('touch-feedback');
    setTimeout(() => btn.classList.remove('touch-feedback'), 200);
  }, []);

  // Navegación optimizada
  const handleNavClick = useCallback((page: string, path: string) => {
    if (page === activePage) {
      handleClose();
      return;
    }

    handleClose();
    
    // Navegar después de que se cierre la animación
    setTimeout(() => {
      setActivePage(page);
      navigate(path);
    }, 200);
  }, [activePage, setActivePage, navigate, handleClose]);

  // Logout optimizado
  const handleLogout = useCallback(() => {
    handleClose();
    setTimeout(() => {
      onLogout();
    }, 200);
  }, [onLogout, handleClose]);

  // Memoizar el estado activo
  const activeLink = useMemo(() => 
    NAV_LINKS.find(link => link.page === activePage), 
    [activePage]
  );

  return (
    <>
      {/* Botón hamburguesa fijo */}
      <Button
        variant="icon"
        className={`
          fixed top-3 left-3 z-50 bg-primary text-white shadow-2xl 
          lg:hidden focus:ring-2 focus:ring-accent w-12 h-12 
          transition-all duration-300 flex items-center justify-center
          hover:bg-primary/90 active:scale-95
          ${isOpen ? 'rotate-90' : ''}
        `}
        aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={isOpen}
        aria-controls="mobile-drawer"
        onClick={handleToggle}
        disabled={isAnimating}
      >
        {isOpen ? (
          <Icon name="fa-times" className="text-xl" />
        ) : (
          <Icon name="fa-bars" className="text-xl" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div
          ref={backdropRef}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          aria-hidden="true"
          onClick={handleClose}
        />
      )}

      {/* Drawer lateral */}
      <nav
        ref={drawerRef}
        id="mobile-drawer"
        className={`
          fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-gradient-to-b from-dark-card to-dark-card/95 
          shadow-2xl z-50 transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:hidden flex flex-col outline-none border-r border-accent/20
        `}
        aria-label="Menú principal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Header del drawer */}
        <div className="p-6 border-b border-accent/20">
          <div className="flex items-center gap-3">
            <Icon name="fa-cash-register" className="text-2xl text-accent" />
            <div>
              <h2 className="text-lg font-bold text-white">Izanagi</h2>
              <p className="text-sm text-gray-400">Sistema de Ventas</p>
            </div>
          </div>
        </div>

        {/* Contenido del drawer */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {/* Información del usuario */}
          {currentUser && <UserInfo currentUser={currentUser} />}

          {/* Enlaces de navegación */}
          <nav aria-label="Navegación principal">
            <ul className="space-y-2">
              {NAV_LINKS.map((link, index) => (
                <NavLink
                  key={link.page}
                  link={link}
                  isActive={activePage === link.page}
                  onClick={handleNavClick}
                  onTouchStart={handleTouchStart}
                  isFirst={index === 0}
                />
              ))}
            </ul>
          </nav>

          {/* Botón de logout */}
          <div className="mt-auto pt-6">
            <Button
              variant="danger"
              icon="fa-sign-out-alt"
              className="w-full py-4 text-base rounded-2xl shadow-lg hover:bg-danger/90 active:scale-95"
              onClick={handleLogout}
              onTouchStart={handleTouchStart}
              disabled={isAnimating}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Estilos para feedback táctil */}
      <style>{`
        .touch-feedback {
          background: rgba(255,255,255,0.15) !important;
          transform: scale(0.98) !important;
          transition: all 0.2s ease !important;
        }
        
        @media (hover: none) {
          .hover\\:bg-black\\/20:hover {
            background: rgba(0,0,0,0.1) !important;
          }
        }
        
        /* Scrollbar personalizado */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </>
  );
};

export default React.memo(MobileNavDrawer); 