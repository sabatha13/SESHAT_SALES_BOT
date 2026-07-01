ALTER TABLE vce_livres
  ADD COLUMN IF NOT EXISTS slug text UNIQUE,
  ADD COLUMN IF NOT EXISTS lien_amazon text;

ALTER TABLE vce_auteurs
  ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Index pour les lookups par slug
CREATE INDEX IF NOT EXISTS idx_vce_livres_slug ON vce_livres(slug);
CREATE INDEX IF NOT EXISTS idx_vce_auteurs_slug ON vce_auteurs(slug);
