import React, { useState, useContext } from 'react';
import { GoogleGenAI } from '@google/genai';
import { DataContext } from '../context';
import { Card, CardHeader, CardContent, Icon } from '../components/ui';

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

const AIAssistantPage: React.FC = () => {
    const { state, showNotification } = useContext(DataContext);
    const [isLoading, setIsLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState('');
    const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisType | null>(null);

    const generatePrompt = (analysisType: AnalysisType): string => {
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
    };
    
    const handleRunAnalysis = async (analysisType: AnalysisType) => {
        if (!process.env.API_KEY) {
            showNotification('Error de Configuración', 'La API Key de Google Gemini no está configurada. El administrador debe configurarla para usar esta función.', true);
            return;
        }

        setIsLoading(true);
        setAiResponse('');
        setCurrentAnalysis(analysisType);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const userPrompt = generatePrompt(analysisType);
            
            const responseStream = await ai.models.generateContentStream({
                model: 'gemini-2.5-flash',
                contents: {
                    role: 'user',
                    parts: [{ text: userPrompt }]
                },
                config: {
                    systemInstruction: `Eres un asistente IA experto en gestión de negocios, economía y comercio. Tu misión es ayudar a que el negocio crezca como la espuma, actuando como economista, gestor y asesor comercial. Analiza los datos JSON que te proporciono y responde SIEMPRE en español. Da recomendaciones claras, accionables y estratégicas para:
 - Optimizar costos y maximizar ganancias
 - Mejorar procesos internos y gestión de inventario
 - Sugerir estrategias de ventas y marketing
 - Detectar oportunidades de negocio y nichos
 - Proyectar flujos de caja y alertar sobre riesgos
 - Proponer alianzas, promociones y mejoras de equipo
 Responde en formato Markdown, usando encabezados, listas, negritas y tablas si es útil. Sé directo, profesional y enfocado en resultados.`,
                },
            });

            for await (const chunk of responseStream) {
                setAiResponse(prev => prev + chunk.text);
            }

        } catch (error) {
            console.error("Error al contactar la API de Gemini:", error);
            showNotification('Error de API', 'No se pudo obtener una respuesta de la IA. Por favor, revise la consola para más detalles.', true);
            setAiResponse('Ocurrió un error al procesar la solicitud. Verifique su conexión y la configuración de la API Key.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in space-y-4 lg:space-y-0">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader icon="fa-robot">Panel del Asistente IA</CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-400 mb-4">Seleccione un tipo de análisis para obtener recomendaciones y perspectivas sobre su negocio.</p>
                        {analysisOptions.map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleRunAnalysis(opt.id)}
                                disabled={isLoading}
                                className={`w-full text-left p-4 rounded-lg flex items-start gap-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-wait min-h-[56px] text-base active:scale-95 touch-manipulation no-hover ${currentAnalysis === opt.id ? 'bg-accent/80' : 'bg-slate-800/60'}`}
                            >
                                <Icon name={opt.icon} className={`text-2xl mt-1 ${currentAnalysis === opt.id ? 'text-white' : 'text-accent'}`} />
                                <div>
                                    <h3 className="font-semibold text-white">{opt.title}</h3>
                                    <p className="text-sm text-gray-300">{opt.description}</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2">
                <Card className="min-h-[60vh]">
                    <CardHeader icon="fa-lightbulb">Recomendaciones de la IA</CardHeader>
                    <CardContent className="prose prose-invert prose-sm max-w-none prose-headings:text-accent prose-strong:text-white">
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center text-center h-full p-8">
                                <Icon name="fa-spinner fa-spin" className="text-4xl text-accent mb-4" />
                                <p className="text-lg font-semibold text-gray-300">Analizando los datos...</p>
                                <p className="text-gray-400">El asistente está preparando sus recomendaciones. Esto puede tardar unos segundos.</p>
                            </div>
                        )}
                        {!isLoading && !aiResponse && (
                            <div className="flex flex-col items-center justify-center text-center h-full p-8">
                                 <Icon name="fa-magic-wand-sparkles" className="text-5xl text-accent mb-4" />
                                <h3 className="text-2xl font-bold mb-2">Bienvenido al Asistente IA</h3>
                                <p className="text-lg text-gray-400 max-w-md">
                                    Seleccione una opción del panel de la izquierda para comenzar a recibir análisis y consejos para hacer crecer su negocio.
                                </p>
                            </div>
                        )}
                        {aiResponse && (
                            <div className="text-gray-200" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</div>
                        )}
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