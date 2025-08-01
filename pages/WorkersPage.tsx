
import React, { useState, useContext, useCallback, useMemo } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import { Worker, Role } from '../types';
import Modal from '../components/Modal';

const ROLES: Role[] = ['Admin', 'Gerente', 'Vendedor'];

function WorkerForm({ worker, onSave, onDone }: { worker?: Worker, onSave: (data: Omit<Worker, 'id'>) => void, onDone: () => void }) {
    const [name, setName] = useState(worker?.name || '');
    const [pin, setPin] = useState(worker?.pin || '');
    const [role, setRole] = useState<Role>(worker?.role || 'Vendedor');
    const handleSubmit = () => {
        if (!name.trim() || !/^\d{4}$/.test(pin)) {
            alert('Por favor, ingrese un nombre válido y un PIN de 4 dígitos.');
            return;
        }
        onSave({ name, pin, role });
        onDone();
    };
    return (
        <div className="space-y-6">
            <InputGroup label="Nombre Completo">
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
            </InputGroup>
            <InputGroup label="PIN de 4 Dígitos">
                <Input 
                    type="password"
                    value={pin} 
                    onChange={e => setPin(e.target.value.replace(/\D/g, '').substring(0, 4))} 
                    placeholder="****" 
                    maxLength={4}
                    pattern="\d{4}"
                    autoComplete="new-password"
                />
            </InputGroup>
            <InputGroup label="Rol">
                <Select value={role} onChange={e => setRole(e.target.value as Role)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </Select>
            </InputGroup>
            <div className="flex justify-end gap-4">
                <Button onClick={onDone}>Cancelar</Button>
                <Button icon="fa-save" onClick={handleSubmit}>Guardar Trabajador</Button>
            </div>
        </div>
    );
}
const MemoizedWorkerForm = React.memo(WorkerForm);

const WorkersTable: React.FC<{
  workers: Worker[];
  onEdit: (w: Worker) => void;
  onDelete: (w: Worker) => void;
}> = React.memo(({ workers, onEdit, onDelete }) => {
  const getRoleStyle = (role: Role) => {
    switch(role) {
      case 'Admin': return 'bg-danger/20 text-red-300 border-danger/30';
      case 'Gerente': return 'bg-accent/20 text-indigo-300 border-accent/30';
      case 'Vendedor': return 'bg-success/20 text-green-300 border-success/30';
      default: return 'bg-slate-700';
    }
  };
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 no-scrollbar">
      <table className="w-full text-sm text-left text-gray-300 min-w-[600px]">
        <thead className="text-xs text-gray-300 uppercase bg-secondary">
          <tr>
            <th scope="col" className="px-6 py-3">Nombre</th>
            <th scope="col" className="px-6 py-3">Rol</th>
            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {workers.length === 0 ? (
            <tr>
              <td colSpan={3} className="text-center p-8 text-gray-500">
                No hay trabajadores registrados.
              </td>
            </tr>
          ) : workers.map(w => (
            <tr key={w.id} className="border-b border-slate-700 bg-slate-900/30 active:scale-95 touch-manipulation no-hover">
              <td className="px-6 py-4 font-semibold">{w.name}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleStyle(w.role)}`}>
                  {w.role}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 justify-end">
                  <Button variant="icon" onClick={() => onEdit(w)} className="w-10 h-10 min-w-[44px] min-h-[44px] active:scale-95 touch-manipulation no-hover" aria-label="Editar trabajador"><Icon name="fa-edit"/></Button>
                  <Button variant="icon" className="bg-danger/30 hover:bg-danger/60 w-10 h-10 min-w-[44px] min-h-[44px] active:scale-95 touch-manipulation no-hover" onClick={() => onDelete(w)} aria-label="Eliminar trabajador"><Icon name="fa-trash"/></Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const WorkersPage: React.FC = () => {
  const { state, setState, showNotification } = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);

  const handleOpenAddModal = useCallback(() => {
    setEditingWorker(null);
    setIsModalOpen(true);
  }, []);
  const handleOpenEditModal = useCallback((worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  }, []);
  const handleSaveWorker = useCallback((data: Omit<Worker, 'id'>) => {
    if (!data.name.trim() || !/^\d{4}$/.test(data.pin)) {
        showNotification('Error', 'Por favor, ingrese un nombre válido y un PIN de 4 dígitos.', true);
        return;
    }
    setState(prev => {
      if (editingWorker) {
            const updatedWorkers = prev.workers.map(w => w.id === editingWorker.id ? { ...w, ...data } : w);
            showNotification('Éxito', `Trabajador '${data.name}' actualizado.`);
            return { ...prev, workers: updatedWorkers };
      } else {
            const newId = (prev.workers.length > 0 ? Math.max(...prev.workers.map(w => w.id)) : 0) + 1;
            const newWorker: Worker = { ...data, id: newId };
            showNotification('Éxito', `Trabajador '${data.name}' agregado.`);
            return { ...prev, workers: [...prev.workers, newWorker] };
        }
    });
    setIsModalOpen(false);
    setEditingWorker(null);
  }, [editingWorker, setState, showNotification]);
  const handleDeleteWorker = useCallback((worker: Worker) => {
    setDeletingWorker(worker);
  }, []);
  const confirmDeleteWorker = useCallback(() => {
    if (!deletingWorker) return;
    setState(prevState => ({
      ...prevState,
      workers: prevState.workers.filter(w => w.id !== deletingWorker.id)
    }));
    showNotification('Éxito', `Trabajador "${deletingWorker.name}" eliminado.`);
    setDeletingWorker(null);
  }, [deletingWorker, setState, showNotification]);

  return (
    <>
        <Card>
            <CardHeader icon="fa-users-cog">Gestión de Trabajadores</CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Lista de Trabajadores</h3>
                    <Button icon="fa-user-plus" onClick={handleOpenAddModal} className="min-h-[44px] px-5 py-3 active:scale-95 touch-manipulation no-hover">
                        Agregar Trabajador
                    </Button>
                </div>
          <WorkersTable
            workers={state.workers}
            onEdit={handleOpenEditModal}
            onDelete={handleDeleteWorker}
          />
            </CardContent>
        </Card>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWorker ? 'Editar Trabajador' : 'Agregar Nuevo Trabajador'}>
        <MemoizedWorkerForm
                worker={editingWorker || undefined} 
                onSave={handleSaveWorker}
                onDone={() => setIsModalOpen(false)} 
            />
        </Modal>
       <Modal isOpen={!!deletingWorker} onClose={() => setDeletingWorker(null)} title="Confirmar Eliminación">
            {deletingWorker && (
                <div className="space-y-6">
                    <p>
                        ¿Está seguro de que desea eliminar al trabajador <strong>{deletingWorker.name}</strong>?
                        <br />
                        Esta acción es irreversible.
                    </p>
                    <div className="flex justify-end gap-4">
                        <Button onClick={() => setDeletingWorker(null)}>Cancelar</Button>
                        <Button variant="danger" icon="fa-trash" onClick={confirmDeleteWorker}>
                            Eliminar
                        </Button>
                    </div>
                </div>
            )}
       </Modal>
       <style>{`
         .touch-manipulation { touch-action: manipulation; }
         .no-hover:hover { background: none !important; filter: none !important; }
         .no-scrollbar::-webkit-scrollbar { display: none; }
         .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
       `}</style>
    </>
  );
};

export default WorkersPage;
