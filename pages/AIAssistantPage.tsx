import React, { useState, useContext, useCallback, useMemo } from 'react';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, Icon } from '../components/ui';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';

type AnalysisType = 'product_performance' | 'purchase_suggestion' | 'weekly_summary' | 'stale_inventory';

const analysisOptions: { id: AnalysisType; title: string; description: string; icon: string; }[] = [
    {
        id: 'product_performance',
        title: 'Analizar Rendimiento de Productos',
        description: 'Identifica tus productos estrella y los que no están funcionando bien.',
        icon: 'fa-chart-pie',
    },
    {
        id: 'purchase_suggestion',
        title: 'Sugerir Lista de Compras',
        description: 'Obtén una lista de compras inteligente basada en ventas y stock actual.',
        icon: 'fa-shopping-basket',
    },
    {
        id: 'weekly_summary',
        title: 'Resumen Semanal del Negocio',
        description: 'Un informe ejecutivo del rendimiento y tendencias de la última semana.',
        icon: 'fa-calendar-week',
    },
    {
        id: 'stale_inventory',
        title: 'Identificar Inventario Obsoleto',
        description: 'Encuentra productos con mucho tiempo en stock y pocas o ninguna venta.',
        icon: 'fa-box-open',
    },
];

// Tipado robusto para el estado de la respuesta de la IA
interface AIResponseState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  error?: string;
}

// Componente para cada opción de análisis
const AnalysisOptionButton: React.FC<{
  option: typeof analysisOptions[number];
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
}> = React.memo(({ option, isActive, isLoading, onClick }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    aria-pressed={isActive}
    aria-busy={isLoading && isActive}
    aria-label={option.title}
    className={`w-full text-left p-4 rounded-lg flex items-start gap-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait min-h-[56px] text-base active:scale-95 touch-manipulation no-hover ${isActive ? 'bg-accent/80' : 'bg-slate-800/60'}`}
  >
    <Icon name={option.icon} className={`text-2xl mt-1 ${isActive ? 'text-white' : 'text-accent'}`} />
    <div>
      <h3 className="font-semibold text-white">{option.title}</h3>
      <p className="text-sm text-gray-300">{option.description}</p>
    </div>
  </button>
));

// Componente para mostrar la respuesta de la IA
const AIResponsePanel: React.FC<{
  responseState: AIResponseState;
  markdownClassName?: string;
}> = ({ responseState, markdownClassName }) => {
  if (responseState.status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-8" role="status" aria-live="polite">
        <Icon name="fa-spinner fa-spin" className="text-4xl text-accent mb-4" />
        <p className="text-lg font-semibold text-gray-300">Analizando los datos...</p>
        <p className="text-gray-400">El asistente está preparando sus recomendaciones. Esto puede tardar unos segundos.</p>
      </div>
    );
  }
  if (responseState.status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-8">
        <Icon name="fa-magic-wand-sparkles" className="text-5xl text-accent mb-4" />
        <h3 className="text-2xl font-bold mb-2">Bienvenido al Asistente IA</h3>
        <p className="text-lg text-gray-400 max-w-md">
          Seleccione una opción del panel de la izquierda para comenzar a recibir análisis y consejos para hacer crecer su negocio.
        </p>
      </div>
    );
  }
  if (responseState.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full p-8 text-danger" role="alert" aria-live="assertive">
        <Icon name="fa-triangle-exclamation" className="text-4xl mb-4" />
        <p className="text-lg font-semibold">Ocurrió un error</p>
        <p className="text-gray-400">{responseState.error || responseState.message}</p>
      </div>
    );
  }
  // success
  return (
    <ReactMarkdown className={markdownClassName || "text-gray-200 prose prose-invert prose-sm max-w-none"} aria-live="polite">{responseState.message}</ReactMarkdown>
  );
};

