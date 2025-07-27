
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext } from '../context';
import { PayrollDetail, PayrollReport, TransactionLogEntry } from '../types';
import { Card, CardHeader, CardContent, Button } from '../components/ui';
import Modal from '../components/Modal';

// --- COMPONENTES INTERNOS ---
const PayrollSummary: React.FC<{
  workerPayoutBalance: number;
  onOpenModal: () => void;
  disabled: boolean;
}> = React.memo(({ workerPayoutBalance, onOpenModal, disabled }) => (
                    <Card>
                        <CardHeader icon="fa-file-invoice-dollar">Nómina</CardHeader>
                        <CardContent className="text-center">
                            <p className="text-gray-400">Fondo de Pago Actual</p>
      <p className="text-4xl font-bold text-success my-2">{workerPayoutBalance.toFixed(2)} <span className="text-2xl">CUP</span></p>
                            <p className="text-xs text-gray-500 mb-6">Este es el 40% acumulado de las ganancias de todas las ventas.</p>
                            <Button 
                                icon="fa-cogs" 
                                className="w-full justify-center min-h-[44px] text-base py-3 active:scale-95 touch-manipulation no-hover" 
        onClick={onOpenModal}
        disabled={disabled}
        aria-live="polite"
                            >
                                Generar y Procesar Nómina
                            </Button>
                        </CardContent>
                    </Card>
));

