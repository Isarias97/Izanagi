
import { AppState } from './types';

export const getInitialState = (): AppState => ({
  products: [],
  categories: [],
  config: {
    exchangeRates: { mlcToCup: 235.00, usdToCup: 380.00 },
    inventory: { itemsPerPage: 10 }
  },
  reports: [],
  purchases: [],
  investmentBalance: 0,
  workerPayoutBalance: 0,
  transactionLog: [],
  workers: [],
  auditReports: [],
  payrollReports: [],
  debtors: [],
  debts: [],
  debtPayments: [],
});