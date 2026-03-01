'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Loader2, Calendar, Globe, Lock } from 'lucide-react'
import { wishlistApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CreateWishlistModalProps {
    open: boolean
    onClose: () => void
}

export function CreateWishlistModal({ open, onClose }: CreateWishlistModalProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [eventDate, setEventDate] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const [loading, setLoading] = useState(false)
    const queryClient = useQueryClient()
    const router = useRouter()

    function handleClose() {
        if (loading) return
        setTitle(''); setDescription(''); setEventDate(''); setIsPublic(true)
        onClose()
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return toast.error('Введите название')

        setLoading(true)
        try {
            const res = await wishlistApi.create({
                title: title.trim(),
                description: description.trim() || undefined,
                event_date: eventDate || undefined,
                is_public: isPublic,
            })
            await queryClient.invalidateQueries({ queryKey: ['my-wishlists'] })
            toast.success('Вишлист создан! 🎉')
            handleClose()
            router.push(`/w/${res.data.slug}`)
        } catch (err: any) {
            toast.error(err.response?.data?.detail ?? 'Не удалось создать вишлист')
        } finally {
            setLoading(false)
        }
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 100,
                        background: 'rgba(0,0,0,0.72)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                >
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.93, y: 24 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 24 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '460px',
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius)',
                            padding: '28px 24px',
                            position: 'relative',
                        }}
                    >
                        {/* Закрыть */}
                        <button
                            onClick={handleClose}
                            style={{
                                position: 'absolute', top: '16px', right: '16px',
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', display: 'flex', padding: '4px',
                                borderRadius: '6px',
                            }}
                        >
                            <X size={18} />
                        </button>

                        {/* Заголовок */}
                        <div style={{ marginBottom: '22px' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                Новый вишлист
                            </h2>
                            <p style={{ margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                Поделитесь желаниями с близкими
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Название */}
                            <input
                                className="input-field"
                                placeholder="Название (например: ДР 2025 🎂)"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                style={{ marginBottom: '12px' }}
                                required
                                autoFocus
                            />

                            {/* Описание */}
                            <textarea
                                className="input-field"
                                placeholder="Описание (необязательно)"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                style={{ marginBottom: '12px', resize: 'none' }}
                            />

                            {/* Дата события */}
                            <div style={{ marginBottom: '12px' }}>
                                <label style={{
                                    display: 'flex', alignItems: 'center', gap: '7px',
                                    fontSize: '0.75rem', color: 'var(--text-muted)',
                                    marginBottom: '5px', fontWeight: 500,
                                }}>
                                    <Calendar size={13} />
                                    Дата события — запустит Тайм-капсулу
                                </label>
                                <input
                                    className="input-field"
                                    type="datetime-local"
                                    value={eventDate}
                                    onChange={e => setEventDate(e.target.value)}
                                />
                                {eventDate && (
                                    <p style={{ margin: '5px 0 0 4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ⏰ Имена и суммы откроются после этой даты
                                    </p>
                                )}
                            </div>

                            {/* Приватность */}
                            <div
                                style={{
                                    display: 'flex',
                                    background: 'var(--bg-glass)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.875rem',
                                    padding: '4px',
                                    marginBottom: '20px',
                                }}
                            >
                                {([
                                    { value: true, icon: <Globe size={14} />, label: 'Публичный' },
                                    { value: false, icon: <Lock size={14} />, label: 'Приватный' },
                                ] as const).map(opt => (
                                    <button
                                        key={String(opt.value)}
                                        type="button"
                                        onClick={() => setIsPublic(opt.value)}
                                        style={{
                                            flex: 1, padding: '9px',
                                            border: 'none', cursor: 'pointer',
                                            borderRadius: '0.625rem',
                                            fontFamily: 'Onest, sans-serif',
                                            fontSize: '0.875rem', fontWeight: 600,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            transition: 'all 0.2s',
                                            background: isPublic === opt.value
                                                ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
                                                : 'transparent',
                                            color: isPublic === opt.value ? 'white' : 'var(--text-muted)',
                                        }}
                                    >
                                        {opt.icon}
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <p style={{ margin: '-14px 0 16px 4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {isPublic
                                    ? '🌐 Любой по ссылке сможет видеть и дарить подарки'
                                    : '🔒 Только по прямой ссылке, без индексации'}
                            </p>

                            {/* Кнопки */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={handleClose}
                                    disabled={loading}
                                    style={{ flex: 1 }}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading || !title.trim()}
                                    style={{
                                        flex: 2,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        padding: '13px',
                                    }}
                                >
                                    {loading
                                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Создаём...</>
                                        : <><Plus size={16} /> Создать вишлист</>
                                    }
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}