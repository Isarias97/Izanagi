
import React, { useState, useContext, useRef, useEffect } from 'react';
import { DataContext } from '../context';
import { getInitialState } from '../state';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Icon } from '../components/ui';
import { AppState, Category, Product, TransactionLogEntry } from '../types';
import Modal from '../components/Modal';

const ConfigPage: React.FC = () => {
  const { state, setState, showNotification } = useContext(DataContext);
  
  const [formState, setFormState] = useState({
    mlcToCup: String(state.config.exchangeRates.mlcToCup),
    usdToCup: String(state.config.exchangeRates.usdToCup),
    itemsPerPage: String(state.config.inventory.itemsPerPage),
  });
  
  const [balanceInput, setBalanceInput] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Sync local form state when global state changes (e.g., after import)
  useEffect(() => {
    setFormState({
      mlcToCup: String(state.config.exchangeRates.mlcToCup),
      usdToCup: String(state.config.exchangeRates.usdToCup),
      itemsPerPage: String(state.config.inventory.itemsPerPage),
    });
  }, [state.config]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = () => {
    setSaveStatus('saving');

    const mlc = parseFloat(formState.mlcToCup);
    const usd = parseFloat(formState.usdToCup);
    const items = parseInt(formState.itemsPerPage, 10);

    if (isNaN(mlc) || mlc < 0) {
      showNotification('Error', 'La tasa de cambio MLC debe ser un número válido.', true);
      setSaveStatus('idle');
      return;
    }
    if (isNaN(usd) || usd < 0) {
        showNotification('Error', 'La tasa de cambio USD debe ser un número válido.', true);
        setSaveStatus('idle');
        return;
    }
    if (isNaN(items) || items <= 0) {
      showNotification('Error', 'El número de productos por página debe ser un entero positivo.', true);
      setSaveStatus('idle');
      return;
    }

    setTimeout(() => {
        setState(prev => ({
          ...prev,
          config: {
            exchangeRates: { mlcToCup: mlc, usdToCup: usd },
            inventory: { itemsPerPage: items },
          },
        }));
        showNotification('Éxito', 'Configuración guardada correctamente.');
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleUpdateBalance = () => {
    const newBalance = parseFloat(balanceInput);
    if (isNaN(newBalance) || newBalance < 0) {
      showNotification('Error', 'El saldo debe ser un número válido y positivo.', true);
      return;
    }
    setState(prev => {
      const changeAmount = newBalance - prev.investmentBalance;
      const nextLogId = (prev.transactionLog.length > 0 ? Math.max(...prev.transactionLog.map(t => t.id)) : 0) + 1;
      const newLogEntry: TransactionLogEntry = {
        id: nextLogId,
        date: new Date().toISOString(),
        type: 'MANUAL_UPDATE',
        description: `Ajuste manual de saldo de inversión.`,
        amount: changeAmount,
        investmentBalanceAfter: newBalance,
        workerPayoutBalanceAfter: prev.workerPayoutBalance, // Unchanged
      };

      return {
        ...prev,
        investmentBalance: newBalance,
        transactionLog: [...prev.transactionLog, newLogEntry]
      };
    });
    showNotification('Éxito', `Saldo de inversión actualizado a ${newBalance.toFixed(2)} CUP.`);
    setBalanceInput('');
  };

  const handleExportData = () => {
    try {
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `izanagi_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showNotification('Éxito', 'Datos exportados correctamente.');
    } catch (error) {
        showNotification('Error', 'No se pudieron exportar los datos.', true);
        console.error(error);
    }
  };

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };
  
  const confirmImport = () => {
    setIsImportModalOpen(false);
    importFileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const result = e.target?.result;
            if (typeof result !== 'string') throw new Error('File could not be read');
            
            const importedData = JSON.parse(result) as Partial<AppState>;
            const initialState = getInitialState();

            const importedState: AppState = {
                ...initialState,
                ...importedData,
                products: (importedData.products ?? initialState.products).map((p: Product) => ({
                    ...p,
                    costPrice: p.costPrice ?? 0,
                })),
                categories: (importedData.categories ?? initialState.categories).map((c: Category) => ({...c, icon: c.icon || '📦' })),
                reports: importedData.reports ?? initialState.reports,
                purchases: importedData.purchases ?? initialState.purchases,
                investmentBalance: importedData.investmentBalance ?? initialState.investmentBalance,
                workerPayoutBalance: importedData.workerPayoutBalance ?? initialState.workerPayoutBalance,
                transactionLog: importedData.transactionLog ?? initialState.transactionLog,
                workers: importedData.workers ?? initialState.workers,
                auditReports: importedData.auditReports ?? initialState.auditReports,
                payrollReports: importedData.payrollReports ?? initialState.payrollReports,
                config: {
                    ...initialState.config,
                    ...(importedData.config ?? {}),
                    exchangeRates: {
                        ...initialState.config.exchangeRates,
                        ...(importedData.config?.exchangeRates ?? {})
                    },
                    inventory: {
                        ...initialState.config.inventory,
                        ...(importedData.config?.inventory ?? {})
                    }
                },
            };

            setState(importedState);
            showNotification('Éxito', 'Datos importados correctamente.');
        } catch (error: any) {
            showNotification('Error', error.message || 'El archivo de respaldo es inválido o está corrupto.', true);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
  };
  
  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };
  
  const confirmReset = () => {
    setIsResetModalOpen(false);
    try {
      localStorage.removeItem('izanagi_state');
      window.location.reload();
    } catch (error) {
      console.error("Failed to reset data:", error);
      showNotification('Error', 'No se pudo restablecer el sistema. Revise los permisos del navegador.', true);
    }
  };
  
  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving': return { text: 'Guardando...', icon: 'fa-spinner fa-spin' };
      case 'saved': return { text: '¡Guardado!', icon: 'fa-check-circle' };
      default: return { text: 'Guardar Cambios', icon: 'fa-save' };
    }
  };
  const saveButtonContent = getSaveButtonContent();

  return (
    <>
      <Card>
        <CardHeader icon="fa-cog">Configuración y Administración</CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                  <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="fa-sliders-h" /> Configuración General</h3>
                      
                      <InputGroup label="Tasa MLC a CUP (1 MLC = X CUP)">
                          <Input name="mlcToCup" type="number" value={formState.mlcToCup} onChange={handleFormChange} step="0.01" min="0" placeholder="Ej: 235.00" />
                      </InputGroup>
                      
                      <InputGroup label="Tasa USD a CUP (1 USD = X CUP)">
                          <Input name="usdToCup" type="number" value={formState.usdToCup} onChange={handleFormChange} step="0.01" min="0" placeholder="Ej: 380.00" />
                      </InputGroup>
                      
                      <InputGroup label="Productos por página en inventario">
                          <Input name="itemsPerPage" type="number" value={formState.itemsPerPage} onChange={handleFormChange} min="1" step="1" placeholder="Ej: 10" />
                      </InputGroup>

                      <div className="pt-2">
                        <Button 
                          icon={saveButtonContent.icon} 
                          onClick={handleSaveChanges} 
                          className="w-full justify-center"
                          disabled={saveStatus === 'saving'}
                        >
                          {saveButtonContent.text}
                        </Button>
                      </div>
                  </div>
                  
                  <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2"><Icon name="fa-wallet" /> Gestión de Saldo de Inversión</h3>
                    <div className="text-center bg-dark-bg p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Saldo Actual Disponible</p>
                      <p className="text-4xl font-bold text-success">{state.investmentBalance.toFixed(2)} <span className="text-2xl">CUP</span></p>
                    </div>
                    <InputGroup label="Establecer Nuevo Saldo de Inversión">
                      <div className="flex gap-2">
                        <Input type="number" value={balanceInput} onChange={e => setBalanceInput(e.target.value)} placeholder="0.00" min="0" step="0.01" />
                        <Button onClick={handleUpdateBalance} icon="fa-check">Actualizar</Button>
                      </div>
                    </InputGroup>
                  </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700 flex flex-col h-full">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Icon name="fa-database" /> Gestión de Datos</h3>
                    <p className="text-sm text-gray-400 mb-6">Guarde o cargue sus datos para seguridad o para moverlos a otra computadora.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mt-auto">
                        <Button icon="fa-file-export" onClick={handleExportData} className="flex-1 justify-center text-base py-3">
                            Exportar Datos
                        </Button>
                        <Button icon="fa-file-import" onClick={handleImportClick} className="flex-1 justify-center text-base py-3">
                            Importar Datos
                        </Button>
                        <input type="file" ref={importFileInputRef} onChange={handleFileImport} accept=".json" className="hidden" />
                    </div>
                </div>

                <div className="bg-red-900/20 border border-danger/50 p-6 rounded-lg">
                    <h4 className="font-semibold text-danger mb-2 flex items-center gap-2 text-lg">
                      <Icon name="fa-exclamation-triangle"/>
                      Zona de Peligro
                    </h4>
                    <p className="text-sm text-red-200/80 mb-4">Esta accion es destructiva e irreversible.</p>
                    <Button variant="danger" icon="fa-trash-alt" onClick={handleResetClick} className="w-full justify-center">
                        Restablecer Sistema de Fabrica
                    </Button>
                </div>
              </div>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Confirmar Importación">
        <div className="space-y-6">
          <p>
            ¿Está seguro de que desea importar datos? Esta acción sobreescribirá <strong className="text-warning">TODOS</strong> los datos actuales (productos, ventas, configuración, etc.).
          </p>
          <p className="text-sm text-gray-400">
            Se recomienda encarecidamente exportar los datos actuales como copia de seguridad antes de continuar.
          </p>
          <div className="flex justify-end gap-4">
            <Button onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" icon="fa-file-import" onClick={confirmImport}>
              Sí, Importar Datos
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} title="Confirmar Restablecimiento del Sistema">
        <div className="space-y-6">
          <p className="text-lg text-red-300">
            <strong className="font-bold text-danger">¡ADVERTENCIA FINAL!</strong>
          </p>
          <p>
            Se borrarán <strong className="text-warning">TODOS</strong> sus productos, categorías, reportes y configuraciones. 
            Esta acción es completamente <strong className="text-warning">IRREVERSIBLE</strong>.
          </p>
          <p>¿Está absolutamente seguro de que desea continuar?</p>
          <div className="flex justify-end gap-4">
            <Button onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" icon="fa-trash-alt" onClick={confirmReset}>
              Sí, Entiendo y Quiero Restablecer
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ConfigPage;