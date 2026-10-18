/**
 * Input Component
 * Reusable text input with labels and validation
 */

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    rightElement?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, className = '', rightElement, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <input
                        ref={ref}
                        className={`w-full px-4 py-3 border ${error ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-slate-700'
                            } rounded-xl focus:ring-2 ${error ? 'focus:ring-red-500' : 'focus:ring-indigo-500'
                            } focus:border-transparent outline-none transition text-gray-900 dark:text-white bg-white dark:bg-slate-800/90 placeholder-gray-400 dark:placeholder-gray-500 font-medium ${rightElement ? 'pr-10' : ''} ${className}`}
                        {...props}
                    />

                    {rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-400">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
                {helperText && !error && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export default Input;
