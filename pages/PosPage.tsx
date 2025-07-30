
import React, { useState, useContext, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../context';
import { SaleItem, Product, TransactionLogEntry, AuditReport, SaleReport } from '../types';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Select, Icon } from '../components/ui';
import Modal from '../components/Modal';
import { DEFAULT_ICON } from '../constants';

const getChangeDisplay = (amountPaidStr: string, change: number) => {
  if (amountPaidStr === '') {
    return { text: '0.00 CUP', className: '' };
  }
  if (change < 0) {
    return { text: `Faltan ${(-change).toFixed(2)} CUP`, className: 'text-danger' };
  }
  return { text: `${change.toFixed(2)} CUP`, className: 'text-success' };
};

const DiscrepancyDisplay: React.FC<{ value: number }> = ({ value }) => {
    const isShortage = value < 0;
    const isSurplus = value > 0;
    const color = isShortage ? 'text-danger' : isSurplus ? 'text-success' : 'text-gray-400';
    const prefix = isSurplus ? '+' : '';
    return <span className={`font-bold ${color}`}>{prefix}{value.toFixed(2)}</span>;
};

const CUP_DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1];

// Componente para el buscador y selección de productos
const ProductSearchSection: React.FC<{
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  searchResults: Product[];
  onSelect: (p: Product) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  categories: any[];
}> = ({ searchTerm, setSearchTerm, searchResults, onSelect, searchInputRef, categories }) => (
  <InputGroup label="Buscar por Nombre o SKU" className="relative">
    <Input ref={searchInputRef} type="text" id="product-search" placeholder="Escriba para buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} autoComplete="off" className="text-lg" />
    {searchResults.length > 0 && searchTerm.length > 0 && (
      <div className="absolute w-full top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto z-30 shadow-lg">
        {searchResults.map(p => {
          const category = categories.find(c => c.id === p.categoryId);
          return (
            <div key={p.id} onClick={() => onSelect(p)} className="suggestion-item p-3 hover:bg-accent cursor-pointer border-b border-slate-700 flex items-center gap-3">
              <span className="text-xl">{category?.icon || DEFAULT_ICON}</span> <span>{p.name} ({p.sku})</span>
            </div>
          );
        })}
      </div>
    )}
  </InputGroup>
);

