import React, { useState, useRef, useEffect } from 'react';
import { Button, Icon } from './ui';
import { useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'POS', icon: 'fa-cash-register', page: 'POS', path: '/' },
  { label: 'Compras', icon: 'fa-shopping-bag', page: 'Purchases', path: '/compras' },
  { label: 'Inventario', icon: 'fa-boxes', page: 'Inventory', path: '/inventario' },
  { label: 'Reportes', icon: 'fa-chart-line', page: 'Reports', path: '/reportes' },
  { label: 'Nómina', icon: 'fa-money-check-alt', page: 'Payroll', path: '/nomina' },
  { label: 'Trabajadores', icon: 'fa-users', page: 'Workers', path: '/trabajadores' },
  { label: 'AI', icon: 'fa-robot', page: 'AI', path: '/ai' },
  { label: 'Configuración', icon: 'fa-cog', page: 'Config', path: '/config' },
];

interface MobileNavDrawerProps {
  activePage: string;
  setActivePage: (page: string) => void;
  currentUser: { name: string; role: string } | null;
  onLogout: () => void;
}

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ activePage, setActivePage, currentUser, onLogout }) => {
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLButtonElement>(null);
  const prevBodyOverflow = useRef<string | null>(null);
  const navigate = useNavigate();

  // Cerrar con Escape o tap fuera, focus management, evitar scroll fondo
  useEffect(() => {
    if (open) {
      // Focus primer link
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 100);
      // Evitar scroll fondo
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar scroll
      if (prevBodyOverflow.current !== null) {
        document.body.style.overflow = prevBodyOverflow.current;
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.addEventListener('mousedown', handleClick);
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      if (!open && prevBodyOverflow.current !== null) {
        document.body.style.overflow = prevBodyOverflow.current;
      }
    };
  }, [open]);

  // Feedback táctil (ripple simple)
  const handleButtonTouch = (e: React.TouchEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    btn.classList.add('touch-feedback');
    setTimeout(() => btn.classList.remove('touch-feedback'), 200);
  };

  // Navegación segura: cambiar página y cerrar drawer
  const handleNavClick = (page: string, path: string) => {
    setOpen(false);
    setTimeout(() => {
      if (page !== activePage) {
        setActivePage(page);
        navigate(path);
      }
    }, 200); // Espera a que drawer cierre antes de cambiar página
  };

  return (
    <>
      {/* Botón hamburguesa fijo */}
      <Button
        variant="icon"
        icon={open ? 'fa-times' : 'fa-bars'}
        className="fixed top-3 left-3 z-50 bg-primary text-white shadow-lg lg:hidden focus:ring-2 focus:ring-accent w-12 h-12 sm:w-14 sm:h-14 transition-all duration-200"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(o => !o)}
      />
      {/* Fondo semitransparente */}
      {open && (
        <div className="fixed inset-0 bg-black/80 z-40 transition-opacity animate-fade-in" aria-label="Fondo del menú" />
      )}
      {/* Drawer lateral */}
      <nav
        ref={drawerRef}
        id="mobile-drawer"
        className={`fixed top-0 left-0 h-full w-64 sm:w-72 max-w-[90vw] bg-dark-card/95 shadow-2xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'} lg:hidden flex flex-col outline-none`}
        aria-label="Menú principal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 pt-6 sm:pt-8 flex-1">
          {currentUser && (
            <div className="mb-2 sm:mb-4 flex items-center gap-2 sm:gap-3">
              <Icon name="fa-user-circle" className="text-3xl sm:text-4xl text-accent" />
              <div className="truncate">
                <div className="font-bold text-white text-base sm:text-lg truncate">{currentUser.name}</div>
                <div className="text-xs sm:text-sm text-gray-400 truncate">{currentUser.role}</div>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-1 sm:gap-2">
            {NAV_LINKS.map((link, i) => (
              <li key={link.page}>
                <button
                  ref={i === 0 ? firstLinkRef : undefined}
                  className={`w-full flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-2xl text-base sm:text-lg md:text-xl font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent active:scale-97 touch-manipulation ${activePage === link.page ? 'bg-white text-primary shadow-lg' : 'bg-black/10 text-white'} no-hover truncate`}
                  onClick={() => handleNavClick(link.page, link.path)}
                  aria-current={activePage === link.page ? 'page' : undefined}
                  onTouchStart={handleButtonTouch}
                >
                  <Icon name={link.icon} className="text-xl sm:text-2xl" />
                  <span className="truncate whitespace-nowrap overflow-hidden">{link.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-4">
            <Button variant="danger" icon="fa-sign-out-alt" className="w-full py-3 sm:py-4 text-base sm:text-lg rounded-2xl" onClick={() => { setOpen(false); onLogout(); }} onTouchStart={handleButtonTouch}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </nav>
      {/* Estilos para feedback táctil y eliminar hover en móvil */}
      <style>{`
        .touch-feedback {
          background: rgba(255,255,255,0.12) !important;
          transition: background 0.2s;
        }
        @media (hover: none) {
          .no-hover:hover {
            background: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNavDrawer; 