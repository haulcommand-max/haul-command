import React from 'react';
import { ContentLayout } from '../config/content-system.tokens';

export function HCContentPageShell({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <main className={`min-h-screen hc-surface-c font-body selection:bg-[#F1A91B]/30 w-full overflow-x-hidden ${className}`}>
            {children}
        </main>
    );
}

export function HCContentContainer({ children, className = '', maxW = 'page_standard' }: { children: React.ReactNode, className?: string, maxW?: keyof typeof ContentLayout.maxWidths }) {
    const maxWidthClass = ContentLayout.maxWidths[maxW] || ContentLayout.maxWidths.page_standard;
    return (
        <div className={`w-full mx-auto ${maxWidthClass} ${ContentLayout.containers.page_x_pad} ${className}`}>
            {children}
        </div>
    );
}

export function HCContentSection({ children, className = '', pad = 'section_y_pad' }: { children: React.ReactNode, className?: string, pad?: keyof typeof ContentLayout.containers }) {
    const paddingClass = (pad && ContentLayout.containers[pad]) || ContentLayout.containers.section_y_pad;
    return (
        <section className={`w-full ${paddingClass} ${className}`}>
            {children}
        </section>
    );
}

export function HCContentReadingContainer({ children, className = '' }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`w-full mx-auto ${ContentLayout.maxWidths.content_reading} ${className}`}>
            {children}
        </div>
    );
}
