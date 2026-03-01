'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Archive, AlertTriangle, Loader2 } from 'lucide-react'
import type { Item } from '@/types'
import { itemApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface ArchiveWarningModalProps {
    item: Item | null
    onClose: () => void
    onSuccess: () => void
}

export function ArchiveWarningModal({ item, onClose, onSuccess }: ArchiveWarningModalProps) {
    const [loading, setLoading] = useState(false)

    if (!item) return null

    const percent = item.funding_percent
    const isFull = percent >= 100
    const hasContribs = item.total_collected > 0

    async function handleConfirm() {
        setLoading(true)
        try {
            const res = await itemApi.delete(item!.id)
            if (res.data?.archived) {
                toast.success(isFull ? 'Желание скрыто в архив' : 'Архивировано, взносы перенесены')
            } else {
                toast.success('Желание удалено')
            }
            onSuccess()
            onClose()
        } catch {
            toast.error('Ошибка при удалении')
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
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        width: '100%', maxWidth: '380px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: '24px',
                        position: 'relative',
                    }}
                >
                    <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={18} />
                    </button>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>
                            {isFull ? '🎉' : hasContribs ? '⚠️' : '🗑️'}
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>
                            {isFull
                                ? 'Подарок уже собран!'
                                : hasContribs
                                    ? 'Есть частичные взносы'
                                    : 'Удалить желание?'}
                        </h2>
                    </div>

                    <div style={{
                        background: isFull ? 'rgba(74,222,128,0.06)' : hasContribs ? 'rgba(251,146,60,0.06)' : 'var(--bg-glass)',
                        border: `1px solid ${isFull ? 'rgba(74,222,128,0.15)' : hasContribs ? 'rgba(251,146,60,0.15)' : 'var(--border)'}`,
                        borderRadius: '0.875rem',
                        padding: '14px',
                        marginBottom: '20px',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                    }}>
                        {isFull ? (
                            <>Друзья уже собрали всю сумму на <strong>«{item.title}»</strong>! Мы просто скроем его в архив, сбор останется заблокированным.</>
                        ) : hasContribs ? (
                            <>Друзья уже начали копить на <strong>«{item.title}»</strong> — внесено{' '}
                                <strong style={{ color: 'var(--warning)' }}>{formatCurrency(item.total_collected, item.currency)}</strong>.
                                Средства автоматически перейдут на другое желание или в «Фонд Сюрприз».</>
                        ) : (
                            <>Желание <strong>«{item.title}»</strong> будет удалено безвозвратно.</>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-ghost" onClick={onClose} style={{ flex: 1 }}>
                            Отмена
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleConfirm}
                            disabled={loading}
                            style={{
                                flex: 2,
                                background: hasContribs && !isFull
                                    ? 'linear-gradient(135deg, var(--warning), #f59e0b)'
                                    : undefined,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            }}
                        >
                            {loading
                                ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                : isFull || hasContribs
                                    ? <><Archive size={15} /> В архив</>
                                    : 'Удалить'
                            }
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}