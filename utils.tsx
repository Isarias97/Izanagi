// Utilidades extraídas de ReportsPage
import React from 'react';
import { TransactionType } from './types';

export type ProfitPeriod = 'daily' | 'weekly' | 'monthly' | 'annually';

export const getPeriodDates = (period: ProfitPeriod) => {
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

export const getTransactionTypeStyle = (type: TransactionType) => {
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
};

export const DiscrepancyDisplay: React.FC<{ value: number }> = ({ value }) => {
    if (value === 0) {
        return (<span className="text-gray-400">0.00</span>);
    }
    const isShortage = value < 0;
    const color = isShortage ? 'text-danger' : 'text-success';
    const prefix = !isShortage ? '+' : '';
    return (<span className={`font-bold ${color}`}>{prefix}{value.toFixed(2)}</span>);
}; 