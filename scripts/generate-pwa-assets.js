#!/usr/bin/env node

/**
 * Script para generar automáticamente todos los assets necesarios para la PWA
 * Sistema Izanagi - Generador de Assets PWA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de iconos
const ICON_SIZES = [
  { size: 72, name: 'icon-72.png' },
  { size: 96, name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' }
];

// Configuración de splash screens para iOS
const SPLASH_SCREENS = [
  { width: 2048, height: 2732, name: 'splash-2048x2732.png', device: 'iPad Pro 12.9" (portrait)' },
  { width: 1668, height: 2388, name: 'splash-1668x2388.png', device: 'iPad Pro 11" (portrait)' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png', device: 'iPad 9.7" (portrait)' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png', device: 'iPhone X/XS/11 Pro (portrait)' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png', device: 'iPhone XS Max/11 Pro Max (portrait)' },
  { width: 750, height: 1334, name: 'splash-750x1334.png', device: 'iPhone 6/7/8 (portrait)' },
  { width: 640, height: 1136, name: 'splash-640x1136.png', device: 'iPhone 5/SE (portrait)' }
];

// Función para crear un icono SVG base
function createBaseSVG(size) {
  return `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#002A8F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CF142B;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.3"/>
    </filter>
  </defs>
  
  <!-- Fondo con gradiente -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>
  
  <!-- Icono principal -->
  <g transform="translate(${size * 0.2}, ${size * 0.2}) scale(${size * 0.6 / 100})" filter="url(#shadow)">
    <!-- Caja registradora -->
    <rect x="10" y="30" width="80" height="50" rx="5" fill="#FFFFFF" opacity="0.9"/>
    <rect x="15" y="35" width="70" height="40" rx="3" fill="#002A8F"/>
    
    <!-- Pantalla -->
    <rect x="20" y="40" width="60" height="15" rx="2" fill="#4CAF50"/>
    <text x="50" y="50" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="8" font-weight="bold">IZANAGI</text>
    
    <!-- Teclas -->
    <circle cx="30" cy="65" r="3" fill="#FFFFFF"/>
    <circle cx="45" cy="65" r="3" fill="#FFFFFF"/>
    <circle cx="60" cy="65" r="3" fill="#FFFFFF"/>
    <circle cx="75" cy="65" r="3" fill="#FFFFFF"/>
    
    <!-- Base -->
    <rect x="5" y="80" width="90" height="8" rx="4" fill="#CF142B"/>
  </g>
  
  <!-- Texto del sistema -->
  <text x="${size * 0.5}" y="${size * 0.9}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold">IZANAGI</text>
</svg>`;
}

// Función para crear un splash screen SVG
function createSplashScreenSVG(width, height) {
  const centerX = width / 2;
  const centerY = height / 2;
  const iconSize = Math.min(width, height) * 0.15;
  
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#002A8F;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#CF142B;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Fondo con gradiente -->
  <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>
  
  <!-- Icono centrado -->
  <g transform="translate(${centerX - iconSize/2}, ${centerY - iconSize/2})">
    <rect width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.2}" fill="#FFFFFF" opacity="0.9"/>
    <g transform="translate(${iconSize * 0.2}, ${iconSize * 0.2}) scale(${iconSize * 0.6 / 100})">
      <rect x="10" y="30" width="80" height="50" rx="5" fill="#002A8F"/>
      <rect x="20" y="40" width="60" height="15" rx="2" fill="#4CAF50"/>
      <text x="50" y="50" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="8" font-weight="bold">IZANAGI</text>
      <rect x="5" y="80" width="90" height="8" rx="4" fill="#CF142B"/>
    </g>
  </g>
  
  <!-- Texto del sistema -->
  <text x="${centerX}" y="${centerY + iconSize * 0.8}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="${width * 0.04}" font-weight="bold">Sistema Izanagi</text>
  <text x="${centerX}" y="${centerY + iconSize * 1.2}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="${width * 0.02}" opacity="0.8">Gestión Comercial</text>
</svg>`;
}

// Función para convertir SVG a PNG usando Canvas (simulado)
function svgToPNG(svgContent, filename) {
  // En un entorno real, usarías una librería como sharp o canvas
  // Por ahora, solo guardamos el SVG
  const svgPath = path.join(process.cwd(), 'public', filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Generado: ${filename.replace('.png', '.svg')}`);
}

// Función principal
function generatePWAAssets() {
  console.log('🚀 Generando assets para PWA Sistema Izanagi...\n');
  
  // Crear directorio public si no existe
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // Generar iconos
  console.log('📱 Generando iconos...');
  ICON_SIZES.forEach(({ size, name }) => {
    const svg = createBaseSVG(size);
    svgToPNG(svg, name);
  });
  
  // Generar splash screens
  console.log('\n🖼️  Generando splash screens...');
  SPLASH_SCREENS.forEach(({ width, height, name, device }) => {
    const svg = createSplashScreenSVG(width, height);
    svgToPNG(svg, name);
    console.log(`   📱 ${device}: ${name.replace('.png', '.svg')}`);
  });
  
  // Generar icono maskable
  console.log('\n🎭 Generando icono maskable...');
  const maskableSVG = createBaseSVG(512);
  svgToPNG(maskableSVG, 'icon-maskable.png');
  
  // Crear archivo de configuración
  console.log('\n⚙️  Generando configuración...');
  const config = {
    generated: new Date().toISOString(),
    version: '2.0.0',
    icons: ICON_SIZES,
    splashScreens: SPLASH_SCREENS,
    instructions: [
      '1. Los archivos SVG se han generado en el directorio public/',
      '2. Convierte los SVG a PNG usando una herramienta como:',
      '   - https://convertio.co/svg-png/',
      '   - https://cloudconvert.com/svg-to-png',
      '   - O usa una librería como sharp en Node.js',
      '3. Asegúrate de que todos los archivos PNG estén en public/',
      '4. Verifica que el manifest.json incluya todos los iconos',
      '5. Prueba la instalación PWA en diferentes dispositivos'
    ]
  };
  
  const configPath = path.join(process.cwd(), 'pwa-assets-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Configuración guardada en: pwa-assets-config.json');
  
  console.log('\n🎉 ¡Assets PWA generados exitosamente!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Convierte los archivos SVG a PNG');
  console.log('2. Coloca todos los archivos PNG en el directorio public/');
  console.log('3. Verifica que el manifest.json incluya todos los iconos');
  console.log('4. Prueba la instalación PWA en diferentes dispositivos');
  console.log('\n🔗 Recursos útiles:');
  console.log('- PWA Builder: https://www.pwabuilder.com/');
  console.log('- Lighthouse PWA Audit: https://developers.google.com/web/tools/lighthouse');
  console.log('- Web App Manifest: https://developer.mozilla.org/en-US/docs/Web/Manifest');
}

// Ejecutar si se llama directamente
generatePWAAssets(); 