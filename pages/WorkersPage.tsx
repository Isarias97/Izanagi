
import React, { useState, useContext } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import { Worker, Role } from '../types';
import Modal from '../components/Modal';

const ROLES: Role[] = ['Admin', 'Gerente', 'Vendedor'];

const WorkerForm: React.FC<{ worker?: Worker, onSave: (data: Omit<Worker, 'id'>) => void, onDone: () => void }> = ({ worker, onSave, onDone }) => {
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
};


const WorkersPage: React.FC = () => {
  const { state, setState, showNotification } = useContext(DataContext);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [deletingWorker, setDeletingWorker] = useState<Worker | null>(null);

  const handleOpenAddModal = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (worker: Worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleSaveWorker = (data: Omit<Worker, 'id'>) => {
    if (!data.name.trim() || !/^\d{4}$/.test(data.pin)) {
        showNotification('Error', 'Por favor, ingrese un nombre válido y un PIN de 4 dígitos.', true);
        return;
    }

    setState(prev => {
        if (editingWorker) { // Update
            const updatedWorkers = prev.workers.map(w => w.id === editingWorker.id ? { ...w, ...data } : w);
            showNotification('Éxito', `Trabajador '${data.name}' actualizado.`);
            return { ...prev, workers: updatedWorkers };
        } else { // Add new
            const newId = (prev.workers.length > 0 ? Math.max(...prev.workers.map(w => w.id)) : 0) + 1;
            const newWorker: Worker = { ...data, id: newId };
            showNotification('Éxito', `Trabajador '${data.name}' agregado.`);
            return { ...prev, workers: [...prev.workers, newWorker] };
        }
    });

    setIsModalOpen(false);
    setEditingWorker(null);
  };
  
  const confirmDeleteWorker = () => {
    if (!deletingWorker) return;

    setState(prevState => ({
      ...prevState,
      workers: prevState.workers.filter(w => w.id !== deletingWorker.id)
    }));
    showNotification('Éxito', `Trabajador "${deletingWorker.name}" eliminado.`);
    setDeletingWorker(null);
  };
  
  const getRoleStyle = (role: Role) => {
    switch(role) {
        case 'Admin': return 'bg-danger/20 text-red-300 border-danger/30';
        case 'Gerente': return 'bg-accent/20 text-indigo-300 border-accent/30';
        case 'Vendedor': return 'bg-success/20 text-green-300 border-success/30';
        default: return 'bg-slate-700';
    }
  }

  return (
    <>
        <Card>
            <CardHeader icon="fa-users-cog">Gestión de Trabajadores</CardHeader>
            <CardContent>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Lista de Trabajadores</h3>
                    <Button icon="fa-user-plus" onClick={handleOpenAddModal}>
                        Agregar Trabajador
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader icon="fa-user-plus">Agregar Trabajador</CardHeader>
                        <CardContent>
                            <Button icon="fa-user-plus" onClick={handleOpenAddModal}>
                                Agregar Trabajador
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader icon="fa-search">Buscar Trabajador</CardHeader>
                        <CardContent>
                            <InputGroup label="Nombre o PIN">
                                <Input placeholder="Buscar por nombre o PIN" />
                            </InputGroup>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader icon="fa-filter">Filtros</CardHeader>
                        <CardContent>
                            <Select>
                                <option value="">Todos los Roles</option>
                                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </Select>
                        </CardContent>
                    </Card>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full text-sm text-left text-gray-300 min-w-[600px]">
                        <thead className="text-xs text-gray-300 uppercase bg-secondary">
                            <tr>
                                <th scope="col" className="px-6 py-3">Nombre</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                                <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {state.workers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="text-center p-8 text-gray-500">
                                        No hay trabajadores registrados.
                                    </td>
                                </tr>
                            ) : state.workers.map(w => (
                                <tr key={w.id} className="border-b border-slate-700 hover:bg-slate-800/50">
                                    <td className="px-6 py-4 font-semibold">{w.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getRoleStyle(w.role)}`}>
                                            {w.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="icon" onClick={() => handleOpenEditModal(w)}><Icon name="fa-edit"/></Button>
                                            <Button variant="icon" className="bg-danger/30 hover:bg-danger/60" onClick={() => setDeletingWorker(w)}><Icon name="fa-trash"/></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingWorker ? 'Editar Trabajador' : 'Agregar Nuevo Trabajador'}>
            <WorkerForm 
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
    </>
  );
};

export default WorkersPage;
