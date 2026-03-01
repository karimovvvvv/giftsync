'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gift, Zap, Lock, Users, ArrowRight } from 'lucide-react'

const features = [
    { icon: '🔗', title: 'Умный ввод ссылки', desc: 'Вставь URL — название, фото и цена заполнятся сами' },
    { icon: '⏰', title: 'Тайм-капсула', desc: 'Имена и суммы откроются точно в день события' },
    { icon: '🦸', title: 'Hero Buyer', desc: 'Друг может перехватить и купить подарок целиком' },
    { icon: '💜', title: 'Сбор вскладчину', desc: 'Реальтайм прогресс-бар, каскадный перенос взносов' },
]

export default function Home() {
    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero */}
            <main style={{ maxWidth: '820px', margin: '0 auto', padding: '80px 24px 60px', textAlign: 'center' }}>
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                    <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🎁</div>
                    <h1 className="font-display" style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        lineHeight: 1.05,
                        letterSpacing: '-0.04em',
                        margin: '0 0 20px',
                    }}>
                        Gift<span style={{ color: 'var(--accent)' }}>Sync</span>
                    </h1>
                    <p style={{
                        fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                        color: 'var(--text-secondary)',
                        maxWidth: '520px',
                        margin: '0 auto 36px',
                        lineHeight: 1.65,
                    }}>
                        Вишлист с душой. Тайм-капсула с сюрпризами. Сбор вскладчину в реальном времени.
                    </p>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href="/register" className="btn-primary" style={{
                            fontSize: '1rem', padding: '14px 28px',
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                        }}>
                            Создать вишлист <ArrowRight size={17} />
                        </Link>
                        <Link href="/login" className="btn-ghost" style={{ fontSize: '1rem', padding: '14px 28px' }}>
                            Войти
                        </Link>
                    </div>
                </motion.div>

                {/* Фичи */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '14px',
                    marginTop: '70px',
                }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1, duration: 0.45 }}
                            className="glass"
                            style={{
                                borderRadius: 'var(--radius)',
                                padding: '20px',
                                textAlign: 'left',
                            }}
                        >
                            <div style={{ fontSize: '1.75rem', marginBottom: '10px' }}>{f.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: '6px' }}>{f.title}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{f.desc}</div>
                        </motion.div>
                    ))}
                </div>
            </main>
        </div>
    )
}