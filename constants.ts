
import { Page } from './types';

// A list of available icons for the user to choose from when creating a category.
export const AVAILABLE_ICONS: string[] = [
  "📦", "🍬", "🧼", "💻", "🥤", "🛒", "🏷️", "🍎", "🍞", "🥩", 
  "🥦", "💊", "🏠", "🎁", "🎨", "⚽", "🧩", "📚"
];

// The default icon to use when a category's icon is not specified.
export const DEFAULT_ICON = "📦";

export const PAGES = [
  { id: Page.POS, label: 'TPV', icon: 'fa-shopping-cart', shortcut: 'F1' },
  { id: Page.Purchases, label: 'Compras', icon: 'fa-dolly', shortcut: 'F2' },
  { id: Page.Inventory, label: 'Inventario', icon: 'fa-boxes', shortcut: 'F3' },
  { id: Page.Reports, label: 'Reportes', icon: 'fa-chart-line', shortcut: 'F4' },
  { id: Page.Payroll, label: 'Nómina', icon: 'fa-file-invoice-dollar', shortcut: 'F5' },
  { id: Page.Workers, label: 'Trabajadores', icon: 'fa-users-cog', shortcut: 'F6' },
  { id: Page.AI, label: 'Asistente IA', icon: 'fa-robot', shortcut: 'F7' },
  { id: Page.Debts, label: 'Deudas', icon: 'fa-credit-card', shortcut: 'F8' },
  { id: Page.Config, label: 'Configuración', icon: 'fa-cog' },
];