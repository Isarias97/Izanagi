
import React, { useState, useContext, useMemo, useCallback } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Icon } from '../components/ui';
import { TransactionType, AuditReport, SaleReport } from '../types';
import { getPeriodDates, getTransactionTypeStyle, DiscrepancyDisplay } from '../utils';
import ReportDownloadButtons from '../components/ReportDownloadButtons';

import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, LineChart, Line } from 'recharts';

type ReportTab = 'sales' | 'profits' | 'transactions' | 'capital' | 'audit';
type ProfitPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';

// --- COMPONENTES INTERNOS ---
const SalesTab: React.FC<{
  filteredSalesReports: any[];
  salesSummary: any;
  salesChartData: any[];
  startDate: string;
  endDate: string;
  setStartDate: (v: string) => void;
  setEndDate: (v: string) => void;
  workerName?: string;
}> = React.memo(({ filteredSalesReports, salesSummary, salesChartData, startDate, endDate, setStartDate, setEndDate, workerName }) => (
                    <div className="space-y-8">
                        {/* Botones de descarga específicos para ventas */}
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Reporte de Ventas</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              icon="fa-download"
                              onClick={() => {
                                const { generateSalesPDF } = require('../utils/pdfReports');
                                generateSalesPDF(filteredSalesReports, {
                                  title: 'Reporte de Ventas',
                                  subtitle: 'Sistema Izanagi',
                                  dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
                                  includeDetails: false,
                                  workerName
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Básico
                            </Button>
                            <Button
                              variant="success"
                              icon="fa-file-pdf"
                              onClick={() => {
                                const { generateSalesPDF } = require('../utils/pdfReports');
                                generateSalesPDF(filteredSalesReports, {
                                  title: 'Reporte Detallado de Ventas',
                                  subtitle: 'Sistema Izanagi',
                                  dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
                                  includeDetails: true,
                                  workerName
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Detallado
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-900/50 rounded-lg items-end">
                            <InputGroup label="Fecha de inicio">
                                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </InputGroup>
                            <InputGroup label="Fecha de fin">
                                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </InputGroup>
                            <Button icon="fa-times-circle" onClick={() => { setStartDate(''); setEndDate(''); }} disabled={!startDate && !endDate}>
                                Limpiar Filtros
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                             <div className="bg-secondary p-6 rounded-lg"><div className="text-4xl font-bold">{salesSummary.salesCount}</div><div className="text-sm text-gray-400 mt-1">Ventas Totales</div></div>
                             <div className="bg-secondary p-6 rounded-lg"><div className="text-4xl font-bold">{salesSummary.itemsSold}</div><div className="text-sm text-gray-400 mt-1">Artículos Vendidos</div></div>
                             <div className="bg-secondary p-6 rounded-lg"><div className="text-4xl font-bold">{salesSummary.revenue.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div><div className="text-sm text-gray-400 mt-1">Ingresos Brutos</div></div>
                             <div className="bg-success/20 border border-success p-6 rounded-lg"><div className="text-4xl font-bold text-success">{salesSummary.netProfit.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div><div className="text-sm text-green-300/80 mt-1">Ganancia Neta</div></div>
                        </div>
                        <div className="w-full h-80 bg-slate-900/50 p-4 rounded-lg flex items-center justify-center">
                            {salesChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                        <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#94a3b8' }} />
                                        <Tooltip cursor={{fill: 'rgba(92, 107, 192, 0.2)'}}/>
                                        <Legend />
                                        <Bar dataKey="Ingresos" fill="#5c6bc0" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (<p className="text-gray-500">No hay datos para mostrar en este período.</p>)}
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[500px] no-scrollbar">
                            <table className="w-full text-sm text-left text-gray-300 min-w-[900px]">
                                <thead className="text-xs text-gray-300 uppercase bg-secondary sticky top-0">
                                    <tr><th scope="col" className="px-6 py-3">ID</th><th scope="col" className="px-6 py-3">Fecha</th><th scope="col" className="px-6 py-3">Items</th><th scope="col" className="px-6 py-3">Total (CUP)</th><th scope="col" className="px-6 py-3">Ganancia (CUP)</th><th scope="col" className="px-6 py-3">Pago</th><th scope="col" className="px-6 py-3">Vuelto (CUP)</th></tr>
                                </thead>
                                <tbody>
                                    {[...filteredSalesReports].reverse().map(r => {
            const reportCost = r.items.reduce((sum: number, i: any) => sum + (i.costPrice * i.quantity), 0);
                                        const reportProfit = r.total - reportCost;
                                        return (
                                            <tr key={r.id} className="border-b border-slate-700 bg-slate-900/30 active:scale-95 touch-manipulation no-hover">
                                                <td className="px-6 py-4">{r.id}</td><td className="px-6 py-4">{new Date(r.date).toLocaleString()}</td><td className="px-6 py-4">{r.itemsCount}</td><td className="px-6 py-4 font-semibold">${r.total.toFixed(2)}</td><td className={`px-6 py-4 font-semibold ${reportProfit >= 0 ? 'text-success' : 'text-danger'}`}>${reportProfit.toFixed(2)}</td><td className="px-6 py-4">{r.payment.currency} (${r.payment.amountPaid.toFixed(2)})</td><td className="px-6 py-4">${r.payment.changeInCup.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
));

const ProfitsTab: React.FC<{
  profitData: any;
  profitPeriod: ProfitPeriod;
  setProfitPeriod: (p: ProfitPeriod) => void;
}> = React.memo(({ profitData, profitPeriod, setProfitPeriod }) => (
                     <div className="space-y-8">
                        <div className="flex flex-wrap gap-2 p-4 bg-slate-900/50 rounded-lg">
                           {(['daily', 'weekly', 'monthly', 'annually'] as ProfitPeriod[]).map(p => (<Button key={p} onClick={() => setProfitPeriod(p)} className={profitPeriod === p ? 'bg-accent' : 'bg-secondary'}>{p === 'daily' && 'Hoy'}{p === 'weekly' && 'Esta Semana'}{p === 'monthly' && 'Este Mes'}{p === 'annually' && 'Este Año'}</Button>))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="bg-secondary p-6 rounded-lg"><div className="text-4xl font-bold">{profitData.summary.revenue.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div><div className="text-sm text-gray-400 mt-1">Ingresos</div></div>
                            <div className="bg-secondary p-6 rounded-lg"><div className="text-4xl font-bold">{profitData.summary.cost.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div><div className="text-sm text-gray-400 mt-1">Costos</div></div>
                            <div className="bg-success/20 border border-success p-6 rounded-lg"><div className="text-4xl font-bold text-success">{profitData.summary.profit.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div><div className="text-sm text-green-300/80 mt-1">Ganancia Neta</div></div>
                        </div>
                         <div className="w-full h-96 bg-slate-900/50 p-4 rounded-lg flex items-center justify-center">
                            {profitData.chart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%"><BarChart data={profitData.chart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#475569" /><XAxis dataKey="name" tick={{ fill: '#94a3b8' }} /><YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#94a3b8' }} /><Tooltip cursor={{fill: 'rgba(76, 175, 80, 0.2)'}} contentStyle={{backgroundColor: '#334155'}}/><Bar dataKey="Ganancia" fill="#4caf50" /></BarChart></ResponsiveContainer>
                            ) : (<p className="text-gray-500">No hay datos para mostrar en este período.</p>)}
                        </div>
                    </div>
));

const TransactionsTab: React.FC<{
  transactionLog: any[];
  workerName?: string;
}> = React.memo(({ transactionLog, workerName }) => (
                    <div className="space-y-6">
                        {/* Botones de descarga específicos para transacciones */}
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Reporte de Transacciones</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              icon="fa-download"
                              onClick={() => {
                                const { generateTransactionsPDF } = require('../utils/pdfReports');
                                generateTransactionsPDF(transactionLog, {
                                  title: 'Reporte de Transacciones',
                                  subtitle: 'Sistema Izanagi',
                                  includeDetails: false,
                                  workerName
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Básico
                            </Button>
                            <Button
                              variant="success"
                              icon="fa-file-pdf"
                              onClick={() => {
                                const { generateTransactionsPDF } = require('../utils/pdfReports');
                                generateTransactionsPDF(transactionLog, {
                                  title: 'Reporte Detallado de Transacciones',
                                  subtitle: 'Sistema Izanagi',
                                  includeDetails: true,
                                  workerName
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Detallado
                            </Button>
                          </div>
                        </div>
                        
                         <div className="bg-slate-900/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold">Historial de Transacciones</h3>
                            <p className="text-sm text-gray-400">Todos los movimientos de fondos de la aplicación.</p>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[70vh] no-scrollbar">
                             <table className="w-full text-sm text-left text-gray-300 min-w-[900px]">
                                <thead className="text-xs text-gray-300 uppercase bg-secondary sticky top-0">
                                    <tr><th scope="col" className="px-6 py-3">Fecha</th><th scope="col" className="px-6 py-3">Tipo</th><th scope="col" className="px-6 py-3">Descripción</th><th scope="col" className="px-6 py-3 text-right">Monto (CUP)</th><th scope="col" className="px-6 py-3 text-right">Saldo Inversión</th><th scope="col" className="px-6 py-3 text-right">Saldo Pagos</th></tr>
                                </thead>
                                <tbody>
          {[...transactionLog].reverse().map(log => {
                                        const typeStyle = getTransactionTypeStyle(log.type);
                                        return (
                                            <tr key={log.id} className="border-b border-slate-700 bg-slate-900/30 active:scale-95 touch-manipulation no-hover">
                                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.date).toLocaleString()}</td>
                                                <td className={`px-6 py-4 font-semibold whitespace-nowrap ${typeStyle.color}`}><Icon name={typeStyle.icon} className="mr-2"/>{typeStyle.label}</td>
                                                <td className="px-6 py-4">{log.description}</td>
                                                <td className={`px-6 py-4 text-right font-bold ${log.amount >= 0 ? 'text-success' : 'text-danger'}`}>{log.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right">{log.investmentBalanceAfter.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right">{log.workerPayoutBalanceAfter.toFixed(2)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
));

const CapitalTab: React.FC<{
  capitalData: any;
  investmentBalance: number;
}> = React.memo(({ capitalData, investmentBalance }) => (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="bg-success/20 border border-success p-6 rounded-lg">
        <div className="text-4xl font-bold text-success">{investmentBalance.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div>
                                <div className="text-sm text-green-300/80 mt-1">Saldo de Inversión Actual</div>
                            </div>
                            <div className="bg-secondary p-6 rounded-lg">
                                <div className="text-4xl font-bold">{capitalData.totalPurchasesCost.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div>
                                <div className="text-sm text-gray-400 mt-1">Total Gastado en Compras</div>
                            </div>
                            <div className="bg-secondary p-6 rounded-lg">
                                <div className="text-4xl font-bold">{capitalData.totalReinvestedProfit.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div>
                                <div className="text-sm text-gray-400 mt-1">Total de Ganancias Reinvertidas</div>
                            </div>
                        </div>
                        <div className="w-full h-96 bg-slate-900/50 p-4 rounded-lg flex items-center justify-center">
                            {capitalData.chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={capitalData.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8' }} />
                                        <YAxis tickFormatter={(value) => `$${value}`} tick={{ fill: '#94a3b8' }} domain={['dataMin', 'dataMax']} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(129, 199, 132, 0.2)' }}
                                            contentStyle={{ backgroundColor: '#334155' }}
                                            labelStyle={{ color: '#cbd5e1' }}
                                            itemStyle={{ color: '#81c784', fontWeight: 'bold' }}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="Saldo de Inversión" stroke="#81c784" strokeWidth={2} dot={{ r: 4, fill: '#81c784' }} activeDot={{ r: 8, stroke: '#fff' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-gray-500">
                                    <Icon name="fa-chart-line" className="text-4xl mb-3" />
                                    <p>No hay historial de transacciones para mostrar un gráfico.</p>
                                </div>
                            )}
                        </div>
                    </div>
));
                
const AuditTab: React.FC<{
  auditReports: AuditReport[];
  workerName?: string;
  salesReports: SaleReport[];
}> = React.memo(({ auditReports, workerName, salesReports }) => (
                    <div className="space-y-6">
                        {/* Botones de descarga específicos para auditoría */}
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Reporte de Auditoría</h3>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              icon="fa-download"
                              onClick={() => {
                                const { generateAuditPDF } = require('../utils/pdfReports');
                                generateAuditPDF(auditReports, {
                                  title: 'Reporte de Auditoría',
                                  subtitle: 'Sistema Izanagi',
                                  includeDetails: false,
                                  workerName,
                                  salesOfDay: salesReports,
                                  salesOfShift: salesReports
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Básico
                            </Button>
                            <Button
                              variant="success"
                              icon="fa-file-pdf"
                              onClick={() => {
                                const { generateAuditPDF } = require('../utils/pdfReports');
                                generateAuditPDF(auditReports, {
                                  title: 'Reporte Detallado de Auditoría',
                                  subtitle: 'Sistema Izanagi',
                                  includeDetails: true,
                                  workerName,
                                  salesOfDay: salesReports,
                                  salesOfShift: salesReports
                                });
                              }}
                              className="text-sm"
                            >
                              PDF Detallado
                            </Button>
                          </div>
                        </div>
                        
                        <div className="bg-slate-900/50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold">Historial de Cierres de Caja</h3>
                            <p className="text-sm text-gray-400">Registro de todas las auditorías y discrepancias.</p>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[70vh] no-scrollbar">
                             <table className="w-full text-sm text-left text-gray-300 min-w-[900px]">
                                <thead className="text-xs text-gray-300 uppercase bg-secondary sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Fecha</th>
                                        <th scope="col" className="px-6 py-3">Cerrado Por</th>
                                        <th scope="col" className="px-6 py-3 text-right">Dif. CUP</th>
                                        <th scope="col" className="px-6 py-3 text-right">Dif. MLC</th>
                                        <th scope="col" className="px-6 py-3 text-right">Dif. USD</th>
                                    </tr>
                                </thead>
                                <tbody>
          {[...auditReports].reverse().map((report: AuditReport) => (
                                        <tr key={report.id} className="border-b border-slate-700 bg-slate-900/30 active:scale-95 touch-manipulation no-hover">
                                            <td className="px-6 py-4 whitespace-nowrap">{new Date(report.date).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-semibold">{report.closedByWorkerName}</td>
                                            <td className="px-6 py-4 text-right"><DiscrepancyDisplay value={report.discrepancies.diffCUP} /></td>
                                            <td className="px-6 py-4 text-right"><DiscrepancyDisplay value={report.discrepancies.diffMLC} /></td>
                                            <td className="px-6 py-4 text-right"><DiscrepancyDisplay value={report.discrepancies.diffUSD} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
));

const ReportsPage: React.FC = () => {
  const { state } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [profitPeriod, setProfitPeriod] = useState<ProfitPeriod>('monthly');
  const [currentWorker] = useState(() => {
    // Obtener el trabajador actual del localStorage o contexto
    const workerId = localStorage.getItem('currentWorkerId');
    if (workerId) {
      const worker = state.workers.find(w => w.id === parseInt(workerId));
      return worker?.name || 'Usuario';
    }
    return 'Usuario';
  });

  const filteredSalesReports = useMemo(() => {
    return state.reports.filter(report => {
      const reportDate = new Date(report.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start && reportDate < start) return false;
      if (end && reportDate > end) return false;
      return true;
    });
  }, [state.reports, startDate, endDate]);

  const salesSummary = useMemo(() => {
    const revenue = filteredSalesReports.reduce((sum, r) => sum + r.total, 0);
    const costOfGoods = filteredSalesReports.reduce((sum, r) => {
      return sum + r.items.reduce((itemSum: number, i: any) => itemSum + (i.costPrice * i.quantity), 0);
    }, 0);
    const netProfit = revenue - costOfGoods;
    const salesCount = filteredSalesReports.length;
    const itemsSold = filteredSalesReports.reduce((sum, r) => sum + r.itemsCount, 0);
    return { revenue, salesCount, itemsSold, netProfit };
  }, [filteredSalesReports]);

  const salesChartData = useMemo(() => {
    const salesByDay = filteredSalesReports.reduce((acc: any, s: any) => {
      const day = new Date(s.date).toLocaleDateString('es-ES', { year:'2-digit', month:'2-digit', day:'2-digit' });
      acc[day] = (acc[day] || 0) + s.total;
      return acc;
    }, {} as {[key: string]: number});
    return Object.entries(salesByDay).map(([name, Ingresos]) => ({name, Ingresos})).slice(-30);
  }, [filteredSalesReports]);

  const profitData = useMemo(() => {
    const { start, end } = getPeriodDates(profitPeriod);
    const reportsInPeriod = state.reports.filter(r => {
      const date = new Date(r.date);
      return date >= start && date <= end;
    });
    const revenue = reportsInPeriod.reduce((sum, r) => sum + r.total, 0);
    const cost = reportsInPeriod.reduce((sum, r) => sum + r.items.reduce((iSum: number, i: any) => iSum + (i.costPrice * i.quantity), 0), 0);
    const profit = revenue - cost;
    const chartData = reportsInPeriod.reduce((acc: any, s: any) => {
      let key = '';
      const date = new Date(s.date);
      if (profitPeriod === 'daily') key = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'});
      else if (profitPeriod === 'weekly' || profitPeriod === 'monthly') key = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      else if (profitPeriod === 'annually') key = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
      const saleProfit = s.total - s.items.reduce((iSum: number, i: any) => iSum + (i.costPrice * i.quantity), 0);
      acc[key] = (acc[key] || 0) + saleProfit;
      return acc;
    }, {} as {[key: string]: number});
    return {
      summary: { revenue, cost, profit },
      chart: Object.entries(chartData).map(([name, Ganancia]) => ({ name, Ganancia })),
    };
  }, [state.reports, profitPeriod]);

  const capitalData = useMemo(() => {
    const totalPurchasesCost = state.transactionLog
      .filter((t: any) => t.type === 'PURCHASE')
      .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
    const totalReinvestedProfit = state.transactionLog
      .filter((t: any) => t.type === 'PROFIT_SHARE_INVEST')
      .reduce((sum: number, t: any) => sum + t.amount, 0);
    const dailyBalanceMap = new Map<string, number>();
    for (const log of state.transactionLog) {
      const dayKey = new Date(log.date).toISOString().split('T')[0];
      dailyBalanceMap.set(dayKey, log.investmentBalanceAfter);
    }
    const chartData = Array.from(dailyBalanceMap.entries())
      .map(([date, balance]) => ({
        name: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        date: new Date(date),
        "Saldo de Inversión": balance,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    return {
      totalPurchasesCost,
      totalReinvestedProfit,
      chartData,
    };
  }, [state.transactionLog]);

  return (
    <Card>
      <CardHeader icon="fa-chart-line">Reportes y Finanzas</CardHeader>
      <CardContent className="space-y-8">
        {/* Botones de descarga de reportes */}
        <ReportDownloadButtons
          activeTab={activeTab}
          filteredData={activeTab === 'sales' ? filteredSalesReports : undefined}
          dateRange={startDate && endDate ? { start: startDate, end: endDate } : undefined}
          workerName={currentWorker}
        />
        
        <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-700 overflow-x-auto no-scrollbar">
          <button onClick={() => setActiveTab('sales')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'sales' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Ventas</button>
          <button onClick={() => setActiveTab('profits')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'profits' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Ganancias</button>
          <button onClick={() => setActiveTab('transactions')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'transactions' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Transacciones</button>
          <button onClick={() => setActiveTab('capital')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'capital' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Capital</button>
          <button onClick={() => setActiveTab('audit')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'audit' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Auditoría</button>
        </div>
        {activeTab === 'sales' && (
          <SalesTab
            filteredSalesReports={filteredSalesReports}
            salesSummary={salesSummary}
            salesChartData={salesChartData}
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            workerName={currentWorker}
          />
        )}
        {activeTab === 'profits' && (
          <ProfitsTab
            profitData={profitData}
            profitPeriod={profitPeriod}
            setProfitPeriod={setProfitPeriod}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionsTab transactionLog={state.transactionLog} workerName={currentWorker} />
        )}
        {activeTab === 'capital' && (
          <CapitalTab capitalData={capitalData} investmentBalance={state.investmentBalance} />
        )}
        {activeTab === 'audit' && (
                                  <AuditTab auditReports={state.auditReports} workerName={currentWorker} salesReports={state.reports} />
        )}
            </CardContent>
            <style>{`
              .touch-manipulation { touch-action: manipulation; }
              .no-hover:hover { background: none !important; filter: none !important; }
              .no-scrollbar::-webkit-scrollbar { display: none; }
              .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </Card>
    );
};

export default ReportsPage;