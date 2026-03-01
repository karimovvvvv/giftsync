'use client'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'

interface SpoilerShieldProps {
    /** true = владелец ещё не видит данные (тайм-капсула не вскрыта) */
    active: boolean
    /** Что показать вместо реального контента когда active=true */
    fallback?: React.ReactNode
    children: React.ReactNode
    /** Подсказка при наведении / под блюром */
    hint?: string
    /** Вид обёртки: 'blur' | 'replace' (по умолч. 'replace') */
    mode?: 'blur' | 'replace'
}

/**
 * SpoilerShield — скрывает детали взносов и имён от владельца
 * до наступления даты события (Тайм-капсула).
 *
 * Использование:
 *   <SpoilerShield active={isOwner && !isRevealed}>
 *     {contributorName}
 *   </SpoilerShield>
 */
export function SpoilerShield({
    active,
    fallback,
    children,
    hint = 'Откроется в день события',
    mode = 'replace',
}: SpoilerShieldProps) {
    if (!active) {
        return <>{children}</>
    }

    // Режим замены
    if (mode === 'replace') {
        return (
            <span
                title={hint}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--text-muted)',
                    fontSize: 'inherit',
                    cursor: 'help',
                }}
            >
                {fallback ?? (
                    <>
                        <Lock size={12} style={{ flexShrink: 0 }} />
                        <span>Сюрприз</span>
                    </>
                )}
            </span>
        )
    }

    // Режим блюра — контент виден размыто
    return (
        <span
            title={hint}
            style={{
                position: 'relative',
                display: 'inline-block',
                cursor: 'help',
            }}
        >
            <span style={{ filter: 'blur(5px)', userSelect: 'none', pointerEvents: 'none' }}>
                {children}
            </span>
            {/* Иконка замка поверх */}
            <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Lock size={12} style={{ color: 'var(--accent)', opacity: 0.8 }} />
            </motion.span>
        </span>
    )
}

// ── Вспомогательные обёртки для частых случаев ──────────────

interface SpoilerAmountProps {
    active: boolean
    amount: number
    currency: string
    formatFn: (v: number, c: string) => string
}

/** Скрывает сумму взноса */
export function SpoilerAmount({ active, amount, currency, formatFn }: SpoilerAmountProps) {
    return (
        <SpoilerShield
            active={active}
            fallback={<span>—</span>}
            hint="Сумма скрыта до дня события"
        >
            {formatFn(amount, currency)}
        </SpoilerShield>
    )
}

interface SpoilerNameProps {
    active: boolean
    name: string
}

/** Скрывает имя участника */
export function SpoilerName({ active, name }: SpoilerNameProps) {
    return (
        <SpoilerShield
            active={active}
            fallback={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>🎁</span>
                    <span>Сюрприз</span>
                </span>
            }
            hint="Имя откроется в день события"
        >
            {name}
        </SpoilerShield>
    )
}