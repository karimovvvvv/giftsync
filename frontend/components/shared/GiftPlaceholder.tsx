'use client'

const GRADIENTS = [
    ['#c084fc', '#f472b6'],
    ['#818cf8', '#c084fc'],
    ['#fb923c', '#f472b6'],
    ['#34d399', '#818cf8'],
    ['#38bdf8', '#818cf8'],
    ['#fb923c', '#fbbf24'],
]

function hashStr(s: string): number {
    let h = 0
    for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
    return Math.abs(h)
}

interface GiftPlaceholderProps {
    seed?: string
    className?: string
    style?: React.CSSProperties
}

export function GiftPlaceholder({ seed = 'gift', className, style }: GiftPlaceholderProps) {
    const [a, b] = GRADIENTS[hashStr(seed) % GRADIENTS.length]

    return (
        <div
            className={className}
            style={{
                background: `linear-gradient(135deg, ${a}, ${b})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                opacity: 0.85,
                ...style,
            }}
        >
            🎁
        </div>
    )
}