'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Loader2, AlertTriangle } from 'lucide-react'
import type { Item } from '@/types'
import { contributionApi } from '@/lib/api'
import { useGuestSession } from '@/hooks/useGuestSession'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface HeroBuyerModalProps {
    item: Item | null
    onClose: () => void
    onSuccess: () => void
}

export function HeroBuyerModal({ item, onClose, onSuccess }: HeroBuyerModalProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const { guestId } = useGuestSession()

    if (!item) return null

    const hasPartialContribs = item.total_collected > 0
    const partialAmount = item.total_collected

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return toast.error('Укажите имя')
        setLoading(true)
        try {
            await contributionApi.heroBuy(item!.id, {
                contributor_name: name.trim(),
                contributor_email: email.trim() || undefined,
                message: message.trim() || undefined,
                guest_session_id: guestId,
            })
            toast.success(`🦸 ${name} — настоящий герой! Подарок за тобой!`)
            onSuccess()
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.detail ?? 'Ошибка')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: '400px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '24px',
                    }}
                >
                    {/* Иконка и заголовок */}
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{
                            width: '60px', height: '60px',
                            background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(244,114,182,0.2))',
                            border: '1px solid rgba(251,146,60,0.3)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 12px',
                            fontSize: '1.75rem',
                        }}>
                            🦸
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                            Купить целиком
                        </h2>
                        <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            «{item.title}»
                        </p>
                        {item.price && (
                            <p style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                                {formatCurrency(item.price, item.currency)}
                            </p>
                        )}
                    </div>

                    {/* Предупреждение о каскаде */}
                    {hasPartialContribs && (
                        <div style={{
                            background: 'rgba(251,146,60,0.08)',
                            border: '1px solid rgba(251,146,60,0.2)',
                            borderRadius: '0.875rem',
                            padding: '12px 14px',
                            marginBottom: '16px',
                            display: 'flex', gap: '10px', alignItems: 'flex-start',
                        }}>
                            <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                Друзья уже внесли{' '}
                                <strong style={{ color: 'var(--warning)' }}>
                                    {formatCurrency(partialAmount, item.currency)}
                                </strong>
                                . Их средства автоматически перейдут на другое желание или в «Фонд Сюрприз».
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <input
                            className="input-field"
                            placeholder="Ваше имя *"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ marginBottom: '12px' }}
                            required
                            autoFocus
                        />
                        <input
                            className="input-field"
                            type="email"
                            placeholder="Email (необязательно)"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ marginBottom: '12px' }}
                        />
                        <textarea
                            className="input-field"
                            placeholder="Поздравление имениннику 🎁"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={2}
                            style={{ marginBottom: '16px', resize: 'none' }}
                        />

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                                Отмена
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !name.trim()}
                                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                {loading
                                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Отправляем...</>
                                    : <><ShoppingBag size={15} /> Куплю сам!</>
                                }
                            </button>
                        </div>
                    </form>

                    <button onClick={onClose} style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                    }}>
                        <X size={18} />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}