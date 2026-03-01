'use client'
import { useEffect, useState } from 'react'
import { timeUntil, formatDate } from '@/lib/utils'
import { Lock, Sparkles } from 'lucide-react'

interface TimeCapsuleBannerProps {
    eventDate: string
    isOwner: boolean
    isRevealed: boolean
}

export function TimeCapsuleBanner({ eventDate, isOwner, isRevealed }: TimeCapsuleBannerProps) {
    const [tick, setTick] = useState(timeUntil(eventDate))

    useEffect(() => {
        if (isRevealed) return
        const id = setInterval(() => setTick(timeUntil(eventDate)), 1000)
        return () => clearInterval(id)
    }, [eventDate, isRevealed])

    if (isRevealed) {
        return (
            <div style={{
                background: 'linear-gradient(135deg, rgba(74,222,128,0.08), rgba(192,132,252,0.08))',
                border: '1px solid rgba(74,222,128,0.2)',
                borderRadius: 'var(--radius)',
                padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '12px',
                marginBottom: '24px',
                animation: 'fadeUp 0.5s ease forwards',
            }}>
                <Sparkles size={22} style={{ color: 'var(--success)', flexShrink: 0 }} />
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9375rem' }}>
                        🎉 Тайм-капсула открыта!
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Все имена и сообщения от друзей теперь видны
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(192,132,252,0.06), rgba(244,114,182,0.06))',
            border: '1px solid rgba(192,132,252,0.15)',
            borderRadius: 'var(--radius)',
            padding: '16px 20px',
            marginBottom: '24px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isOwner ? '12px' : 0 }}>
                <Lock size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                        Тайм-капсула
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', marginLeft: '8px' }}>
                        {isOwner
                            ? 'Имена и суммы откроются в день события'
                            : `Событие: ${formatDate(eventDate)}`}
                    </span>
                </div>
            </div>

            {/* Таймер обратного отсчёта — только для владельца */}
            {isOwner && !tick.expired && (
                <div style={{ display: 'flex', gap: '10px' }}>
                    {[
                        { v: tick.days, l: 'дней' },
                        { v: tick.hours, l: 'часов' },
                        { v: tick.minutes, l: 'минут' },
                        { v: tick.seconds, l: 'секунд' },
                    ].map(({ v, l }) => (
                        <div key={l} style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            padding: '8px 12px',
                            textAlign: 'center',
                            minWidth: '58px',
                        }}>
                            <div className="font-display" style={{ fontSize: '1.4rem', color: 'var(--accent)', lineHeight: 1 }}>
                                {String(v).padStart(2, '0')}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>{l}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}