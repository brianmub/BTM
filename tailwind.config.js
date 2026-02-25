/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#6366f1',
                    dark: '#4f46e5',
                    light: '#818cf8',
                },
                secondary: {
                    DEFAULT: '#ec4899',
                    dark: '#db2777',
                    light: '#f472b6',
                },
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                surface: 'var(--color-surface)',
                'surface-border': 'var(--color-surface-border)',
            },
            backgroundImage: {
                'gradient-premium': 'var(--gradient-premium)',
                'gradient-glass': 'var(--gradient-surface)',
            }
        },
    },
    plugins: [],
}
