'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password.length < 8) return toast.error('Пароль минимум 8 символов')
        setLoading(true)
        try {
            await register(email, password)
            toast.success('Добро пожаловать! 🎉')
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.response?.data?.detail ?? 'Ошибка регистрации')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
        }}>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', maxWidth: '400px' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '8px' }}>✨</div>
                    <h1 className="font-display" style={{ fontSize: '2rem', margin: 0, letterSpacing: '-0.03em' }}>
                        Создай вишлист
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                        Поделитесь мечтами с близкими
                    </p>
                </div>

                <div className="glass" style={{ borderRadius: 'var(--radius)', padding: '28px 24px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ position: 'relative', marginBottom: '14px' }}>
                            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                className="input-field"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                style={{ paddingLeft: '38px' }}
                                required
                                autoFocus
                            />
                        </div>
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                className="input-field"
                                type="password"
                                placeholder="Пароль (мин. 8 символов)"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ paddingLeft: '38px' }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.9375rem' }}
                        >
                            {loading ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Создаём...</> : 'Создать аккаунт 🎁'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Уже есть аккаунт?{' '}
                    <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                        Войти
                    </Link>
                </p>
            </motion.div>
        </div>
    )
}