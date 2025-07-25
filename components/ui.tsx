
import React from 'react';

// Icon Component
interface IconProps {
  name: string;
  className?: string;
}
export const Icon: React.FC<IconProps> = ({ name, className }) => (
  <i className={`fas ${name} ${className || ''} align-middle`} aria-hidden="true"></i>
);

// Card Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`bg-dark-card backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-3d-card overflow-hidden mb-4 sm:mb-6 p-2 sm:p-4 md:p-6 lg:p-8 ${className || ''} focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200`}
    tabIndex={0} role="region" aria-label="Tarjeta de información">
    {children}
  </div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  icon?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ children, icon }) => (
  <div className="px-3 sm:px-6 py-2 sm:py-4 bg-black/30 border-b border-slate-700/50 shadow-3d-card rounded-t-2xl">
    <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2 sm:gap-3">
      {icon && <Icon name={icon} className="text-accent drop-shadow-md" />}
      <span className="truncate">{children}</span>
    </h2>
  </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={`p-2 sm:p-4 md:p-6 ${className || ''}`} tabIndex={0} role="region">
    {children}
  </div>
);

// Form Components
interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
export const InputGroup: React.FC<InputGroupProps> = ({ label, children, className }) => (
  <div className={`mb-3 sm:mb-4 ${className || ''}`}> 
    <label className="block text-xs sm:text-sm font-medium text-accent mb-1 sm:mb-2 truncate drop-shadow-md" aria-label={label}>{label}</label>
    {children}
  </div>
);

const baseInputStyles = "w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-900/50 border-2 border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent focus:shadow-3d-card transition touch-manipulation no-hover shadow-md";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${baseInputStyles} text-sm sm:text-base md:text-lg min-h-[40px] sm:min-h-[48px] ${className || ''}`} {...props} aria-label={props['aria-label'] || props.placeholder || ''} />
));
Input.displayName = 'Input';


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select: React.FC<SelectProps> = ({ children, className, ...props }) => (
  <select className={`${baseInputStyles} text-sm sm:text-base md:text-lg min-h-[40px] sm:min-h-[48px] ${className || ''}`} {...props} aria-label={props['aria-label'] || ''}>
    {children}
  </select>
);

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'icon';
  icon?: string;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', icon, className, ...props }, ref) => {
    const baseClasses = "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 select-none min-h-[40px] sm:min-h-[48px] min-w-[40px] sm:min-w-[48px] text-sm sm:text-base md:text-lg shadow-3d-card border-2 border-transparent touch-manipulation no-hover";
    
    const variantClasses = {
      primary: "bg-primary text-white border-accent hover:bg-primary/90 hover:text-white focus:bg-primary/80 focus:text-white",
      danger: "bg-danger text-white border-danger hover:bg-danger/90 hover:text-white focus:bg-danger/80 focus:text-white",
      success: "bg-success text-white border-success hover:bg-success/90 hover:text-white focus:bg-success/80 focus:text-white",
      icon: "bg-accent text-primary w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border-accent hover:bg-accent/80 hover:text-primary focus:bg-accent/70 focus:text-primary",
    };

    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} px-4 sm:px-6 py-2 sm:py-3 ${className || ''}`} {...props} aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}>
        <span className="flex items-center justify-center gap-2 sm:gap-3 truncate">
          {icon && <Icon name={icon} />}
          <span className="truncate whitespace-nowrap overflow-hidden">{children}</span>
        </span>
      </button>
    );
  }
);
Button.displayName = 'Button';

// Estilos globales para feedback táctil y no-hover
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .touch-manipulation { touch-action: manipulation; }
    .no-hover:hover { background: none !important; filter: none !important; }
  `;
  document.head.appendChild(style);
}