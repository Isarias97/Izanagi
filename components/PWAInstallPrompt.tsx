import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context';
import { Button, Icon, Modal } from './ui';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAInstallPrompt: React.FC = () => {
  const { showNotification } = useContext(DataContext);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Verificar si ya está instalada
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInApp = window.navigator.standalone === true;
      setIsInstalled(isStandalone || isInApp);
    };

    checkIfInstalled();

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar notificación automática después de 5 segundos
      setTimeout(() => {
        if (!isInstalled && deferredPrompt) {
          setShowModal(true);
        }
      }, 5000);
    };

    // Escuchar el evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showNotification('¡Éxito!', 'Sistema Izanagi se ha instalado correctamente en tu dispositivo.', false);
    };

    // Escuchar cambios en el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkIfInstalled();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [deferredPrompt, isInstalled, showNotification]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showNotification('Error', 'No se puede instalar la aplicación en este momento.', true);
      return;
    }

    setIsInstalling(true);
    try {
      // Mostrar el prompt de instalación
      await deferredPrompt.prompt();
      
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Usuario aceptó la instalación');
        setIsInstalled(true);
        showNotification('¡Éxito!', 'Sistema Izanagi se está instalando...', false);
      } else {
        console.log('Usuario rechazó la instalación');
        showNotification('Información', 'Puedes instalar la aplicación más tarde desde el menú del navegador.', false);
      }
    } catch (error) {
      console.error('Error durante la instalación:', error);
      showNotification('Error', 'Ocurrió un error durante la instalación. Inténtalo de nuevo.', true);
    } finally {
      setIsInstalling(false);
      setDeferredPrompt(null);
      setShowModal(false);
    }
  };

  const handleManualInstall = () => {
    setShowModal(true);
  };

  const getInstallInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return {
        title: 'Instalar en Android',
        steps: [
          'Toca el botón "Menú" (⋮) en Chrome',
          'Selecciona "Instalar aplicación"',
          'Confirma la instalación',
          '¡Listo! La app aparecerá en tu pantalla de inicio'
        ]
      };
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return {
        title: 'Instalar en iOS',
        steps: [
          'Toca el botón "Compartir" (□↑) en Safari',
          'Desplázate y selecciona "Añadir a pantalla de inicio"',
          'Toca "Añadir"',
          '¡Listo! La app aparecerá en tu pantalla de inicio'
        ]
      };
    } else {
      return {
        title: 'Instalar en Escritorio',
        steps: [
          'Haz clic en el ícono de instalación en la barra de direcciones',
          'Selecciona "Instalar"',
          'Confirma la instalación',
          '¡Listo! La app se abrirá en una ventana separada'
        ]
      };
    }
  };

  // No mostrar nada si ya está instalada o no hay prompt disponible
  if (isInstalled || !deferredPrompt) {
    return null;
  }

  return (
    <>
      {/* Botón flotante de instalación */}
      <div className="fixed top-4 right-4 z-50">
        <Button
          variant="primary"
          icon="fa-download"
          onClick={handleManualInstall}
          className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse"
        >
          <Icon name="fa-mobile-alt" />
          Instalar App
        </Button>
      </div>

      {/* Modal de instalación */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Instalar Sistema Izanagi"
        size="md"
      >
        <div className="space-y-6">
          {/* Información de la app */}
          <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-4 rounded-lg border border-primary/30">
            <div className="flex items-center gap-4">
              <img src="/icon-192.png" alt="Izanagi" className="w-16 h-16 rounded-lg" />
              <div>
                <h3 className="text-lg font-bold text-white">Sistema Izanagi</h3>
                <p className="text-sm text-gray-300">
                  Gestión comercial completa con experiencia nativa
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Icon name="fa-star" className="text-yellow-400 text-sm" />
                  <span className="text-xs text-gray-400">Optimizado para móviles</span>
                </div>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Beneficios de instalar:</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2 text-sm">
                <Icon name="fa-rocket" className="text-success" />
                <span>Acceso rápido desde la pantalla de inicio</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="fa-wifi" className="text-success" />
                <span>Funciona offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="fa-mobile-alt" className="text-success" />
                <span>Experiencia nativa en móviles</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Icon name="fa-bell" className="text-success" />
                <span>Notificaciones push</span>
              </div>
            </div>
          </div>

          {/* Instrucciones de instalación */}
          <div className="space-y-3">
            <h4 className="font-semibold text-white">{getInstallInstructions().title}:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
              {getInstallInstructions().steps.map((step, index) => (
                <li key={index} className="pl-2">{step}</li>
              ))}
            </ol>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="primary"
              icon="fa-download"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1"
            >
              {isInstalling ? (
                <>
                  <Icon name="fa-spinner fa-spin" />
                  Instalando...
                </>
              ) : (
                <>
                  <Icon name="fa-download" />
                  Instalar Ahora
                </>
              )}
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600"
            >
              <Icon name="fa-times" />
              Más Tarde
            </Button>
          </div>

          {/* Información adicional */}
          <div className="text-xs text-gray-400 text-center pt-4 border-t border-slate-700">
            <p>
              La aplicación se instalará automáticamente y aparecerá en tu pantalla de inicio.
              Puedes desinstalarla desde la configuración de tu dispositivo en cualquier momento.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PWAInstallPrompt; 