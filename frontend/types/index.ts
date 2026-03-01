export interface User {
  id: string
  email: string
  avatar_url: string | null
  created_at: string
}

export interface Wishlist {
  id: string
  user_id: string;
  title: string
  description: string | null
  slug: string
  event_date: string | null
  is_public: boolean
  is_capsule_revealed: boolean
  created_at: string
  items: Item[]
}

export interface WishlistShort {
  id: string
  title: string
  slug: string
  event_date: string | null
  is_public: boolean
  is_capsule_revealed: boolean
  created_at: string
  items_count: number
}

export interface Item {
  id: string
  wishlist_id: string
  url: string | null
  title: string
  description: string | null
  image_url: string | null
  price: number | null
  currency: string
  is_crowdfunding: boolean
  is_archived: boolean
  is_locked: boolean
  hero_buyer_name: string | null
  position: number
  funding_percent: number
  total_collected: number
  created_at: string
  contributions: Contribution[]
}

export interface Contribution {
  id: string
  contributor_name: string
  amount: number
  message: string | null
  created_at: string
  is_transferred: boolean
  original_item_id: string | null
}

export interface ParsedItemData {
  title: string | null
  description: string | null
  image_url: string | null
  price: number | null
  currency: string
  success: boolean
  error: string | null
}

export interface WSEvent {
  type: WSEventType
  payload: Record<string, unknown>
}

export type WSEventType =
  | 'contribution.added'
  | 'contribution.removed'
  | 'hero_buyer.activated'
  | 'cascade.transferred'
  | 'progress.updated'
  | 'capsule.revealed'
  | 'item.locked'
  | 'item.added'
  | 'item.updated'
  | 'item.archived'

export interface TokenOut {
  access_token: string
  token_type: string
  user: User
}

export interface ContributionCreate {
  contributor_name: string
  contributor_email?: string
  amount: number
  message?: string
  guest_session_id?: string
}

export interface HeroBuyerCreate {
  contributor_name: string
  contributor_email?: string
  message?: string
  guest_session_id?: string
}