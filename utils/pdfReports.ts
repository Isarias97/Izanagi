import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { SaleReport, PurchaseReport, TransactionLogEntry, AuditReport, PayrollReport, Worker } from '../types';

// Configuración global del PDF
const PDF_CONFIG = {
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 20,
  fontSize: {
    title: 18,
    subtitle: 14,
    normal: 10,
    small: 8
  },
  colors: {
    primary: '#1e293b',
    secondary: '#475569',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b'
  }
};

// Interfaz para las opciones de generación de reportes
interface ReportOptions {
  title: string;
  subtitle?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includeCharts?: boolean;
  includeDetails?: boolean;
  workerName?: string;
}

// Clase principal para generar reportes en PDF
export class PDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 30;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF(PDF_CONFIG.orientation, 'mm', PDF_CONFIG.pageSize);
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  // Método para agregar encabezado del reporte
  private addHeader(options: ReportOptions): void {
    // Logo o título principal
    this.doc.setFontSize(PDF_CONFIG.fontSize.title);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(PDF_CONFIG.colors.primary);
    this.doc.text('SISTEMA IZANAGI', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 10;

    // Título del reporte
    this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    this.doc.text(options.title, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 8;

    // Subtítulo si existe
    if (options.subtitle) {
      this.doc.setFontSize(PDF_CONFIG.fontSize.normal);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(PDF_CONFIG.colors.secondary);
      this.doc.text(options.subtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 8;
    }

    // Información de fecha y generación
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.text(`Generado el: ${new Date().toLocaleString('es-ES')}`, PDF_CONFIG.margin, this.currentY);
    if (options.workerName) {
      this.doc.text(`Generado por: ${options.workerName}`, this.pageWidth - PDF_CONFIG.margin, this.currentY, { align: 'right' });
    }
    this.currentY += 15;

    // Rango de fechas si se especifica
    if (options.dateRange) {
      this.doc.setFontSize(PDF_CONFIG.fontSize.normal);
      this.doc.setTextColor(PDF_CONFIG.colors.secondary);
      this.doc.text(`Período: ${new Date(options.dateRange.start).toLocaleDateString('es-ES')} - ${new Date(options.dateRange.end).toLocaleDateString('es-ES')}`, PDF_CONFIG.margin, this.currentY);
      this.currentY += 10;
    }

    this.doc.setTextColor(PDF_CONFIG.colors.primary);
  }

  // Método para agregar resumen estadístico
  private addSummary(summary: any, title: string): void {
    this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, PDF_CONFIG.margin, this.currentY);
    this.currentY += 8;

    const summaryData = Object.entries(summary).map(([key, value]) => [
      key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
      typeof value === 'number' ? value.toFixed(2) : value
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [30, 41, 59]
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Método para agregar tabla de datos
  private addTable(headers: string[], data: any[][], title?: string): void {
    if (title) {
      this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(title, PDF_CONFIG.margin, this.currentY);
      this.currentY += 8;
    }

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [30, 41, 59],
        fontSize: PDF_CONFIG.fontSize.small
      },
      margin: { left: PDF_CONFIG.margin, right: PDF_CONFIG.margin },
      styles: {
        overflow: 'linebreak',
        cellWidth: 'auto'
      }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  // Método para agregar nueva página
  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = 30;
  }

  // Método para verificar si necesitamos nueva página
  private checkPageBreak(estimatedHeight: number): void {
    if (this.currentY + estimatedHeight > this.pageHeight - PDF_CONFIG.margin) {
      this.addNewPage();
    }
  }

  // Generar reporte de ventas
  public generateSalesReport(sales: SaleReport[], options: ReportOptions): void {
    this.addHeader(options);

    // Resumen de ventas
    const summary = {
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalItems: sales.reduce((sum, sale) => sum + sale.itemsCount, 0),
      averageTicket: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0
    };

    this.addSummary(summary, 'Resumen de Ventas');

    // Tabla de ventas detalladas
    if (options.includeDetails && sales.length > 0) {
      this.checkPageBreak(200);
      
      const salesData = sales.map(sale => [
        sale.id.toString(),
        new Date(sale.date).toLocaleString('es-ES'),
        sale.itemsCount.toString(),
        `$${sale.total.toFixed(2)}`,
        sale.payment.currency,
        `$${sale.payment.amountPaid.toFixed(2)}`,
        `$${sale.payment.changeInCup.toFixed(2)}`
      ]);

      this.addTable(
        ['ID', 'Fecha', 'Items', 'Total (CUP)', 'Moneda Pago', 'Monto Pagado', 'Vuelto (CUP)'],
        salesData,
        'Detalle de Ventas'
      );

      // Detalle de items por venta
      if (sales.length > 0) {
        this.checkPageBreak(300);
        this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Detalle de Items por Venta', PDF_CONFIG.margin, this.currentY);
        this.currentY += 8;

        sales.forEach((sale, index) => {
          if (index > 0) this.currentY += 5;
          
          this.doc.setFontSize(PDF_CONFIG.fontSize.normal);
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`Venta #${sale.id} - ${new Date(sale.date).toLocaleString('es-ES')}`, PDF_CONFIG.margin, this.currentY);
          this.currentY += 5;

          const itemsData = sale.items.map(item => [
            item.name,
            item.quantity.toString(),
            `$${item.price.toFixed(2)}`,
            `$${(item.price * item.quantity).toFixed(2)}`
          ]);

          autoTable(this.doc, {
            startY: this.currentY,
            head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
            body: itemsData,
            theme: 'striped',
            headStyles: {
              fillColor: [71, 85, 105],
              textColor: 255,
              fontStyle: 'bold'
            },
            bodyStyles: {
              textColor: [30, 41, 59],
              fontSize: PDF_CONFIG.fontSize.small
            },
            margin: { left: PDF_CONFIG.margin + 10, right: PDF_CONFIG.margin }
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
        });
      }
    }
  }

  // Generar reporte de transacciones
  public generateTransactionsReport(transactions: TransactionLogEntry[], options: ReportOptions): void {
    this.addHeader(options);

    // Resumen de transacciones
    const summary = {
      totalTransactions: transactions.length,
      totalInflow: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0),
      totalOutflow: Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)),
      netFlow: transactions.reduce((sum, t) => sum + t.amount, 0)
    };

    this.addSummary(summary, 'Resumen de Transacciones');

    // Tabla de transacciones
    if (transactions.length > 0) {
      this.checkPageBreak(200);

      const transactionData = transactions.map(t => [
        new Date(t.date).toLocaleString('es-ES'),
        this.getTransactionTypeLabel(t.type),
        t.description,
        `$${t.amount.toFixed(2)}`,
        `$${t.investmentBalanceAfter.toFixed(2)}`,
        `$${t.workerPayoutBalanceAfter.toFixed(2)}`
      ]);

      this.addTable(
        ['Fecha', 'Tipo', 'Descripción', 'Monto (CUP)', 'Saldo Inversión', 'Saldo Pagos'],
        transactionData,
        'Historial de Transacciones'
      );
    }
  }

  // Generar reporte de auditoría
  public generateAuditReport(auditReports: AuditReport[], options: ReportOptions): void {
    this.addHeader(options);

    // Resumen de auditorías
    const summary = {
      totalAudits: auditReports.length,
      totalDiscrepancies: auditReports.filter(a => 
        a.discrepancies.diffCUP !== 0 || 
        a.discrepancies.diffMLC !== 0 || 
        a.discrepancies.diffUSD !== 0
      ).length,
      averageDiscrepancy: auditReports.length > 0 ? 
        auditReports.reduce((sum, a) => sum + Math.abs(a.discrepancies.diffCUP), 0) / auditReports.length : 0
    };

    this.addSummary(summary, 'Resumen de Auditorías');

    // Tabla de auditorías
    if (auditReports.length > 0) {
      this.checkPageBreak(200);

      const auditData = auditReports.map(a => [
        new Date(a.date).toLocaleString('es-ES'),
        a.closedByWorkerName,
        `$${a.systemTotals.expectedCUP.toFixed(2)}`,
        `$${a.countedTotals.countedCUP.toFixed(2)}`,
        this.formatDiscrepancy(a.discrepancies.diffCUP),
        this.formatDiscrepancy(a.discrepancies.diffMLC),
        this.formatDiscrepancy(a.discrepancies.diffUSD)
      ]);

      this.addTable(
        ['Fecha', 'Cerrado Por', 'Esperado CUP', 'Contado CUP', 'Dif. CUP', 'Dif. MLC', 'Dif. USD'],
        auditData,
        'Historial de Cierres de Caja'
      );

      // Detalle de conteo de efectivo si está disponible
      const auditsWithCashCount = auditReports.filter(a => a.cashCountDetails);
      if (auditsWithCashCount.length > 0) {
        this.checkPageBreak(300);
        this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Detalle de Conteo de Efectivo', PDF_CONFIG.margin, this.currentY);
        this.currentY += 8;

        auditsWithCashCount.forEach((audit, index) => {
          if (index > 0) this.currentY += 5;
          
          this.doc.setFontSize(PDF_CONFIG.fontSize.normal);
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`Auditoría #${audit.id} - ${new Date(audit.date).toLocaleString('es-ES')}`, PDF_CONFIG.margin, this.currentY);
          this.currentY += 5;

          const cashData = Object.entries(audit.cashCountDetails!).map(([denomination, count]) => [
            denomination,
            count.toString(),
            `$${(parseFloat(denomination) * count).toFixed(2)}`
          ]);

          autoTable(this.doc, {
            startY: this.currentY,
            head: [['Denominación', 'Cantidad', 'Subtotal']],
            body: cashData,
            theme: 'striped',
            headStyles: {
              fillColor: [71, 85, 105],
              textColor: 255,
              fontStyle: 'bold'
            },
            bodyStyles: {
              textColor: [30, 41, 59],
              fontSize: PDF_CONFIG.fontSize.small
            },
            margin: { left: PDF_CONFIG.margin + 10, right: PDF_CONFIG.margin }
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
        });
      }
    }
  }

  // Generar reporte de compras
  public generatePurchasesReport(purchases: PurchaseReport[], options: ReportOptions): void {
    this.addHeader(options);

    // Resumen de compras
    const summary = {
      totalPurchases: purchases.length,
      totalCost: purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0),
      totalItems: purchases.reduce((sum, purchase) => sum + purchase.itemsCount, 0),
      averagePurchaseCost: purchases.length > 0 ? purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0) / purchases.length : 0
    };

    this.addSummary(summary, 'Resumen de Compras');

    // Tabla de compras
    if (purchases.length > 0) {
      this.checkPageBreak(200);

      const purchasesData = purchases.map(purchase => [
        purchase.id.toString(),
        new Date(purchase.date).toLocaleString('es-ES'),
        purchase.itemsCount.toString(),
        `$${purchase.totalCost.toFixed(2)}`
      ]);

      this.addTable(
        ['ID', 'Fecha', 'Items', 'Costo Total (CUP)'],
        purchasesData,
        'Detalle de Compras'
      );

      // Detalle de items por compra
      if (options.includeDetails) {
        this.checkPageBreak(300);
        this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text('Detalle de Items por Compra', PDF_CONFIG.margin, this.currentY);
        this.currentY += 8;

        purchases.forEach((purchase, index) => {
          if (index > 0) this.currentY += 5;
          
          this.doc.setFontSize(PDF_CONFIG.fontSize.normal);
          this.doc.setFont('helvetica', 'bold');
          this.doc.text(`Compra #${purchase.id} - ${new Date(purchase.date).toLocaleString('es-ES')}`, PDF_CONFIG.margin, this.currentY);
          this.currentY += 5;

          const itemsData = purchase.items.map(item => [
            item.name,
            item.quantity.toString(),
            `$${item.costPrice.toFixed(2)}`,
            `$${item.sellingPrice.toFixed(2)}`,
            `$${(item.costPrice * item.quantity).toFixed(2)}`
          ]);

          autoTable(this.doc, {
            startY: this.currentY,
            head: [['Producto', 'Cantidad', 'Costo Unit.', 'Precio Venta', 'Subtotal']],
            body: itemsData,
            theme: 'striped',
            headStyles: {
              fillColor: [71, 85, 105],
              textColor: 255,
              fontStyle: 'bold'
            },
            bodyStyles: {
              textColor: [30, 41, 59],
              fontSize: PDF_CONFIG.fontSize.small
            },
            margin: { left: PDF_CONFIG.margin + 10, right: PDF_CONFIG.margin }
          });

          this.currentY = (this.doc as any).lastAutoTable.finalY + 5;
        });
      }
    }
  }

  // Generar reporte de nómina
  public generatePayrollReport(payroll: PayrollReport, options: ReportOptions): void {
    this.addHeader(options);

    // Resumen de nómina
    const summary = {
      totalWorkers: payroll.details.length,
      totalPayoutFund: payroll.totalPayoutFund,
      adminShare: payroll.adminShare,
      workerShare: payroll.workerShare,
      periodStart: new Date(payroll.periodStartDate).toLocaleDateString('es-ES'),
      periodEnd: new Date(payroll.periodEndDate).toLocaleDateString('es-ES')
    };

    this.addSummary(summary, 'Resumen de Nómina');

    // Tabla de detalles de nómina
    if (payroll.details.length > 0) {
      this.checkPageBreak(200);

      const payrollData = payroll.details.map(detail => [
        detail.workerName,
        detail.role,
        `$${detail.salesContribution.toFixed(2)}`,
        `$${detail.grossPay.toFixed(2)}`,
        `$${detail.shortageDeductions.toFixed(2)}`,
        `$${detail.finalPay.toFixed(2)}`
      ]);

      this.addTable(
        ['Trabajador', 'Rol', 'Contribución Ventas', 'Salario Bruto', 'Deducciones', 'Salario Final'],
        payrollData,
        'Detalle de Nómina por Trabajador'
      );
    }
  }

  // Generar reporte combinado
  public generateComprehensiveReport(data: {
    sales: SaleReport[];
    purchases: PurchaseReport[];
    transactions: TransactionLogEntry[];
    auditReports: AuditReport[];
  }, options: ReportOptions): void {
    this.addHeader({ ...options, title: 'Reporte Integral de Auditoría' });

    // Resumen general
    const generalSummary = {
      totalSales: data.sales.length,
      totalPurchases: data.purchases.length,
      totalTransactions: data.transactions.length,
      totalAudits: data.auditReports.length,
      totalRevenue: data.sales.reduce((sum, sale) => sum + sale.total, 0),
      totalCost: data.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0),
      netProfit: data.sales.reduce((sum, sale) => sum + sale.total, 0) - data.purchases.reduce((sum, purchase) => sum + purchase.totalCost, 0)
    };

    this.addSummary(generalSummary, 'Resumen General del Negocio');

    // Generar cada sección en páginas separadas
    if (data.sales.length > 0) {
      this.addNewPage();
      this.generateSalesReport(data.sales, { ...options, title: 'Sección: Reporte de Ventas' });
    }

    if (data.purchases.length > 0) {
      this.addNewPage();
      this.generatePurchasesReport(data.purchases, { ...options, title: 'Sección: Reporte de Compras' });
    }

    if (data.transactions.length > 0) {
      this.addNewPage();
      this.generateTransactionsReport(data.transactions, { ...options, title: 'Sección: Reporte de Transacciones' });
    }

    if (data.auditReports.length > 0) {
      this.addNewPage();
      this.generateAuditReport(data.auditReports, { ...options, title: 'Sección: Reporte de Auditoría' });
    }
  }

  // Métodos auxiliares
  private getTransactionTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'REIMBURSEMENT': 'Reembolso',
      'PROFIT_SHARE_INVEST': 'Reinversión de Ganancias',
      'PROFIT_SHARE_PAYOUT': 'Distribución de Ganancias',
      'PURCHASE': 'Compra',
      'MANUAL_UPDATE': 'Actualización Manual',
      'PAYOUT_RESET': 'Reinicio de Pagos',
      'CASH_SHORTAGE': 'Falta de Efectivo'
    };
    return labels[type] || type;
  }

  private formatDiscrepancy(value: number): string {
    const formatted = `$${Math.abs(value).toFixed(2)}`;
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }

  // Método para descargar el PDF
  public download(filename: string): void {
    this.doc.save(filename);
  }

  // Método para obtener el PDF como blob
  public getBlob(): Blob {
    return this.doc.output('blob');
  }
}

// Funciones de conveniencia para generar reportes específicos
export const generateSalesPDF = (sales: SaleReport[], options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generateSalesReport(sales, options);
  generator.download(`Reporte_Ventas_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateTransactionsPDF = (transactions: TransactionLogEntry[], options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generateTransactionsReport(transactions, options);
  generator.download(`Reporte_Transacciones_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateAuditPDF = (auditReports: AuditReport[], options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generateAuditReport(auditReports, options);
  generator.download(`Reporte_Auditoria_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePurchasesPDF = (purchases: PurchaseReport[], options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generatePurchasesReport(purchases, options);
  generator.download(`Reporte_Compras_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePayrollPDF = (payroll: PayrollReport, options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generatePayrollReport(payroll, options);
  generator.download(`Reporte_Nomina_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateComprehensivePDF = (data: {
  sales: SaleReport[];
  purchases: PurchaseReport[];
  transactions: TransactionLogEntry[];
  auditReports: AuditReport[];
}, options: ReportOptions): void => {
  const generator = new PDFReportGenerator();
  generator.generateComprehensiveReport(data, options);
  generator.download(`Reporte_Integral_${new Date().toISOString().split('T')[0]}.pdf`);
}; 