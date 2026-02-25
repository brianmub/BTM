import { ReactNode } from 'react';
import { GlassBox } from '@/components/ui/Card';
import { useOrganization } from '@/hooks/useOrganization';

interface PublicLayoutProps {
    children: ReactNode;
    showFooter?: boolean;
}

export function PublicLayout({ children, showFooter = true }: PublicLayoutProps) {
    const { organization } = useOrganization();

    const primaryColor = '#6366f1';
    const secondaryColor = '#ec4899';

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans relative overflow-x-hidden">
            {/* Dynamic Background */}
            <div
                className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20 blur-[150px] pointer-events-none"
                style={{ background: primaryColor }}
            ></div>
            <div
                className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-10 blur-[150px] pointer-events-none"
                style={{ background: secondaryColor }}
            ></div>

            {/* Content */}
            <main className="relative z-10 p-6 md:p-12">
                {children}
            </main>

            {/* Footer */}
            {showFooter && (
                <footer className="relative z-10 py-12 text-center text-slate-500 text-xs font-medium border-t border-surface-border mx-12">
                    <p className="uppercase tracking-widest mb-2 font-black">{organization?.name || 'Church Programs Pro'}</p>
                    <p>Powered by <span className="text-slate-500">Antigravity Systems</span></p>
                </footer>
            )}
        </div>
    );
}
