-- ============================================================
-- VOIX COSMIQUE ÉDITIONS — 12 tables préfixées vce_*
-- Sprint 1 — Infrastructure VCE
-- ============================================================

-- 1. vce_auteurs — comptes auteurs (liés à auth.users Supabase)
CREATE TABLE IF NOT EXISTS vce_auteurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom_plume TEXT,
  prenom TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT,
  photo_url TEXT,
  site_web TEXT,
  nationalite TEXT,
  langue_principale TEXT DEFAULT 'fr',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. vce_manuscrits — soumissions de manuscrits
CREATE TABLE IF NOT EXISTS vce_manuscrits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auteur_id UUID NOT NULL REFERENCES vce_auteurs(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT NOT NULL,
  nb_pages INTEGER,
  langue TEXT DEFAULT 'fr',
  fichier_url TEXT,
  statut TEXT NOT NULL DEFAULT 'soumis'
    CHECK (statut IN ('soumis', 'en_lecture', 'accepte', 'refuse', 'en_revision')),
  notes_comite TEXT,
  date_soumission TIMESTAMPTZ DEFAULT NOW(),
  date_decision TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. vce_collections — collections / séries éditoriales
CREATE TABLE IF NOT EXISTS vce_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  couleur_hex TEXT DEFAULT '#B5A020',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. vce_livres — catalogue VCE (distinct du catalogue CDS)
CREATE TABLE IF NOT EXISTS vce_livres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manuscrit_id UUID REFERENCES vce_manuscrits(id),
  collection_id UUID REFERENCES vce_collections(id),
  titre TEXT NOT NULL,
  sous_titre TEXT,
  auteur_id UUID NOT NULL REFERENCES vce_auteurs(id),
  isbn TEXT UNIQUE,
  description TEXT NOT NULL,
  resume_court TEXT NOT NULL,
  couverture_url TEXT,
  fichier_pdf_path TEXT,
  prix_cents INTEGER NOT NULL DEFAULT 0,
  annee_publication INTEGER,
  nb_pages INTEGER,
  langue TEXT DEFAULT 'fr',
  mots_cles TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. vce_contrats — contrats d'édition avec les auteurs
CREATE TABLE IF NOT EXISTS vce_contrats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auteur_id UUID NOT NULL REFERENCES vce_auteurs(id) ON DELETE RESTRICT,
  livre_id UUID REFERENCES vce_livres(id),
  type_contrat TEXT NOT NULL DEFAULT 'edition'
    CHECK (type_contrat IN ('edition', 'cession', 'coedition', 'licence')),
  taux_royalties_pourcent NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  avance_cents INTEGER DEFAULT 0,
  date_signature DATE,
  date_expiration DATE,
  fichier_contrat_url TEXT,
  statut TEXT NOT NULL DEFAULT 'brouillon'
    CHECK (statut IN ('brouillon', 'signe', 'resilie', 'expire')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. vce_royalties — relevés de droits d'auteur
CREATE TABLE IF NOT EXISTS vce_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contrat_id UUID NOT NULL REFERENCES vce_contrats(id) ON DELETE RESTRICT,
  auteur_id UUID NOT NULL REFERENCES vce_auteurs(id),
  livre_id UUID REFERENCES vce_livres(id),
  periode_debut DATE NOT NULL,
  periode_fin DATE NOT NULL,
  nb_ventes INTEGER NOT NULL DEFAULT 0,
  montant_brut_cents INTEGER NOT NULL DEFAULT 0,
  montant_net_cents INTEGER NOT NULL DEFAULT 0,
  statut_paiement TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut_paiement IN ('en_attente', 'verse', 'annule')),
  date_versement DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. vce_clients — acheteurs VCE (séparés des users CDS/Clerk)
CREATE TABLE IF NOT EXISTS vce_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  prenom TEXT,
  nom TEXT,
  stripe_customer_id TEXT UNIQUE,
  pays TEXT DEFAULT 'FR',
  is_newsletter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. vce_commandes — commandes clients VCE
CREATE TABLE IF NOT EXISTS vce_commandes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES vce_clients(id) ON DELETE RESTRICT,
  livre_id UUID NOT NULL REFERENCES vce_livres(id) ON DELETE RESTRICT,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  montant_cents INTEGER NOT NULL,
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'complete', 'rembourse', 'annule')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. vce_newsletter_abonnes — liste newsletter VCE
CREATE TABLE IF NOT EXISTS vce_newsletter_abonnes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  prenom TEXT,
  source TEXT DEFAULT 'site',
  is_active BOOLEAN DEFAULT TRUE,
  date_abonnement TIMESTAMPTZ DEFAULT NOW(),
  date_desabonnement TIMESTAMPTZ,
  token_desabonnement TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex')
);

-- 10. vce_articles — contenu éditorial / blog VCE
CREATE TABLE IF NOT EXISTS vce_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  contenu TEXT NOT NULL,
  resume TEXT,
  image_url TEXT,
  auteur_id UUID REFERENCES vce_auteurs(id),
  categorie TEXT DEFAULT 'actualite',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT FALSE,
  date_publication TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. vce_evenements — événements littéraires VCE
