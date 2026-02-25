import React, { HTMLAttributes } from 'react';
import { cn } from './Button';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
}

export function Card({ children, className, hover = true, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-surface backdrop-blur-sm rounded-2xl p-6 border border-surface-border shadow-sm transition-all duration-300',
                hover && 'hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/20',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface GlassBoxProps extends CardProps {
    elite?: boolean;
}

export function GlassBox({ children, className, elite, ...props }: GlassBoxProps) {
    return (
        <div
            className={cn(
                'bg-surface/40 backdrop-blur-xl border border-surface-border rounded-3xl p-8 shadow-2xl transition-all duration-500 hover:bg-surface/60',
                elite && 'bg-black/60 border-white/10 shadow-[0_0_40px_0_rgba(218,41,28,0.08)] hover:shadow-[0_0_60px_0_rgba(218,41,28,0.15)]',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}
