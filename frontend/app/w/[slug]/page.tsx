'use client'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Share2, Globe, Lock, Wifi, WifiOff } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { useAuth } from '@/hooks/useAuth'
import { WishlistGrid } from '@/components/wishlist/WishlistGrid'
import { Navbar } from '@/components/shared/Navbar'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function WishlistPage() {
    const { slug } = useParams<{ slug: string }>()
    const { user } = useAuth()
    const { data: wishlist, isLoading, isError, isConnected } = useWishlist(slug)

    const isOwner = !!(user && wishlist && user.id === wishlist.user_id)

    function copyLink() {
        navigator.clipboard.writeText(window.location.href)
        toast.success('Ссылка скопирована! 🔗')
    }

    if (isLoading) {
        return (
            <>
                <Navbar />
                <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
                    <div style={{ marginBottom: '28px' }}>
                        <div className="skeleton" style={{ height: '36px', width: '280px', borderRadius: '0.75rem', marginBottom: '12px' }} />
                        <div className="skeleton" style={{ height: '20px', width: '180px', borderRadius: '0.5rem' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="skeleton" style={{ height: '280px', borderRadius: 'var(--radius)' }} />
                        ))}
                    </div>
                </main>
            </>
        )
    }

    if (isError || !wishlist) {
        return (
            <>
                <Navbar />
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>😕</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>Вишлист не найден</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Возможно, ссылка устарела или вишлист был удалён</p>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <main style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 20px' }}>
                {/* Шапка вишлиста */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ marginBottom: '28px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                                <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '-0.03em' }}>
                                    {wishlist.title}
                                </h1>
                                {wishlist.is_public
                                    ? <Globe size={16} style={{ color: 'var(--text-muted)' }} />
                                    : <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                                }
                            </div>
                            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {wishlist.event_date && (
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        📅 {formatDate(wishlist.event_date)}
                                    </span>
                                )}
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    🎁 {wishlist.items.filter(i => !i.is_archived).length} желания
                                </span>
                                {/* WS индикатор */}
                                <span style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    fontSize: '0.75rem',
                                    color: isConnected ? 'var(--success)' : 'var(--text-muted)',
                                }}>
                                    {isConnected
                                        ? <><Wifi size={12} /> Онлайн</>
                                        : <><WifiOff size={12} /> Офлайн</>
                                    }
                                </span>
                            </div>
                        </div>

                        {/* Кнопка поделиться */}
                        <button
                            className="btn-ghost"
                            onClick={copyLink}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
                        >
                            <Share2 size={15} />
                            Поделиться
                        </button>
                    </div>

                    {wishlist.description && (
                        <p style={{ margin: '12px 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                            {wishlist.description}
                        </p>
                    )}
                </motion.div>

                {/* Основная сетка */}
                <WishlistGrid wishlist={wishlist} isOwner={isOwner} />
            </main>
        </>
    )
}