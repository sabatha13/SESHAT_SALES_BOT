// Block type definitions for Email Builder V2.
// html_body is always generated from these blocks — never written by hand.

export type BlockType =
  | 'logo' | 'banner' | 'title' | 'paragraph' | 'image'
  | 'book_card' | 'divider' | 'quote' | 'cta_button'
  | 'coupon' | 'social_links' | 'footer' | 'custom_html';

export type Alignment = 'left' | 'center' | 'right';

export interface Block {
  id:   string;
  type: BlockType;
  data: Record<string, unknown>;
}

export interface BuilderData {
  version: number;
  blocks:  Block[];
}

// ── Per-block data shapes (used for type-safe defaults and property panels) ──

export interface LogoData {
  logoUrl:   string;
  alignment: Alignment;
  bg:        string;
  paddingY:  number;
  paddingX:  number;
}

export interface BannerData {
  imageUrl:    string;
  headline:    string;
  subheadline: string;
  ctaLabel:    string;
  ctaUrl:      string;
  bg:          string;
  textColor:   string;
  overlayOpacity: number;
}

export interface TitleData {
  text:      string;
  tag:       'h1' | 'h2' | 'h3';
  fontSize:  number;
  alignment: Alignment;
  color:     string;
  bg:        string;
  paddingY:  number;
  paddingX:  number;
}

export interface ParagraphData {
  text:     string;
  color:    string;
  bg:       string;
  fontSize: number;
  paddingY: number;
  paddingX: number;
}

export interface ImageData {
  imageUrl:     string;
  alt:          string;
  width:        number;
  alignment:    Alignment;
  borderRadius: number;
  paddingY:     number;
  paddingX:     number;
}

export interface BookCardData {
  coverUrl:     string;
  title:        string;
  author:       string;
  description:  string;
  price:        string;
  buttonLabel:  string;
  buttonUrl:    string;
  bg:           string;
  borderRadius: number;
}

export interface DividerData {
  style:     'solid' | 'dashed' | 'dotted';
  color:     string;
  thickness: number;
  widthPct:  number;
  paddingY:  number;
}

export interface QuoteData {
  text:        string;
  author:      string;
  color:       string;
  accentColor: string;
  bg:          string;
  paddingY:    number;
  paddingX:    number;
}

export interface CtaButtonData {
  label:     string;
  url:       string;
  bgColor:   string;
  textColor: string;
  radius:    number;
  alignment: Alignment;
  paddingY:  number;
  paddingX:  number;
}

export interface CouponData {
  code:        string;
  discount:    string;
  expiration:  string;
  buttonLabel: string;
  buttonUrl:   string;
  bg:          string;
  accentColor: string;
}

export interface SocialLinksData {
  facebook:  string;
  instagram: string;
  youtube:   string;
  website:   string;
  color:     string;
  alignment: Alignment;
  paddingY:  number;
}

export interface FooterData {
  company:        string;
  address:        string;
  unsubscribeUrl: string;
  copyright:      string;
  bg:             string;
  color:          string;
  paddingY:       number;
}

export interface CustomHtmlData {
  html: string;
}

// ── Block defaults ────────────────────────────────────────────────────────────

