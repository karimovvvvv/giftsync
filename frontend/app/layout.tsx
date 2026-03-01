'use client'
import './globals.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ru">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>GiftSync — Вишлист с душой</title>
                <meta name="description" content="Создайте вишлист и позвольте друзьям удивить вас" />
                <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎁</text></svg>" />
            </head>
            <body>
                <div className="orb orb-1" />
                <div className="orb orb-2" />
                <QueryClientProvider client={queryClient}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        {children}
                    </div>
                    <Toaster
                        position="bottom-center"
                        toastOptions={{
                            style: {
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                fontFamily: 'Onest, sans-serif',
                            },
                        }}
                    />
                </QueryClientProvider>
            </body>
        </html>
    )
}