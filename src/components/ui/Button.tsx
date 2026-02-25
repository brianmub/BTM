import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium' | 'united';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0',
            secondary: 'bg-secondary text-white hover:bg-secondary-dark shadow-lg shadow-secondary/10 hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0',
            outline: 'border-2 border-surface-border bg-transparent hover:bg-surface text-foreground hover:border-primary/20 transition-all',
            ghost: 'bg-transparent hover:bg-surface text-slate-600 hover:text-foreground transition-all',
            premium: 'bg-gradient-premium text-white hover:opacity-90 shadow-xl shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0',
            united: 'bg-[#DA291C] text-white font-black uppercase tracking-widest hover:bg-[#B31D14] shadow-xl shadow-[#DA291C]/30 hover:shadow-[#DA291C]/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-6 py-2.5',
            lg: 'px-8 py-3.5 text-lg font-bold',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';

export { Button, cn };
