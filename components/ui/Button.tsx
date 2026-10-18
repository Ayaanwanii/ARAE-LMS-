/**
 * Button Component
 * Reusable button with variants and sizes
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            isLoading = false,
            fullWidth = false,
            disabled,
            className = '',
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none shadow-sm hover:-translate-y-0.5 active:translate-y-0';

        const variants = {
            primary: 'bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 text-white hover:from-indigo-500 hover:via-blue-500 hover:to-cyan-400 focus:ring-indigo-500 shadow-indigo-500/20',
            secondary: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-500 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100',
            outline: 'border border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white focus:ring-slate-400',
            ghost: 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/10 focus:ring-slate-400',
            danger: 'bg-gradient-to-r from-rose-600 to-red-500 text-white hover:from-rose-500 hover:to-red-400 focus:ring-red-500',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2.5 text-sm sm:text-base',
            lg: 'px-6 py-3.5 text-base sm:text-lg',
        };

        const widthClass = fullWidth ? 'w-full' : '';

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
                {...props}
            >
                {isLoading && (
                    <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        />
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
