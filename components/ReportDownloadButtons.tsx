import React, { useState, useContext } from 'react';
import { DataContext } from '../context';
import { Button, Icon, Modal } from './ui';
import { 
  generateSalesPDF, 
  generateTransactionsPDF, 
  generateAuditPDF, 
  generatePurchasesPDF,
  generateComprehensivePDF,
  generateDebtsPDF
} from '../utils/pdfReports';

interface ReportDownloadButtonsProps {
  activeTab: string;
  filteredData?: any[];
  dateRange?: {
    start: string;
    end: string;
  };
  workerName?: string;
}

const ReportDownloadButtons: React.FC<ReportDownloadButtonsProps> = ({ 
  activeTab, 
  filteredData, 
  dateRange,
  workerName 
}) => {
  const { state } = useContext(DataContext);
  const [showOptions, setShowOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (reportType: string, includeDetails: boolean = false) => {
    setIsGenerating(true);
    try {
      const options = {
        title: `Reporte de ${reportType}`,
        subtitle: `Generado desde Sistema Izanagi`,
        dateRange,
        includeDetails,
        workerName
      };

      switch (reportType) {
        case 'Ventas':
          const salesData = filteredData || state.reports;
          generateSalesPDF(salesData, options);
          break;
        
        case 'Transacciones':
          generateTransactionsPDF(state.transactionLog, options);
          break;
        
        case 'Auditoría':
          generateAuditPDF(state.auditReports, {
            ...options,
            salesOfDay: state.reports,
            salesOfShift: state.reports
          });
          break;
        
        case 'Compras':
          generatePurchasesPDF(state.purchases, options);
          break;
        
        case 'Integral':
          generateComprehensivePDF({
            sales: state.reports,
            purchases: state.purchases,
            transactions: state.transactionLog,
            auditReports: state.auditReports
          }, options);
          break;
        
        case 'Deudas':
          generateDebtsPDF(state.debts, options);
          break;
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el reporte PDF. Por favor, intente nuevamente.');
    } finally {
      setIsGenerating(false);
      setShowOptions(false);
    }
  };

  const getReportOptions = () => {
    const baseOptions = [
      {
        label: 'Reporte Básico',
        description: 'Solo resumen y estadísticas principales',
        action: () => handleDownload(getReportTypeLabel(), false)
      },
      {
        label: 'Reporte Detallado',
        description: 'Incluye todos los detalles y transacciones',
        action: () => handleDownload(getReportTypeLabel(), true)
      }
    ];

    // Agregar opción de reporte integral si no estamos ya en esa vista
    if (activeTab !== 'integral') {
      baseOptions.push({
        label: 'Reporte Integral',
        description: 'Todos los reportes combinados en un solo PDF',
        action: () => handleDownload('Integral', true)
      });
    }

    return baseOptions;
  };

  const getReportTypeLabel = () => {
    const labels: { [key: string]: string } = {
      'sales': 'Ventas',
      'profits': 'Ganancias',
      'transactions': 'Transacciones',
      'capital': 'Capital',
      'audit': 'Auditoría',
      'debts': 'Deudas'
    };
    return labels[activeTab] || 'Reporte';
  };

  const isDataAvailable = () => {
    switch (activeTab) {
      case 'sales':
        return (filteredData || state.reports).length > 0;
      case 'transactions':
        return state.transactionLog.length > 0;
      case 'audit':
        return state.auditReports.length > 0;
      case 'capital':
        return state.transactionLog.length > 0;
      case 'debts':
        return state.debts.length > 0;
      default:
        return true;
    }
  };

  if (!isDataAvailable()) {
    return (
      <div className="text-center p-4 bg-slate-900/50 rounded-lg">
        <Icon name="fa-exclamation-triangle" className="text-warning text-2xl mb-2" />
        <p className="text-gray-400">No hay datos disponibles para generar reportes</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          variant="primary"
          icon="fa-download"
          onClick={() => setShowOptions(true)}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Icon name="fa-spinner fa-spin" />
              Generando PDF...
            </>
          ) : (
            <>
              <Icon name="fa-file-pdf" />
              Descargar Reporte
            </>
          )}
        </Button>
        
        <Button
          variant="primary"
          icon="fa-info-circle"
          onClick={() => setShowOptions(true)}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600"
        >
          <Icon name="fa-cog" />
          Opciones de Reporte
        </Button>
      </div>

      <Modal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        title="Opciones de Descarga de Reporte"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Información del Reporte</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <p><strong>Tipo:</strong> {getReportTypeLabel()}</p>
              {dateRange && (
                <p><strong>Período:</strong> {new Date(dateRange.start).toLocaleDateString('es-ES')} - {new Date(dateRange.end).toLocaleDateString('es-ES')}</p>
              )}
              {workerName && (
                <p><strong>Generado por:</strong> {workerName}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {getReportOptions().map((option, index) => (
              <div
                key={index}
                className="p-4 border border-slate-700 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors"
                onClick={option.action}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-white">{option.label}</h5>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                  <Icon name="fa-arrow-right" className="text-accent" />
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-900/20 border border-blue-700 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="fa-lightbulb" className="text-blue-400 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-300">Consejo:</p>
                <p className="text-blue-200">
                  El reporte detallado incluye todas las transacciones y items, 
                  mientras que el básico solo muestra resúmenes y estadísticas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ReportDownloadButtons; 