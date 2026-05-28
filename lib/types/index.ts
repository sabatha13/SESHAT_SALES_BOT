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
