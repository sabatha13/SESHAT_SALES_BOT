"use client";
import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle } from "lucide-react";

export default function AdminAuteurPage() {
  const [bio, setBio] = useState("");
  const [quote, setQuote] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/auteur").then(r => r.json()).then(d => {
      setBio(d.bio || ""); setQuote(d.favorite_quote || ""); setPhotoUrl(d.photo_url || "");
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/auteur", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio, favorite_quote: quote, photo_url: photoUrl }) });
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><h1 className="font-serif text-3xl text-silver-100">Profil Auteur</h1><p className="text-silver-500 text-sm mt-1">Le Comte de Sabatha</p></div>
      <div className="card-dark p-6 rounded-2xl space-y-4">
        <h2 className="text-gold-400 font-medium">Photo de l auteur</h2>
        {photoUrl && <img src={photoUrl} alt="Auteur" className="w-24 h-24 rounded-full object-cover border-2 border-gold-600/40" />}
        <input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL de la photo (ex: https://...)" className="w-full bg-charcoal border border-ash rounded-xl px-4 py-3 text-silver-300 text-sm focus:outline-none focus:border-gold-600/50" />
        <p className="text-silver-500 text-xs">Uploadez votre photo sur imgbb.com ou imgur.com et collez le lien ici.</p>
      </div>
      <div className="card-dark p-6 rounded-2xl space-y-3">
        <h2 className="text-gold-400 font-medium">Biographie</h2>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={8} placeholder="Biographie..." className="w-full bg-charcoal border border-ash rounded-xl px-4 py-3 text-silver-300 text-sm resize-none focus:outline-none focus:border-gold-600/50" />
      </div>
      <div className="card-dark p-6 rounded-2xl space-y-3">
        <h2 className="text-gold-400 font-medium">Pensee favorite</h2>
        <textarea value={quote} onChange={e => setQuote(e.target.value)} rows={3} placeholder="Une citation..." className="w-full bg-charcoal border border-ash rounded-xl px-4 py-3 text-silver-300 text-sm resize-none focus:outline-none focus:border-gold-600/50" />
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-gold px-6 py-3 rounded-xl flex items-center gap-2 text-sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? "Sauvegarde !" : "Sauvegarder"}
      </button>
    </div>
  );
}