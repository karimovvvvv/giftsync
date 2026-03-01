'use client'
import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Trash2, Gift, ShoppingBag, Users } from 'lucide-react'
import type { Item } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import { AvatarGroup } from '../shared/Avatar'
import { GiftPlaceholder } from '../shared/GiftPlaceholder'

interface ItemCardProps {
    item: Item
    isOwner: boolean
    isCapsuleRevealed: boolean
    onContribute: (item: Item) => void
    onHeroBuy: (item: Item) => void
    onDelete?: (item: Item) => void
    index: number
}

export function ItemCard({
    item, isOwner, isCapsuleRevealed, onContribute, onHeroBuy, onDelete, index
}: ItemCardProps) {
    const [imgError, setImgError] = useState(false)
    const showSpoiler = isOwner && !isCapsuleRevealed
    const isSurpriseFund = item.title === 'Фонд Сюрприз'

    const contributorNames = item.contributions
        .filter(c => !c.is_transferred)
        .map(c => c.contributor_name)

    const isReserved = item.contributions.some(c => c.amount === 0 && !c.is_transferred)

    return (
        <div
            className="glass glass-hover"
            style={{
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: `fadeUp 0.4s ease forwards`,
                animationDelay: `${index * 60}ms`,
                opacity: 0,
            }}
        >
            {/* Изображение */}
            <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
                {item.image_url && !imgError ? (
                    <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        onError={() => setImgError(true)}
                        sizes="(max-width: 768px) 100vw, 400px"
                    />
                ) : (
                    <GiftPlaceholder seed={item.title} style={{ width: '100%', height: '100%' }} />
                )}

                {/* Оверлей: статус бейджи */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.is_locked && (
                        <span className="badge badge-locked" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.5)' }}>
                            ✓ Закрыто
                        </span>
                    )}
                    {item.hero_buyer_name && !showSpoiler && (
                        <span className="badge badge-hero" style={{ backdropFilter: 'blur(10px)', background: 'rgba(0,0,0,0.5)' }}>
                            🦸 Герой
                        </span>
                    )}
                </div>

                {/* Цена в правом верхнем углу */}
                {item.price && (
                    <div style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '0.625rem',
                        padding: '4px 10px',
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        color: 'white',
                    }}>
                        {formatCurrency(item.price, item.currency)}
                    </div>
                )}
            </div>

            {/* Контент */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
                {/* Заголовок */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h3 style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        margin: 0,
                    }}>
                        {item.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        {item.url && (
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    transition: 'color 0.2s',
                                }}
                            >
                                <ExternalLink size={15} />
                            </a>
                        )}
                        {isOwner && onDelete && (
                            <button
                                onClick={() => onDelete(item)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    transition: 'color 0.2s',
                                }}
                            >
                                <Trash2 size={15} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Описание */}
                {item.description && (
                    <p style={{
                        fontSize: '0.8125rem',
                        color: 'var(--text-muted)',
                        margin: 0,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {item.description}
                    </p>
                )}

                {/* Прогресс-бар краудфандинга (скрываем для Фонда) */}
                {item.is_crowdfunding && item.price && !isSurpriseFund && (
                    <ProgressBar
                        percent={item.funding_percent}
                        totalCollected={item.total_collected}
                        price={item.price}
                        currency={item.currency}
                        isLocked={item.is_locked}
                        heroBuyerName={showSpoiler ? null : item.hero_buyer_name}
                    />
                )}

                {/* Участники */}
                {contributorNames.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <AvatarGroup
                            names={contributorNames}
                            spoiler={showSpoiler}
                            size={24}
                            max={5}
                        />
                        {!showSpoiler && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {contributorNames.length === 1
                                    ? contributorNames[0]
                                    : `${contributorNames.length} участника`}
                            </span>
                        )}
                    </div>
                )}

                {/* Сообщения / Поздравления */}
                {item.contributions.some(c => c.message && !c.is_transferred) && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {item.contributions
                            .filter(c => c.message && !c.is_transferred)
                            .map(c => (
                                <div key={c.id} style={{
                                    background: 'var(--bg-glass)',
                                    padding: '8px 10px',
                                    borderRadius: '0.5rem',
                                    borderLeft: '2px solid var(--accent)',
                                    fontSize: '0.8125rem',
                                    lineHeight: 1.4
                                }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '6px' }}>
                                        {c.contributor_name}:
                                    </span>
                                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                        «{c.message}»
                                    </span>
                                </div>
                            ))}
                    </div>
                )}

                {/* Кнопки действий (только для гостей) */}
                {!isOwner && !item.is_locked && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                        {isSurpriseFund ? (
                            <button
                                className="btn-primary"
                                onClick={() => onContribute(item)}
                                style={{ flex: 1, fontSize: '0.8125rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <Gift size={14} />
                                Внести вклад
                            </button>
                        ) : item.is_crowdfunding ? (
                            <>
                                <button
                                    className="btn-primary"
                                    onClick={() => onContribute(item)}
                                    style={{ flex: 1, fontSize: '0.8125rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                >
                                    <Users size={14} />
                                    {item.price ? 'Внести вклад' : 'Зарезервировать'}
                                </button>
                                {!isReserved && (
                                    <button
                                        className="btn-ghost"
                                        onClick={() => onHeroBuy(item)}
                                        style={{ fontSize: '0.8125rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <ShoppingBag size={14} />
                                        Куплю сам
                                    </button>
                                )}
                            </>
                        ) : (
                            <button
                                className="btn-primary"
                                onClick={() => onContribute(item)}
                                style={{ flex: 1, fontSize: '0.8125rem', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <Gift size={14} />
                                Зарезервировать
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}