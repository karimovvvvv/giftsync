'use client'
import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

interface ProgressBarProps {
    percent: number
    totalCollected: number
    price: number | null
    currency: string
    isLocked: boolean
    heroBuyerName?: string | null
}

export function ProgressBar({ percent, totalCollected, price, currency, isLocked, heroBuyerName }: ProgressBarProps) {
    const [displayed, setDisplayed] = useState(0)

    // Анимируем значение при изменении
    useEffect(() => {
        const timer = setTimeout(() => setDisplayed(percent), 50)
        return () => clearTimeout(timer)
    }, [percent])

    const isComplete = displayed >= 100

    return (
        <div style={{ marginTop: '12px' }}>
            {/* Заголовок */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                    {isComplete
                        ? heroBuyerName
                            ? `🦸 ${heroBuyerName} купит`
                            : '🎉 Собрано полностью!'
                        : 'Копим вместе'}
                </span>
                <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: isComplete ? 'var(--success)' : 'var(--accent)',
                }}>
                    {Math.round(displayed)}%
                </span>
            </div>

            {/* Трек */}
            <div className="progress-track">
                <div
                    className={`progress-fill${isComplete ? ' complete' : ''}`}
                    style={{ width: `${displayed}%` }}
                />
            </div>

            {/* Суммы */}
            {price && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(totalCollected, currency)}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatCurrency(price, currency)}
                    </span>
                </div>
            )}

            {/* Бейдж заблокирован */}
            {isLocked && (
                <div style={{ marginTop: '8px' }}>
                    <span className="badge badge-locked">
                        ✓ Сбор закрыт
                    </span>
                </div>
            )}
        </div>
    )
}