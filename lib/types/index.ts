export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  short_description: string;
  price: number;
  cover_url: string;
  pdf_path: string;
  category: string;
  tags: string[];
  page_count: number;
  language: string;
  is_featured: boolean;
  is_published: boolean;
  stripe_price_id: string;
  // Phase 2 additions
  access_type: 'purchase_only' | 'subscription_only' | 'purchase_and_subscription' | 'free_preview';
  download_allowed: boolean;
  subscription_included: boolean;
  estimated_reading_minutes: number | null;
  isbn: string | null;
  publication_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  clerk_user_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  book_id: string;
  stripe_session_id: string;
  stripe_payment_intent: string;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  created_at: string;
  book?: Book;
  profile?: Profile;
}

export interface CartItem {
  book: Book;
  quantity: 1;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  stripe_price_id: string | null;
  price_cents: number;
  interval: 'month' | 'year';
  is_active: boolean;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  plan?: SubscriptionPlan;
  profile?: Profile;
}

export interface DownloadToken {
  id: string;
  user_id: string;
  book_id: string;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  book_id: string;
  token_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  book?: Book;
  profile?: Profile;
}

export interface ReaderSession {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number | null;
  last_read_at: string;
  completed: boolean;
  book?: Book;
}

export interface Bookmark {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  label: string | null;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  page_number: number;
  text: string;
  color: 'yellow' | 'green' | 'pink';
  note: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  book_id: string;
  created_at: string;
  book?: Book;
}

export interface Coupon {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_cents: number | null;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  book_ids: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  profile?: Profile;
}

export interface ReadingEvent {
  id: string;
  user_id: string;
  book_id: string;
  event_type: 'open' | 'close' | 'page_turn' | 'bookmark' | 'highlight';
  page_number: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  created_at: string;
}

export interface BookAccessInfo {
  canRead: boolean;
  canDownload: boolean;
  accessType: 'purchased' | 'subscription' | 'free_preview' | 'none';
}