export const BLOCK_DEFAULTS: Record<BlockType, Record<string, unknown>> = {
  logo: {
    logoUrl: 'https://cdslibrairie.com/logo.png',
    alignment: 'center', bg: '#0A0800', paddingY: 20, paddingX: 24,
  } satisfies LogoData,
  banner: {
    imageUrl: '', headline: 'Découvrez votre prochain livre',
    subheadline: 'Une sélection unique pour les esprits curieux.',
    ctaLabel: 'Explorer maintenant', ctaUrl: '{{site_url}}',
    bg: '#1a1a1a', textColor: '#FFFFFF', overlayOpacity: 40,
  } satisfies BannerData,
  title: {
    text: 'Bonjour {{reader_name}},', tag: 'h2', fontSize: 28,
    alignment: 'center', color: '#000000', bg: '#FFFFFF', paddingY: 24, paddingX: 24,
  } satisfies TitleData,
  paragraph: {
    text: 'Nous avons pensé à vous en sélectionnant ce livre exceptionnel.',
    color: '#333333', bg: '#FFFFFF', fontSize: 16, paddingY: 12, paddingX: 24,
  } satisfies ParagraphData,
  image: {
    imageUrl: '', alt: '', width: 560, alignment: 'center',
    borderRadius: 8, paddingY: 16, paddingX: 24,
  } satisfies ImageData,
  book_card: {
    coverUrl: '', title: '{{book_title}}', author: '',
    description: '', price: '{{book_price}}',
    buttonLabel: 'Obtenir ce livre', buttonUrl: '{{book_url}}',
    bg: '#F8F8F6', borderRadius: 8,
  } satisfies BookCardData,
  divider: {
    style: 'solid', color: '#E5E5E5', thickness: 1, widthPct: 80, paddingY: 16,
  } satisfies DividerData,
  quote: {
    text: '« La lecture est une amitié. »',
    author: 'Marcel Proust',
    color: '#222222', accentColor: '#E5A700', bg: '#FAFAF8',
    paddingY: 24, paddingX: 32,
  } satisfies QuoteData,
  cta_button: {
    label: 'Voir le livre', url: '{{book_url}}',
    bgColor: '#000000', textColor: '#FFFFFF',
    radius: 6, alignment: 'center', paddingY: 20, paddingX: 24,
  } satisfies CtaButtonData,
  coupon: {
    code: '{{coupon_code}}', discount: '{{discount}}%',
    expiration: '', buttonLabel: 'Utiliser ce coupon',
    buttonUrl: '{{site_url}}', bg: '#FFF8E8', accentColor: '#E5A700',
  } satisfies CouponData,
  social_links: {
    facebook: '', instagram: '', youtube: '', website: '{{site_url}}',
    color: '#555555', alignment: 'center', paddingY: 16,
  } satisfies SocialLinksData,
  footer: {
    company: 'CDS Librairie', address: '',
    unsubscribeUrl: '{{unsubscribe_url}}',
    copyright: `© ${new Date().getFullYear()} CDS Librairie. Tous droits réservés.`,
    bg: '#1a1a1a', color: '#999999', paddingY: 24,
  } satisfies FooterData,
  custom_html: {
    html: '<p style="font-family:Arial,sans-serif;font-size:16px;color:#333333;margin:0;padding:16px 24px;">Votre HTML personnalisé ici</p>',
  } satisfies CustomHtmlData,
};

export const BLOCK_META: Record<BlockType, { label: string; icon: string; description: string }> = {
  logo:         { label: 'Logo',          icon: '🔷', description: 'Logo CDS avec alignement' },
  banner:       { label: 'Bannière',      icon: '🖼️', description: 'Image + titre + CTA' },
  title:        { label: 'Titre',         icon: 'T',  description: 'H1, H2 ou H3' },
  paragraph:    { label: 'Paragraphe',    icon: '¶',  description: 'Texte avec variables' },
  image:        { label: 'Image',         icon: '📷', description: 'Image centrée ou alignée' },
  book_card:    { label: 'Carte Livre ⭐', icon: '📚', description: 'Couverture + infos + bouton' },
  divider:      { label: 'Séparateur',    icon: '—',  description: 'Ligne de séparation' },
  quote:        { label: 'Citation',      icon: '❝',  description: 'Grande citation + auteur' },
  cta_button:   { label: 'Bouton CTA',   icon: '⚡',  description: 'Bouton d\'appel à l\'action' },
  coupon:       { label: 'Coupon',        icon: '🎫', description: 'Code promo + expiration' },
  social_links: { label: 'Réseaux',       icon: '🔗', description: 'Facebook, Instagram, etc.' },
  footer:       { label: 'Footer',        icon: '©',  description: 'Pied de page légal' },
  custom_html:  { label: 'HTML Brut',     icon: '<>', description: 'Code HTML personnalisé exact' },
};

export const AVAILABLE_VARS = [
  { key: 'reader_name',     label: '{{reader_name}}' },
  { key: 'reader_email',    label: '{{reader_email}}' },
  { key: 'book_title',      label: '{{book_title}}' },
  { key: 'book_price',      label: '{{book_price}}' },
  { key: 'book_url',        label: '{{book_url}}' },
  { key: 'coupon_code',     label: '{{coupon_code}}' },
  { key: 'discount',        label: '{{discount}}' },
  { key: 'site_url',        label: '{{site_url}}' },
  { key: 'download_link',   label: '{{download_link}}' },
  { key: 'unsubscribe_url', label: '{{unsubscribe_url}}' },
];
