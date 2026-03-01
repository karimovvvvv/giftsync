'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Users, Loader2 } from 'lucide-react'
import type { Item } from '@/types'
import { contributionApi } from '@/lib/api'
import { useGuestSession } from '@/hooks/useGuestSession'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface ContributeModalProps {
    item: Item | null
    onClose: () => void
    onSuccess: () => void
}

export function ContributeModal({ item, onClose, onSuccess }: ContributeModalProps) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [amount, setAmount] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const { guestId, saveReservation } = useGuestSession()

    if (!item) return null

    const remaining = item.price
        ? item.price - item.total_collected
        : null
    const isCrowdfunding = item.is_crowdfunding && item.price
    const mode = isCrowdfunding ? 'contribute' : 'reserve'

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return toast.error('Укажите имя')

        const amountVal = mode === 'contribute' ? parseFloat(amount) || 0 : 0
        if (mode === 'contribute' && amountVal <= 0) return toast.error('Укажите сумму')

        setLoading(true)
        try {
            const res = await contributionApi.contribute(item!.id, {
                contributor_name: name.trim(),
                contributor_email: email.trim() || undefined,
                amount: amountVal,
                message: message.trim() || undefined,
                guest_session_id: guestId,
            })
            saveReservation(item!.id, res.data.id)
            toast.success(
                mode === 'reserve'
                    ? `Зарезервировано! Спасибо, ${name} 🎁`
                    : `Взнос ${formatCurrency(amountVal, item!.currency)} добавлен! 💜`
            )
            onSuccess()
            onClose()
        } catch (err: any) {
            const msg = err.response?.data?.detail ?? 'Ошибка'
            toast.error(msg)
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
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'flex-end',
                    padding: '0',
                }}
            >
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%',
                        maxWidth: '480px',
                        margin: '0 auto',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius) var(--radius) 0 0',
                        padding: '24px 20px 32px',
                    }}
                >
                    {/* Ручка */}
                    <div style={{ width: '36px', height: '4px', background: 'var(--border-hover)', borderRadius: '2px', margin: '0 auto 20px' }} />

                    {/* Шапка */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                Представьтесь, пожалуйста 👋
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                {item.title}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Сумма (для режима contribute) */}
                        {isCrowdfunding && mode === 'contribute' && (
                            <div style={{ marginBottom: '12px' }}>
                                <input
                                    className="input-field"
                                    type="number"
                                    min="1"
                                    max={remaining ?? undefined}
                                    step="1"
                                    placeholder={remaining ? `До ${formatCurrency(remaining, item.currency)}` : 'Сумма'}
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    autoFocus
                                />
                                {remaining && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 4px' }}>
                                        Осталось собрать: {formatCurrency(remaining, item.currency)}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Имя */}
                        <input
                            className="input-field"
                            placeholder="Ваше имя *"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ marginBottom: '12px' }}
                            required
                        />

                        {/* Email */}
                        <input
                            className="input-field"
                            type="email"
                            placeholder="Email (для уведомлений — необязательно)"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ marginBottom: '12px' }}
                        />

                        {/* Сообщение */}
                        <textarea
                            className="input-field"
                            placeholder="Поздравление 🎉 (увидит именинник в день события)"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            rows={2}
                            style={{ marginBottom: '16px', resize: 'none' }}
                        />

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading || !name.trim()}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px' }}
                        >
                            {loading
                                ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Отправляем...</>
                                : <><Gift size={16} /> {mode === 'reserve' ? 'Зарезервировать' : `Внести ${amount ? formatCurrency(parseFloat(amount), item.currency) : 'вклад'}`}</>
                            }
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}