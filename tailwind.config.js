/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores originales
        primary: '#002A8F',
        secondary: '#CF142B',
        accent: '#FFFFFF',
        success: '#4caf50',
        danger: '#f44336',
        warning: '#ff9800',
        'dark-bg': '#002A8F',
        'dark-card': 'rgba(0, 42, 143, 0.7)',
        'light-text': '#FFFFFF',
        
        // Colores futuristas
        'neon-blue': '#00d4ff',
        'neon-purple': '#8b5cf6',
        'neon-cyan': '#06b6d4',
        'neon-green': '#10b981',
        'neon-red': '#ef4434',
        'neon-orange': '#f97316',
        'neon-yellow': '#eab308',
        
        // Gradientes de fondo
        'cyber-dark': '#0f172a',
        'cyber-darker': '#020617',
        'cyber-light': '#1e293b',
        'cyber-lighter': '#334155',
      },
      boxShadow: {
        '3d': '0 10px 20px 0 rgba(0,42,143,0.25), 0 2px 4px 0 rgba(207,20,43,0.15)',
        '3d-card': '0 8px 24px 0 rgba(0,42,143,0.18), 0 1.5px 4px 0 rgba(207,20,43,0.12)',
        
        // Sombras futuristas
        'neon-light': '0 0 5px rgba(0, 212, 255, 0.3)',
        'neon-medium': '0 0 20px rgba(0, 212, 255, 0.5)',
        'neon-heavy': '0 0 30px rgba(0, 212, 255, 0.8)',
        'neon-glow': '0 0 40px rgba(0, 212, 255, 1)',
        
        '3d-light': '0 8px 32px rgba(0, 212, 255, 0.15)',
        '3d-medium': '0 12px 40px rgba(0, 212, 255, 0.2)',
        '3d-heavy': '0 20px 60px rgba(0, 212, 255, 0.3)',
        
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-heavy': '0 20px 60px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'cuban-gradient': 'linear-gradient(135deg, #002A8F 0%, #CF142B 100%)',
        
        // Gradientes futuristas
        'cyber-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'neon-gradient': 'linear-gradient(45deg, #00d4ff, #8b5cf6, #06b6d4)',
        'hologram-gradient': 'linear-gradient(45deg, rgba(0,212,255,0.1), rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
        'matrix-gradient': 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
        
        // Fondos animados
        'cyber-bg': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'space-bg': 'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 100%)',
      },
      borderColor: {
        'cuban-blue': '#002A8F',
        'cuban-red': '#CF142B',
        
        // Bordes futuristas
        'neon-cyan': 'rgba(0, 212, 255, 0.3)',
        'neon-purple': 'rgba(139, 92, 246, 0.3)',
        'neon-glow': 'rgba(0, 212, 255, 0.5)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
      },
      animation: {
        // Animaciones futuristas
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'hologram-float': 'hologram-float 3s ease-in-out infinite',
        'cyber-glow': 'cyber-glow 4s ease infinite',
        'pulse-3d': 'pulse-3d 2s ease-in-out infinite',
        'rotate-3d': 'rotate-3d 10s linear infinite',
        'matrix-rain': 'matrix-rain 10s linear infinite',
        'scan-line': 'scan-line 2s linear infinite',
        'modal-slide': 'modalSlideIn 0.3s ease',
        'fade-in-up': 'fadeInUp 0.5s ease',
        'fade-in-scale': 'fadeInScale 0.3s ease',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': { 
            boxShadow: '0 0 5px rgba(0, 212, 255, 0.3)',
            borderColor: 'rgba(0, 212, 255, 0.3)'
          },
          '50%': { 
            boxShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
            borderColor: 'rgba(0, 212, 255, 0.6)'
          }
        },
        'hologram-float': {
          '0%, 100%': { 
            transform: 'translateY(0px) rotateX(0deg)',
            opacity: '0.8'
          },
          '50%': { 
            transform: 'translateY(-10px) rotateX(5deg)',
            opacity: '1'
          }
        },
        'cyber-glow': {
          '0%, 100%': { 
            backgroundPosition: '0% 50%'
          },
          '50%': { 
            backgroundPosition: '100% 50%'
          }
        },
        'pulse-3d': {
          '0%, 100%': { 
            transform: 'scale(1) translateZ(0)'
          },
          '50%': { 
            transform: 'scale(1.05) translateZ(10px)'
          }
        },
        'rotate-3d': {
          '0%': { 
            transform: 'rotateY(0deg)'
          },
          '100%': { 
            transform: 'rotateY(360deg)'
          }
        },
        'matrix-rain': {
          '0%': { 
            transform: 'translateY(-100vh)',
            opacity: '0'
          },
          '10%': { 
            opacity: '1'
          },
          '90%': { 
            opacity: '1'
          },
          '100%': { 
            transform: 'translateY(100vh)',
            opacity: '0'
          }
        },
        'scan-line': {
          '0%': { 
            transform: 'translateY(-100%)'
          },
          '100%': { 
            transform: 'translateY(100%)'
          }
        },
        'modalSlideIn': {
          'from': {
            transform: 'scale(0.8) translateY(-50px)',
            opacity: '0'
          },
          'to': {
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        },
        'fadeInUp': {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fadeInScale': {
          'from': {
            opacity: '0',
            transform: 'scale(0.9)'
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)'
          }
        }
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
        '2xl': '40px',
        '3xl': '64px',
      },
      fontFamily: {
        'cyber': ['Orbitron', 'monospace'],
        'futuristic': ['Rajdhani', 'sans-serif'],
        'matrix': ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
} 