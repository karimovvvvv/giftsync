'use client'
import { getInitials, getAvatarColor } from '@/lib/utils'

interface AvatarProps {
    name: string
    size?: number
    spoiler?: boolean // показать '?' вместо инициалов
}

export function Avatar({ name, size = 32, spoiler = false }: AvatarProps) {
    const [bg, fg] = getAvatarColor(name)
    const initials = spoiler ? '?' : getInitials(name)

    return (
        <div
            title={spoiler ? 'Сюрприз' : name}
            style={{
                width: size,
                height: size,
                borderRadius: '50%',
                background: spoiler ? 'rgba(255,255,255,0.06)' : bg,
                color: spoiler ? 'var(--text-muted)' : fg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.36,
                fontWeight: 700,
                fontFamily: 'Onest, sans-serif',
                border: `2px solid var(--bg-card)`,
                flexShrink: 0,
                userSelect: 'none',
                filter: spoiler ? 'blur(0px)' : 'none',
            }}
        >
            {initials}
        </div>
    )
}

interface AvatarGroupProps {
    names: string[]
    max?: number
    spoiler?: boolean
    size?: number
}

export function AvatarGroup({ names, max = 4, spoiler = false, size = 28 }: AvatarGroupProps) {
    const visible = names.slice(0, max)
    const overflow = names.length - max

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {visible.map((name, i) => (
                <div key={i} style={{ marginLeft: i === 0 ? 0 : -(size * 0.35) }}>
                    <Avatar name={name} size={size} spoiler={spoiler} />
                </div>
            ))}
            {overflow > 0 && (
                <div
                    style={{
                        width: size, height: size,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '2px solid var(--bg-card)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: size * 0.3,
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        marginLeft: -(size * 0.35),
                    }}
                >
                    +{overflow}
                </div>
            )}
        </div>
    )
}