ALTER TABLE vce_auteurs
  ADD COLUMN IF NOT EXISTS bio_courte text;

COMMENT ON COLUMN vce_auteurs.bio_courte IS 'Bio courte pour les cartes catalogue (max 150 caractères / ~25 mots). bio = bio complète pour la page profil individuel.';
