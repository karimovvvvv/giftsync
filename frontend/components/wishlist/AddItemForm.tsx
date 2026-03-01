'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Loader2, X, Plus, ChevronDown } from 'lucide-react'
import { useOgParser } from '@/hooks/useOgParser'
import { itemApi } from '@/lib/api'
import { GiftPlaceholder } from '../shared/GiftPlaceholder'
import { toast } from 'sonner'
import Image from 'next/image'

interface AddItemFormProps {
    wishlistSlug: string
    onAdded: () => void
}

export function AddItemForm({ wishlistSlug, onAdded }: AddItemFormProps) {
    const [open, setOpen] = useState(false)
    const [url, setUrl] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [imageUrl, setImageUrl] = useState('')
    const [price, setPrice] = useState('')
    const [currency, setCurrency] = useState('RUB')
    const [isCrowdfunding, setIsCrowdfunding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [imgError, setImgError] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const { data: parsed, isLoading: parsing, parse, reset } = useOgParser()

    // Автозаполнение из OG-данных
    const prevParsed = useRef<typeof parsed>(null)
    if (parsed && parsed !== prevParsed.current && parsed.success) {
        prevParsed.current = parsed
        if (parsed.title && !title) setTitle(parsed.title)
        if (parsed.description && !description) setDescription(parsed.description)
        if (parsed.image_url && !imageUrl) { setImageUrl(parsed.image_url); setImgError(false) }
        if (parsed.price) { setPrice(String(parsed.price)); setCurrency(parsed.currency) }
    }

    function handleUrlChange(v: string) {
        setUrl(v)
        if (v.startsWith('http')) parse(v)
    }

    function clearForm() {
        setUrl(''); setTitle(''); setDescription('')
        setImageUrl(''); setPrice(''); setIsCrowdfunding(false)
        setShowAdvanced(false); setImgError(false)
        reset()
        prevParsed.current = null
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!title.trim()) return toast.error('Укажите название')
        setSaving(true)
        try {
            await itemApi.add(wishlistSlug, {
                url: url || null,
                title: title.trim(),
                description: description.trim() || null,
                image_url: imageUrl.trim() || null,
                price: price ? parseFloat(price) : null,
                currency,
                is_crowdfunding: isCrowdfunding,
            })
            clearForm()
            setOpen(false)
            onAdded()
            toast.success('Желание добавлено 🎁')
        } catch {
            toast.error('Не удалось добавить')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    style={{
                        width: '100%', padding: '14px',
                        background: 'var(--bg-glass)',
                        border: '1.5px dashed rgba(192,132,252,0.3)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--text-muted)',
                        fontSize: '0.9375rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                        fontFamily: 'Onest, sans-serif',
                    }}
                >
                    <Plus size={18} style={{ color: 'var(--accent)' }} />
                    Добавить желание
                </button>
            ) : (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="glass"
                        style={{ borderRadius: 'var(--radius)', padding: '20px' }}
                    >
                        <form onSubmit={handleSubmit}>
                            {/* URL ввод */}
                            <div style={{ position: 'relative', marginBottom: '16px' }}>
                                <div style={{
                                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                                    color: 'var(--text-muted)', pointerEvents: 'none',
                                }}>
                                    {parsing
                                        ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Link2 size={16} />
                                    }
                                </div>
                                <input
                                    type="url"
                                    className="input-field"
                                    placeholder="Вставьте ссылку на товар..."
                                    value={url}
                                    onChange={e => handleUrlChange(e.target.value)}
                                    style={{ paddingLeft: '38px', paddingRight: '36px' }}
                                />
                                {url && (
                                    <button type="button" onClick={() => { setUrl(''); reset(); prevParsed.current = null }}
                                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* Превью спарсенного изображения */}
                            <AnimatePresence>
                                {(imageUrl || parsing) && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginBottom: '16px', overflow: 'hidden' }}
                                    >
                                        <div style={{
                                            borderRadius: '0.875rem', overflow: 'hidden',
                                            height: '140px', position: 'relative',
                                            background: 'var(--bg-card)',
                                        }}>
                                            {parsing ? (
                                                <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                                            ) : imageUrl && !imgError ? (
                                                <Image src={imageUrl} alt="preview" fill style={{ objectFit: 'cover' }} onError={() => setImgError(true)} />
                                            ) : (
                                                <GiftPlaceholder seed={title} style={{ width: '100%', height: '100%' }} />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Название */}
                            <input
                                className="input-field"
                                placeholder="Название *"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                style={{ marginBottom: '12px' }}
                                required
                            />

                            {/* Цена */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                                <input
                                    className="input-field"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Цена (необязательно)"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <select
                                    className="input-field"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    style={{ width: '90px', flex: 'none' }}
                                >
                                    <option value="RUB">₽ RUB</option>
                                    <option value="USD">$ USD</option>
                                    <option value="EUR">€ EUR</option>
                                </select>
                            </div>

                            {/* Краудфандинг тоггл */}
                            {price && (
                                <motion.label
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        cursor: 'pointer', marginBottom: '12px',
                                        padding: '10px 14px',
                                        background: isCrowdfunding ? 'rgba(192,132,252,0.08)' : 'var(--bg-glass)',
                                        border: `1px solid ${isCrowdfunding ? 'rgba(192,132,252,0.3)' : 'var(--border)'}`,
                                        borderRadius: '0.875rem',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isCrowdfunding}
                                        onChange={e => setIsCrowdfunding(e.target.checked)}
                                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                                    />
                                    <div>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            Собирать вскладчину 💜
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Друзья смогут вносить частичные суммы
                                        </div>
                                    </div>
                                </motion.label>
                            )}

                            {/* Дополнительные поля */}
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                style={{
                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                    fontSize: '0.8125rem', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '4px', padding: '0 0 12px',
                                    fontFamily: 'Onest, sans-serif',
                                }}
                            >
                                <ChevronDown size={14} style={{ transform: showAdvanced ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                {showAdvanced ? 'Скрыть' : 'Доп. поля'}
                            </button>

                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <textarea
                                            className="input-field"
                                            placeholder="Описание"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            rows={2}
                                            style={{ marginBottom: '12px', resize: 'vertical' }}
                                        />
                                        <input
                                            className="input-field"
                                            placeholder="URL изображения"
                                            value={imageUrl}
                                            onChange={e => { setImageUrl(e.target.value); setImgError(false) }}
                                            style={{ marginBottom: '12px' }}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Кнопки */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    className="btn-ghost"
                                    onClick={() => { clearForm(); setOpen(false) }}
                                    style={{ flex: 1 }}
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving || !title.trim()}
                                    style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                    {saving ? 'Сохраняем...' : 'Добавить'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}