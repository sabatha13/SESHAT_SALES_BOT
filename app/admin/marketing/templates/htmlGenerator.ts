// Converts builder block data → responsive email-client HTML.
// Rules: inline styles only, table-based layout, no flexbox/grid.
// Variables ({{reader_name}} etc.) are left as-is for substitution at send time.

import type { Block, BlockType } from './builderTypes';

const CONTAINER_WIDTH = 600;

function safe(v: unknown, fallback = ''): string {
  if (v === null || v === undefined) return fallback;
  return String(v);
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

// Escape HTML special chars (but leave {{variables}} intact)
function esc(str: string): string {
  return str
    .replace(/&(?!\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Convert newlines to <br> for text areas
function nl2br(str: string): string {
  return esc(str).replace(/\n/g, '<br>');
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderLogo(d: Record<string, unknown>): string {
  const align = safe(d.logoUrl) ? `<img src="${safe(d.logoUrl)}" width="120" alt="CDS Librairie" style="display:block;max-width:120px;border:0;">` : `<span style="font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#E5A700;">CDS Librairie</span>`;
  return `
<tr>
  <td align="${safe(d.alignment, 'center')}" bgcolor="${safe(d.bg, '#0A0800')}" style="padding:${num(d.paddingY, 20)}px ${num(d.paddingX, 24)}px;">
    ${align}
  </td>
</tr>`;
}

function renderBanner(d: Record<string, unknown>): string {
  const hasImg = safe(d.imageUrl);
  const opacity = num(d.overlayOpacity, 40) / 100;
  const overlayBg = `rgba(0,0,0,${opacity})`;
  if (hasImg) {
    return `
<tr>
  <td style="position:relative;background:${safe(d.bg,'#1a1a1a')};padding:0;">
    <div style="position:relative;background-image:url('${hasImg}');background-size:cover;background-position:center;">
      <div style="background:${overlayBg};padding:48px 32px;text-align:center;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:32px;color:${safe(d.textColor,'#FFFFFF')};line-height:1.2;">${nl2br(safe(d.headline))}</h1>
        ${d.subheadline ? `<p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:16px;color:${safe(d.textColor,'#FFFFFF')};opacity:0.85;">${nl2br(safe(d.subheadline))}</p>` : ''}
        ${d.ctaLabel ? `<a href="${safe(d.ctaUrl)}" style="display:inline-block;background:#E5A700;color:#000000;padding:14px 32px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${esc(safe(d.ctaLabel))}</a>` : ''}
      </div>
    </div>
  </td>
</tr>`;
  }
  return `
<tr>
  <td bgcolor="${safe(d.bg,'#1a1a1a')}" style="padding:48px 32px;text-align:center;">
    <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:32px;color:${safe(d.textColor,'#FFFFFF')};line-height:1.2;">${nl2br(safe(d.headline))}</h1>
    ${d.subheadline ? `<p style="margin:0 0 24px;font-family:Arial,sans-serif;font-size:16px;color:${safe(d.textColor,'#FFFFFF')};opacity:0.85;">${nl2br(safe(d.subheadline))}</p>` : ''}
    ${d.ctaLabel ? `<a href="${safe(d.ctaUrl)}" style="display:inline-block;background:#E5A700;color:#000000;padding:14px 32px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${esc(safe(d.ctaLabel))}</a>` : ''}
  </td>
</tr>`;
}

function renderTitle(d: Record<string, unknown>): string {
  const tag = ['h1','h2','h3'].includes(safe(d.tag)) ? safe(d.tag) : 'h2';
  return `
<tr>
  <td align="${safe(d.alignment,'center')}" bgcolor="${safe(d.bg,'#FFFFFF')}" style="padding:${num(d.paddingY,24)}px ${num(d.paddingX,24)}px;">
    <${tag} style="margin:0;font-family:Georgia,serif;font-size:${num(d.fontSize,28)}px;color:${safe(d.color,'#000000')};line-height:1.3;font-weight:bold;">${nl2br(safe(d.text))}</${tag}>
  </td>
</tr>`;
}

function renderParagraph(d: Record<string, unknown>): string {
  return `
<tr>
  <td bgcolor="${safe(d.bg,'#FFFFFF')}" style="padding:${num(d.paddingY,12)}px ${num(d.paddingX,24)}px;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:${num(d.fontSize,16)}px;color:${safe(d.color,'#333333')};line-height:1.7;">${nl2br(safe(d.text))}</p>
  </td>
</tr>`;
}

function renderImage(d: Record<string, unknown>): string {
  if (!safe(d.imageUrl)) return '';
  const w = num(d.width, 560);
  return `
<tr>
  <td align="${safe(d.alignment,'center')}" bgcolor="#FFFFFF" style="padding:${num(d.paddingY,16)}px ${num(d.paddingX,24)}px;">
    <img src="${safe(d.imageUrl)}" alt="${esc(safe(d.alt))}" width="${w}" style="display:block;max-width:100%;border-radius:${num(d.borderRadius,8)}px;border:0;">
  </td>
</tr>`;
}

function renderBookCard(d: Record<string, unknown>): string {
  return `
<tr>
  <td bgcolor="#FFFFFF" style="padding:16px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${safe(d.bg,'#F8F8F6')};border-radius:${num(d.borderRadius,8)}px;overflow:hidden;">
      <tr>
        <td width="110" style="padding:20px 0 20px 20px;vertical-align:top;">
          ${safe(d.coverUrl) ? `<img src="${safe(d.coverUrl)}" width="90" alt="${esc(safe(d.title))}" style="display:block;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.15);border:0;">` : `<div style="width:90px;height:130px;background:#E5E5E5;border-radius:4px;display:flex;align-items:center;justify-content:center;"></div>`}
        </td>
        <td style="padding:20px;vertical-align:top;">
          ${safe(d.author) ? `<p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:11px;color:#888888;text-transform:uppercase;letter-spacing:0.05em;">${esc(safe(d.author))}</p>` : ''}
          <h3 style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;color:#000000;line-height:1.3;">${nl2br(safe(d.title))}</h3>
          ${safe(d.description) ? `<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.5;">${nl2br(safe(d.description))}</p>` : ''}
          <p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:22px;font-weight:bold;color:#E5A700;">${esc(safe(d.price))}</p>
          <a href="${safe(d.buttonUrl)}" style="display:inline-block;background:#000000;color:#FFFFFF;padding:10px 24px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${esc(safe(d.buttonLabel,'Voir le livre'))}</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`;
}

function renderDivider(d: Record<string, unknown>): string {
  const w = num(d.widthPct, 80);
  return `
<tr>
  <td style="padding:${num(d.paddingY,16)}px 0;text-align:center;">
    <div style="display:inline-block;width:${w}%;border-top:${num(d.thickness,1)}px ${safe(d.style,'solid')} ${safe(d.color,'#E5E5E5')};margin:0 auto;"></div>
  </td>
</tr>`;
}

function renderQuote(d: Record<string, unknown>): string {
  return `
<tr>
  <td bgcolor="${safe(d.bg,'#FAFAF8')}" style="padding:${num(d.paddingY,24)}px ${num(d.paddingX,32)}px;border-left:4px solid ${safe(d.accentColor,'#E5A700')};">
    <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;font-style:italic;color:${safe(d.color,'#222222')};line-height:1.5;">${nl2br(safe(d.text))}</p>
    ${safe(d.author) ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:13px;color:${safe(d.accentColor,'#E5A700')};font-weight:bold;">— ${esc(safe(d.author))}</p>` : ''}
  </td>
</tr>`;
}

function renderCtaButton(d: Record<string, unknown>): string {
  return `
<tr>
  <td align="${safe(d.alignment,'center')}" bgcolor="#FFFFFF" style="padding:${num(d.paddingY,20)}px ${num(d.paddingX,24)}px;">
    <a href="${safe(d.url)}" style="display:inline-block;background:${safe(d.bgColor,'#000000')};color:${safe(d.textColor,'#FFFFFF')};padding:14px 36px;border-radius:${num(d.radius,6)}px;text-decoration:none;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;letter-spacing:0.02em;">${esc(safe(d.label,'Voir le livre'))}</a>
  </td>
</tr>`;
}

function renderCoupon(d: Record<string, unknown>): string {
  return `
<tr>
  <td bgcolor="${safe(d.bg,'#FFF8E8')}" style="padding:28px 24px;text-align:center;border:2px dashed ${safe(d.accentColor,'#E5A700')};">
    ${safe(d.discount) ? `<p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#666666;text-transform:uppercase;letter-spacing:0.08em;">Réduction exclusive</p><p style="margin:0 0 16px;font-family:Georgia,serif;font-size:36px;font-weight:bold;color:${safe(d.accentColor,'#E5A700')};">${esc(safe(d.discount))}</p>` : ''}
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;color:#888888;text-transform:uppercase;letter-spacing:0.1em;">Votre code</p>
    <p style="margin:0 0 16px;font-family:'Courier New',monospace;font-size:24px;font-weight:bold;color:#000000;letter-spacing:0.15em;background:#FFFFFF;display:inline-block;padding:8px 20px;border-radius:4px;">${esc(safe(d.code,'CODE'))}</p>
    ${safe(d.expiration) ? `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:12px;color:#888888;">Expire le ${esc(safe(d.expiration))}</p>` : ''}
    ${safe(d.buttonLabel) ? `<a href="${safe(d.buttonUrl)}" style="display:inline-block;background:${safe(d.accentColor,'#E5A700')};color:#000000;padding:12px 28px;border-radius:4px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${esc(safe(d.buttonLabel))}</a>` : ''}
  </td>
</tr>`;
}

function renderSocialLinks(d: Record<string, unknown>): string {
  const links = [
    { key: 'facebook',  label: 'Facebook',  color: '#1877F2' },
    { key: 'instagram', label: 'Instagram', color: '#E1306C' },
    { key: 'youtube',   label: 'YouTube',   color: '#FF0000' },
    { key: 'website',   label: 'Site Web',  color: '#555555' },
  ]
    .filter((l) => safe(d[l.key]))
    .map((l) => `<a href="${safe(d[l.key])}" style="display:inline-block;margin:0 8px;font-family:Arial,sans-serif;font-size:13px;color:${l.color};text-decoration:none;font-weight:bold;">${l.label}</a>`)
    .join('');
  return links ? `
<tr>
  <td align="${safe(d.alignment,'center')}" bgcolor="#FFFFFF" style="padding:${num(d.paddingY,16)}px 24px;">
    ${links}
  </td>
</tr>` : '';
}

function renderFooter(d: Record<string, unknown>): string {
  return `
<tr>
  <td bgcolor="${safe(d.bg,'#1a1a1a')}" style="padding:${num(d.paddingY,24)}px 24px;text-align:center;">
    ${safe(d.company) ? `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:14px;color:${safe(d.color,'#999999')};font-weight:bold;">${esc(safe(d.company))}</p>` : ''}
    ${safe(d.address) ? `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;color:${safe(d.color,'#999999')};">${esc(safe(d.address))}</p>` : ''}
    ${safe(d.unsubscribeUrl) ? `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:11px;color:${safe(d.color,'#999999')};"><a href="${safe(d.unsubscribeUrl)}" style="color:${safe(d.color,'#999999')};">Se désabonner</a></p>` : ''}
    ${safe(d.copyright) ? `<p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:${safe(d.color,'#999999')};">${esc(safe(d.copyright))}</p>` : ''}
  </td>
</tr>`;
}

function renderCustomHtml(d: Record<string, unknown>): string {
  const html = String(d.html ?? '');
  if (!html.trim()) return '';
  return `
<tr>
  <td style="padding:0;">${html}</td>
</tr>`;
}

const RENDERERS: Record<BlockType, (d: Record<string, unknown>) => string> = {
  logo:         renderLogo,
  banner:       renderBanner,
  title:        renderTitle,
  paragraph:    renderParagraph,
  image:        renderImage,
  book_card:    renderBookCard,
  divider:      renderDivider,
  quote:        renderQuote,
  cta_button:   renderCtaButton,
  coupon:       renderCoupon,
  social_links: renderSocialLinks,
  footer:       renderFooter,
  custom_html:  renderCustomHtml,
};

export function generateEmailHTML(blocks: Block[], subject = ''): string {
  const blocksHtml = blocks
    .map((b) => RENDERERS[b.type]?.(b.data) ?? '')
    .filter(Boolean)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <title>${esc(subject)}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    @media only screen and (max-width:620px){
      .email-wrapper{width:100%!important;max-width:100%!important}
      .block-img img{width:100%!important;height:auto!important}
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F4;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#F4F4F4" style="min-height:100%;">
    <tr>
      <td align="center" style="padding:20px 0 40px;">
        <!--[if mso]><table width="${CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table class="email-wrapper" width="${CONTAINER_WIDTH}" cellpadding="0" cellspacing="0" border="0" style="max-width:${CONTAINER_WIDTH}px;background-color:#FFFFFF;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
${blocksHtml}
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}