CREATE TABLE IF NOT EXISTS vce_evenements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titre TEXT NOT NULL,
  description TEXT,
  lieu TEXT,
  adresse TEXT,
  date_debut TIMESTAMPTZ NOT NULL,
  date_fin TIMESTAMPTZ,
  lien_inscription TEXT,
  image_url TEXT,
  type_evenement TEXT DEFAULT 'lecture'
    CHECK (type_evenement IN ('lecture', 'salon', 'conference', 'atelier', 'lancement', 'autre')),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. vce_medias — revue de presse / couverture médiatique
CREATE TABLE IF NOT EXISTS vce_medias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  livre_id UUID REFERENCES vce_livres(id) ON DELETE SET NULL,
  media_nom TEXT NOT NULL,
  type_media TEXT DEFAULT 'presse'
    CHECK (type_media IN ('presse', 'podcast', 'tv', 'radio', 'blog', 'autre')),
  titre_article TEXT,
  url TEXT,
  date_parution DATE,
  extrait TEXT,
  note_presse NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vce_manuscrits_auteur ON vce_manuscrits(auteur_id);
CREATE INDEX IF NOT EXISTS idx_vce_manuscrits_statut ON vce_manuscrits(statut);
CREATE INDEX IF NOT EXISTS idx_vce_livres_auteur ON vce_livres(auteur_id);
CREATE INDEX IF NOT EXISTS idx_vce_livres_collection ON vce_livres(collection_id);
CREATE INDEX IF NOT EXISTS idx_vce_livres_published ON vce_livres(is_published);
CREATE INDEX IF NOT EXISTS idx_vce_contrats_auteur ON vce_contrats(auteur_id);
CREATE INDEX IF NOT EXISTS idx_vce_royalties_auteur ON vce_royalties(auteur_id);
CREATE INDEX IF NOT EXISTS idx_vce_royalties_periode ON vce_royalties(periode_debut, periode_fin);
CREATE INDEX IF NOT EXISTS idx_vce_commandes_client ON vce_commandes(client_id);
CREATE INDEX IF NOT EXISTS idx_vce_commandes_statut ON vce_commandes(statut);
CREATE INDEX IF NOT EXISTS idx_vce_articles_slug ON vce_articles(slug);
CREATE INDEX IF NOT EXISTS idx_vce_articles_published ON vce_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_vce_evenements_date ON vce_evenements(date_debut);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION vce_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vce_auteurs_updated_at
  BEFORE UPDATE ON vce_auteurs FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_manuscrits_updated_at
  BEFORE UPDATE ON vce_manuscrits FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_livres_updated_at
  BEFORE UPDATE ON vce_livres FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_contrats_updated_at
  BEFORE UPDATE ON vce_contrats FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_clients_updated_at
  BEFORE UPDATE ON vce_clients FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_articles_updated_at
  BEFORE UPDATE ON vce_articles FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();
CREATE TRIGGER vce_evenements_updated_at
  BEFORE UPDATE ON vce_evenements FOR EACH ROW EXECUTE FUNCTION vce_update_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE vce_auteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_manuscrits ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_livres ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_newsletter_abonnes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_evenements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vce_medias ENABLE ROW LEVEL SECURITY;

-- Auteurs : chaque auteur voit/modifie uniquement son propre profil
CREATE POLICY "vce_auteurs_select_own"
  ON vce_auteurs FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "vce_auteurs_update_own"
  ON vce_auteurs FOR UPDATE
  USING (auth.uid() = auth_user_id);

-- Manuscrits : auteur voit ses propres manuscrits
CREATE POLICY "vce_manuscrits_select_own"
  ON vce_manuscrits FOR SELECT
  USING (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

CREATE POLICY "vce_manuscrits_insert_own"
  ON vce_manuscrits FOR INSERT
  WITH CHECK (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

CREATE POLICY "vce_manuscrits_update_own"
  ON vce_manuscrits FOR UPDATE
  USING (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

-- Collections : lecture publique
CREATE POLICY "vce_collections_select_public"
  ON vce_collections FOR SELECT
  USING (is_active = true);

-- Livres : lecture publique pour les publiés
CREATE POLICY "vce_livres_select_published"
  ON vce_livres FOR SELECT
  USING (is_published = true);

-- Livres : auteur voit ses propres livres même non publiés
CREATE POLICY "vce_livres_select_own"
  ON vce_livres FOR SELECT
  USING (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

-- Contrats : auteur voit ses propres contrats
CREATE POLICY "vce_contrats_select_own"
  ON vce_contrats FOR SELECT
  USING (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

-- Royalties : auteur voit ses propres relevés
CREATE POLICY "vce_royalties_select_own"
  ON vce_royalties FOR SELECT
  USING (auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()));

-- Commandes : client voit les siennes (accès via service_role pour les inserts)
CREATE POLICY "vce_commandes_select_own"
  ON vce_commandes FOR SELECT
  USING (true);

-- Clients : service_role only (pas de politique publique)
-- (aucune politique = seul service_role peut accéder)

-- Newsletter : inscription publique autorisée
CREATE POLICY "vce_newsletter_insert_public"
  ON vce_newsletter_abonnes FOR INSERT
  WITH CHECK (true);

-- Articles : lecture publique pour les publiés
CREATE POLICY "vce_articles_select_published"
  ON vce_articles FOR SELECT
  USING (is_published = true);

-- Événements : lecture publique pour les publiés
CREATE POLICY "vce_evenements_select_published"
  ON vce_evenements FOR SELECT
  USING (is_published = true);

-- Médias : lecture publique
CREATE POLICY "vce_medias_select_public"
  ON vce_medias FOR SELECT
  USING (true);
