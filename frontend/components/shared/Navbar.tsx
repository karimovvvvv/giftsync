'use client'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from './Avatar'
import { LogOut, LayoutDashboard } from 'lucide-react'

export function Navbar() {
    const { user, logout } = useAuth()

    return (
        <header style={{
            position: 'sticky', top: 0, zIndex: 50,
            padding: '0 1.5rem',
            height: '60px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(14,12,20,0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
        }}>
            {/* Лого */}
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <span style={{ fontSize: '1.4rem' }}>🎁</span>
                <span className="font-display" style={{ fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    Gift<span style={{ color: 'var(--accent)' }}>Sync</span>
                </span>
            </Link>

            {/* Правая часть */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user ? (
                    <>
                        <Link
                            href="/dashboard"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                color: 'var(--text-secondary)', textDecoration: 'none',
                                fontSize: '0.875rem', fontWeight: 500,
                                padding: '6px 12px',
                                borderRadius: '0.75rem',
                                border: '1px solid var(--border)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <LayoutDashboard size={15} />
                            Мои вишлисты
                        </Link>
                        <button
                            onClick={logout}
                            title="Выйти"
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                borderRadius: '0.75rem',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center',
                                color: 'var(--text-muted)',
                                transition: 'all 0.2s',
                            }}
                        >
                            <LogOut size={15} />
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="btn-ghost" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
                            Войти
                        </Link>
                        <Link href="/register" className="btn-primary" style={{ fontSize: '0.875rem', padding: '6px 16px' }}>
                            Создать вишлист
                        </Link>
                    </>
                )}
            </div>
        </header>
    )
}