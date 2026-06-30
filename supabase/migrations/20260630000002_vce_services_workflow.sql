-- ============================================================
-- Migration: 20260630000002_vce_services_workflow.sql
-- Sprint 1 (complément) — VCE — Services, workflow, paiements
-- ============================================================

-- ── Services et tarifs ──────────────────────────────────────
CREATE TABLE vce_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  type_tarif TEXT NOT NULL,
  prix_fixe DECIMAL(10,2),
  prix_0_100 DECIMAL(10,2),
  prix_100_200 DECIMAL(10,2),
  prix_200_300 DECIMAL(10,2),
  prix_300_400 DECIMAL(10,2),
  categorie TEXT,
  actif BOOLEAN DEFAULT true,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_services_public_read" ON vce_services
  FOR SELECT USING (actif = true);

CREATE POLICY "vce_services_admin_all" ON vce_services
  FOR ALL USING (auth.role() = 'service_role');

-- ── Packages combinés ────────────────────────────────────────
CREATE TABLE vce_service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  description TEXT,
  services_inclus UUID[],
  prix DECIMAL(10,2) NOT NULL,
  economie DECIMAL(10,2),
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_service_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_packages_public_read" ON vce_service_packages
  FOR SELECT USING (actif = true);

CREATE POLICY "vce_packages_admin_all" ON vce_service_packages
  FOR ALL USING (auth.role() = 'service_role');

-- ── Commandes de services éditoriaux ─────────────────────────
-- Distinct de vce_commandes (Sprint 1) qui couvre les achats de livres publiés.
-- Ici : un auteur commande un service éditorial (correction, ghostwriting, etc.)
CREATE TABLE vce_commandes_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id UUID REFERENCES vce_auteurs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES vce_services(id),
  package_id UUID REFERENCES vce_service_packages(id),
  titre TEXT NOT NULL,
  montant_total DECIMAL(10,2) NOT NULL,
  acompte_paye DECIMAL(10,2) DEFAULT 0,
  solde_restant DECIMAL(10,2),
  statut TEXT DEFAULT 'briefing', -- 'briefing' | 'production' | 'revision' | 'livre' | 'termine'
  progression INTEGER DEFAULT 0,
  date_debut TIMESTAMPTZ,
  date_livraison_estimee TIMESTAMPTZ,
  date_livraison_reelle TIMESTAMPTZ,
  notes_internes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_commandes_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_commandes_services_auteur_own" ON vce_commandes_services
  FOR SELECT USING (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_commandes_services_auteur_insert" ON vce_commandes_services
  FOR INSERT WITH CHECK (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_commandes_services_admin_all" ON vce_commandes_services
  FOR ALL USING (auth.role() = 'service_role');

-- ── Étapes de production ─────────────────────────────────────
CREATE TABLE vce_etapes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES vce_commandes_services(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT DEFAULT 'en_attente',
  ordre INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_etapes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_etapes_auteur_read" ON vce_etapes
  FOR SELECT USING (
    commande_id IN (
      SELECT id FROM vce_commandes_services WHERE auteur_id IN (
        SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "vce_etapes_admin_all" ON vce_etapes
  FOR ALL USING (auth.role() = 'service_role');

-- ── Fichiers ──────────────────────────────────────────────────
CREATE TABLE vce_fichiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES vce_commandes_services(id) ON DELETE CASCADE,
  auteur_id UUID REFERENCES vce_auteurs(id) ON DELETE CASCADE,
  nom_fichier TEXT NOT NULL,
  url TEXT NOT NULL,
  taille_bytes INTEGER,
  type_fichier TEXT,
  envoye_par TEXT,
  valide_par_auteur BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_fichiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_fichiers_auteur_own" ON vce_fichiers
  FOR SELECT USING (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_fichiers_auteur_insert" ON vce_fichiers
  FOR INSERT WITH CHECK (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_fichiers_admin_all" ON vce_fichiers
  FOR ALL USING (auth.role() = 'service_role');

-- ── Messagerie ────────────────────────────────────────────────
CREATE TABLE vce_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES vce_commandes_services(id) ON DELETE CASCADE,
  expediteur TEXT NOT NULL,
  expediteur_nom TEXT,
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_messages_auteur_own" ON vce_messages
  FOR SELECT USING (
    commande_id IN (
      SELECT id FROM vce_commandes_services WHERE auteur_id IN (
        SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "vce_messages_auteur_insert" ON vce_messages
  FOR INSERT WITH CHECK (
    commande_id IN (
      SELECT id FROM vce_commandes_services WHERE auteur_id IN (
        SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "vce_messages_admin_all" ON vce_messages
  FOR ALL USING (auth.role() = 'service_role');

-- ── Reviews auteurs ───────────────────────────────────────────
CREATE TABLE vce_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES vce_commandes_services(id) ON DELETE CASCADE,
  auteur_id UUID REFERENCES vce_auteurs(id) ON DELETE CASCADE,
  note INTEGER CHECK (note BETWEEN 1 AND 5),
  commentaire TEXT,
  autorise_affichage BOOLEAN DEFAULT false,
  approuve_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_reviews_public_read" ON vce_reviews
  FOR SELECT USING (autorise_affichage = true AND approuve_admin = true);

CREATE POLICY "vce_reviews_auteur_own" ON vce_reviews
  FOR SELECT USING (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_reviews_auteur_insert" ON vce_reviews
  FOR INSERT WITH CHECK (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_reviews_admin_all" ON vce_reviews
  FOR ALL USING (auth.role() = 'service_role');

-- ── Transactions paiements ────────────────────────────────────
CREATE TABLE vce_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commande_id UUID REFERENCES vce_commandes_services(id) ON DELETE CASCADE,
  auteur_id UUID REFERENCES vce_auteurs(id) ON DELETE CASCADE,
  type_paiement TEXT,
  mode_paiement TEXT,
  montant DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  statut TEXT DEFAULT 'confirme',
  facture_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vce_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vce_transactions_auteur_own" ON vce_transactions
  FOR SELECT USING (
    auteur_id IN (SELECT id FROM vce_auteurs WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "vce_transactions_admin_all" ON vce_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- Seed data
-- ============================================================

INSERT INTO vce_services (nom, type_tarif, prix_fixe, prix_0_100, prix_100_200, prix_200_300, prix_300_400, categorie, ordre) VALUES
  ('Diagnostic Éditorial', 'fixe', 250, NULL, NULL, NULL, NULL, 'analyse', 1),
  ('Structuration & Correction', 'selon_pages', NULL, 350, 450, 550, 600, 'correction', 2),
  ('Ghostwriting Complet', 'selon_pages', NULL, 600, 800, 900, 1000, 'redaction', 3),
  ('Mise en Page & Formatage', 'selon_pages', NULL, 150, 200, 250, 300, 'mise_en_page', 4),
  ('Création de Couverture', 'fixe', 250, NULL, NULL, NULL, NULL, 'design', 5),
  ('Publication Amazon KDP', 'fixe', 200, NULL, NULL, NULL, NULL, 'publication', 6);

INSERT INTO vce_service_packages (nom, description, prix, economie) VALUES
  ('Essentiel', 'Diagnostic + Correction', 550, 50),
  ('Genèse', 'Correction + Mise en page + Couverture + KDP', 1000, 100),
  ('Signature', 'Ghostwriting + Couverture + KDP', 1350, 100);
