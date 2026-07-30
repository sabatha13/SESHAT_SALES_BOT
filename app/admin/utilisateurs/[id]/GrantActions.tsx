'use client';
import { useState } from 'react';
import { BookOpen, Crown, Check, AlertCircle, Trash2, Ban, DollarSign, Gift, X } from 'lucide-react';

interface Book { id: string; title: string; }
interface OwnedBook { purchaseId: string; bookId: string; title: string; cover_url?: string; category?: string; purchaseDate: string; price: number; }

type BookGrantType = 'free_grant' | 'paid_external' | null;

interface ConfirmState {
  type: 'free_grant' | 'paid_external';
  amount?: string;
  method?: string;
}

const PAYMENT_METHODS = ['Cash', 'Virement Bancaire', 'MonCash', 'Zelle', 'PayPal', 'CashApp', 'Autre'];

export default function GrantActions({ userId, books, ownedBooks, hasSubscription, isBanned }: {
  userId: string;
  books: Book[];
  ownedBooks: OwnedBook[];
  hasSubscription: boolean;
  isBanned: boolean;
}) {
  const [selectedBook, setSelectedBook] = useState('');
  const [loadingBook, setLoadingBook] = useState(false);
  const [loadingSub, setLoadingSub] = useState('');
  const [loadingRevoke, setLoadingRevoke] = useState('');
  const [loadingBan, setLoadingBan] = useState(false);
  const [banned, setBanned] = useState(isBanned);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Book grant — starts as null to force explicit selection
  const [bookGrantType, setBookGrantType] = useState<BookGrantType>(null);
  const [bookPaidAmount, setBookPaidAmount] = useState('');
  const [bookPaymentMethod, setBookPaymentMethod] = useState('Cash');
  const [bookPaymentMethodOther, setBookPaymentMethodOther] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);

  // Subscription
  const [grantType, setGrantType] = useState<'free_grant' | 'paid_external'>('paid_external');
  const [paymentMethod, setPaymentMethod] = useState('Zelle');
  const [paidAmount, setPaidAmount] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Effective payment method (handles "Autre" + custom text)
  const effectiveBookPaymentMethod = bookPaymentMethod === 'Autre' ? bookPaymentMethodOther : bookPaymentMethod;

  function isBookGrantReady(): boolean {
    if (!selectedBook || !bookGrantType) return false;
    if (bookGrantType === 'paid_external') {
      if (!bookPaidAmount || parseFloat(bookPaidAmount) <= 0) return false;
      if (!effectiveBookPaymentMethod.trim()) return false;
    }
    return true;
  }

  function handleBookGrantClick() {
    if (!isBookGrantReady()) return;
    if (bookGrantType === 'paid_external') {
      setConfirmModal({
        type: 'paid_external',
        amount: parseFloat(bookPaidAmount).toFixed(2),
        method: effectiveBookPaymentMethod,
      });
    } else {
      setConfirmModal({ type: 'free_grant' });
    }
  }

  async function grantBook() {
    if (!selectedBook || !bookGrantType) return;
    setLoadingBook(true); setMsg(null);
    const res = await fetch('/api/admin/grant-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        book_id: selectedBook,
        grant_type: bookGrantType,
        amount: bookGrantType === 'paid_external' ? Math.round(parseFloat(bookPaidAmount) * 100) : 0,
        payment_method: bookGrantType === 'paid_external' ? effectiveBookPaymentMethod : null,
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Livre accordé !' } : { type: 'error', text: data.error });
    setLoadingBook(false);
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function grantSub(months: number) {
    if (grantType === 'paid_external' && (!paidAmount || parseFloat(paidAmount) <= 0)) {
      setMsg({ type: 'error', text: 'Veuillez entrer le montant reçu.' });
      return;
    }
    setLoadingSub(String(months)); setMsg(null);
    const res = await fetch('/api/admin/grant-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        months,
        grant_type: grantType,
        payment_method: grantType === 'paid_external' ? paymentMethod : null,
        amount: grantType === 'paid_external' ? Math.round(parseFloat(paidAmount) * 100) : 0,
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: `Abonnement ${months === 1 ? 'mensuel' : 'annuel'} activé !` } : { type: 'error', text: data.error });
    setLoadingSub('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function recordPayment() {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      setMsg({ type: 'error', text: 'Veuillez entrer le montant reçu.' });
      return;
    }
    setLoadingPayment(true); setMsg(null);
    const res = await fetch('/api/admin/record-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        amount: Math.round(parseFloat(paidAmount) * 100),
        payment_method: paymentMethod,
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Paiement enregistré !' } : { type: 'error', text: data.error });
    setLoadingPayment(false);
    if (res.ok) setPaidAmount('');
  }

  async function revokeBook(purchaseId: string) {
    setLoadingRevoke(purchaseId); setMsg(null);
    const res = await fetch('/api/admin/revoke-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchase_id: purchaseId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Accès retiré.' } : { type: 'error', text: data.error });
    setLoadingRevoke('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  async function toggleBan() {
    setLoadingBan(true); setMsg(null);
    const res = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, ban: !banned }),
    });
    const data = await res.json();
    if (res.ok) {
      setBanned(!banned);
      setMsg({ type: 'success', text: !banned ? 'Compte suspendu.' : 'Compte réactivé.' });
    } else {
      setMsg({ type: 'error', text: data.error });
    }
    setLoadingBan(false);
  }

  async function revokeSubscription() {
    setLoadingSub('revoke'); setMsg(null);
    const res = await fetch('/api/admin/revoke-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    setMsg(res.ok ? { type: 'success', text: 'Abonnement annulé.' } : { type: 'error', text: data.error });
    setLoadingSub('');
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl text-gold-300">Accorder un accès manuellement</h2>

      {msg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${msg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {msg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {msg.text}
        </div>
      )}

      {/* Ban / Suspend */}
      <div className={`card-dark p-5 rounded-xl space-y-3 ${banned ? 'border border-red-500/30' : ''}`}>
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <Ban className="w-4 h-4 text-red-400" />
          Suspension du compte
        </div>
        {banned && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-400 text-xs">
            <Ban className="w-3 h-3" /> Ce compte est actuellement suspendu
          </div>
        )}
        <button
          onClick={toggleBan}
          disabled={loadingBan}
          className={`px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 ${banned ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30' : 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30'}`}
        >
          {loadingBan ? '...' : banned ? 'Réactiver le compte' : 'Suspendre le compte'}
        </button>
      </div>

      {/* ── GRANT BOOK ─────────────────────────────────────────── */}
      <div className="card-dark p-5 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
          <BookOpen className="w-4 h-4 text-gold-500" />
          Accorder un livre
        </div>

        {/* Book selector */}
        <select
          value={selectedBook}
          onChange={e => setSelectedBook(e.target.value)}
          className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm"
        >
          <option value="">Choisir un livre...</option>
          {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>

        {/* Explicit type selection — no default, forces active choice */}
        <div className="space-y-2">
          <p className="text-silver-500 text-xs uppercase tracking-widest">Type d'accord</p>

          {/* Option A — External Payment */}
          <button
            type="button"
            onClick={() => setBookGrantType('paid_external')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              bookGrantType === 'paid_external'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-ash/30 bg-charcoal/20 hover:border-ash/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">💵</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-silver-100">Paiement externe</p>
                <p className="text-xs text-silver-500 mt-0.5 leading-relaxed">
                  Un paiement a été reçu hors Stripe.<br />
                  (Cash, Virement, Zelle, MonCash, PayPal…)
                </p>
              </div>
              {bookGrantType === 'paid_external' && (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
            </div>
          </button>

          {/* Option B — Free Book */}
          <button
            type="button"
            onClick={() => setBookGrantType('free_grant')}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              bookGrantType === 'free_grant'
                ? 'border-amber-500 bg-amber-500/10'
                : 'border-ash/30 bg-charcoal/20 hover:border-ash/60'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">🎁</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-silver-100">Livre offert</p>
                <p className="text-xs text-silver-500 mt-0.5 leading-relaxed">
                  Aucun paiement n'a été reçu.<br />
                  Le livre est accordé gratuitement.
                </p>
              </div>
              {bookGrantType === 'free_grant' && (
                <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        </div>

        {/* Conditional: paid form */}
        {bookGrantType === 'paid_external' && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">
                Montant reçu ($US) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={bookPaidAmount}
                onChange={e => setBookPaidAmount(e.target.value)}
                placeholder="30.00"
                className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-emerald-600/60"
              />
              {bookPaidAmount && parseFloat(bookPaidAmount) <= 0 && (
                <p className="text-red-400 text-xs mt-1">Le montant doit être supérieur à zéro.</p>
              )}
            </div>

            <div>
              <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">
                Méthode de paiement <span className="text-red-400">*</span>
              </label>
              <select
                value={bookPaymentMethod}
                onChange={e => setBookPaymentMethod(e.target.value)}
                className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-emerald-600/60"
              >
                {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>

            {bookPaymentMethod === 'Autre' && (
              <div>
                <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">
                  Préciser la méthode <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={bookPaymentMethodOther}
                  onChange={e => setBookPaymentMethodOther(e.target.value)}
                  placeholder="Ex : Wise, CashApp, chèque…"
                  className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-emerald-600/60"
                />
              </div>
            )}
          </div>
        )}

        {/* Conditional: free warning banner */}
        {bookGrantType === 'free_grant' && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-amber-300 text-xs leading-relaxed">
              Aucun revenu ne sera enregistré pour cet accès.
            </p>
          </div>
        )}

        {/* Submit — opens confirmation modal */}
        <button
          onClick={handleBookGrantClick}
          disabled={!isBookGrantReady() || loadingBook}
          className="btn-gold w-full px-4 py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loadingBook ? 'En cours…' : 'Accorder ce livre'}
        </button>
      </div>
      {/* ── END GRANT BOOK ─────────────────────────────────────── */}

      {/* Grant subscription — only when no active subscription */}
      {!hasSubscription && (
        <div className="card-dark p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
            <Crown className="w-4 h-4 text-purple-400" />
            Accorder un abonnement
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setGrantType('paid_external')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${grantType === 'paid_external' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'border-ash/40 text-silver-500 hover:border-ash'}`}>
              <DollarSign className="w-3.5 h-3.5" /> Payé hors-site
            </button>
            <button type="button" onClick={() => setGrantType('free_grant')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${grantType === 'free_grant' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'border-ash/40 text-silver-500 hover:border-ash'}`}>
              <Gift className="w-3.5 h-3.5" /> Gratuit
            </button>
          </div>

          {grantType === 'paid_external' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Montant ($US)</label>
                <input type="number" min="0" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="9.99"
                  className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-gold-600/50" />
              </div>
              <div>
                <label className="text-silver-500 text-xs uppercase tracking-wide block mb-1">Méthode</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-gold-600/50">
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => grantSub(1)} disabled={!!loadingSub}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50">
              {loadingSub === '1' ? '...' : 'Mensuel (1 mois)'}
            </button>
            <button onClick={() => grantSub(12)} disabled={!!loadingSub}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-purple-500/20 border border-purple-500/40 text-purple-400 hover:bg-purple-500/30 transition-all disabled:opacity-50">
              {loadingSub === '12' ? '...' : 'Annuel (1 an)'}
            </button>
          </div>
        </div>
      )}

      {/* Active subscription — cancel + record payment */}
      {hasSubscription && (
        <div className="card-dark p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
              <Crown className="w-4 h-4 text-purple-400" />
              Abonnement actif
            </div>
            <button onClick={revokeSubscription} disabled={loadingSub === 'revoke'}
              className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1 border border-red-500/30 px-2 py-1 rounded-lg transition-all">
              <Trash2 className="w-3 h-3" /> {loadingSub === 'revoke' ? '...' : 'Annuler l\'abonnement'}
            </button>
          </div>

          <div className="border-t border-ash/30 pt-3">
            <p className="text-silver-500 text-xs mb-2 uppercase tracking-wide">Enregistrer un paiement reçu</p>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-silver-500 text-xs block mb-1">Montant ($US)</label>
                <input type="number" min="0" step="0.01" value={paidAmount} onChange={e => setPaidAmount(e.target.value)} placeholder="9.99"
                  className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-gold-600/50" />
              </div>
              <div>
                <label className="text-silver-500 text-xs block mb-1">Méthode</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-charcoal border border-ash/50 rounded-lg px-3 py-2 text-silver-300 text-sm focus:outline-none focus:border-gold-600/50">
                  {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <button onClick={recordPayment} disabled={loadingPayment}
              className="w-full px-3 py-2 rounded-lg text-sm bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <DollarSign className="w-3.5 h-3.5" />
              {loadingPayment ? 'Enregistrement...' : 'Enregistrer le paiement'}
            </button>
          </div>
        </div>
      )}

      {/* Revoke book access */}
      {ownedBooks.length > 0 && (
        <div className="card-dark p-5 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-silver-300 text-sm font-medium">
            <Trash2 className="w-4 h-4 text-red-400" />
            Retirer un accès livre
          </div>
          <div className="space-y-2">
            {ownedBooks.map(ob => (
              <div key={ob.purchaseId} className="flex items-center justify-between bg-charcoal/50 rounded-lg px-3 py-2">
                <span className="text-silver-400 text-sm">{ob.title}</span>
                <button onClick={() => revokeBook(ob.purchaseId)} disabled={loadingRevoke === ob.purchaseId} className="text-red-400 text-xs hover:text-red-300 flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> {loadingRevoke === ob.purchaseId ? '...' : 'Retirer'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONFIRMATION MODAL ────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#1c1c1c] border border-ash/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-5">

            {/* Close */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{confirmModal.type === 'paid_external' ? '💵' : '🎁'}</span>
                <h3 className="text-silver-100 font-semibold text-base leading-tight">
                  {confirmModal.type === 'paid_external'
                    ? 'Confirmer le paiement externe'
                    : 'Confirmer l\'accord gratuit'}
                </h3>
              </div>
              <button onClick={() => setConfirmModal(null)} className="text-silver-500 hover:text-silver-300 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {confirmModal.type === 'paid_external' ? (
              <>
                <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-silver-400">Montant</span>
                    <span className="text-emerald-400 font-semibold text-base">${confirmModal.amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-silver-400">Méthode</span>
                    <span className="text-silver-200 font-medium">{confirmModal.method}</span>
                  </div>
                </div>
                <p className="text-silver-400 text-sm leading-relaxed">
                  Le client recevra un accès immédiat. Ce paiement sera enregistré dans la base de données.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-300 text-sm leading-relaxed">
                    Vous êtes sur le point d'accorder ce livre <strong>gratuitement</strong>.<br />
                    Aucun revenu ne sera enregistré.
                  </p>
                </div>
                <p className="text-silver-500 text-sm">
                  Assurez-vous qu'aucun paiement n'a été reçu avant de continuer.
                </p>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-ash/40 text-silver-400 hover:border-ash/70 hover:text-silver-300 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => { setConfirmModal(null); grantBook(); }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  confirmModal.type === 'paid_external'
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
                    : 'bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                }`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── END CONFIRMATION MODAL ────────────────────────────── */}
    </div>
  );
}