const PayrollHistory: React.FC<{
  payrollReports: PayrollReport[];
}> = React.memo(({ payrollReports }) => (
                    <Card>
                        <CardHeader icon="fa-history">Historial de Nóminas</CardHeader>
                        <CardContent className="max-h-[70vh] overflow-y-auto">
      {payrollReports.length === 0 ? (
                                <div className="text-center p-8 text-gray-500">
                                    No se han procesado nóminas todavía.
                                </div>
                            ) : (
                                <div className="space-y-4">
          {[...payrollReports].reverse().map(report => (
                                        <details key={report.id} className="bg-slate-800/60 rounded-lg p-4 active:scale-95 touch-manipulation no-hover">
                                            <summary className="font-bold cursor-pointer flex justify-between">
                                                <span>Nómina #{report.id} - {new Date(report.date).toLocaleDateString()}</span>
                                                <span className="text-accent">{report.totalPayoutFund.toFixed(2)} CUP</span>
                                            </summary>
                                            <div className="mt-4 pt-4 border-t border-slate-700">
                                                <p className="text-xs text-gray-400">Procesado por: {report.processedByWorkerName}</p>
                                                <table className="w-full text-sm mt-2">
                                                    <thead>
                                                        <tr className="text-left border-b border-slate-600">
                                                            <th className="py-1">Trabajador</th>
                                                            <th className="py-1 text-right">Pago Bruto</th>
                                                            <th className="py-1 text-right text-danger">Deducciones</th>
                                                            <th className="py-1 text-right text-success">Pago Final</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {report.details.map(d => (
                                                            <tr key={d.workerId}>
                                                                <td className="py-1 font-semibold">{d.workerName} <span className="text-xs text-gray-400">({d.role})</span></td>
                                                                <td className="py-1 text-right">{d.grossPay.toFixed(2)}</td>
                                                                <td className="py-1 text-right text-danger">-{d.shortageDeductions.toFixed(2)}</td>
                                                                <td className="py-1 text-right font-bold text-success">{d.finalPay.toFixed(2)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
));

const PayrollModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  payrollCalculation: any;
  lastPayrollDate: string;
  onProcess: () => void;
}> = React.memo(({ isOpen, onClose, payrollCalculation, lastPayrollDate, onProcess }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Procesar Nómina">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Resumen de la Nómina</h3>
                    <div className="bg-slate-900/50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between"><span>Período:</span> <span className="font-semibold">{new Date(lastPayrollDate).toLocaleDateString()} - Hoy</span></div>
                        <div className="flex justify-between"><span>Fondo Total a Pagar:</span> <span className="font-semibold text-success">{payrollCalculation.totalPayoutFund.toFixed(2)} CUP</span></div>
                        <hr className="border-slate-700" />
                        <div className="flex justify-between"><span>Parte del Administrador (30%):</span> <span className="font-semibold">{payrollCalculation.adminShare.toFixed(2)} CUP</span></div>
                        <div className="flex justify-between"><span>Parte de Trabajadores (70%):</span> <span className="font-semibold">{payrollCalculation.workerSharePool.toFixed(2)} CUP</span></div>
                    </div>
                    <h4 className="font-bold pt-2">Desglose por Trabajador</h4>
                    <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[40vh] no-scrollbar">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary text-left sticky top-0">
                                <tr>
                                    <th className="p-2">Trabajador</th>
                                    <th className="p-2 text-right">Pago Bruto</th>
                                    <th className="p-2 text-right">Deducciones</th>
                                    <th className="p-2 text-right">Pago Final</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollCalculation.details.length === 0 ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">No hay trabajadores para procesar.</td></tr>
            ) : payrollCalculation.details.map((d: any) => (
                                    <tr key={d.workerId} className="border-t border-slate-700">
                                        <td className="p-2 font-semibold">{d.workerName}</td>
                                        <td className="p-2 text-right">{d.grossPay.toFixed(2)}</td>
                                        <td className="p-2 text-right text-danger">-{d.shortageDeductions.toFixed(2)}</td>
                                        <td className="p-2 text-right font-bold text-success">{d.finalPay.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400">
                        El Pago Bruto se calcula basado en la contribución de cada trabajador a las ganancias del período. Las deducciones corresponden a faltantes de caja registrados.
                    </p>
                    <div className="flex justify-end gap-4 pt-4">
        <Button onClick={onClose} className="min-h-[44px] px-5 py-3 active:scale-95 touch-manipulation no-hover">Cancelar</Button>
        <Button variant="success" icon="fa-check" onClick={onProcess} className="min-h-[44px] px-5 py-3 active:scale-95 touch-manipulation no-hover">
                            Confirmar y Pagar
                        </Button>
                    </div>
                </div>
            </Modal>
));

export const PayrollPage: React.FC = () => {
  const { state, setState, showNotification, currentUser } = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lastPayrollDate = useMemo(() => {
    if (state.payrollReports.length === 0) {
      return new Date(0).toISOString();
    }
    return state.payrollReports[state.payrollReports.length - 1].date;
  }, [state.payrollReports]);

  const payrollCalculation = useMemo(() => {
    const periodStartDate = new Date(lastPayrollDate);
    const periodSales = state.reports.filter(r => new Date(r.date) > periodStartDate);
    const periodShortages = state.transactionLog.filter(t => t.type === 'CASH_SHORTAGE' && new Date(t.date) > periodStartDate);
    const contributionsByWorker: { [key: number]: number } = {};
    const shortagesByWorker: { [key: number]: number } = {};
    for(const sale of periodSales) {
      const workerId = sale.soldByWorkerId;
      const saleProfit = sale.items.reduce((profit: number, item: any) => profit + (item.price - item.costPrice) * item.quantity, 0);
      const payoutShare = saleProfit * 0.40;
      contributionsByWorker[workerId] = (contributionsByWorker[workerId] || 0) + payoutShare;
    }
    for(const shortage of periodShortages) {
      if(shortage.workerId !== undefined) {
        shortagesByWorker[shortage.workerId] = (shortagesByWorker[shortage.workerId] || 0) + shortage.amount;
      }
    }
    const totalPayoutFund = state.workerPayoutBalance;
    const adminShare = totalPayoutFund * 0.30;
    const workerSharePool = totalPayoutFund * 0.70;
    const nonAdminWorkers = state.workers.filter(w => w.role !== 'Admin');
    const adminWorkers = state.workers.filter(w => w.role === 'Admin');
    const totalNonAdminContributions = nonAdminWorkers.reduce((total, worker) => total + (contributionsByWorker[worker.id] || 0), 0);
    const details: PayrollDetail[] = [];
    for(const worker of nonAdminWorkers) {
      const contribution = contributionsByWorker[worker.id] || 0;
      const contributionPercent = totalNonAdminContributions > 0 ? contribution / totalNonAdminContributions : 0;
      const grossPay = workerSharePool * contributionPercent;
      const shortageDeductions = Math.abs(shortagesByWorker[worker.id] || 0);
      const finalPay = Math.max(0, grossPay - shortageDeductions);
      details.push({
        workerId: worker.id,
        workerName: worker.name,
        role: worker.role,
        salesContribution: contribution,
        grossPay,
        shortageDeductions,
        finalPay
      });
    }
    const adminSharePerAdmin = adminWorkers.length > 0 ? adminShare / adminWorkers.length : adminShare;
    for(const admin of adminWorkers) {
      details.push({
        workerId: admin.id,
        workerName: admin.name,
        role: admin.role,
        salesContribution: contributionsByWorker[admin.id] || 0,
        grossPay: adminSharePerAdmin,
        shortageDeductions: 0,
        finalPay: adminSharePerAdmin,
      });
    }
    return {
      totalPayoutFund,
      adminShare,
      workerSharePool,
      details: [...details].sort((a,b) => b.finalPay - a.finalPay),
      periodStartDate: periodStartDate.toISOString(),
      periodEndDate: new Date().toISOString(),
    };
  }, [state, lastPayrollDate]);

  const handleProcessPayroll = useCallback(() => {
    if (!currentUser) {
      showNotification('Error', 'No hay un usuario con sesión iniciada.', true);
      return;
    }
    const { totalPayoutFund, adminShare, workerSharePool, details, periodStartDate, periodEndDate } = payrollCalculation;
    if (totalPayoutFund <= 0) {
      showNotification('Aviso', 'El fondo de pago está en cero. No hay nada que procesar.', true);
      return;
    }
    setState(prev => {
      const nextPayrollId = (prev.payrollReports.length > 0 ? Math.max(...prev.payrollReports.map(p => p.id)) : 0) + 1;
      const newPayrollReport: PayrollReport = {
        id: nextPayrollId,
        date: new Date().toISOString(),
        processedByWorkerName: currentUser.name,
        periodStartDate,
        periodEndDate,
        totalPayoutFund,
        adminShare,
        workerShare: workerSharePool,
        details
      };
      const nextLogId = (prev.transactionLog.length > 0 ? Math.max(...prev.transactionLog.map(t => t.id)) : 0) + 1;
      const newLogEntry: TransactionLogEntry = {
        id: nextLogId,
        date: new Date().toISOString(),
        type: 'PAYOUT_RESET',
        description: `Pago de nómina #${nextPayrollId} procesado.`,
        amount: -totalPayoutFund,
        investmentBalanceAfter: prev.investmentBalance,
        workerPayoutBalanceAfter: 0,
      };
      return {
        ...prev,
        workerPayoutBalance: 0,
        payrollReports: [...prev.payrollReports, newPayrollReport],
        transactionLog: [...prev.transactionLog, newLogEntry]
      };
    });
    showNotification('Éxito', 'Nómina procesada y fondo de pago reiniciado.');
    setIsModalOpen(false);
  }, [payrollCalculation, currentUser, setState, showNotification]);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PayrollSummary
            workerPayoutBalance={state.workerPayoutBalance}
            onOpenModal={() => setIsModalOpen(true)}
            disabled={state.workerPayoutBalance <= 0}
          />
        </div>
        <div className="lg:col-span-2">
          <PayrollHistory payrollReports={state.payrollReports} />
        </div>
      </div>
      <PayrollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        payrollCalculation={payrollCalculation}
        lastPayrollDate={lastPayrollDate}
        onProcess={handleProcessPayroll}
      />
        </>
    );
};
