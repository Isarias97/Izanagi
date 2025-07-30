import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import { Debtor, Debt, DebtPayment, Role } from '../types';
import Modal from '../components/Modal';

type DebtsTab = 'debtors' | 'debts' | 'payments' | 'overdue';

// Componente para formulario de deudor
const DebtorForm: React.FC<{
  debtor?: Debtor;
  onSave: (data: Omit<Debtor, 'id' | 'totalDebt' | 'createdAt'>) => void;
  onCancel: () => void;
}> = ({ debtor, onSave, onCancel }) => {
  const [name, setName] = useState(debtor?.name || '');
  const [phone, setPhone] = useState(debtor?.phone || '');
  const [email, setEmail] = useState(debtor?.email || '');
  const [address, setAddress] = useState(debtor?.address || '');
  const [creditLimit, setCreditLimit] = useState(debtor?.creditLimit.toString() || '0');
  const [notes, setNotes] = useState(debtor?.notes || '');

  const handleSubmit = () => {
    if (!name.trim() || !phone.trim()) {
      alert('Nombre y teléfono son obligatorios.');
      return;
    }
    onSave({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      creditLimit: Number(creditLimit) || 0,
      isActive: true,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <InputGroup label="Nombre Completo *">
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" />
      </InputGroup>
      <InputGroup label="Teléfono *">
        <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: +53 5 123 4567" />
      </InputGroup>
      <InputGroup label="Email">
        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@email.com" />
      </InputGroup>
      <InputGroup label="Dirección">
        <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección completa" />
      </InputGroup>
      <InputGroup label="Límite de Crédito (CUP)">
        <Input type="number" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} placeholder="0.00" min="0" step="0.01" />
      </InputGroup>
      <InputGroup label="Notas">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Información adicional" />
      </InputGroup>
      <div className="flex justify-end gap-4">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button icon="fa-save" onClick={handleSubmit}>
          {debtor ? 'Actualizar' : 'Guardar'} Deudor
        </Button>
      </div>
    </div>
  );
};

// Componente para formulario de deuda
const DebtForm: React.FC<{
  debt?: Debt;
  debtors: Debtor[];
  onSave: (data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}> = ({ debt, debtors, onSave, onCancel }) => {
  const [debtorId, setDebtorId] = useState(debt?.debtorId.toString() || '');
  const [amount, setAmount] = useState(debt?.amount.toString() || '');
  const [description, setDescription] = useState(debt?.description || '');
  const [dueDate, setDueDate] = useState(debt?.dueDate || '');
  const [notes, setNotes] = useState(debt?.notes || '');

  const handleSubmit = () => {
    if (!debtorId || !amount || !description.trim() || !dueDate) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    const debtor = debtors.find(d => d.id === Number(debtorId));
    if (!debtor) {
      alert('Deudor no encontrado.');
      return;
    }
    onSave({
      debtorId: Number(debtorId),
      debtorName: debtor.name,
      amount: Number(amount),
      originalAmount: Number(amount),
      description: description.trim(),
      dueDate,
      status: 'PENDING',
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <InputGroup label="Deudor *">
        <Select value={debtorId} onChange={e => setDebtorId(e.target.value)}>
          <option value="">Seleccionar deudor</option>
          {debtors.filter(d => d.isActive).map(d => (
            <option key={d.id} value={d.id}>
              {d.name} - {d.phone}
            </option>
          ))}
        </Select>
      </InputGroup>
      <InputGroup label="Monto (CUP) *">
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
      </InputGroup>
      <InputGroup label="Descripción *">
        <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Motivo de la deuda" />
      </InputGroup>
      <InputGroup label="Fecha de Vencimiento *">
        <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </InputGroup>
      <InputGroup label="Notas">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Información adicional" />
      </InputGroup>
      <div className="flex justify-end gap-4">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button icon="fa-save" onClick={handleSubmit}>
          {debt ? 'Actualizar' : 'Registrar'} Deuda
        </Button>
      </div>
    </div>
  );
};

// Componente para formulario de pago
const PaymentForm: React.FC<{
  debt: Debt;
  onSave: (data: Omit<DebtPayment, 'id'>) => void;
  onCancel: () => void;
}> = ({ debt, onSave, onCancel }) => {
  const { state, currentUser } = useContext(DataContext);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MLC' | 'USD' | 'TRANSFER' | 'OTHER'>('CASH');
  const [notes, setNotes] = useState('');

  const remainingAmount = debt.amount;
  const maxAmount = Math.min(Number(amount) || 0, remainingAmount);

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      alert('Ingrese un monto válido.');
      return;
    }
    if (Number(amount) > remainingAmount) {
      alert(`El monto no puede exceder ${remainingAmount.toFixed(2)} CUP.`);
      return;
    }
    onSave({
      debtId: debt.id,
      amount: Number(amount),
      paymentDate: new Date().toISOString(),
      paymentMethod,
      receivedByWorkerId: currentUser?.id || 0,
      receivedByWorkerName: currentUser?.name || 'Sistema',
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/60 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Información de la Deuda</h3>
        <p><strong>Deudor:</strong> {debt.debtorName}</p>
        <p><strong>Descripción:</strong> {debt.description}</p>
        <p><strong>Monto Restante:</strong> {remainingAmount.toFixed(2)} CUP</p>
      </div>
      <InputGroup label="Monto a Pagar (CUP) *">
        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" max={remainingAmount} step="0.01" />
      </InputGroup>
      <InputGroup label="Método de Pago *">
        <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
          <option value="CASH">Efectivo (CUP)</option>
          <option value="MLC">MLC</option>
          <option value="USD">USD</option>
          <option value="TRANSFER">Transferencia</option>
          <option value="OTHER">Otro</option>
        </Select>
      </InputGroup>
      <InputGroup label="Notas">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Información del pago" />
      </InputGroup>
      <div className="flex justify-end gap-4">
        <Button onClick={onCancel}>Cancelar</Button>
        <Button icon="fa-money-bill" onClick={handleSubmit}>
          Registrar Pago
        </Button>
      </div>
    </div>
  );
};

const DebtsPage: React.FC = () => {
  const { state, setState, showNotification, currentUser } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<DebtsTab>('debtors');
  const [isAddDebtorModalOpen, setIsAddDebtorModalOpen] = useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<Debtor | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cálculos memoizados
  const totalDebt = useMemo(() => 
    state.debts.reduce((sum, debt) => sum + debt.amount, 0), [state.debts]
  );

  const overdueDebts = useMemo(() => 
    state.debts.filter(debt => 
      debt.status === 'PENDING' && new Date(debt.dueDate) < new Date()
    ), [state.debts]
  );

  const totalOverdue = useMemo(() => 
    overdueDebts.reduce((sum, debt) => sum + debt.amount, 0), [overdueDebts]
  );

  const filteredDebtors = useMemo(() => 
    state.debtors.filter(debtor => 
      debtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debtor.phone.includes(searchTerm)
    ), [state.debtors, searchTerm]
  );

  const filteredDebts = useMemo(() => 
    state.debts.filter(debt => 
      debt.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      debt.description.toLowerCase().includes(searchTerm.toLowerCase())
    ), [state.debts, searchTerm]
  );

  // Handlers
  const handleAddDebtor = useCallback((data: Omit<Debtor, 'id' | 'totalDebt' | 'createdAt'>) => {
    const newDebtor: Debtor = {
      ...data,
      id: Date.now(),
      totalDebt: 0,
      createdAt: new Date().toISOString(),
    };
    setState(prev => ({
      ...prev,
      debtors: [...prev.debtors, newDebtor]
    }));
    setIsAddDebtorModalOpen(false);
    showNotification('Éxito', 'Deudor agregado correctamente.');
  }, [setState, showNotification]);

  const handleAddDebt = useCallback((data: Omit<Debt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDebt: Debt = {
      ...data,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Actualizar total de deuda del deudor
    const updatedDebtors = state.debtors.map(debtor => 
      debtor.id === data.debtorId 
        ? { ...debtor, totalDebt: debtor.totalDebt + data.amount }
        : debtor
    );

    setState(prev => ({
      ...prev,
      debts: [...prev.debts, newDebt],
      debtors: updatedDebtors
    }));
    setIsAddDebtModalOpen(false);
    showNotification('Éxito', 'Deuda registrada correctamente.');
  }, [setState, showNotification, state.debtors]);

  const handleAddPayment = useCallback((data: Omit<DebtPayment, 'id'>) => {
    const newPayment: DebtPayment = {
      ...data,
      id: Date.now(),
    };

    // Actualizar deuda
    const updatedDebts = state.debts.map(debt => {
      if (debt.id === data.debtId) {
        const newAmount = debt.amount - data.amount;
        const newStatus = newAmount <= 0 ? 'PAID' : 'PARTIAL';
        return {
          ...debt,
          amount: newAmount,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      }
      return debt;
    });

    // Actualizar total de deuda del deudor
    const debt = state.debts.find(d => d.id === data.debtId);
    const updatedDebtors = state.debtors.map(debtor => 
      debtor.id === debt?.debtorId 
        ? { ...debtor, totalDebt: Math.max(0, debtor.totalDebt - data.amount) }
        : debtor
    );

    setState(prev => ({
      ...prev,
      debtPayments: [...prev.debtPayments, newPayment],
      debts: updatedDebts,
      debtors: updatedDebtors
    }));
    setIsPaymentModalOpen(false);
    showNotification('Éxito', 'Pago registrado correctamente.');
  }, [setState, showNotification, state.debts, state.debtors]);

  const getStatusColor = (status: Debt['status']) => {
    switch (status) {
      case 'PAID': return 'text-success';
      case 'PARTIAL': return 'text-warning';
      case 'OVERDUE': return 'text-danger';
      case 'CANCELLED': return 'text-gray-400';
      default: return 'text-accent';
    }
  };

  const getStatusText = (status: Debt['status']) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'PARTIAL': return 'Parcial';
      case 'OVERDUE': return 'Vencida';
      case 'CANCELLED': return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-accent">{state.debtors.length}</div>
            <div className="text-sm text-gray-400">Deudores Activos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-warning">{totalDebt.toFixed(2)} CUP</div>
            <div className="text-sm text-gray-400">Deuda Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-danger">{totalOverdue.toFixed(2)} CUP</div>
            <div className="text-sm text-gray-400">Deudas Vencidas</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de navegación */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('debtors')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'debtors' 
              ? 'bg-accent text-primary' 
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Icon name="fa-users" className="mr-2" />
          Deudores
        </button>
        <button
          onClick={() => setActiveTab('debts')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'debts' 
              ? 'bg-accent text-primary' 
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Icon name="fa-credit-card" className="mr-2" />
          Deudas
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'payments' 
              ? 'bg-accent text-primary' 
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Icon name="fa-money-bill" className="mr-2" />
          Pagos
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 rounded-t-lg font-medium transition ${
            activeTab === 'overdue' 
              ? 'bg-accent text-primary' 
              : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
          }`}
        >
          <Icon name="fa-exclamation-triangle" className="mr-2" />
          Vencidas ({overdueDebts.length})
        </button>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-4 items-center">
        <InputGroup label="Buscar" className="flex-1">
          <Input 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            placeholder="Buscar por nombre, teléfono o descripción..." 
          />
        </InputGroup>
        {activeTab === 'debtors' && (
          <Button icon="fa-plus" onClick={() => setIsAddDebtorModalOpen(true)}>
            Agregar Deudor
          </Button>
        )}
        {activeTab === 'debts' && (
          <Button icon="fa-plus" onClick={() => setIsAddDebtModalOpen(true)}>
            Registrar Deuda
          </Button>
        )}
      </div>

      {/* Contenido de tabs */}
      {activeTab === 'debtors' && (
        <Card>
          <CardHeader icon="fa-users">Lista de Deudores</CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-300 uppercase bg-secondary">
                  <tr>
                    <th className="px-6 py-3">Nombre</th>
                    <th className="px-6 py-3">Teléfono</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3 text-right">Límite Crédito</th>
                    <th className="px-6 py-3 text-right">Deuda Total</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebtors.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-500">
                        No hay deudores registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredDebtors.map(debtor => (
                      <tr key={debtor.id} className="border-b border-slate-700 bg-slate-900/30">
                        <td className="px-6 py-4 font-semibold">{debtor.name}</td>
                        <td className="px-6 py-4">{debtor.phone}</td>
                        <td className="px-6 py-4">{debtor.email || '-'}</td>
                        <td className="px-6 py-4 text-right">{debtor.creditLimit.toFixed(2)} CUP</td>
                        <td className="px-6 py-4 text-right font-bold">{debtor.totalDebt.toFixed(2)} CUP</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            debtor.isActive ? 'bg-success/20 text-green-300' : 'bg-danger/20 text-red-300'
                          }`}>
                            {debtor.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button 
                              variant="icon" 
                              onClick={() => setEditingDebtor(debtor)}
                              className="w-8 h-8"
                            >
                              <Icon name="fa-edit" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'debts' && (
        <Card>
          <CardHeader icon="fa-credit-card">Lista de Deudas</CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-300 uppercase bg-secondary">
                  <tr>
                    <th className="px-6 py-3">Deudor</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                    <th className="px-6 py-3 text-center">Vencimiento</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No hay deudas registradas.
                      </td>
                    </tr>
                  ) : (
                    filteredDebts.map(debt => (
                      <tr key={debt.id} className="border-b border-slate-700 bg-slate-900/30">
                        <td className="px-6 py-4 font-semibold">{debt.debtorName}</td>
                        <td className="px-6 py-4">{debt.description}</td>
                        <td className="px-6 py-4 text-right font-bold">{debt.amount.toFixed(2)} CUP</td>
                        <td className="px-6 py-4 text-center">
                          {new Date(debt.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(debt.status)}`}>
                            {getStatusText(debt.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {debt.status !== 'PAID' && (
                              <Button 
                                variant="icon" 
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="w-8 h-8 bg-success/30 hover:bg-success/60"
                              >
                                <Icon name="fa-money-bill" />
                              </Button>
                            )}
                            <Button 
                              variant="icon" 
                              onClick={() => setEditingDebt(debt)}
                              className="w-8 h-8"
                            >
                              <Icon name="fa-edit" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card>
          <CardHeader icon="fa-money-bill">Historial de Pagos</CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-300 uppercase bg-secondary">
                  <tr>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Deudor</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                    <th className="px-6 py-3 text-center">Método</th>
                    <th className="px-6 py-3">Recibido por</th>
                  </tr>
                </thead>
                <tbody>
                  {state.debtPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No hay pagos registrados.
                      </td>
                    </tr>
                  ) : (
                    [...state.debtPayments].reverse().map(payment => {
                      const debt = state.debts.find(d => d.id === payment.debtId);
                      return (
                        <tr key={payment.id} className="border-b border-slate-700 bg-slate-900/30">
                          <td className="px-6 py-4">
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-semibold">{debt?.debtorName || 'N/A'}</td>
                          <td className="px-6 py-4">{debt?.description || 'N/A'}</td>
                          <td className="px-6 py-4 text-right font-bold text-success">
                            {payment.amount.toFixed(2)} CUP
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-accent/20 text-accent">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td className="px-6 py-4">{payment.receivedByWorkerName}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'overdue' && (
        <Card>
          <CardHeader icon="fa-exclamation-triangle">Deudas Vencidas</CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-300 uppercase bg-secondary">
                  <tr>
                    <th className="px-6 py-3">Deudor</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                    <th className="px-6 py-3 text-center">Vencimiento</th>
                    <th className="px-6 py-3 text-center">Días Vencida</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {overdueDebts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-500">
                        No hay deudas vencidas.
                      </td>
                    </tr>
                  ) : (
                    overdueDebts.map(debt => {
                      const daysOverdue = Math.floor((new Date().getTime() - new Date(debt.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <tr key={debt.id} className="border-b border-slate-700 bg-slate-900/30">
                          <td className="px-6 py-4 font-semibold">{debt.debtorName}</td>
                          <td className="px-6 py-4">{debt.description}</td>
                          <td className="px-6 py-4 text-right font-bold text-danger">
                            {debt.amount.toFixed(2)} CUP
                          </td>
                          <td className="px-6 py-4 text-center">
                            {new Date(debt.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-danger/20 text-red-300">
                              {daysOverdue} días
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <Button 
                                variant="icon" 
                                onClick={() => {
                                  setSelectedDebt(debt);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="w-8 h-8 bg-success/30 hover:bg-success/60"
                              >
                                <Icon name="fa-money-bill" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modales */}
      <Modal 
        isOpen={isAddDebtorModalOpen} 
        onClose={() => setIsAddDebtorModalOpen(false)}
        title="Agregar Deudor"
      >
        <DebtorForm 
          onSave={handleAddDebtor}
          onCancel={() => setIsAddDebtorModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={isAddDebtModalOpen} 
        onClose={() => setIsAddDebtModalOpen(false)}
        title="Registrar Deuda"
      >
        <DebtForm 
          debtors={state.debtors}
          onSave={handleAddDebt}
          onCancel={() => setIsAddDebtModalOpen(false)}
        />
      </Modal>

      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)}
        title="Registrar Pago"
      >
        {selectedDebt && (
          <PaymentForm 
            debt={selectedDebt}
            onSave={handleAddPayment}
            onCancel={() => setIsPaymentModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default DebtsPage; 