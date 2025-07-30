
export interface Category {
  id: number;
  name: string;
  icon: string; // The emoji icon character
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  costPrice: number;
  stock: number;
  sales: number;
  categoryId: number;
}

export interface SaleItem extends Product {
  quantity: number;
}

export interface SaleReport {
  id: number;
  date: string;
  soldByWorkerId: number;
  items: SaleItem[];
  itemsCount: number;
  total: number;
  payment: {
    currency: 'CUP' | 'MLC' | 'USD';
    amountPaid: number;
    changeInCup: number;
  };
}

export interface PurchaseItem {
  productId: number;
  name: string; // For display in history
  quantity: number;
  costPrice: number; // The price at which it was bought
  sellingPrice: number; // The price at which it will be sold
}

export interface PurchaseReport {
  id: number;
  date: string;
  items: PurchaseItem[];
  itemsCount: number;
  totalCost: number;
}

export type TransactionType = 'REIMBURSEMENT' | 'PROFIT_SHARE_INVEST' | 'PROFIT_SHARE_PAYOUT' | 'PURCHASE' | 'MANUAL_UPDATE' | 'PAYOUT_RESET' | 'CASH_SHORTAGE';

export interface TransactionLogEntry {
    id: number;
    date: string;
    type: TransactionType;
    description: string;
    amount: number; // The amount of the transaction
    saleId?: number; // Optional link to a sale
    purchaseId?: number; // Optional link to a purchase
    workerId?: number;
    investmentBalanceAfter: number;
    workerPayoutBalanceAfter: number;
}

export interface Config {
  exchangeRates: {
    mlcToCup: number;
    usdToCup: number;
  };
  inventory: {
    itemsPerPage: number;
  };
}

export type Role = 'Admin' | 'Gerente' | 'Vendedor';

export interface Worker {
  id: number;
  name: string;
  pin: string; // 4-digit PIN
  role: Role;
}

export interface AuditReport {
  id: number;
  date: string;
  closedByWorkerId: number;
  closedByWorkerName: string;
  systemTotals: {
    totalSalesInCUP: number;
    expectedCUP: number;
    expectedMLC: number;
    expectedUSD: number;
  };
  countedTotals: {
    countedCUP: number;
    countedMLC: number;
    countedUSD: number;
  };
  discrepancies: {
    diffCUP: number;
    diffMLC: number;
    diffUSD: number;
  };
  cashCountDetails?: {
    [denomination: string]: number;
  };
}

export interface PayrollDetail {
    workerId: number;
    workerName: string;
    role: Role;
    salesContribution: number;
    grossPay: number;
    shortageDeductions: number;
    finalPay: number;
}

export interface PayrollReport {
    id: number;
    date: string;
    processedByWorkerName: string;
    periodStartDate: string;
    periodEndDate: string;
    totalPayoutFund: number;
    adminShare: number;
    workerShare: number;
    details: PayrollDetail[];
}

export interface Debtor {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  creditLimit: number;
  totalDebt: number;
  isActive: boolean;
  createdAt: string;
  notes?: string;
}

export interface Debt {
  id: number;
  debtorId: number;
  debtorName: string; // Para display sin join
  saleId?: number; // Si la deuda viene de una venta
  amount: number;
  originalAmount: number;
  description: string;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface DebtPayment {
  id: number;
  debtId: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'MLC' | 'USD' | 'TRANSFER' | 'OTHER';
  receivedByWorkerId: number;
  receivedByWorkerName: string;
  notes?: string;
}

export interface AppState {
  products: Product[];
  categories: Category[];
  reports: SaleReport[];
  purchases: PurchaseReport[];
  config: Config;
  investmentBalance: number;
  workerPayoutBalance: number;
  transactionLog: TransactionLogEntry[];
  workers: Worker[];
  auditReports: AuditReport[];
  payrollReports: PayrollReport[];
  debtors: Debtor[];
  debts: Debt[];
  debtPayments: DebtPayment[];
}

export enum Page {
  POS = 'pos',
  Purchases = 'purchases',
  Inventory = 'inventory',
  Reports = 'reports',
  Payroll = 'payroll',
  Workers = 'workers',
  AI = 'ai',
  Debts = 'debts',
  Config = 'config',
}