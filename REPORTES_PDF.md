# Sistema de Reportes PDF - Sistema Izanagi

## Descripción General

El Sistema Izanagi incluye una funcionalidad robusta y profesional para generar reportes en PDF de todos los aspectos del negocio. Los reportes están diseñados para ser detallados, profesionales y completos, incluyendo toda la información necesaria para auditorías y análisis financieros.

## Características Principales

### 📊 Tipos de Reportes Disponibles

1. **Reporte de Ventas**
   - Resumen de ventas totales
   - Detalle de cada transacción
   - Análisis de ganancias por venta
   - Información de pagos y vuelto
   - Detalle completo de items por venta

2. **Reporte de Transacciones**
   - Historial completo de movimientos financieros
   - Tipos de transacciones (compras, pagos, reinversiones, etc.)
   - Saldos actualizados después de cada transacción
   - Análisis de flujo de efectivo

3. **Reporte de Auditoría**
   - Historial de cierres de caja
   - Discrepancias encontradas
   - Detalle de conteo de efectivo por denominación
   - Información del trabajador que realizó el cierre

4. **Reporte de Compras**
   - Resumen de todas las compras realizadas
   - Detalle de items por compra
   - Análisis de costos y precios de venta
   - Información de proveedores y fechas

5. **Reporte de Nómina**
   - Desglose completo de pagos por trabajador
   - Cálculo de contribuciones y deducciones
   - Información del período de pago
   - Salarios brutos y netos

6. **Reporte Integral**
   - Combina todos los reportes en un solo documento
   - Resumen general del negocio
   - Análisis completo de la situación financiera

### 🎯 Opciones de Reporte

Cada tipo de reporte ofrece dos niveles de detalle:

- **Reporte Básico**: Incluye resúmenes y estadísticas principales
- **Reporte Detallado**: Incluye todas las transacciones, items y detalles completos

## Cómo Usar la Funcionalidad

### Desde la Página de Reportes

1. **Navegar a Reportes**: Ve a la pestaña "Reportes" en el menú principal
2. **Seleccionar Tipo**: Elige la pestaña del tipo de reporte que necesitas:
   - Ventas
   - Ganancias
   - Transacciones
   - Capital
   - Auditoría

3. **Configurar Filtros** (opcional):
   - Establece fechas de inicio y fin para filtrar datos
   - Los filtros se aplicarán automáticamente al reporte

4. **Descargar Reporte**:
   - Haz clic en "Descargar Reporte" en la parte superior
   - Selecciona entre "PDF Básico" o "PDF Detallado"
   - El archivo se descargará automáticamente

### Desde Otras Páginas

#### Página de Compras
- En el historial de compras, encontrarás botones para descargar reportes específicos
- "PDF Básico": Resumen de compras
- "PDF Detallado": Incluye todos los items de cada compra

#### Página de Nómina
- En el historial de nóminas, puedes descargar:
- "Última Nómina PDF": El reporte más reciente
- "Reporte Completo": Información consolidada

## Características Técnicas

### Formato de Archivo
- **Formato**: PDF profesional
- **Orientación**: Vertical (A4)
- **Codificación**: UTF-8 para caracteres especiales
- **Compresión**: Optimizada para archivos pequeños

### Información Incluida

#### Encabezado del Reporte
- Logo y nombre del sistema
- Título del reporte
- Fecha y hora de generación
- Nombre del trabajador que generó el reporte
- Período del reporte (si aplica)

#### Contenido del Reporte
- Resumen ejecutivo con métricas clave
- Tablas detalladas con toda la información
- Gráficos y visualizaciones (cuando sea relevante)
- Pie de página con información adicional

#### Metadatos
- Información de auditoría
- Timestamps de generación
- Versión del sistema
- Configuración utilizada

## Configuración y Personalización

### Opciones de Generación

```typescript
interface ReportOptions {
  title: string;                    // Título del reporte
  subtitle?: string;               // Subtítulo opcional
  dateRange?: {                    // Rango de fechas
    start: string;
    end: string;
  };
  includeCharts?: boolean;         // Incluir gráficos
  includeDetails?: boolean;        // Incluir detalles completos
  workerName?: string;             // Nombre del generador
}
```

### Personalización de Estilos

Los reportes utilizan una configuración consistente:

```typescript
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
```

## Casos de Uso

### Para Administradores
- **Auditoría Financiera**: Reportes detallados para revisión contable
- **Análisis de Rendimiento**: Evaluación de ventas y ganancias
- **Control de Inventario**: Seguimiento de compras y stock
- **Gestión de Personal**: Control de nóminas y pagos

### Para Contadores
- **Reportes Fiscales**: Información detallada para declaraciones
- **Conciliación Bancaria**: Verificación de movimientos financieros
- **Análisis de Costos**: Evaluación de gastos y rentabilidad

### Para Auditores
- **Trail de Auditoría**: Seguimiento completo de transacciones
- **Verificación de Caja**: Control de cierres y discrepancias
- **Cumplimiento**: Verificación de procedimientos y políticas

## Mejores Prácticas

### Generación de Reportes
1. **Filtros Apropiados**: Usa filtros de fecha para reportes específicos
2. **Nivel de Detalle**: Selecciona el nivel apropiado según el propósito
3. **Verificación**: Revisa los datos antes de generar reportes importantes
4. **Almacenamiento**: Guarda copias de reportes críticos

### Uso de Reportes
1. **Análisis Regular**: Genera reportes periódicamente para seguimiento
2. **Comparación**: Compara reportes de diferentes períodos
3. **Documentación**: Usa los reportes como respaldo de decisiones
4. **Compartir**: Distribuye reportes relevantes al equipo

## Solución de Problemas

### Problemas Comunes

#### Reporte No Se Descarga
- Verifica la conexión a internet
- Revisa si hay datos disponibles para el reporte
- Intenta con un rango de fechas diferente

#### Datos Incompletos
- Asegúrate de que los filtros no estén excluyendo datos importantes
- Verifica que el período seleccionado tenga información
- Revisa la configuración de detalles

#### Archivo Corrupto
- Intenta generar el reporte nuevamente
- Verifica el espacio en disco
- Revisa la configuración del navegador

### Contacto y Soporte

Para problemas técnicos o solicitudes de mejora:
- Revisa la documentación del sistema
- Consulta con el administrador del sistema
- Reporta problemas específicos con detalles

## Actualizaciones y Mejoras

### Próximas Características
- Exportación a Excel
- Reportes programados automáticos
- Plantillas personalizables
- Integración con sistemas externos

### Historial de Versiones
- **v1.0**: Implementación inicial de reportes PDF
- **v1.1**: Agregado reporte integral
- **v1.2**: Mejoras en formato y diseño
- **v1.3**: Optimización de rendimiento

---

**Nota**: Esta funcionalidad está diseñada para proporcionar transparencia total y control financiero en el Sistema Izanagi. Todos los reportes incluyen información de auditoría para garantizar la integridad de los datos. 