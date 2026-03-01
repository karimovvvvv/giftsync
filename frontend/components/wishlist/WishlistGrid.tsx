'use client'
import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Item, Wishlist } from '@/types'
import { ItemCard } from './ItemCard'
import { AddItemForm } from './AddItemForm'
import { ContributeModal } from '../modals/ContributeModal'
import { HeroBuyerModal } from '../modals/HeroBuyerModal'
import { ArchiveWarningModal } from '../modals/ArchiveWarningModal'
import { TimeCapsuleBanner } from './TimeCapsuleBanner'
import { Package } from 'lucide-react'

interface WishlistGridProps {
    wishlist: Wishlist
    isOwner: boolean
}

export function WishlistGrid({ wishlist, isOwner }: WishlistGridProps) {
    const queryClient = useQueryClient()
    const [contributeItem, setContributeItem] = useState<Item | null>(null)
    const [heroItem, setHeroItem] = useState<Item | null>(null)
    const [deleteItem, setDeleteItem] = useState<Item | null>(null)

    const visibleItems = wishlist.items.filter(i => !i.is_archived)
    const archivedItems = wishlist.items.filter(i => i.is_archived)

    function refresh() {
        queryClient.invalidateQueries({ queryKey: ['wishlist', wishlist.slug] })
    }

    return (
        <>
            {/* Тайм-капсула */}
            {wishlist.event_date && (
                <TimeCapsuleBanner
                    eventDate={wishlist.event_date}
                    isOwner={isOwner}
                    isRevealed={wishlist.is_capsule_revealed}
                />
            )}

            {/* Форма добавления (только владелец) */}
            {isOwner && (
                <AddItemForm wishlistSlug={wishlist.slug} onAdded={refresh} />
            )}

            {/* Пустое состояние */}
            {visibleItems.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--text-muted)',
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎁</div>
                    <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '4px' }}>
                        {isOwner ? 'Добавьте первое желание!' : 'Вишлист пока пуст'}
                    </p>
                    <p style={{ fontSize: '0.875rem', margin: 0 }}>
                        {isOwner ? 'Вставьте ссылку на товар выше' : 'Заходи позже'}
                    </p>
                </div>
            )}

            {/* Bento Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                gap: '16px',
            }}>
                {visibleItems.map((item, i) => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        index={i}
                        isOwner={isOwner}
                        isCapsuleRevealed={wishlist.is_capsule_revealed}
                        onContribute={setContributeItem}
                        onHeroBuy={setHeroItem}
                        onDelete={isOwner ? setDeleteItem : undefined}
                    />
                ))}
            </div>

            {/* НОВЫЙ БЛОК: АРХИВ */}
            {isOwner && archivedItems.length > 0 && (
                <div style={{ marginTop: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-muted)' }}>
                        <Package size={20} />
                        <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Исполненные желания</h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
                        gap: '16px',
                        opacity: 0.75, // Делаем карточки в архиве слегка прозрачными
                        filter: 'grayscale(20%)'
                    }}>
                        {archivedItems.map((item, i) => (
                            <ItemCard
                                key={item.id}
                                item={item}
                                index={i}
                                isOwner={isOwner}
                                isCapsuleRevealed={wishlist.is_capsule_revealed}
                                // В архиве нельзя удалять или скидываться заново
                                onContribute={() => { }}
                                onHeroBuy={() => { }}
                                onDelete={undefined}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Модалки */}
            <ContributeModal
                item={contributeItem}
                onClose={() => setContributeItem(null)}
                onSuccess={refresh}
            />
            <HeroBuyerModal
                item={heroItem}
                onClose={() => setHeroItem(null)}
                onSuccess={refresh}
            />
            <ArchiveWarningModal
                item={deleteItem}
                onClose={() => setDeleteItem(null)}
                onSuccess={refresh}
            />
        </>
    )
}