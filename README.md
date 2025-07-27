# Izanagi Sales System

Sistema de ventas, inventario y gestión para negocios modernos. Rápido, seguro y optimizado para móvil.

## Requisitos
- Node.js >= 18
- npm >= 9

## Desarrollo local

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Crea un archivo `.env.local` en la raíz y agrega tu clave de Gemini:
   ```env
   GEMINI_API_KEY=tu_clave_aqui
   ```
3. Inicia la app en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Accede a [http://localhost:5173](http://localhost:5173)

## Scripts útiles
- `npm run dev`: Inicia el servidor de desarrollo (Vite)
- `npm run build`: Genera la build de producción
- `npm run preview`: Previsualiza la build de producción localmente
- `npm run test`: Ejecuta los tests

## Despliegue en Vercel

1. Haz push de tu repositorio a GitHub/GitLab/Bitbucket.
2. Entra a [vercel.com/import](https://vercel.com/import) y conecta tu repo.
3. Configura la variable de entorno `GEMINI_API_KEY` en Vercel.
4. Vercel detectará automáticamente el framework (Vite) y usará los scripts `build` y `preview`.
5. Despliega y accede a tu app desde la URL proporcionada por Vercel.

---

Creado por Isarias
