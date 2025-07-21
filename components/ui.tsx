
import React from 'react';

// Icon Component
interface IconProps {
  name: string;
  className?: string;
}
export const Icon: React.FC<IconProps> = ({ name, className }) => (
  <i className={`fas ${name} ${className || ''}`}></i>
);

// Card Components
interface CardProps {
  children: React.ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className }) => (
  <div className={`bg-dark-card backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden ${className || ''}`} tabIndex={0} role="region" aria-label="Tarjeta de información">
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
      {icon && <Icon name={icon} className="text-accent" />}
      {children}
    </h2>
  </div>
);

export const CardContent: React.FC<CardProps> = ({ children, className }) => (
  <div className={`p-6 ${className || ''}`}>
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
    <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
    {children}
  </div>
);

const baseInputStyles = "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input ref={ref} className={`${baseInputStyles} text-base md:text-lg min-h-[48px] ${className || ''}`} {...props} aria-label={props['aria-label'] || props.placeholder || ''} />
));
Input.displayName = 'Input';


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
export const Select: React.FC<SelectProps> = ({ children, className, ...props }) => (
  <select className={`${baseInputStyles} ${className || ''}`} {...props}>
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
    const baseClasses = "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 select-none min-h-[48px] min-w-[48px] text-base md:text-lg";
    
    const variantClasses = {
      primary: "bg-accent hover:bg-indigo-500 text-white px-6 py-3",
      danger: "bg-danger hover:bg-red-700 text-white px-6 py-3",
      success: "bg-success hover:bg-green-600 text-white px-6 py-3",
      icon: "bg-slate-700/80 hover:bg-slate-600 text-gray-200 w-12 h-12 flex items-center justify-center",
    };

    return (
      <button ref={ref} className={`${baseClasses} ${variantClasses[variant]} ${className || ''}`} {...props} aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}>
        <div className="flex items-center justify-center gap-2">
          {icon && <Icon name={icon} />}
          {children}
        </div>
      </button>
    );
  }
);
Button.displayName = 'Button';