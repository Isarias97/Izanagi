
import React, { useState, useContext, useMemo } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, InputGroup, Input, Button, Icon } from '../components/ui';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TransactionType, AuditReport } from '../types';

type ReportTab = 'sales' | 'profits' | 'transactions' | 'capital' | 'audit';
type ProfitPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';

const getPeriodDates = (period: ProfitPeriod) => {
    const end = new Date();
    const start = new Date();
    switch (period) {
        case 'daily':
            start.setHours(0, 0, 0, 0);
            break;
        case 'weekly':
            start.setDate(start.getDate() - start.getDay());
            start.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'annually':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);
            break;
    }
    return { start, end };
};

const getTransactionTypeStyle = (type: TransactionType) => {
    switch(type) {
        case 'REIMBURSEMENT': return { icon: 'fa-undo', color: 'text-blue-400', label: 'Reembolso' };
        case 'PROFIT_SHARE_INVEST': return { icon: 'fa-piggy-bank', color: 'text-green-400', label: 'Ganancia a Inversión' };
        case 'PROFIT_SHARE_PAYOUT': return { icon: 'fa-users', color: 'text-teal-400', label: 'Ganancia a Pagos' };
        case 'PURCHASE': return { icon: 'fa-dolly', color: 'text-red-400', label: 'Compra' };
        case 'MANUAL_UPDATE': return { icon: 'fa-edit', color: 'text-yellow-400', label: 'Ajuste Manual' };
        case 'PAYOUT_RESET': return { icon: 'fa-file-invoice-dollar', color: 'text-orange-400', label: 'Pago de Nómina' };
        case 'CASH_SHORTAGE': return { icon: 'fa-exclamation-triangle', color: 'text-orange-500', label: 'Faltante de Caja' };
        default: return { icon: 'fa-question-circle', color: 'text-gray-400', label: 'Desconocido' };
    }
}

const DiscrepancyDisplay: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) return <span className="text-gray-400">0.00</span>;
    const isShortage = value < 0;
    const color = isShortage ? 'text-danger' : 'text-success';
    const prefix = !isShortage ? '+' : '';
    return <span className={`font-bold ${color}`}>{prefix}{value.toFixed(2)}</span>;
};


const ReportsPage: React.FC = () => {
    const { state } = useContext(DataContext);
    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [profitPeriod, setProfitPeriod] = useState<ProfitPeriod>('monthly');

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
            return sum + r.items.reduce((itemSum, i) => itemSum + (i.costPrice * i.quantity), 0);
        }, 0);
        const netProfit = revenue - costOfGoods;
        const salesCount = filteredSalesReports.length;
        const itemsSold = filteredSalesReports.reduce((sum, r) => sum + r.itemsCount, 0);
        return { revenue, salesCount, itemsSold, netProfit };
    }, [filteredSalesReports]);

    const salesChartData = useMemo(() => {
        const salesByDay = filteredSalesReports.reduce((acc, s) => {
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
        const cost = reportsInPeriod.reduce((sum, r) => sum + r.items.reduce((iSum, i) => iSum + (i.costPrice * i.quantity), 0), 0);
        const profit = revenue - cost;

        const chartData = reportsInPeriod.reduce((acc, s) => {
            let key = '';
            const date = new Date(s.date);
            if (profitPeriod === 'daily') key = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit'});
            else if (profitPeriod === 'weekly' || profitPeriod === 'monthly') key = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            else if (profitPeriod === 'annually') key = date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
            
            const saleProfit = s.total - s.items.reduce((iSum, i) => iSum + (i.costPrice * i.quantity), 0);
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
            .filter(t => t.type === 'PURCHASE')
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        const totalReinvestedProfit = state.transactionLog
            .filter(t => t.type === 'PROFIT_SHARE_INVEST')
            .reduce((sum, t) => sum + t.amount, 0);

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
                <div className="flex flex-wrap gap-2 mb-2 border-b border-slate-700 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveTab('sales')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'sales' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Ventas</button>
                    <button onClick={() => setActiveTab('profits')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'profits' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Ganancias</button>
                    <button onClick={() => setActiveTab('transactions')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'transactions' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Transacciones</button>
                    <button onClick={() => setActiveTab('capital')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'capital' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Capital</button>
                    <button onClick={() => setActiveTab('audit')} className={`px-4 py-3 text-base font-semibold rounded-t-lg transition min-w-[120px] min-h-[44px] active:scale-95 touch-manipulation no-hover ${activeTab === 'audit' ? 'bg-accent text-white shadow-md' : 'bg-secondary text-gray-300'}`}>Auditoría</button>
                </div>

                {activeTab === 'sales' && (
                    <div className="space-y-8">
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
                                        const reportCost = r.items.reduce((sum, i) => sum + (i.costPrice * i.quantity), 0);
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
                )}
                
                {activeTab === 'profits' && (
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
                )}

                {activeTab === 'transactions' && (
                    <div className="space-y-6">
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
                                    {[...state.transactionLog].reverse().map(log => {
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
                )}

                {activeTab === 'capital' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                            <div className="bg-success/20 border border-success p-6 rounded-lg">
                                <div className="text-4xl font-bold text-success">{state.investmentBalance.toFixed(2)}<small className="text-2xl ml-1">CUP</small></div>
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
                )}
                
                {activeTab === 'audit' && (
                    <div className="space-y-6">
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
                                    {[...state.auditReports].reverse().map((report: AuditReport) => (
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