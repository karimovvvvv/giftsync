'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Gift, Calendar, Lock, Globe, Loader2, X, Share2, ExternalLink } from 'lucide-react'
import { useMyWishlists } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { wishlistApi } from '@/lib/api'
import { Navbar } from '@/components/shared/Navbar'
import { formatDate } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import type { WishlistShort } from '@/types'

export default function DashboardPage() {
    const { user, loading: authLoading } = useAuth()
    const { data: wishlists, isLoading } = useMyWishlists()
    const [creating, setCreating] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [title, setTitle] = useState('')
    const [eventDate, setEventDate] = useState('')
    const [isPublic, setIsPublic] = useState(true)
    const queryClient = useQueryClient()
    const router = useRouter()

    // Редирект если не авторизован
    if (!authLoading && !user) {
        if (typeof window !== 'undefined') router.push('/login')
        return null
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return toast.error('Введите название')
        setCreating(true)
        try {
            const res = await wishlistApi.create({
                title: title.trim(),
                event_date: eventDate || undefined,
                is_public: isPublic,
            })
            queryClient.invalidateQueries({ queryKey: ['my-wishlists'] })
            toast.success('Вишлист создан! 🎉')
            setShowForm(false)
            setTitle(''); setEventDate('')
            router.push(`/w/${res.data.slug}`)
        } catch {
            toast.error('Не удалось создать')
        } finally {
            setCreating(false)
        }
    }

    function copyLink(slug: string) {
        const url = `${window.location.origin}/w/${slug}`
        navigator.clipboard.writeText(url)
        toast.success('Ссылка скопирована!')
    }

    return (
        <>
            <Navbar />
            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
                {/* Заголовок */}
                <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                        <h1 className="font-display" style={{ margin: 0, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
                            Мои вишлисты
                        </h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            {wishlists?.length ? `${wishlists.length} список${wishlists.length > 1 ? 'а' : ''}` : 'Создайте первый'}
                        </p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(!showForm)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={17} />
                        Создать
                    </button>
                </div>

                {/* Форма создания */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginBottom: '20px' }}
                            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="glass" style={{ borderRadius: 'var(--radius)', padding: '20px', border: '1.5px solid rgba(192,132,252,0.25)' }}>
                                <form onSubmit={handleCreate}>
                                    <input
                                        className="input-field"
                                        placeholder="Название вишлиста (например: ДР 2025 🎂)"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        style={{ marginBottom: '12px' }}
                                        autoFocus
                                        required
                                    />
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                                📅 Дата события (для Тайм-капсулы)
                                            </label>
                                            <input
                                                className="input-field"
                                                type="datetime-local"
                                                value={eventDate}
                                                onChange={e => setEventDate(e.target.value)}
                                            />
                                        </div>
                                        <label style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            cursor: 'pointer', padding: '10px 14px',
                                            background: 'var(--bg-glass)', border: '1px solid var(--border)',
                                            borderRadius: '0.875rem', alignSelf: 'flex-end',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
                                                style={{ accentColor: 'var(--accent)', width: '15px', height: '15px' }} />
                                            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {isPublic ? '🌐 Публичный' : '🔒 Приватный'}
                                            </span>
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="button" className="btn-ghost" onClick={() => setShowForm(false)} style={{ flex: 1 }}>
                                            Отмена
                                        </button>
                                        <button type="submit" className="btn-primary" disabled={creating} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            {creating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                            {creating ? 'Создаём...' : 'Создать вишлист'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Список вишлистов */}
                {isLoading ? (
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: 'var(--radius)' }} />
                        ))}
                    </div>
                ) : wishlists?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎁</div>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Создайте первый вишлист</p>
                        <p style={{ fontSize: '0.875rem', margin: '4px 0 0' }}>Поделитесь желаниями с близкими</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                        {(wishlists as WishlistShort[])?.map((w, i) => (
                            <motion.div
                                key={w.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="glass glass-hover"
                                style={{ borderRadius: 'var(--radius)', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}
                                onClick={() => router.push(`/w/${w.slug}`)}
                            >
                                <div style={{
                                    width: '44px', height: '44px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(192,132,252,0.2), rgba(244,114,182,0.2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.3rem', flexShrink: 0,
                                }}>
                                    🎁
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                                            {w.title}
                                        </span>
                                        {!w.is_public && <Lock size={13} style={{ color: 'var(--text-muted)' }} />}
                                        {w.is_public && <Globe size={13} style={{ color: 'var(--text-muted)' }} />}
                                        {!w.is_capsule_revealed && w.event_date && (
                                            <span className="badge badge-capsule" style={{ fontSize: '0.7rem' }}>⏰ Тайм-капсула</span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            <Gift size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                            {w.items_count} желания
                                        </span>
                                        {w.event_date && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {formatDate(w.event_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => copyLink(w.slug)}
                                        className="btn-ghost"
                                        style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8125rem' }}
                                    >
                                        <Share2 size={13} /> Поделиться
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </>
    )
}