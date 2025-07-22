
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
  <div className={`bg-dark-card backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden mb-6 p-6 sm:p-8 ${className || ''} focus:outline-none focus:ring-2 focus:ring-accent`} tabIndex={0} role="region" aria-label="Tarjeta de información">
    {children}
  </div>
);

interface CardHeaderProps {
  children: React.ReactNode;
  icon?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = ({ children, icon }) => (
  <div className="px-6 py-4 bg-black/20 border-b border-slate-700/50">
    <h2 className="text-xl font-semibold flex items-center gap-3">
      {icon && <Icon name={icon} className="text-accent drop-shadow-md" />}
      {children}
    </h2>
  </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={`p-4 sm:p-6 ${className || ''}`} tabIndex={0} role="region">
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
  <div className={`mb-4 ${className || ''}`}> 
    <label className="block text-sm font-medium text-gray-300 mb-2" aria-label={label}>{label}</label>
    {children}
  </div>
);

const baseInputStyles = "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition touch-manipulation no-hover";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${baseInputStyles} text-base md:text-lg min-h-[48px] ${className || ''}`} {...props} aria-label={props['aria-label'] || props.placeholder || ''} />
));
Input.displayName = 'Input';


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select: React.FC<SelectProps> = ({ children, className, ...props }) => (
  <select className={`${baseInputStyles} ${className || ''}`} {...props} aria-label={props['aria-label'] || ''}>
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
    const baseClasses = "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 select-none min-h-[48px] min-w-[48px] text-base md:text-lg shadow-md border-2 border-transparent touch-manipulation no-hover";
    
    const variantClasses = {
      primary: "bg-primary text-white border-accent hover:bg-accent hover:text-primary focus:bg-accent focus:text-primary",
      danger: "bg-danger text-white border-danger hover:bg-white hover:text-danger focus:bg-white focus:text-danger",
      success: "bg-success text-white border-success hover:bg-white hover:text-success focus:bg-white focus:text-success",
      icon: "bg-accent text-primary w-12 h-12 flex items-center justify-center border-accent hover:bg-primary hover:text-accent focus:bg-primary focus:text-accent",
    };

    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} px-6 py-3 ${className || ''}`} {...props} aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}>
        <span className="flex items-center justify-center gap-2">
          {icon && <Icon name={icon} />}
          {children}
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