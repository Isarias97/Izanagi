import React, { useState, useRef, useEffect } from 'react';
import { Button, Icon } from './ui';

const NAV_LINKS = [
  { label: 'POS', icon: 'fa-cash-register', page: 'POS' },
  { label: 'Compras', icon: 'fa-shopping-bag', page: 'Purchases' },
  { label: 'Inventario', icon: 'fa-boxes', page: 'Inventory' },
  { label: 'Reportes', icon: 'fa-chart-line', page: 'Reports' },
  { label: 'Nómina', icon: 'fa-money-check-alt', page: 'Payroll' },
  { label: 'Trabajadores', icon: 'fa-users', page: 'Workers' },
  { label: 'AI', icon: 'fa-robot', page: 'AI' },
  { label: 'Configuración', icon: 'fa-cog', page: 'Config' },
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

  return (
    <>
      {/* Botón hamburguesa fijo */}
      <Button
        variant="icon"
        icon={open ? 'fa-times' : 'fa-bars'}
        className="fixed top-4 left-4 z-50 bg-primary text-white shadow-lg lg:hidden focus:ring-2 focus:ring-accent"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        aria-controls="mobile-drawer"
        onClick={() => setOpen(o => !o)}
      />
      {/* Fondo semitransparente */}
      {open && (
        <div className="fixed inset-0 bg-black/60 z-40 transition-opacity animate-fade-in" aria-label="Fondo del menú" />
      )}
      {/* Drawer lateral */}
      <nav
        ref={drawerRef}
        id="mobile-drawer"
        className={`fixed top-0 left-0 h-full w-72 max-w-[90vw] bg-dark-card shadow-2xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${open ? 'translate-x-0' : '-translate-x-full'} lg:hidden flex flex-col outline-none`}
        aria-label="Menú principal"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        <div className="flex flex-col gap-6 p-6 pt-8 flex-1">
          {currentUser && (
            <div className="mb-4 flex items-center gap-3">
              <Icon name="fa-user-circle" className="text-3xl text-accent" />
              <div>
                <div className="font-bold text-white text-lg">{currentUser.name}</div>
                <div className="text-xs text-gray-400">{currentUser.role}</div>
              </div>
            </div>
          )}
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link, i) => (
              <li key={link.page}>
                <button
                  ref={i === 0 ? firstLinkRef : undefined}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent active:scale-95 touch-manipulation ${activePage === link.page ? 'bg-accent text-primary' : 'text-white'} no-hover`}
                  onClick={() => { setActivePage(link.page); setOpen(false); }}
                  aria-current={activePage === link.page ? 'page' : undefined}
                  onTouchStart={handleButtonTouch}
                >
                  <Icon name={link.icon} className="text-xl" />
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-8">
            <Button variant="danger" icon="fa-sign-out-alt" className="w-full" onClick={() => { setOpen(false); onLogout(); }} onTouchStart={handleButtonTouch}>
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