import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined, currency = 'RUB'): string {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTimeLocal(dateStr: string): string {
  // Для input[type=datetime-local]
  const d = new Date(dateStr)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function generateSlug(title: string): string {
  const translit: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',
    й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',
    у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',
    э:'e',ю:'yu',я:'ya',
  }
  return title
    .toLowerCase()
    .split('')
    .map(c => translit[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'wishlist'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function timeUntil(dateStr: string): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  return { days, hours, minutes, seconds, expired: false }
}

// Генератор guest_session_id
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('giftsync_guest_id')
  if (!id) {
    id = `g_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`
    localStorage.setItem('giftsync_guest_id', id)
  }
  return id
}

// Цвета-аватары по имени (детерминированные)
const AVATAR_COLORS: [string, string][] = [
  ['#f97316','#fed7aa'], ['#8b5cf6','#ede9fe'], ['#ec4899','#fce7f3'],
  ['#06b6d4','#cffafe'], ['#10b981','#d1fae5'], ['#f59e0b','#fef3c7'],
  ['#3b82f6','#dbeafe'], ['#ef4444','#fee2e2'],
]

export function getAvatarColor(name: string): [string, string] {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}