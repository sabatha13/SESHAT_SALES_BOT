-- ============================================================
-- Migration: 20260630000003_vce_statut_devis_envoye.sql
-- Sprint 3 — Ajout statut 'devis_envoye' + fix montant_total nullable
-- ============================================================

-- 1. montant_total devient nullable
--    Avant le devis, le montant n'est pas encore connu (statut='briefing')
ALTER TABLE vce_commandes_services
  ALTER COLUMN montant_total DROP NOT NULL;

-- 2. Formalise le CHECK constraint statut (existait seulement en commentaire)
--    Ajoute 'devis_envoye' entre 'briefing' et 'production'
ALTER TABLE vce_commandes_services
  ADD CONSTRAINT vce_commandes_services_statut_check
  CHECK (statut IN ('briefing', 'devis_envoye', 'production', 'revision', 'livre', 'termine'));
