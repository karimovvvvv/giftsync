import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './app/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#fdf4ff',
                    400: '#e879f9',
                    500: '#a855f7',
                    600: '#9333ea',
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 4px)',
            },
            fontFamily: {
                display: ['"Dela Gothic One"', 'cursive'],
                sans: ['Onest', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
export default config