const AIAssistantPage: React.FC = () => {
  const { state, showNotification } = useContext(DataContext);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisType | null>(null);
  const [aiResponse, setAiResponse] = useState<AIResponseState>({ status: 'idle', message: '' });

  // Memoizar generación de prompt
  const generatePrompt = useCallback((analysisType: AnalysisType): string => {
    const { products, reports, transactionLog, investmentBalance } = state;
    switch (analysisType) {
      case 'product_performance':
        return `Analiza el rendimiento de los productos basándote en estos datos. Identifica los 'productos estrella' (alta ganancia, alta rotación) y los 'productos problemáticos' (baja ganancia, bajo stock, o no se venden). Proporciona una tabla resumen y recomendaciones concretas para cada categoría de producto. Los datos son: ${JSON.stringify({ products, reports })}`;
      case 'purchase_suggestion':
        return `Actúa como un gestor de inventario experto. Basado en las ventas recientes, el stock actual, y el rendimiento de los productos, sugiere una lista de compras priorizada. Considera el saldo de inversión disponible para no exceder el presupuesto. Formatea la respuesta como una lista de compras accionable con cantidades sugeridas y costo estimado. Los datos son: ${JSON.stringify({ products, reports, investmentBalance })}`;
      case 'weekly_summary':
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weeklySales = reports.filter(r => new Date(r.date) >= oneWeekAgo);
        const weeklyTransactions = transactionLog.filter(t => new Date(t.date) >= oneWeekAgo);
        return `Resume el rendimiento del negocio en la última semana. Analiza ventas, ganancias y transacciones. Destaca los logros, identifica áreas de mejora y ofrece 2-3 consejos estratégicos para la próxima semana. Los datos de la última semana son: ${JSON.stringify({ weeklySales, weeklyTransactions })}`;
      case 'stale_inventory':
        return `Identifica el inventario obsoleto. Un producto es obsoleto si tiene stock pero no se ha vendido en los últimos 30 días. Analiza los reportes de ventas para determinar la última fecha de venta de cada producto y compárala con la fecha actual. Sugiere acciones para estos productos (ej. descuentos, liquidación, no re-comprar). Los datos son: ${JSON.stringify({ products, reports })}`;
      default:
        return '';
    }
  }, [state]);

  // Memoizar handler de análisis
  const handleRunAnalysis = useCallback(async (analysisType: AnalysisType) => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
      showNotification('Error de Configuración', 'La API Key de Google Gemini no está configurada. El administrador debe configurarla para usar esta función.', true);
      return;
    }
    setAiResponse({ status: 'loading', message: '' });
    setCurrentAnalysis(analysisType);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const userPrompt = generatePrompt(analysisType);
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: {
          role: 'user',
          parts: [{ text: userPrompt }]
        },
        config: {
          systemInstruction: `Eres un asistente IA experto en gestión de negocios, economía y comercio. Tu misión es ayudar a que el negocio crezca como la espuma, actuando como economista, gestor y asesor comercial. Analiza los datos JSON que te proporciono y responde SIEMPRE en español. Da recomendaciones claras, accionables y estratégicas para:\n - Optimizar costos y maximizar ganancias\n - Mejorar procesos internos y gestión de inventario\n - Sugerir estrategias de ventas y marketing\n - Detectar oportunidades de negocio y nichos\n - Proyectar flujos de caja y alertar sobre riesgos\n - Proponer alianzas, promociones y mejoras de equipo\n Responde en formato Markdown, usando encabezados, listas, negritas y tablas si es útil. Sé directo, profesional y enfocado en resultados.`,
        },
      });
      let fullResponse = '';
      for await (const chunk of responseStream) {
        fullResponse += chunk.text;
        setAiResponse(prev => ({ ...prev, message: fullResponse }));
      }
      setAiResponse({ status: 'success', message: fullResponse });
    } catch (error: any) {
      console.error("Error al contactar la API de Gemini:", error);
      let message = 'No se pudo obtener una respuesta de la IA. Por favor, revise la consola para más detalles.';
      if (error?.status === 401 || error?.code === 401) {
        message = 'API Key inválida o sin permisos. Verifica tu clave de Gemini.';
      } else if (error?.status === 429 || error?.code === 429) {
        message = 'Límite de cuota alcanzado. Intenta más tarde o revisa tu cuenta de Gemini.';
      } else if (error?.message) {
        message = error.message;
      }
      showNotification('Error de API', message, true);
      setAiResponse({ status: 'error', message: 'Ocurrió un error al procesar la solicitud.', error: message });
    }
  }, [generatePrompt, showNotification]);

  // Memoizar opciones de análisis para evitar renders innecesarios
  const memoizedOptions = useMemo(() => analysisOptions, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in space-y-4 lg:space-y-0">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader icon="fa-robot">Panel del Asistente IA</CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">Seleccione un tipo de análisis para obtener recomendaciones y perspectivas sobre su negocio.</p>
            {memoizedOptions.map(opt => (
              <AnalysisOptionButton
                key={opt.id}
                option={opt}
                isActive={currentAnalysis === opt.id}
                isLoading={aiResponse.status === 'loading' && currentAnalysis === opt.id}
                onClick={() => handleRunAnalysis(opt.id)}
              />
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="min-h-[60vh]">
          <CardHeader icon="fa-lightbulb">Recomendaciones de la IA</CardHeader>
          <CardContent className="prose prose-invert prose-sm max-w-none prose-headings:text-accent prose-strong:text-white">
            <AIResponsePanel responseState={aiResponse} markdownClassName="text-gray-200 prose prose-invert prose-sm max-w-none" />
          </CardContent>
        </Card>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .prose {
            line-height: 1.6;
        }
        .prose h1, .prose h2, .prose h3 {
            margin-bottom: 0.5em;
        }
        .prose p {
            margin-bottom: 1em;
        }
        .prose ul, .prose ol {
            padding-left: 1.5em;
            margin-bottom: 1em;
        }
        .prose li {
            margin-bottom: 0.25em;
        }
        .touch-manipulation { touch-action: manipulation; }
        .no-hover:hover { background: none !important; filter: none !important; }
      `}</style>
    </div>
  );
};

export default AIAssistantPage;

// Si no existen los tipos de @google/genai, declara el módulo para TypeScript
// @ts-ignore
declare module '@google/genai';
// Si no existen los tipos de react-markdown, declara el módulo para TypeScript
// @ts-ignore
declare module 'react-markdown';
// Añadir declaración global para TypeScript
declare global {
  interface ImportMeta {
    env: {
      VITE_API_KEY: string;
      [key: string]: any;
    };
  }
}