
import React from 'react';

// Icon Component - Optimizado
interface IconProps {
  name: string;
  className?: string;
}
export const Icon: React.FC<IconProps> = React.memo(({ name, className }) => (
  <i className={`fas ${name} ${className || ''} align-middle`} aria-hidden="true"></i>
));

// Card Components - Optimizados y más limpios
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = React.memo(({ children, className }) => (
  <div className={`bg-dark-card backdrop-blur-md border border-slate-700/50 rounded-xl shadow-lg overflow-hidden mb-3 sm:mb-4 p-3 sm:p-4 md:p-5 ${className || ''} focus:outline-none focus:ring-2 focus:ring-accent transition-all duration-200`}
    tabIndex={0} role="region" aria-label="Tarjeta de información">
    {children}
  </div>
));

interface CardHeaderProps {
  children: React.ReactNode;
  icon?: string;
}
export const CardHeader: React.FC<CardHeaderProps> = React.memo(({ children, icon }) => (
  <div className="px-3 sm:px-4 py-2 sm:py-3 bg-black/30 border-b border-slate-700/50 shadow-sm rounded-t-xl">
    <h2 className="text-sm sm:text-base font-semibold flex items-center gap-2 sm:gap-3">
      {icon && <Icon name={icon} className="text-accent drop-shadow-sm" />}
      <span className="truncate">{children}</span>
    </h2>
  </div>
));

export const CardContent: React.FC<CardProps> = React.memo(({ children, className }) => (
  <div className={`p-2 sm:p-3 md:p-4 ${className || ''}`} tabIndex={0} role="region">
    {children}
  </div>
));

// Form Components - Optimizados
interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}
export const InputGroup: React.FC<InputGroupProps> = React.memo(({ label, children, className }) => (
  <div className={`mb-2 sm:mb-3 ${className || ''}`}> 
    <label className="block text-xs sm:text-sm font-medium text-accent mb-1 truncate drop-shadow-sm" aria-label={label}>{label}</label>
    {children}
  </div>
));

const baseInputStyles = "w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition touch-manipulation shadow-sm text-sm sm:text-base";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${baseInputStyles} min-h-[36px] sm:min-h-[40px] ${className || ''}`} {...props} aria-label={props['aria-label'] || props.placeholder || ''} />
));
Input.displayName = 'Input';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select: React.FC<SelectProps> = React.memo(({ children, className, ...props }) => (
  <select className={`${baseInputStyles} min-h-[36px] sm:min-h-[40px] ${className || ''}`} {...props} aria-label={props['aria-label'] || ''}>
    {children}
  </select>
));

// Button Component - Completamente refactorizado y optimizado
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'icon' | 'secondary';
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', icon, size = 'md', className, ...props }, ref) => {
    const baseClasses = "font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 select-none shadow-sm border border-transparent touch-manipulation";
    
    const sizeClasses = {
      sm: "px-2 py-1 text-xs min-h-[28px] min-w-[28px]",
      md: "px-3 py-1.5 text-sm min-h-[36px] min-w-[36px]",
      lg: "px-4 py-2 text-base min-h-[44px] min-w-[44px]"
    };
    
    const variantClasses = {
      primary: "bg-primary text-white border-accent hover:bg-primary/90 hover:text-white focus:bg-primary/80 focus:text-white",
      secondary: "bg-slate-700 text-white border-slate-600 hover:bg-slate-600 hover:text-white focus:bg-slate-600 focus:text-white",
      danger: "bg-danger text-white border-danger hover:bg-danger/90 hover:text-white focus:bg-danger/80 focus:text-white",
      success: "bg-success text-white border-success hover:bg-success/90 hover:text-white focus:bg-success/80 focus:text-white",
      icon: "bg-accent text-primary w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border-accent hover:bg-accent/80 hover:text-primary focus:bg-accent/70 focus:text-primary",
    };

    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`} {...props} aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}>
        <span className="flex items-center justify-center gap-1.5 sm:gap-2 truncate">
          {icon && <Icon name={icon} />}
          <span className="truncate whitespace-nowrap overflow-hidden">{children}</span>
        </span>
      </button>
    );
  }
);
Button.displayName = 'Button';

// Modal Component - Optimizado
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export const Modal: React.FC<ModalProps> = React.memo(({ isOpen, onClose, title, children, size = 'md' }) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-dark-card rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
            aria-label="Cerrar"
          >
            <Icon name="fa-times" className="text-xl" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  );
});