// Componente para el carrito de compra
const CartSection: React.FC<{
  items: SaleItem[];
  categories: any[];
  onRemove: (id: number) => void;
}> = ({ items, categories, onRemove }) => (
  <div className="bg-slate-900/50 rounded-lg p-2 min-h-[120px] max-h-[40vh] overflow-y-auto">
    {items.length === 0 ? (
      <div className="flex items-center justify-center h-full text-gray-500">El carrito está vacío</div>
    ) : (
      <ul className="space-y-2">
        {items.map((item) => {
          const category = categories.find(c => c.id === item.categoryId);
          return (
            <li key={item.id} className="bg-slate-800/60 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between animate-fade-in gap-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{category?.icon || DEFAULT_ICON}</span>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-400">{item.quantity} &times; ${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 sm:mt-0">
                <span className="font-bold text-lg w-24 text-right">${(item.quantity * item.price).toFixed(2)}</span>
                <Button variant="icon" className="bg-danger/30 hover:bg-danger/60" onClick={() => onRemove(item.id)} aria-label="Eliminar del carrito"><Icon name="fa-times"/></Button>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

// Componente para el resumen y pago
const PaymentSummarySection: React.FC<{
  saleTotals: { total: number; paid: number; paidInCup: number; change: number };
  currentSale: any;
  setCurrentSale: React.Dispatch<React.SetStateAction<any>>;
  changeDisplay: { text: string; className: string };
  processSale: () => void;
  paymentInputRef: React.RefObject<HTMLInputElement | null>;
}> = ({ saleTotals, currentSale, setCurrentSale, changeDisplay, processSale, paymentInputRef }) => (
  <>
    <div className="flex-grow space-y-4">
      <div className="text-right border-b border-slate-700 pb-4 mb-4">
        <span className="text-gray-400">Total a Pagar</span>
        <p className="text-4xl font-bold text-accent">{saleTotals.total.toFixed(2)} <span className="text-2xl">CUP</span></p>
      </div>
      <InputGroup label="Moneda de Pago">
        <Select value={currentSale.paymentCurrency} onChange={e => setCurrentSale((prev: any) => ({...prev, paymentCurrency: e.target.value as any}))} className="text-lg">
          <option value="CUP">Efectivo (CUP)</option>
          <option value="MLC">Tarjeta (MLC)</option>
          <option value="USD">Dólares (USD)</option>
        </Select>
      </InputGroup>
      <InputGroup label={`Monto Pagado (${currentSale.paymentCurrency})`}>
        <Input ref={paymentInputRef} type="number" placeholder="0.00" step="0.01" min="0" value={currentSale.amountPaid} onChange={e => setCurrentSale((prev: any) => ({...prev, amountPaid: e.target.value}))} className="text-lg" />
      </InputGroup>
      <InputGroup label="Vuelto (en CUP)">
        <Input type="text" readOnly value={changeDisplay.text} className={`font-bold ${changeDisplay.className} text-lg`} />
      </InputGroup>
    </div>
    <div className="mt-auto pt-6">
      <Button variant="success" icon="fa-check-circle" className="w-full text-lg py-4" onClick={processSale}> Finalizar Venta (F12) </Button>
    </div>
  </>
);

// Componente para la sección de auditoría
const AuditSection: React.FC<{
  dailyAuditData: any;
  cashCount: { [key: number]: string };
  setCashCount: React.Dispatch<React.SetStateAction<{ [key: number]: string }>>;
  countedMLC: string;
  setCountedMLC: (v: string) => void;
  countedUSD: string;
  setCountedUSD: (v: string) => void;
  totalCountedCUP: number;
  handleCloseRegister: () => void;
}> = ({ dailyAuditData, cashCount, setCashCount, countedMLC, setCountedMLC, countedUSD, setCountedUSD, totalCountedCUP, handleCloseRegister }) => (
  <Card>
    <CardHeader icon="fa-calculator">Auditoría y Cierre de Caja</CardHeader>
    <CardContent>
      {!dailyAuditData.hasSales ? (
        <div className="text-center p-8 text-gray-500">
          <Icon name="fa-info-circle" className="text-4xl mb-4"/>
          <p>No se han registrado ventas hoy. No hay datos para la auditoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Cash Count Section */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b border-slate-700 pb-2">Conteo de Efectivo (CUP)</h3>
            <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-2">
              {CUP_DENOMINATIONS.map(den => (
                <div key={den} className="grid grid-cols-3 items-center gap-2 text-sm">
                  <span className="font-semibold text-right">${den} CUP</span>
                  <Input 
                    type="number" 
                    placeholder="0" 
                    min="0"
                    className="text-center"
                    value={cashCount[den] || ''} 
                    onChange={e => setCashCount(p => ({...p, [den]: e.target.value}))}
                  />
                  <span className="text-gray-400 text-right pr-2">= ${(den * (parseInt(cashCount[den] || '0', 10))).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center bg-secondary p-3 rounded-lg text-lg font-bold mt-4">
              <span>Total Contado (CUP):</span>
              <span className="text-accent">${totalCountedCUP.toFixed(2)}</span>
            </div>
          </div>
          {/* Summary Section */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-2">
              <h3 className="font-bold text-center text-lg border-b border-slate-700 pb-2 mb-3">Conteo Físico (Otras Monedas)</h3>
              <InputGroup label="Total Contado (MLC)"><Input type="number" placeholder="0.00" value={countedMLC} onChange={e => setCountedMLC(e.target.value)} /></InputGroup>
              <InputGroup label="Total Contado (USD)"><Input type="number" placeholder="0.00" value={countedUSD} onChange={e => setCountedUSD(e.target.value)} /></InputGroup>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg space-y-3 text-sm">
              <h3 className="font-bold text-center text-lg border-b border-slate-700 pb-2">Resumen del Cierre</h3>
              <div className="flex justify-between"><span>Total Ventas del Día:</span><span className="font-semibold">{dailyAuditData.systemTotals.totalSalesInCUP.toFixed(2)}</span></div>
              <hr className="border-slate-700 my-2"/>
              <div className="flex justify-between"><span>Sistema Espera (CUP):</span><span className="font-semibold">{dailyAuditData.systemTotals.expectedCUP.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Contado (CUP):</span><span className="font-semibold">{dailyAuditData.counted.CUP.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><span>Diferencia (CUP):</span><DiscrepancyDisplay value={dailyAuditData.discrepancies.diffCUP} /></div>
              <hr className="border-slate-600 my-2"/>
              <div className="flex justify-between"><span>Sistema Espera (MLC):</span><span className="font-semibold">{dailyAuditData.systemTotals.expectedMLC.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Contado (MLC):</span><span className="font-semibold">{dailyAuditData.counted.MLC.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><span>Diferencia (MLC):</span><DiscrepancyDisplay value={dailyAuditData.discrepancies.diffMLC} /></div>
              <hr className="border-slate-600 my-2"/>
              <div className="flex justify-between"><span>Sistema Espera (USD):</span><span className="font-semibold">{dailyAuditData.systemTotals.expectedUSD.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Contado (USD):</span><span className="font-semibold">{dailyAuditData.counted.USD.toFixed(2)}</span></div>
              <div className="flex justify-between items-center"><span>Diferencia (USD):</span><DiscrepancyDisplay value={dailyAuditData.discrepancies.diffUSD} /></div>
            </div>
            <div className="text-center pt-4">
              <Button variant="success" icon="fa-lock" className="w-full text-lg px-8 py-3" onClick={handleCloseRegister}>
                Confirmar y Cerrar Caja
              </Button>
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

const PosPage: React.FC = () => {
  const { state, setState, showNotification, currentUser } = useContext(DataContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'sale' | 'audit' | 'debts'>('sale');
  const [currentSale, setCurrentSale] = useState<{
    items: SaleItem[];
    selectedProduct: Product | null;
    paymentCurrency: 'CUP' | 'MLC' | 'USD';
    amountPaid: string;
    isDebt: boolean;
    debtorId?: number;
    dueDate?: string;
  }>({ items: [], selectedProduct: null, paymentCurrency: 'CUP', amountPaid: '', isDebt: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cashCount, setCashCount] = useState<{[key: number]: string}>({});
  const [countedMLC, setCountedMLC] = useState('');
  const [countedUSD, setCountedUSD] = useState('');
  const [selectedDebtor, setSelectedDebtor] = useState<any>(null);
  const [debtorSearchTerm, setDebtorSearchTerm] = useState('');
  const [debtsTab, setDebtsTab] = useState<'sale' | 'debtors' | 'debts' | 'payments'>('sale');
  const [isAddDebtorModalOpen, setIsAddDebtorModalOpen] = useState(false);
  const [isAddDebtModalOpen, setIsAddDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDebtor, setEditingDebtor] = useState<any>(null);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [debtsSearchTerm, setDebtsSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  // Memo: search results
  const searchResults = useMemo(() => {
    if (searchTerm.length < 1) return [];
    const term = searchTerm.toLowerCase();
    return state.products.filter(p => p.stock > 0 && (p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)));
  }, [searchTerm, state.products]);

  // Memo: debtor search results
  const debtorSearchResults = useMemo(() => {
    if (debtorSearchTerm.length < 1) return [];
    const term = debtorSearchTerm.toLowerCase();
    return state.debtors.filter(d => d.isActive && (d.name.toLowerCase().includes(term) || d.phone.includes(term)));
  }, [debtorSearchTerm, state.debtors]);
  // Memo: sale totals
  const saleTotals = useMemo(() => {
    const total = currentSale.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const paid = parseFloat(currentSale.amountPaid) || 0;
    let paidInCup = paid;
    if (currentSale.paymentCurrency === 'MLC') paidInCup *= state.config.exchangeRates.mlcToCup;
    if (currentSale.paymentCurrency === 'USD') paidInCup *= state.config.exchangeRates.usdToCup;
    const change = paidInCup - total;
    return { total, paid, paidInCup, change };
  }, [currentSale, state.config.exchangeRates]);
  const changeDisplay = getChangeDisplay(currentSale.amountPaid, saleTotals.change);
  // Memo: total contado CUP
  const totalCountedCUP = useMemo(() => {
    return CUP_DENOMINATIONS.reduce((total, den) => {
        const count = parseInt(cashCount[den] || '0', 10);
        return total + (count * den);
    }, 0);
  }, [cashCount]);
  // Memo: daily audit data
  const dailyAuditData = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todaysSales = state.reports.filter(r => { const saleDate = new Date(r.date); return saleDate >= todayStart && saleDate <= todayEnd; });
    const systemTotals = { totalSalesInCUP: 0, expectedCUP: 0, expectedMLC: 0, expectedUSD: 0 };
    todaysSales.forEach(sale => {
        systemTotals.totalSalesInCUP += sale.total;
      if(sale.payment.currency === 'CUP') systemTotals.expectedCUP += sale.payment.amountPaid - sale.payment.changeInCup;
      else if (sale.payment.currency === 'MLC') systemTotals.expectedMLC += sale.payment.amountPaid;
      else if (sale.payment.currency === 'USD') systemTotals.expectedUSD += sale.payment.amountPaid;
    });
    const counted = { CUP: totalCountedCUP, MLC: parseFloat(countedMLC) || 0, USD: parseFloat(countedUSD) || 0 };
    const discrepancies = { diffCUP: counted.CUP - systemTotals.expectedCUP, diffMLC: counted.MLC - systemTotals.expectedMLC, diffUSD: counted.USD - systemTotals.expectedUSD };
    return { systemTotals, counted, discrepancies, hasSales: todaysSales.length > 0 };
  }, [state.reports, totalCountedCUP, countedMLC, countedUSD]);

  // Memoizar handlers
  const handleSelectProduct = useCallback((product: Product) => {
    setCurrentSale(prev => ({ ...prev, selectedProduct: product }));
    setSearchTerm('');
    setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
    }, 100);
  }, []);
  const handleCancelSelection = useCallback(() => {
    setCurrentSale(prev => ({ ...prev, selectedProduct: null }));
    setSearchTerm('');
    searchInputRef.current?.focus();
  }, []);
  const handleAddToSale = useCallback(() => {
    if (!currentSale.selectedProduct) {
      showNotification('Error', 'Seleccione un producto.', true);
      return;
    }
    const q = parseInt(quantity);
    if (isNaN(q) || q <= 0) {
      showNotification('Error', 'Cantidad inválida.', true);
      return;
    }
    const existingItem = currentSale.items.find(i => i.id === currentSale.selectedProduct!.id);
    const totalInCart = existingItem ? existingItem.quantity : 0;
    if (q + totalInCart > currentSale.selectedProduct.stock) {
      showNotification('Error', `Stock insuficiente. Disponible: ${currentSale.selectedProduct.stock}, en carrito: ${totalInCart}`, true);
      return;
    }
    let newItems;
    if (existingItem) {
      newItems = currentSale.items.map(item => item.id === existingItem.id ? { ...item, quantity: item.quantity + q } : item);
    } else {
      newItems = [...currentSale.items, { ...currentSale.selectedProduct, quantity: q }];
    }
    setCurrentSale(prev => ({ ...prev, items: newItems, selectedProduct: null }));
    setSearchTerm('');
    setQuantity('1');
    searchInputRef.current?.focus();
  }, [currentSale.items, currentSale.selectedProduct, quantity, showNotification]);
  const handleRemoveFromSale = useCallback((productId: number) => {
    setCurrentSale(prev => ({...prev, items: prev.items.filter(item => item.id !== productId)}));
  }, []);
  const processSale = useCallback(() => {
      if (!currentUser) {
        showNotification('Error', 'No se pudo identificar al vendedor.', true);
        return;
      }
      if (currentSale.items.length === 0) {
        showNotification('Error', 'El carrito está vacío.', true);
        return;
      }
      
      // Validaciones específicas para deudas
      if (currentSale.isDebt) {
        if (!currentSale.debtorId) {
          showNotification('Error', 'Debe seleccionar un deudor para crear una deuda.', true);
          return;
        }
        if (saleTotals.paidInCup > 0 && saleTotals.paidInCup < saleTotals.total) {
          showNotification('Error', 'Si se realiza un pago parcial, debe ser menor al total.', true);
          return;
        }
      } else {
        if (saleTotals.paidInCup < saleTotals.total) {
          showNotification('Error', 'Pago insuficiente.', true);
          return;
        }
      }
      setState(prev => {
        const newReportId = (prev.reports[prev.reports.length - 1]?.id || 0) + 1;
        const updatedProducts = prev.products.map(p => {
          const itemInSale = currentSale.items.find(i => i.id === p.id);
          if (itemInSale) {
            return { ...p, stock: p.stock - itemInSale.quantity, sales: p.sales + itemInSale.quantity };
          }
          return p;
        });
        const newReport: SaleReport = {
          id: newReportId,
          date: new Date().toISOString(),
          soldByWorkerId: currentUser.id,
          items: currentSale.items,
          itemsCount: currentSale.items.reduce((sum, i) => sum + i.quantity, 0),
          total: saleTotals.total,
          payment: {
            currency: currentSale.paymentCurrency,
            amountPaid: saleTotals.paid,
            changeInCup: saleTotals.change
          }
        };

        // Crear deuda si es necesario
        let newDebt = null;
        if (currentSale.isDebt && saleTotals.paidInCup < saleTotals.total) {
          const debtAmount = saleTotals.total - saleTotals.paidInCup;
          const debtor = state.debtors.find(d => d.id === currentSale.debtorId);
          if (debtor) {
            newDebt = {
              id: (prev.debts.length > 0 ? Math.max(...prev.debts.map(d => d.id)) : 0) + 1,
              debtorId: currentSale.debtorId!,
              debtorName: debtor.name,
              saleId: newReportId,
              amount: debtAmount,
              originalAmount: debtAmount,
              description: `Deuda por venta #${newReportId}`,
              dueDate: currentSale.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días por defecto
              status: 'PENDING' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              notes: `Venta #${newReportId} - Pago parcial: ${saleTotals.paidInCup.toFixed(2)} CUP`
            };
          }
        }
        const totalCostOfGoods = currentSale.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
        const totalProfit = saleTotals.total - totalCostOfGoods;
        const profitToInvestment = totalProfit * 0.60;
        const profitToPayout = totalProfit * 0.40;
        let runningInvBalance = prev.investmentBalance;
        let runningPayBalance = prev.workerPayoutBalance;
        const newLogs: TransactionLogEntry[] = [];
        let nextLogId = (prev.transactionLog.length > 0 ? Math.max(...prev.transactionLog.map(t => t.id)) : 0) + 1;
        runningInvBalance += totalCostOfGoods;
        newLogs.push({ id: nextLogId++, date: newReport.date, type: 'REIMBURSEMENT', description: `Reembolso de costo de Venta #${newReportId}`, amount: totalCostOfGoods, saleId: newReportId, investmentBalanceAfter: runningInvBalance, workerPayoutBalanceAfter: runningPayBalance });
        runningInvBalance += profitToInvestment;
        newLogs.push({ id: nextLogId++, date: newReport.date, type: 'PROFIT_SHARE_INVEST', description: `60% ganancia de Venta #${newReportId} a inversión`, amount: profitToInvestment, saleId: newReportId, investmentBalanceAfter: runningInvBalance, workerPayoutBalanceAfter: runningPayBalance });
        runningPayBalance += profitToPayout;
        newLogs.push({ id: nextLogId++, date: newReport.date, type: 'PROFIT_SHARE_PAYOUT', description: `40% ganancia de Venta #${newReportId} a pagos`, amount: profitToPayout, saleId: newReportId, investmentBalanceAfter: runningInvBalance, workerPayoutBalanceAfter: runningPayBalance });
        const updatedState = { 
          ...prev, 
          products: updatedProducts, 
          reports: [...prev.reports, newReport], 
          investmentBalance: runningInvBalance, 
          workerPayoutBalance: runningPayBalance, 
          transactionLog: [...prev.transactionLog, ...newLogs]
        };
        
        // Agregar la deuda si existe
        if (newDebt) {
          updatedState.debts = [...prev.debts, newDebt];
          // Actualizar el total de deuda del deudor
          updatedState.debtors = prev.debtors.map(d => 
            d.id === newDebt!.debtorId 
              ? { ...d, totalDebt: d.totalDebt + newDebt!.amount }
              : d
          );
        }
        
        return updatedState;
      });
      showNotification('Éxito', `Venta registrada. Saldos actualizados.`);
      setCurrentSale({ items: [], selectedProduct: null, paymentCurrency: 'CUP', amountPaid: '', isDebt: false });
      setSearchTerm('');
      setQuantity('1');
      searchInputRef.current?.focus();
  }, [currentUser, currentSale.items, currentSale.paymentCurrency, saleTotals, setState, showNotification]);
  const handleCloseRegister = useCallback(() => {
    if (!currentUser) {
        showNotification('Error', 'No hay un usuario con sesión iniciada para cerrar la caja.', true);
        return;
    }
    setState(prev => {
        const cupShortage = dailyAuditData.discrepancies.diffCUP;
        const newLogs: TransactionLogEntry[] = [];
        let nextLogId = (prev.transactionLog.length > 0 ? Math.max(...prev.transactionLog.map(t => t.id)) : 0) + 1;
        if (cupShortage < 0) {
            const newLogEntry: TransactionLogEntry = {
                id: nextLogId++,
                date: new Date().toISOString(),
                type: 'CASH_SHORTAGE',
                description: `Faltante de caja por ${currentUser.name}.`,
                amount: cupShortage,
                workerId: currentUser.id,
          investmentBalanceAfter: prev.investmentBalance,
          workerPayoutBalanceAfter: prev.workerPayoutBalance,
            };
            newLogs.push(newLogEntry);
        }
        const cashCountDetails = Object.fromEntries(
            Object.entries(cashCount).map(([den, qty]) => [den, Number(qty) || 0])
        );
        const newAuditReport: AuditReport = {
            id: (prev.auditReports.length > 0 ? Math.max(...prev.auditReports.map(r => r.id)) : 0) + 1,
            date: new Date().toISOString(),
            closedByWorkerId: currentUser.id,
            closedByWorkerName: currentUser.name,
            systemTotals: dailyAuditData.systemTotals,
            countedTotals: {
                countedCUP: dailyAuditData.counted.CUP,
                countedMLC: dailyAuditData.counted.MLC,
                countedUSD: dailyAuditData.counted.USD,
            },
            discrepancies: dailyAuditData.discrepancies,
            cashCountDetails: cashCountDetails
        };
        showNotification('Éxito', 'Cierre de caja registrado correctamente.');
        return { 
            ...prev, 
            auditReports: [...prev.auditReports, newAuditReport],
            transactionLog: [...prev.transactionLog, ...newLogs],
        investmentBalance: prev.investmentBalance
        };
    });
    setCashCount({});
    setCountedMLC('');
    setCountedUSD('');
  }, [currentUser, dailyAuditData, cashCount, setState, showNotification]);

  // Cálculos para deudas
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
      debtor.name.toLowerCase().includes(debtsSearchTerm.toLowerCase()) ||
      debtor.phone.includes(debtsSearchTerm)
    ), [state.debtors, debtsSearchTerm]
  );

  const filteredDebts = useMemo(() => 
    state.debts.filter(debt => 
      debt.debtorName.toLowerCase().includes(debtsSearchTerm.toLowerCase()) ||
      debt.description.toLowerCase().includes(debtsSearchTerm.toLowerCase())
    ), [state.debts, debtsSearchTerm]
  );

  // Handlers para gestión de deudas
  const handleAddDebtor = useCallback((data: any) => {
    const newDebtor = {
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

  const handleAddDebt = useCallback((data: any) => {
    const newDebt = {
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

  const handleAddPayment = useCallback((data: any) => {
    const newPayment = {
      ...data,
      id: Date.now(),
    };

    // Actualizar deuda
    const updatedDebts = state.debts.map(debt => {
      if (debt.id === data.debtId) {
        const newAmount = debt.amount - data.amount;
        const newStatus = newAmount <= 0 ? 'PAID' as const : 'PARTIAL' as const;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-success';
      case 'PARTIAL': return 'text-warning';
      case 'OVERDUE': return 'text-danger';
      case 'CANCELLED': return 'text-gray-400';
      default: return 'text-accent';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID': return 'Pagada';
      case 'PARTIAL': return 'Parcial';
      case 'OVERDUE': return 'Vencida';
      case 'CANCELLED': return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  useEffect(() => {
    const handlePosKeys = (e: KeyboardEvent) => {
        if(document.activeElement?.closest('.modal-content') || activeTab !== 'sale') return;
        if (e.key === 'Enter' && currentSale.selectedProduct && document.activeElement === quantityInputRef.current) { e.preventDefault(); handleAddToSale(); } 
        else if (e.key === 'F9') { e.preventDefault(); paymentInputRef.current?.focus(); paymentInputRef.current?.select(); } 
        else if (e.key === 'F12') { e.preventDefault(); processSale(); }
    };
    document.addEventListener('keydown', handlePosKeys);
    return () => document.removeEventListener('keydown', handlePosKeys);
  }, [activeTab, currentSale.selectedProduct, handleAddToSale, processSale]);

  if (state.products.length === 0 && activeTab === 'sale') {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center p-10 min-h-[60vh] space-y-6">
          <Icon name="fa-rocket" className="text-6xl text-accent mb-6" />
          <h2 className="text-3xl font-bold mb-2">¡Bienvenido a Sistema Izanagi!</h2>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl">
            Parece que es tu primera vez aquí. Para empezar a vender, primero necesitas agregar productos y categorías a tu inventario.
          </p>
          <Button variant="primary" icon="fa-boxes" className="text-lg py-3 px-6" onClick={() => navigate('/inventory')}>Configurar Inventario</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
        <div className="flex gap-2 mb-6 border-b border-slate-700 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('sale')} className={`flex-1 px-4 py-3 text-base font-semibold rounded-t-lg transition ${activeTab === 'sale' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'} focus:outline-none focus:ring-2 focus:ring-accent`}>Venta Actual</button>
          <button onClick={() => setActiveTab('debts')} className={`flex-1 px-4 py-3 text-base font-semibold rounded-t-lg transition ${activeTab === 'debts' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'} focus:outline-none focus:ring-2 focus:ring-accent`}>Venta a Crédito</button>
          <button onClick={() => setActiveTab('audit')} className={`flex-1 px-4 py-3 text-base font-semibold rounded-t-lg transition ${activeTab === 'audit' ? 'bg-accent text-white shadow-md' : 'text-gray-400 hover:bg-slate-700'} focus:outline-none focus:ring-2 focus:ring-accent`}>Auditoría</button>
        </div>
        {activeTab === 'sale' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3 order-2 lg:order-1">
                <Card className="p-2 sm:p-4">
                <CardHeader icon="fa-search">Venta Actual</CardHeader>
                <CardContent>
                    <div className="text-center text-xs text-gray-400 mb-4">Atajos: [Enter] Agregar | [F9] Pagar | [F12] Finalizar</div>
                    <div className="min-h-[140px]">
                    {currentSale.selectedProduct ? (
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-accent relative animate-fade-in">
                      <button onClick={handleCancelSelection} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl leading-none z-10" aria-label="Cancelar selección">&times;</button>
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                            <span className="text-4xl">{state.categories.find(c => c.id === currentSale.selectedProduct!.categoryId)?.icon || DEFAULT_ICON}</span>
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-lg">{currentSale.selectedProduct.name}</p>
                                <p className="text-sm text-gray-400">Precio: ${currentSale.selectedProduct.price.toFixed(2)} | Stock: {currentSale.selectedProduct.stock}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 items-end sm:grid-cols-[1fr_auto]">
                            <InputGroup label="Cantidad"><Input ref={quantityInputRef} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full text-center text-lg" /></InputGroup>
                            <Button icon="fa-plus" onClick={handleAddToSale} className="w-full sm:w-auto text-lg py-3">Agregar al Carrito</Button>
                        </div>
                        </div>
                    ) : (
                    <ProductSearchSection
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      searchResults={searchResults}
                      onSelect={handleSelectProduct}
                      searchInputRef={searchInputRef}
                      categories={state.categories}
                    />
                    )}
                    </div>
                    <div className="mt-6">
                        <h4 className="flex items-center gap-3 text-lg font-semibold mb-3"><Icon name="fa-shopping-cart"/> Carrito de Compra</h4>
                  <CartSection
                    items={currentSale.items}
                    categories={state.categories}
                    onRemove={handleRemoveFromSale}
                  />
                    </div>
                </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 order-1 lg:order-2">
                <Card className="p-2 sm:p-4">
                    <CardHeader icon="fa-money-check-alt">Resumen y Pago</CardHeader>
                    <CardContent className="flex flex-col h-full">
                {currentSale.items.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-4"> <Icon name="fa-shopping-cart" className="text-5xl mb-4 text-slate-600" /> <p className="text-lg font-semibold">El carrito está vacío</p> <p className="text-gray-400">Agregue productos para ver el resumen.</p> </div>
                ) : (
                  <PaymentSummarySection
                    saleTotals={saleTotals}
                    currentSale={currentSale}
                    setCurrentSale={setCurrentSale}
                    changeDisplay={changeDisplay}
                    processSale={processSale}
                    paymentInputRef={paymentInputRef}
                  />
                )}
                    </CardContent>
                </Card>
            </div>
            <style>{` @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in { animation: fade-in 0.3s ease-out forwards; } `}</style>
            </div>
        )}
        {activeTab === 'debts' && (
          <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-accent">{state.debtors.length}</div>
                  <div className="text-sm text-gray-400">Deudores Activos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-warning">{totalDebt.toFixed(2)} CUP</div>
                  <div className="text-sm text-gray-400">Deuda Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-danger">{totalOverdue.toFixed(2)} CUP</div>
                  <div className="text-sm text-gray-400">Deudas Vencidas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center p-4">
                  <div className="text-2xl font-bold text-success">{state.debtPayments.length}</div>
                  <div className="text-sm text-gray-400">Pagos Registrados</div>
                </CardContent>
              </Card>
            </div>

            {/* Sub-pestañas */}
            <div className="flex flex-wrap gap-2 border-b border-slate-700">
              <button
                onClick={() => setDebtsTab('sale')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  debtsTab === 'sale' 
                    ? 'bg-accent text-white' 
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon name="fa-shopping-cart" className="mr-2" />
                Nueva Venta
              </button>
              <button
                onClick={() => setDebtsTab('debtors')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  debtsTab === 'debtors' 
                    ? 'bg-accent text-white' 
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon name="fa-users" className="mr-2" />
                Deudores
              </button>
              <button
                onClick={() => setDebtsTab('debts')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  debtsTab === 'debts' 
                    ? 'bg-accent text-white' 
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon name="fa-credit-card" className="mr-2" />
                Deudas
              </button>
              <button
                onClick={() => setDebtsTab('payments')}
                className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${
                  debtsTab === 'payments' 
                    ? 'bg-accent text-white' 
                    : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                <Icon name="fa-money-bill" className="mr-2" />
                Pagos
              </button>
            </div>

            {/* Contenido de las sub-pestañas */}
            {debtsTab === 'sale' && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-3 order-2 lg:order-1">
                  <Card className="p-2 sm:p-4">
                    <CardHeader icon="fa-search">Venta a Crédito</CardHeader>
                    <CardContent>
                      <div className="text-center text-xs text-gray-400 mb-4">Atajos: [Enter] Agregar | [F9] Pagar | [F12] Finalizar</div>
                      
                      {/* Selección de Deudor */}
                      <div className="mb-6">
                        <h4 className="flex items-center gap-3 text-lg font-semibold mb-3">
                          <Icon name="fa-user"/> Seleccionar Deudor
                        </h4>
                        <InputGroup label="Buscar Deudor" className="relative">
                          <Input 
                            type="text" 
                            placeholder="Buscar por nombre o teléfono..." 
                            value={debtorSearchTerm} 
                            onChange={e => setDebtorSearchTerm(e.target.value)} 
                            autoComplete="off" 
                            className="text-lg" 
                          />
                          {debtorSearchResults.length > 0 && debtorSearchTerm.length > 0 && (
                            <div className="absolute w-full top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg max-h-60 overflow-y-auto z-30 shadow-lg">
                              {debtorSearchResults.map(debtor => (
                                <div 
                                  key={debtor.id} 
                                  onClick={() => {
                                    setSelectedDebtor(debtor);
                                    setCurrentSale(prev => ({ ...prev, debtorId: debtor.id, isDebt: true }));
                                    setDebtorSearchTerm('');
                                  }} 
                                  className="suggestion-item p-3 hover:bg-accent cursor-pointer border-b border-slate-700 flex items-center gap-3"
                                >
                                  <span className="text-xl">👤</span>
                                  <div>
                                    <span className="font-semibold">{debtor.name}</span>
                                    <div className="text-sm text-gray-400">{debtor.phone}</div>
                                    <div className="text-xs text-gray-500">Deuda actual: ${debtor.totalDebt.toFixed(2)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </InputGroup>
                        
                        {selectedDebtor && (
                          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-accent relative animate-fade-in">
                            <button 
                              onClick={() => {
                                setSelectedDebtor(null);
                                setCurrentSale(prev => ({ ...prev, debtorId: undefined, isDebt: false }));
                              }} 
                              className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl leading-none z-10" 
                              aria-label="Cancelar selección"
                            >
                              &times;
                            </button>
                            <div className="flex items-center gap-4">
                              <span className="text-3xl">👤</span>
                              <div>
                                <p className="font-bold text-lg">{selectedDebtor.name}</p>
                                <p className="text-sm text-gray-400">{selectedDebtor.phone}</p>
                                <p className="text-sm text-warning">Deuda actual: ${selectedDebtor.totalDebt.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-h-[140px]">
                        {currentSale.selectedProduct ? (
                          <div className="bg-slate-900/50 p-4 rounded-lg border border-accent relative animate-fade-in">
                            <button onClick={handleCancelSelection} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl leading-none z-10" aria-label="Cancelar selección">&times;</button>
                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
                              <span className="text-4xl">{state.categories.find(c => c.id === currentSale.selectedProduct!.categoryId)?.icon || DEFAULT_ICON}</span>
                              <div className="text-center sm:text-left">
                                <p className="font-bold text-lg">{currentSale.selectedProduct.name}</p>
                                <p className="text-sm text-gray-400">Precio: ${currentSale.selectedProduct.price.toFixed(2)} | Stock: {currentSale.selectedProduct.stock}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 items-end sm:grid-cols-[1fr_auto]">
                              <InputGroup label="Cantidad">
                                <Input ref={quantityInputRef} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full text-center text-lg" />
                              </InputGroup>
                              <Button icon="fa-plus" onClick={handleAddToSale} className="w-full sm:w-auto text-lg py-3">Agregar al Carrito</Button>
                            </div>
                          </div>
                        ) : (
                          <ProductSearchSection
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            searchResults={searchResults}
                            onSelect={handleSelectProduct}
                            searchInputRef={searchInputRef}
                            categories={state.categories}
                          />
                        )}
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="flex items-center gap-3 text-lg font-semibold mb-3">
                          <Icon name="fa-shopping-cart"/> Carrito de Compra
                        </h4>
                        <CartSection
                          items={currentSale.items}
                          categories={state.categories}
                          onRemove={handleRemoveFromSale}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-2 order-1 lg:order-2">
                  <Card className="p-2 sm:p-4">
                    <CardHeader icon="fa-credit-card">Resumen y Pago Parcial</CardHeader>
                    <CardContent className="flex flex-col h-full">
                      {currentSale.items.length === 0 ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500 p-4">
                          <Icon name="fa-shopping-cart" className="text-5xl mb-4 text-slate-600" />
                          <p className="text-lg font-semibold">El carrito está vacío</p>
                          <p className="text-gray-400">Agregue productos para ver el resumen.</p>
                        </div>
                      ) : (
                        <div className="flex-grow space-y-4">
                          <div className="text-right border-b border-slate-700 pb-4 mb-4">
                            <span className="text-gray-400">Total a Pagar</span>
                            <div className="text-3xl font-bold">${saleTotals.total.toFixed(2)} CUP</div>
                          </div>
                          
                          {/* Fecha límite opcional */}
                          <InputGroup label="Fecha Límite (Opcional)">
                            <Input 
                              type="date" 
                              value={currentSale.dueDate || ''} 
                              onChange={e => setCurrentSale(prev => ({ ...prev, dueDate: e.target.value }))}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </InputGroup>
                          
                          {/* Pago parcial */}
                          <InputGroup label="Pago Inicial (Opcional)">
                            <Input 
                              ref={paymentInputRef}
                              type="number" 
                              placeholder="0.00" 
                              value={currentSale.amountPaid} 
                              onChange={e => setCurrentSale(prev => ({ ...prev, amountPaid: e.target.value }))}
                              className="text-lg text-center"
                            />
                          </InputGroup>
                          
                          {currentSale.amountPaid && parseFloat(currentSale.amountPaid) > 0 && (
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                              <div className="text-center">
                                <span className="text-gray-400">Pago Inicial</span>
                                <div className="text-2xl font-bold text-success">${parseFloat(currentSale.amountPaid).toFixed(2)} CUP</div>
                                <span className="text-gray-400">Deuda Restante</span>
                                <div className="text-xl font-bold text-warning">${(saleTotals.total - parseFloat(currentSale.amountPaid)).toFixed(2)} CUP</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex-grow"></div>
                          
                          <Button 
                            icon="fa-check-circle" 
                            onClick={processSale} 
                            className="w-full text-lg py-4"
                            disabled={!selectedDebtor}
                          >
                            {currentSale.amountPaid && parseFloat(currentSale.amountPaid) > 0 ? 'Crear Venta con Pago Parcial' : 'Crear Deuda Completa'}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {debtsTab === 'debtors' && (
              <Card>
                <CardHeader icon="fa-users">
                  <div className="flex justify-between items-center">
                    <span>Gestión de Deudores</span>
                    <Button 
                      icon="fa-plus" 
                      onClick={() => setIsAddDebtorModalOpen(true)}
                      className="text-sm"
                    >
                      Agregar Deudor
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <InputGroup label="Buscar Deudores">
                    <Input 
                      type="text" 
                      placeholder="Buscar por nombre o teléfono..." 
                      value={debtsSearchTerm} 
                      onChange={e => setDebtsSearchTerm(e.target.value)} 
                    />
                  </InputGroup>
                  
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-800">
                        <tr>
                          <th className="px-4 py-3">Nombre</th>
                          <th className="px-4 py-3">Teléfono</th>
                          <th className="px-4 py-3">Email</th>
                          <th className="px-4 py-3">Deuda Total</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {filteredDebtors.map(debtor => (
                          <tr key={debtor.id} className="hover:bg-slate-800/50">
                            <td className="px-4 py-3 font-medium">{debtor.name}</td>
                            <td className="px-4 py-3">{debtor.phone}</td>
                            <td className="px-4 py-3">{debtor.email || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={debtor.totalDebt > 0 ? 'text-warning font-semibold' : 'text-success'}>
                                ${debtor.totalDebt.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                debtor.totalDebt > 0 ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
                              }`}>
                                {debtor.totalDebt > 0 ? 'Con Deuda' : 'Sin Deuda'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => {
                                    setEditingDebtor(debtor);
                                    setIsAddDebtorModalOpen(true);
                                  }}
                                >
                                  <Icon name="fa-edit" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="primary"
                                  onClick={() => {
                                    setSelectedDebtor(debtor);
                                    setDebtsTab('sale');
                                  }}
                                >
                                  <Icon name="fa-shopping-cart" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {debtsTab === 'debts' && (
              <Card>
                <CardHeader icon="fa-credit-card">
                  <div className="flex justify-between items-center">
                    <span>Gestión de Deudas</span>
                    <Button 
                      icon="fa-plus" 
                      onClick={() => setIsAddDebtModalOpen(true)}
                      className="text-sm"
                    >
                      Agregar Deuda
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <InputGroup label="Buscar Deudas">
                    <Input 
                      type="text" 
                      placeholder="Buscar por deudor o descripción..." 
                      value={debtsSearchTerm} 
                      onChange={e => setDebtsSearchTerm(e.target.value)} 
                    />
                  </InputGroup>
                  
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-800">
                        <tr>
                          <th className="px-4 py-3">Deudor</th>
                          <th className="px-4 py-3">Descripción</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Fecha Límite</th>
                          <th className="px-4 py-3">Estado</th>
                          <th className="px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {filteredDebts.map(debt => {
                          const dueDate = new Date(debt.dueDate);
                          const today = new Date();
                          const isOverdue = debt.status === 'PENDING' && dueDate < today;
                          
                          return (
                            <tr key={debt.id} className="hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-medium">{debt.debtorName}</td>
                              <td className="px-4 py-3">{debt.description}</td>
                              <td className="px-4 py-3 font-semibold">${debt.amount.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={isOverdue ? 'text-danger' : ''}>
                                  {dueDate.toLocaleDateString('es-ES')}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(debt.status)}`}>
                                  {getStatusText(debt.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  {debt.status !== 'PAID' && (
                                    <Button 
                                      size="sm" 
                                      variant="success"
                                      onClick={() => {
                                        setSelectedDebt(debt);
                                        setIsPaymentModalOpen(true);
                                      }}
                                    >
                                      <Icon name="fa-money-bill" />
                                    </Button>
                                  )}
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => {
                                      setEditingDebt(debt);
                                      setIsAddDebtModalOpen(true);
                                    }}
                                  >
                                    <Icon name="fa-edit" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {debtsTab === 'payments' && (
              <Card>
                <CardHeader icon="fa-money-bill">
                  <span>Historial de Pagos</span>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-slate-800">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3">Deudor</th>
                          <th className="px-4 py-3">Monto</th>
                          <th className="px-4 py-3">Método</th>
                          <th className="px-4 py-3">Recibido por</th>
                          <th className="px-4 py-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {state.debtPayments.map(payment => (
                          <tr key={payment.id} className="hover:bg-slate-800/50">
                            <td className="px-4 py-3">
                              {new Date(payment.paymentDate).toLocaleDateString('es-ES')}
                            </td>
                            <td className="px-4 py-3 font-medium">
                              {state.debts.find(d => d.id === payment.debtId)?.debtorName || 'N/A'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-success">
                              ${payment.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">{payment.paymentMethod}</td>
                            <td className="px-4 py-3">{payment.receivedByWorkerName}</td>
                            <td className="px-4 py-3">{payment.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {activeTab === 'audit' && (
        <AuditSection
          dailyAuditData={dailyAuditData}
          cashCount={cashCount}
          setCashCount={setCashCount}
          countedMLC={countedMLC}
          setCountedMLC={setCountedMLC}
          countedUSD={countedUSD}
          setCountedUSD={setCountedUSD}
          totalCountedCUP={totalCountedCUP}
          handleCloseRegister={handleCloseRegister}
        />
        )}

        {/* Modales para gestión de deudas */}
        {isAddDebtorModalOpen && (
          <Modal
            isOpen={isAddDebtorModalOpen}
            onClose={() => {
              setIsAddDebtorModalOpen(false);
              setEditingDebtor(null);
            }}
            title={editingDebtor ? 'Editar Deudor' : 'Agregar Deudor'}
          >
            <DebtorForm
              debtor={editingDebtor}
              onSave={handleAddDebtor}
              onCancel={() => {
                setIsAddDebtorModalOpen(false);
                setEditingDebtor(null);
              }}
            />
          </Modal>
        )}

        {isAddDebtModalOpen && (
          <Modal
            isOpen={isAddDebtModalOpen}
            onClose={() => {
              setIsAddDebtModalOpen(false);
              setEditingDebt(null);
            }}
            title={editingDebt ? 'Editar Deuda' : 'Agregar Deuda'}
          >
            <DebtForm
              debt={editingDebt}
              debtors={state.debtors}
              onSave={handleAddDebt}
              onCancel={() => {
                setIsAddDebtModalOpen(false);
                setEditingDebt(null);
              }}
            />
          </Modal>
        )}

        {isPaymentModalOpen && selectedDebt && (
          <Modal
            isOpen={isPaymentModalOpen}
            onClose={() => {
              setIsPaymentModalOpen(false);
              setSelectedDebt(null);
            }}
            title="Registrar Pago"
          >
            <PaymentForm
              debt={selectedDebt}
              onSave={handleAddPayment}
              onCancel={() => {
                setIsPaymentModalOpen(false);
                setSelectedDebt(null);
              }}
            />
          </Modal>
        )}
      </div>
    );
  };

  // Componentes de formularios
  const DebtorForm: React.FC<{
    debtor?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
  }> = ({ debtor, onSave, onCancel }) => {
    const [name, setName] = useState(debtor?.name || '');
    const [phone, setPhone] = useState(debtor?.phone || '');
    const [email, setEmail] = useState(debtor?.email || '');
    const [address, setAddress] = useState(debtor?.address || '');
    const [creditLimit, setCreditLimit] = useState(debtor?.creditLimit?.toString() || '0');
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
      <div className="space-y-4">
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
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" icon="fa-save" onClick={handleSubmit}>
            {debtor ? 'Actualizar' : 'Guardar'} Deudor
          </Button>
        </div>
      </div>
    );
  };

  const DebtForm: React.FC<{
    debt?: any;
    debtors: any[];
    onSave: (data: any) => void;
    onCancel: () => void;
  }> = ({ debt, debtors, onSave, onCancel }) => {
    const [debtorId, setDebtorId] = useState(debt?.debtorId?.toString() || '');
    const [amount, setAmount] = useState(debt?.amount?.toString() || '');
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
      <div className="space-y-4">
        <InputGroup label="Deudor *">
          <Select value={debtorId} onChange={e => setDebtorId(e.target.value)}>
            <option value="">Seleccionar deudor</option>
            {debtors.map(debtor => (
              <option key={debtor.id} value={debtor.id}>{debtor.name} - {debtor.phone}</option>
            ))}
          </Select>
        </InputGroup>
        <InputGroup label="Monto (CUP) *">
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" step="0.01" />
        </InputGroup>
        <InputGroup label="Descripción *">
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción de la deuda" />
        </InputGroup>
        <InputGroup label="Fecha Límite *">
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
        </InputGroup>
        <InputGroup label="Notas">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas adicionales" />
        </InputGroup>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" icon="fa-save" onClick={handleSubmit}>
            {debt ? 'Actualizar' : 'Guardar'} Deuda
          </Button>
        </div>
      </div>
    );
  };

  const PaymentForm: React.FC<{
    debt: any;
    onSave: (data: any) => void;
    onCancel: () => void;
  }> = ({ debt, onSave, onCancel }) => {
    const { currentUser } = useContext(DataContext);
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [notes, setNotes] = useState('');

    const handleSubmit = () => {
      if (!amount || !currentUser) {
        alert('Monto es obligatorio.');
        return;
      }
      const paymentAmount = Number(amount);
      if (paymentAmount <= 0 || paymentAmount > debt.amount) {
        alert('El monto debe ser mayor a 0 y no puede exceder la deuda.');
        return;
      }
      onSave({
        debtId: debt.id,
        amount: paymentAmount,
        paymentDate: new Date().toISOString(),
        paymentMethod,
        receivedByWorkerId: currentUser.id,
        receivedByWorkerName: currentUser.name,
        notes: notes.trim() || undefined,
      });
    };

    return (
      <div className="space-y-4">
        <div className="bg-slate-900/50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Información de la Deuda</h4>
          <p><strong>Deudor:</strong> {debt.debtorName}</p>
          <p><strong>Descripción:</strong> {debt.description}</p>
          <p><strong>Monto Restante:</strong> ${debt.amount.toFixed(2)} CUP</p>
        </div>
        <InputGroup label="Monto a Pagar (CUP) *">
          <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min="0" max={debt.amount} step="0.01" />
        </InputGroup>
        <InputGroup label="Método de Pago">
          <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="CASH">Efectivo</option>
            <option value="MLC">MLC</option>
            <option value="USD">USD</option>
            <option value="TRANSFER">Transferencia</option>
            <option value="OTHER">Otro</option>
          </Select>
        </InputGroup>
        <InputGroup label="Notas">
          <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas del pago" />
        </InputGroup>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" icon="fa-money-bill" onClick={handleSubmit}>
            Registrar Pago
          </Button>
        </div>
      </div>
    );
  };

export default PosPage;